import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assets } from '../scripts/serve.ts';
import { build } from '../src/build.ts';
import { card, readRecording } from '../src/explanation.ts';
import { html, raw } from '../src/html.ts';
import { markdown } from '../src/markdown.ts';
import { fileFor, markdownFor, pathOfMarkdown } from '../src/page.ts';
import { readTransaction } from '../src/transaction.ts';
import worker, { prefersMarkdown } from '../src/worker.ts';

const pages = build();
const dist = (path: string) => new URL(`../dist/${path}`, import.meta.url);
const built = pages.map((page) => ({ page, text: readFileSync(dist(fileFor(page.path)), 'utf8') }));

/** Where an internal link lands, as Workers static assets resolve it. */
function target(href: string): string | null {
    const path = href.split('#')[0] ?? '';
    if (path === '') return null;
    if (path.endsWith('/')) return `${path.slice(1)}index.html`;
    if (/\.[a-z0-9]+$/.test(path)) return path.slice(1);
    return `${path.slice(1)}.html`;
}

test('every internal link and image lands on a built file', () => {
    for (const { page, text } of built) {
        for (const match of text.matchAll(/(?:href|src|srcset)="(\/[^"]*)"/g)) {
            const file = target(match[1] ?? '');
            if (file !== null) assert.ok(existsSync(dist(file)), `${page.path} links to ${match[1]}`);
        }
    }
});

test('every page has one h1, a title, a description, and a canonical link unless hidden', () => {
    for (const { page, text } of built) {
        assert.equal(text.match(/<h1[ >]/g)?.length, 1, `${page.path}: one h1`);
        assert.match(text, /<title>[^<]+<\/title>/, page.path);
        assert.match(text, /<meta name="description" content="[^"]+">/, page.path);
        assert.equal(text.includes('<link rel="canonical"'), !page.hidden, page.path);
    }
});

test('no page runs a script of its own: structured data only, the analytics beacon is added at the edge', () => {
    for (const { page, text } of built) {
        for (const match of text.matchAll(/<script([^>]*)>/g)) {
            const attributes = match[1] ?? '';
            assert.equal(attributes, ' type="application/ld+json"', `${page.path}: <script${attributes}>`);
        }
        assert.doesNotMatch(text, / on[a-z]+="/, `${page.path}: an inline event handler`);
    }
});

test('no page prints an object where it meant its words', () => {
    for (const { page, text } of built) assert.ok(!text.includes('[object Object]'), page.path);
});

test('the sitemap lists every page but the hidden ones', () => {
    const sitemap = readFileSync(dist('sitemap.xml'), 'utf8');
    for (const { page } of built) assert.equal(sitemap.includes(`<loc>https://signlens.dev${page.path}</loc>`), !page.hidden, page.path);
});

test('the favicon is an icon of the three sizes, and the home-screen icon is 180 pixels square', () => {
    const ico = readFileSync(dist('favicon.ico'));
    assert.deepEqual([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)], [0, 1, 3]);
    assert.deepEqual(
        [0, 1, 2].map((i) => ico.readUInt8(6 + 16 * i)),
        [16, 32, 48],
    );
    const touch = readFileSync(dist('apple-touch-icon.png'));
    assert.deepEqual([touch.readUInt32BE(16), touch.readUInt32BE(20)], [180, 180]);
});

test('robots.txt allows every crawler, signals search, AI input and training, and names the sitemap', () => {
    const robots = readFileSync(dist('robots.txt'), 'utf8');
    assert.match(
        robots,
        /^User-agent: \*\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nAllow: \/\n\nSitemap: https:\/\/signlens\.dev\/sitemap\.xml\n$/m,
    );
    assert.doesNotMatch(robots, /Disallow/);
});

test('a preview on workers.dev is kept out of search engines, and signlens.dev is not', () => {
    const headers = readFileSync(dist('_headers'), 'utf8');
    const rules = headers.split(/\n(?=\S)/);
    const workersDev = rules.find((rule) => rule.startsWith('https://:version.:subdomain.workers.dev/*'));
    assert.match(workersDev ?? '', /\n {2}X-Robots-Tag: noindex/);
    assert.equal(headers.match(/X-Robots-Tag/g)?.length, 1);
});

