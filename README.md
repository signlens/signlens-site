# signlens.dev

The site of [SignLens](https://github.com/signlens/signlens-extension), the
browser extension that explains every Solana transaction in plain words
before your wallet signs it: what it is, what it shows on real mainnet
transactions, what it warns about, the attacks it reads, and how to
install it.

Plain HTML, written by a small TypeScript script that Node runs as it is,
with no runtime dependency and no script in the pages. Served by
Cloudflare Workers static assets.

## Building

Node 26.1 or later (`nvm use` reads `.nvmrc`).

```sh
npm ci
npm run build    # dist/: every page, the static files, sitemap.xml, robots.txt, llms.txt, security.txt, _headers
npm run serve    # dist/ on http://127.0.0.1:8788, resolved as Workers resolves it
npm run check    # Biome (lint and format) and the TypeScript compiler, strict
npm test         # builds, then checks every link, page head, the sitemap and the transaction reader
```

## Layout

| | |
|---|---|
| `src/build.ts` | the build: every page into `dist/`, and the checks that refuse a recording that explains other bytes or that no page shows |
| `src/page.ts` | a page, and the shell every page is rendered in |
| `src/pages/` | the pages: home, examples, warnings, incidents, how it works, the comparison, the FAQ, install, privacy, security, 404 |
| `src/explanation.ts` | an explanation as the SignLens window shows it, in HTML: the sentences follow the extension's `src/ui/render.ts` |
| `src/transaction.ts` | a transaction file: its header lines and its bytes |
| `src/html.ts` | HTML from template literals, escaping what is interpolated |
| `transactions/` | the transactions the site shows: mainnet ones with their signature, constructed ones marked so |
| `recordings/` | what a SignLens API answered for each, written by `npm run record` |
| `static/` | the stylesheet, the icons and the images, copied as they are |
| `design/og.html` | the social preview, rendered into `static/images/og.png` |
| `wrangler.jsonc` | the Workers configuration: `dist/` as static assets, 404s from `404.html`, no `workers.dev` copy |

## The examples are recorded, never written

Every explanation on the site is what the SignLens engine answered for
that transaction, recorded and committed. A transaction file's header
says whose transaction it is to SignLens: `# signer: <key>` when the user
is not the fee payer, `# contact: Name <key>` for each address-book entry,
the addresses its lookup tables load (`# loaded-writable:`,
`# loaded-readonly:`), and, for an explanation that names accounts to
read, those accounts as an RPC returned them, one `# account: <address>
<owner> <slot> <base64 data>` line each with a `# accounts read:
YYYY-MM-DD` line, which the recording sends as the extension does and
the card's caption mentions.

To add one: put the transaction under `transactions/<slug>.b64`, show it
on a page with `shown('<slug>')`, and record it. Record against an API
built from the engine commit that production runs, or will run when the
site goes out:

```sh
SIGNLENS_API_URL=http://127.0.0.1:8787 npm run record -- <slug>
```

The build refuses a recording whose digest is not its transaction's, and
a transaction no page shows. Re-recording everything after an engine
change (`npm run record`) shows what changed on the site as a diff.

## Deploying

Cloudflare's Git integration (Workers Builds) deploys `master`:

- build command `npm run check && npm test && npm run build`, deploy
  command `npx wrangler deploy`, production branch `master`, with the
  Wrangler version pinned in `package.json`;
- the custom domain `signlens.dev` on the Worker, and nowhere else:
  `wrangler.jsonc` turns the `workers.dev` route off. A branch build
  still gets a preview URL on `workers.dev`, which `_headers` marks
  `noindex`;
- `www.signlens.dev` redirects to `signlens.dev`, set in the dashboard: a
  proxied DNS record for `www` (an `AAAA` to `100::`) and a redirect rule
  from `www.signlens.dev/*` to `https://signlens.dev/${1}`, status 301,
  query string kept.

Visits are counted by Cloudflare Web Analytics with automatic setup:
Cloudflare adds its beacon to every HTML response at the edge, so the
pages carry none. The Content-Security-Policy in `_headers` allows that
beacon (`script-src https://static.cloudflareinsights.com`) and its
reports to `/cdn-cgi/rum` on the same origin (`connect-src 'self'`), and
nothing else. After a deploy, `curl -s https://signlens.dev/ | grep
cloudflareinsights` shows whether the beacon is being added.

The window and popup images in `static/images/` are the extension's own
screenshots (`npm run screenshots` in its checkout, `docs/images/`), taken
at twice the pixel density so that they stay sharp on high-density
screens: `deviceScaleFactor: 2` in its test harness's browser context for
that run.

The icons are the extension's drawing: `static/icon.svg` as it is;
`static/favicon.ico`, for whatever asks for `/favicon.ico` instead of
reading the page's links, holds the extension's 16, 32 and 48 pixel PNGs
(`npm run favicon -- ../signlens-extension/static/icons`); and
`static/apple-touch-icon.png`, the icon a phone puts on its home screen,
is rendered from `design/apple-touch-icon.html` at 180×180 like the social
preview below.

The social preview is rendered from `design/og.html` with Playwright, for
example from the extension's checkout:

```sh
npx playwright screenshot --viewport-size=1200,630 file://$PWD/design/og.html static/images/og.png
```

## License

Apache-2.0, see [`LICENSE`](LICENSE). SignLens is not affiliated with the
projects whose programs it explains; their names are their owners'
trademarks.
