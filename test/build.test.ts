import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { build } from '../src/build.ts';
import { html, raw } from '../src/html.ts';
import { fileFor } from '../src/page.ts';
import { readTransaction } from '../src/transaction.ts';

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

test('the sitemap lists every page but the hidden ones', () => {
    const sitemap = readFileSync(dist('sitemap.xml'), 'utf8');
    for (const { page } of built) assert.equal(sitemap.includes(`<loc>https://signlens.dev${page.path}</loc>`), !page.hidden, page.path);
});

test('robots.txt allows every crawler and names the sitemap', () => {
    assert.equal(readFileSync(dist('robots.txt'), 'utf8'), 'User-agent: *\nAllow: /\n\nSitemap: https://signlens.dev/sitemap.xml\n');
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