test('html escapes what it is given and keeps what is HTML already', () => {
    assert.equal(html`<p>${'<b>&"\''}</p>`.value, '<p>&lt;b&gt;&amp;&quot;&#39;</p>');
    assert.equal(html`<p>${raw('<b>x</b>')}${[html`<i>${'a<'}</i>`, 'b']}${null}${false}</p>`.value, '<p><b>x</b><i>a&lt;</i>b</p>');
});

test('a transaction file is read for its signer line, else its fee payer', () => {
    const perps = readTransaction(
        new URL('../transactions/jupiter-perps-limit-order.b64', import.meta.url).pathname,
        'jupiter-perps-limit-order',
    );
    assert.equal(perps.signer, 'AoLtF39MuvBN51nYsatNyXQmub3sHzEGpV1JffyByfvM');
    assert.equal(perps.constructed, false);
    const drift = readTransaction(new URL('../transactions/drift-signer-1.b64', import.meta.url).pathname, 'drift-signer-1');
    assert.equal(drift.signer, '39JyWrdbVdRqjzw9yyEjxNtTbTKcTPLdtdCgbz7C7Aq8');
    assert.equal(drift.signature?.slice(0, 6), '2HvMSg');
    const lookalike = readTransaction(new URL('../transactions/lookalike-recipient.b64', import.meta.url).pathname, 'lookalike-recipient');
    assert.equal(lookalike.constructed, true);
    assert.equal(lookalike.signature, null);
    assert.deepEqual(lookalike.contacts, [{ name: 'Bob', key: '6Q6wVYukhaZ3wAFzZjNWmuY3zeoykvuQRbs1X2Bvni4j' }]);
    assert.deepEqual(lookalike.accounts, []);
    const vote = readTransaction(new URL('../transactions/jupiter-dao-vote.b64', import.meta.url).pathname, 'jupiter-dao-vote');
    assert.deepEqual(
        vote.accounts.map((a) => a.address.slice(0, 4)),
        ['HpYm', 'DgNJ', '4i99'],
    );
    assert.equal(vote.accounts[0]?.owner, 'GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY');
    assert.equal(vote.accountsRead, '2026-10-25');
});

test("every card says the engine's words, line for line", () => {
    const text = (markup: string) =>
        markup
            .replace(/<[^>]*>/g, '')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    for (const file of readdirSync(new URL('../recordings/', import.meta.url))) {
        const slug = file.slice(0, -'.json'.length);
        const recording = readRecording(slug);
        const out = card(readTransaction(new URL(`../transactions/${slug}.b64`, import.meta.url).pathname, slug), recording).value;
        const e = recording.explanation;
        const lines = [...out.matchAll(/<li[^>]*>(.*?)<\/li>/gs)].map((m) =>
            text(m[1] ?? '').replace(/^(Info|Warning|High|Critical) /, ''),
        );
        const words = [
            ...(e.actions.length > 1 ? e.actions.map((a) => a.summary.text) : []),
            ...e.findings.map((f) => f.message.text),
            ...e.effects.map((effect) => effect.message.text),
        ];
        assert.deepEqual(lines, words, slug);
        if (e.actions.length <= 1) assert.equal(text(out.match(/<p class="summary">(.*?)<\/p>/s)?.[1] ?? ''), e.summary.text, slug);
    }
});

