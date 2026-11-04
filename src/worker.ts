// signlens.dev's one script, in front of the static files. A request that
// prefers Markdown (Accept: text/markdown, as an agent sends it) gets the
// page's Markdown, which the build writes beside its HTML; every other
// request goes to the static files as it came. A page's answers say they
// vary with Accept, so that no cache hands one kind to a client that asked
// for the other. Images do not reach it: wrangler.jsonc sends them straight
// to the static files.
import { markdownFor, pathOfMarkdown } from './page.ts';
import { CONTENT_SIGNAL, ORIGIN } from './site.ts';

/** The static files, as Workers hands them to the script. */
export interface Assets {
    fetch(request: Request): Promise<Response>;
}

/** Whether a client prefers Markdown: its Accept header asks for `text/markdown`, at least as much as for `text/html`. */
export function prefersMarkdown(accept: string | null): boolean {
    const quality = new Map<string, number>();
    for (const entry of (accept ?? '').split(',')) {
        const [type = '', ...parameters] = entry.split(';').map((part) => part.trim().toLowerCase());
        const q = parameters.find((parameter) => parameter.startsWith('q='));
        quality.set(type, q === undefined ? 1 : Number(q.slice(2)) || 0);
    }
    const markdown = quality.get('text/markdown') ?? 0;
    return markdown > 0 && markdown >= (quality.get('text/html') ?? 0);
}

/** A page's address: one ending in `/`, or whose last segment has no extension. */
function isPage(path: string): boolean {
    return !/\.[^/]*$/.test(path);
}

/** The Markdown file's answer, named for what it is and pointing at its page. */
function asMarkdown(response: Response, path: string): Response {
    const out = new Response(response.body, response);
    if (response.ok) out.headers.set('Content-Type', 'text/markdown; charset=utf-8');
    out.headers.set('Link', `<${ORIGIN}${path}>; rel="canonical"`);
    out.headers.set('Content-Signal', CONTENT_SIGNAL);
    return out;
}

function varied(response: Response): Response {
    const out = new Response(response.body, response);
    out.headers.append('Vary', 'Accept');
    return out;
}

export default {
    async fetch(request: Request, env: { ASSETS: Assets }): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        if (path.endsWith('.md')) {
            const response = await env.ASSETS.fetch(request);
            return response.ok || response.status === 304 ? asMarkdown(response, pathOfMarkdown(path.slice(1))) : response;
        }
        if (!isPage(path)) return env.ASSETS.fetch(request);
        if (prefersMarkdown(request.headers.get('Accept'))) {
            const response = await env.ASSETS.fetch(new Request(new URL(`/${markdownFor(path)}`, url), request));
            if (response.ok || response.status === 304) return varied(asMarkdown(response, path));
        }
        return varied(await env.ASSETS.fetch(request));
    },
};
