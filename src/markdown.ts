// A page as Markdown, for an agent that asks for it (Accept: text/markdown):
// the headings, paragraphs, lists, tables, links, images and code of its
// main column, without the menu, the footer or the styling. It reads the
// HTML src/html.ts writes, whose attributes are quoted and whose text is
// escaped, not HTML at large.
import { ORIGIN } from './site.ts';

interface Element {
    tag: string;
    attributes: Record<string, string>;
    children: Node[];
}
type Node = Element | string;

const VOID = new Set(['img', 'source', 'br', 'hr', 'wbr', 'meta', 'link', 'input']);
const BLOCK = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'table',
    'dl',
    'dt',
    'dd',
    'figure',
    'figcaption',
    'div',
    'section',
    'details',
    'summary',
    'pre',
    'blockquote',
]);

function decode(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
        if (name[0] === '#') return String.fromCodePoint(Number.parseInt(name.slice(name[1] === 'x' ? 2 : 1), name[1] === 'x' ? 16 : 10));
        return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[name.toLowerCase()] ?? entity;
    });
}

function parse(markup: string): Element {
    const root: Element = { tag: '#root', attributes: {}, children: [] };
    const open = [root];
    for (const match of markup.matchAll(/<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|[^<]+/g)) {
        const top = open[open.length - 1] ?? root;
        const [token, closing, name, rest = '', selfClosing] = match;
        if (name === undefined) {
            if (!token.startsWith('<!--')) top.children.push(decode(token));
            continue;
        }
        const tag = name.toLowerCase();
        if (closing) {
            const at = open.map((element) => element.tag).lastIndexOf(tag);
            if (at > 0) open.length = at;
            continue;
        }
        const attributes: Record<string, string> = {};
        for (const [, key = '', value = ''] of rest.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) attributes[key] = decode(value);
        const element: Element = { tag, attributes, children: [] };
        top.children.push(element);
        if (!selfClosing && !VOID.has(tag)) open.push(element);
    }
    return root;
}

function hasClass(element: Element, name: string): boolean {
    return (element.attributes.class ?? '').split(' ').includes(name);
}

function textOf(node: Node): string {
    return typeof node === 'string' ? node : node.children.map(textOf).join('');
}