test('every page but the hidden ones has its Markdown, under its title, its address and its heading', () => {
    for (const { page, text } of built) {
        const file = markdownFor(page.path);
        assert.equal(pathOfMarkdown(file), page.path);
        assert.equal(existsSync(dist(file)), !page.hidden, file);
        if (page.hidden) continue;
        const md = readFileSync(dist(file), 'utf8');
        assert.ok(md.startsWith(`---\ntitle: ${JSON.stringify(page.title)}\n`), file);
        assert.ok(md.includes(`\nurl: https://signlens.dev${page.path}\n---\n`), file);
        const h1 = (text.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? '').replace(/<[^>]*>/g, '').replace(/&#39;/g, "'");
        assert.equal(md.match(/^# (.*)$/m)?.[1]?.replace(/\\(.)/g, '$1'), h1, file);
        const prose = md.replace(/^>? ?(`{3,})[^\n]*\n[\s\S]*?\n>? ?\1$/gm, '').replace(/(`+)[^`]*?\1/g, '');
        assert.doesNotMatch(prose, /<\/?[a-z]|&(#\d+|[a-z]+);|\[object Object\]/, file);
    }
});

test('the Markdown has the forms of what the HTML shows', () => {
    const page = { path: '/how-it-works', title: 'T', description: 'D' };
    const md = markdown(
        page,
        `<main id="main"><h2>Two_words</h2><p>A <a href="#verdict">link</a>, <b>bold <b>once</b></b>, <code><abbr class="term" title="Ffz5kwUjkUNw7hV4r6iCJnUoXXsAPFHkCMCmKKDypiwg">Ffz5…piwg</abbr></code> and a badge<span class="verified-badge" role="img" aria-label="verified"><svg><path d="M0"/></svg></span>.</p>
<ol><li>One</li><li>- two</li></ol>
<table><thead><tr><th>On</th><th>Says</th></tr></thead><tbody><tr><td>a|b</td><td>c</td></tr></tbody></table>
<figure class="explanation"><div class="head"><span class="badge">OK</span><p class="summary">Send it</p></div><details><summary>Full</summary><pre>x
  y</pre></details></figure></main>`,
    );
    assert.equal(
        md,
        `---
title: "T"
description: "D"
url: https://signlens.dev/how-it-works
---

## Two\\_words

A [link](https://signlens.dev/how-it-works#verdict), **bold once**, \`Ffz5kwUjkUNw7hV4r6iCJnUoXXsAPFHkCMCmKKDypiwg\` and a badge (verified).

1. One
2. \\- two

| On | Says |
| --- | --- |
| a\\|b | c |

> **OK** Send it
>
> **Full**
>
> \`\`\`text
> x
>   y
> \`\`\`
`,
    );
});

test('a client prefers Markdown when it asks for it at least as much as for HTML', () => {
    assert.equal(prefersMarkdown('text/markdown'), true);
    assert.equal(prefersMarkdown('text/markdown, text/html, */*'), true);
    assert.equal(prefersMarkdown('text/html;q=0.9, text/markdown'), true);
    assert.equal(prefersMarkdown('text/markdown;q=0.5, text/html'), false);
    assert.equal(prefersMarkdown('text/markdown;q=0'), false);
    assert.equal(prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), false);
    assert.equal(prefersMarkdown('*/*'), false);
    assert.equal(prefersMarkdown(null), false);
});

test('a page answers Markdown to who prefers it and HTML to everyone else, and says it varies with Accept', async () => {
    const get = (path: string, accept?: string) =>
        worker.fetch(new Request(`https://signlens.dev${path}`, accept ? { headers: { Accept: accept } } : {}), {
            ASSETS: { fetch: assets },
        });
    for (const path of ['/', '/faq', '/examples/', '/warnings/durable-nonce']) {
        const md = await get(path, 'text/markdown');
        assert.equal(md.status, 200, path);
        assert.equal(md.headers.get('Content-Type'), 'text/markdown; charset=utf-8', path);
        assert.equal(md.headers.get('Vary'), 'Accept', path);
        assert.equal(md.headers.get('Link'), `<https://signlens.dev${path}>; rel="canonical"`, path);
        assert.equal(md.headers.get('Content-Signal'), 'search=yes, ai-input=yes, ai-train=yes', path);
        assert.equal(await md.text(), readFileSync(dist(markdownFor(path)), 'utf8'), path);
        const page = await get(path, 'text/html,*/*;q=0.8');
        assert.equal(page.headers.get('Content-Type'), 'text/html; charset=utf-8', path);
        assert.equal(page.headers.get('Vary'), 'Accept', path);
        assert.equal(await page.text(), readFileSync(dist(fileFor(path)), 'utf8'), path);
    }
    const direct = await get('/faq.md');
    assert.equal(direct.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(direct.headers.get('Link'), '<https://signlens.dev/faq>; rel="canonical"');
    const missing = await get('/nowhere', 'text/markdown');
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get('Content-Type'), 'text/html; charset=utf-8');
    const style = await get('/style.css', 'text/markdown');
    assert.equal(style.headers.get('Content-Type'), 'text/css');
    assert.equal(style.headers.get('Vary'), null);
});

test("llms.txt links each page's Markdown", () => {
    const llms = readFileSync(dist('llms.txt'), 'utf8');
    const links = [...llms.matchAll(/\]\(https:\/\/signlens\.dev\/([^)]*)\)/g)].map((m) => m[1] ?? '');
    assert.equal(links.length, built.filter(({ page }) => !page.hidden && page.path !== '/').length);
    for (const link of links) assert.ok(link.endsWith('.md') && existsSync(dist(link)), link);
});
