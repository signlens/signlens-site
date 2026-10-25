// Serves dist/ on http://127.0.0.1:8788 the way Workers static assets do:
// `/privacy` is privacy.html, `/examples/` is examples/index.html, anything
// else is 404.html with a 404. For looking at a build, not for production.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
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

const port = Number(process.env.PORT ?? 8788);
createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    const found = file(path);
    const target = found ?? `${DIST}404.html`;
    response.writeHead(found ? 200 : 404, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' });
    response.end(readFileSync(target));
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
