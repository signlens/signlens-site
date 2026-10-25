// A page of the site, and the shell every page is rendered in.
import { type Html, html, raw } from './html.ts';
import { NAME, ORIGIN, REPOSITORY } from './site.ts';

export interface Page {
    /** The URL path: `/`, `/faq`, `/examples/`; a path ending in `/` is a section's index. */
    path: string;
    /** The document title, at most 60 characters with the name. */
    title: string;
    /** The meta description, at most 160 characters. */
    description: string;
    /** When the page's content last changed (YYYY-MM-DD), for the sitemap. */
    updated: string;
    body: Html;
    /** Structured data for search engines, on the home page. */
    jsonLd?: object;
    /** A wider column, for the home page. */
    wide?: boolean;
    /** Left out of the sitemap (the 404 page). */
    hidden?: boolean;
}

/** The file a path is written to under dist/. */
export function fileFor(path: string): string {
    if (path.endsWith('/')) return `${path.slice(1)}index.html`;
    return `${path.slice(1)}.html`;
}

const NAV: [string, string][] = [
    ['/examples/', 'Examples'],
    ['/warnings/', 'Warnings'],
    ['/incidents/', 'Incidents'],
    ['/how-it-works', 'How it works'],
    ['/faq', 'FAQ'],
    ['/install', 'Install'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Published 25 October 2026", under the heading of an article. */
export function published(date: string): Html {
    const [year, month, day] = date.split('-').map(Number);
    return html`<p class="dated">Published <time datetime="${date}">${day} ${MONTHS[(month ?? 1) - 1]} ${year}</time></p>`;
}

/** Structured data for an article: its headline and when it was published and last changed. */
export function article(headline: string, publishedOn: string, updated: string): object {
    const organization = { '@type': 'Organization', name: NAME, url: `${ORIGIN}/` };
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        datePublished: publishedOn,
        dateModified: updated,
        author: organization,
        publisher: organization,
    };
}

function current(path: string, href: string): string | null {
    return path === href || (href.endsWith('/') && path.startsWith(href)) ? 'page' : null;
}

export function render(page: Page): string {
    const url = `${ORIGIN}${page.path}`;
    const doc = html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
${page.hidden ? html`<meta name="robots" content="noindex">` : html`<link rel="canonical" href="${url}">`}
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/images/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css">
${page.jsonLd ? raw(`<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`) : ''}
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<header class="site"><div class="bar">
<a class="brand" href="/"><img src="/icon.svg" alt="" width="28" height="28">${NAME}</a>
<nav aria-label="Site">${NAV.map(([href, label]) => html`<a href="${href}"${current(page.path, href) ? raw(' aria-current="page"') : ''}>${label}</a>`)}</nav>
</div></header>
<main id="main"${page.wide ? raw(' class="wide"') : ''}>
${page.body}
${page.hidden || page.path === '/' || page.path === '/install' ? '' : html`<p class="next">Try it: <a href="/install">install SignLens</a> for Chrome or Firefox.</p>`}
</main>
<footer class="site"><div class="bar">
<nav aria-label="More">
<a href="/install">Install</a>
<a href="/compare">Compared with wallet previews</a>
<a href="/privacy">Privacy</a>
<a href="/security">Security</a>
<a href="${REPOSITORY}">Source on GitHub</a>
</nav>
<p>SignLens explains Solana transactions; it holds no keys and signs nothing. It is not affiliated with any project, product or company named on this site; their names are their owners' trademarks.</p>
</div></footer>
</body>
</html>
`;
    return doc.value;
}