/** Text with what Markdown would read as markup escaped. */
function escapeMarkdown(text: string): string {
    return text.replace(/[\\`*_[\]<]/g, '\\$&');
}

/** A block's first characters, escaped where Markdown would start a heading, a list or a quote. */
function startSafe(text: string): string {
    return text.replace(/^(\d+)([.)])(?= )/, '$1\\$2').replace(/^([#>+-])/, '\\$1');
}

/** Code, in as many backticks as it needs. */
function codeSpan(text: string): string {
    const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map((run) => run[0].length));
    const fence = '`'.repeat(longest + 1);
    return text.includes('`') ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`;
}

class Converter {
    /** The page's address, against which its links and images are resolved. */
    private readonly base: string;
    constructor(base: string) {
        this.base = base;
    }

    /** Inline content, its white space collapsed. */
    line(nodes: Node[]): string {
        return nodes
            .map((node) => this.inline(node, false))
            .join('')
            .replace(/\s+/g, ' ')
            .replace(/\)\[/g, ') [') // links side by side, as buttons are
            .trim();
    }

    inline(node: Node, bold: boolean): string {
        if (typeof node === 'string') return escapeMarkdown(node);
        const inner = () => node.children.map((child) => this.inline(child, bold || node.tag === 'b' || node.tag === 'strong')).join('');
        switch (node.tag) {
            case 'a': {
                const text = inner().replace(/\s+/g, ' ').trim();
                return text ? `[${text}](${new URL(node.attributes.href ?? '', this.base).href})` : '';
            }
            case 'b':
            case 'strong':
                return bold ? inner() : strong(inner());
            case 'code':
                // A short address shows its whole one: an agent reads it, it does not hover it.
                return codeSpan(
                    node.children
                        .map((child) =>
                            typeof child !== 'string' && child.tag === 'abbr' ? (child.attributes.title ?? textOf(child)) : textOf(child),
                        )
                        .join(''),
                );
            case 'img':
                return `![${escapeMarkdown(node.attributes.alt ?? '')}](${new URL(node.attributes.src ?? '', this.base).href})`;
            case 'picture':
                return node.children
                    .map((child) => (typeof child !== 'string' && child.tag === 'img' ? this.inline(child, bold) : ''))
                    .join('');
            case 'svg':
                return '';
            case 'br':
                return ' ';
            case 'span':
                // The verified badge is drawn: its words are its label.
                if (node.attributes.role === 'img') return ` (${escapeMarkdown(node.attributes['aria-label'] ?? '')})`;
                if (!bold && (hasClass(node, 'badge') || hasClass(node, 'severity'))) return strong(inner());
                return inner();
            default:
                return inner();
        }
    }

    /** Block content: each run of inline content a paragraph, each block in its own form. */
    blocks(nodes: Node[]): string[] {
        const out: string[] = [];
        let run: Node[] = [];
        const flush = () => {
            const text = this.line(run);
            if (text) out.push(startSafe(text));
            run = [];
        };
        for (const node of nodes) {
            if (typeof node !== 'string' && BLOCK.has(node.tag)) {
                flush();
                out.push(...this.block(node));
            } else run.push(node);
        }
        flush();
        return out;
    }

    block(element: Element): string[] {
        const heading = /^h([1-6])$/.exec(element.tag);
        if (heading) return [`${'#'.repeat(Number(heading[1]))} ${this.line(element.children)}`];
        switch (element.tag) {
            case 'dt':
            case 'summary':
                return [strong(this.line(element.children))];
            case 'p':
                return hasClass(element, 'label') ? [strong(this.line(element.children))] : this.blocks(element.children);
            case 'ul':
            case 'ol':
                return [this.list(element)];
            case 'table':
                return [this.table(element)];
            case 'pre': {
                const text = textOf(element).replace(/^\n/, '').replace(/\n$/, '');
                const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((run) => run[0].length));
                const fence = '`'.repeat(longest + 1);
                return [`${fence}text\n${text}\n${fence}`];
            }
            case 'figure':
                // An explanation is set apart from the page around it, as its card is.
                return hasClass(element, 'explanation')
                    ? [quote(this.blocks(element.children).join('\n\n'))]
                    : this.blocks(element.children);
            case 'blockquote':
                return [quote(this.blocks(element.children).join('\n\n'))];
            case 'div':
                // A card's head: its verdict, then its summary, on one line.
                if (hasClass(element, 'head')) return [element.children.map((child) => this.line([child])).join(' ')];
                return this.blocks(element.children);
            default:
                return this.blocks(element.children);
        }
    }

    list(element: Element): string {
        const ordered = element.tag === 'ol';
        const items = element.children.filter((child): child is Element => typeof child !== 'string' && child.tag === 'li');
        const blocks = items.map((item) => this.blocks(item.children));
        // Items of more than one block are set apart by a blank line, as Markdown's loose lists are.
        const loose = blocks.some((item) => item.length > 1);
        return blocks
            .map((item, i) => {
                const marker = ordered ? `${i + 1}. ` : '- ';
                const lines = item.join('\n\n').split('\n');
                return lines.map((line, j) => (j === 0 ? marker + line : line ? ' '.repeat(marker.length) + line : line)).join('\n');
            })
            .join(loose ? '\n\n' : '\n');
    }

    table(element: Element): string {
        const rows: Element[] = [];
        const collect = (node: Element) => {
            for (const child of node.children) {
                if (typeof child === 'string') continue;
                if (child.tag === 'tr') rows.push(child);
                else collect(child);
            }
        };
        collect(element);
        const cells = rows.map((row) =>
            row.children
                .filter((cell): cell is Element => typeof cell !== 'string' && (cell.tag === 'th' || cell.tag === 'td'))
                .map((cell) => this.line(cell.children).replace(/\|/g, '\\|')),
        );
        const [head = [], ...body] = cells;
        const row = (values: string[]) => `| ${values.join(' | ')} |`;
        return [row(head), row(head.map(() => '---')), ...body.map(row)].join('\n');
    }
}

function strong(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return text;
    const [, before = '', after = ''] = /^(\s*)[\s\S]*?(\s*)$/.exec(text) ?? [];
    return `${before}**${trimmed}**${after}`;
}

function quote(text: string): string {
    return text
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
}

/** A rendered page's main column as Markdown, under its title, description and address. */
export function markdown(page: { path: string; title: string; description: string }, rendered: string): string {
    const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(rendered)?.[1];
    if (main === undefined) throw new Error(`${page.path}: no <main>`);
    const url = `${ORIGIN}${page.path}`;
    const body = new Converter(url).blocks(parse(main).children).join('\n\n');
    return `---\ntitle: ${JSON.stringify(page.title)}\ndescription: ${JSON.stringify(page.description)}\nurl: ${url}\n---\n\n${body}\n`;
}
