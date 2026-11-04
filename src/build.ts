// Builds the site into dist/: every page and its Markdown, the static files,
// the sitemap, robots.txt, llms.txt, security.txt and the response headers. It refuses
// to build a recording that does not explain its transaction, or one no page
// shows. The pages carry no script of their own: Cloudflare Web Analytics, set
// up as automatic, adds its beacon at the edge, from static.cloudflareinsights.com,
// and it reports to /cdn-cgi/rum on this origin, which is what the policy allows.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { markdown } from './markdown.ts';
import { fileFor, markdownFor, type Page, render } from './page.ts';
import { clearSigningPage, comparePage, faqPage, howItWorksPage } from './pages/about.ts';
import { examplePages } from './pages/examples.ts';
import { homePage } from './pages/home.ts';
import { incidentPages } from './pages/incidents.ts';
import { installPage, notFoundPage, privacyPage, securityPage } from './pages/info.ts';
import { warningPages } from './pages/warnings.ts';
import { load, used } from './shown.ts';
import { CONTENT_SIGNAL, ORIGIN, SECURITY_EMAIL } from './site.ts';

const DIST = new URL('../dist/', import.meta.url);

export function pages(): Page[] {
    return [
        homePage(),
        ...examplePages(),
        ...warningPages(),
        ...incidentPages(),
        howItWorksPage(),
        clearSigningPage(),
        comparePage(),
        faqPage(),
        installPage(),
        privacyPage(),
        securityPage(),
        notFoundPage(),
    ];
}

function check(all: Page[]): void {
    const titles = new Set<string>();
    for (const page of all) {
        if (page.title.length > 65) throw new Error(`${page.path}: the title is ${page.title.length} characters`);
        if (page.description.length > 160) throw new Error(`${page.path}: the description is ${page.description.length} characters`);
        if (titles.has(page.title)) throw new Error(`${page.path}: the title is another page's`);
        titles.add(page.title);
    }
    const recorded = readdirSync(new URL('../transactions/', import.meta.url))
        .filter((f) => f.endsWith('.b64'))
        .map((f) => f.slice(0, -4));
    const shownSlugs = new Set(used());
    for (const slug of recorded) {
        if (!shownSlugs.has(slug)) throw new Error(`transactions/${slug}.b64: no page shows it`);
        const { tx, recording } = load(slug);
        if (recording.explanation.raw?.digest !== tx.digest) throw new Error(`recordings/${slug}.json: it explains other bytes`);
    }
}

/** Every crawler is welcome, and the content signals (contentsignals.org) say what for: search, AI answers, and training. */
const ROBOTS = `# Content signals (https://contentsignals.org/): you may use this site's content
# for search, as input to AI answers, and to train AI models.
User-agent: *
Content-Signal: ${CONTENT_SIGNAL}
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

const HEADERS = `/*
  Content-Security-Policy: default-src 'none'; script-src https://static.cloudflareinsights.com; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  X-Frame-Options: DENY

/images/*
  Cache-Control: public, max-age=86400

https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
`;

function sitemap(all: Page[]): string {
    const urls = all
        .filter((p) => !p.hidden)
        .map((p) => `  <url><loc>${ORIGIN}${p.path}</loc><lastmod>${p.updated}</lastmod></url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function llms(all: Page[]): string {
    const list = all
        .filter((p) => !p.hidden && p.path !== '/')
        .map((p) => `- [${p.title.replace(/ \| SignLens$/, '')}](${ORIGIN}/${markdownFor(p.path)}): ${p.description}`)
        .join('\n');
    return `# SignLens

> SignLens is a free browser extension (Chrome, Brave, Edge, Firefox) that explains each Solana transaction a dapp asks you to sign, in plain words, before the user's wallet signs it, and says when it cannot: clear signing for Phantom, Backpack, Solflare and other Solana wallets. It holds no keys and passes each request unchanged to the user's own wallet. It warns about owner changes, unlimited token approvals, durable nonces, lookalike addresses, unknown programs and multisig approvals whose content is not in the signed bytes.

Every page is also Markdown: the links below are, and any page answers Markdown to a request with \`Accept: text/markdown\`.

## Pages

${list}
`;
}

function securityTxt(): string {
    const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    return `Contact: mailto:${SECURITY_EMAIL}
Expires: ${expires}T00:00:00.000Z
Preferred-Languages: en
Canonical: ${ORIGIN}/.well-known/security.txt
Policy: https://github.com/signlens/signlens-extension/blob/master/SECURITY.md
`;
}

function write(path: string, text: string): void {
    const url = new URL(path, DIST);
    mkdirSync(dirname(url.pathname), { recursive: true });
    writeFileSync(url, text);
}

export function build(): Page[] {
    const all = pages();
    check(all);
    rmSync(DIST, { recursive: true, force: true });
    cpSync(new URL('../static/', import.meta.url), DIST, { recursive: true });
    for (const page of all) {
        const rendered = render(page);
        write(fileFor(page.path), rendered);
        if (!page.hidden) write(markdownFor(page.path), markdown(page, rendered));
    }
    write('sitemap.xml', sitemap(all));
    write('robots.txt', ROBOTS);
    write('llms.txt', llms(all));
    write('.well-known/security.txt', securityTxt());
    write('_headers', HEADERS);
    return all;
}

if (import.meta.main) {
    const all = build();
    console.log(`dist/: ${all.length} pages`);
}
