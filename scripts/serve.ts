// Serves dist/ on http://127.0.0.1:8788 the way signlens.dev does: through
// src/worker.ts, in front of the static files as Workers serves them, where
// `/privacy` is privacy.html, `/examples/` is examples/index.html, and
// anything else is 404.html with a 404. For looking at a build, not for
// production; `npx wrangler dev` runs Cloudflare's own.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import worker from '../src/worker.ts';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.css': 'text/css',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
};

function file(path: string): string | null {
    const clean = decodeURIComponent(path).replace(/\.\.+/g, '');
    for (const candidate of clean.endsWith('/') ? [`${clean}index.html`] : [clean, `${clean}.html`]) {
        try {
            if (statSync(DIST + candidate).isFile()) return DIST + candidate;
        } catch {}
    }
    return null;
}

/** The static files of dist/, as the Worker's ASSETS binding hands them. */
export async function assets(request: Request): Promise<Response> {
    const found = file(new URL(request.url).pathname);
    const target = found ?? `${DIST}404.html`;
    const headers = { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' };
    return new Response(request.method === 'HEAD' ? null : readFileSync(target), { status: found ? 200 : 404, headers });
}

if (import.meta.main) {
    const port = Number(process.env.PORT ?? 8788);
    createServer(async (incoming, outgoing) => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(name, value);
        const request = new Request(new URL(incoming.url ?? '/', `http://127.0.0.1:${port}`), {
            method: incoming.method ?? 'GET',
            headers,
        });
        const response = await worker.fetch(request, { ASSETS: { fetch: assets } });
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
    }).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
}
