// HTML from template literals. An interpolated value is escaped unless it
// is already HTML, made by `html` or `raw`; arrays are joined; null,
// undefined and false leave nothing.

/** A string that is HTML, not text. */
export class Html {
    readonly value: string;
    constructor(value: string) {
        this.value = value;
    }
    toString(): string {
        return this.value;
    }
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** `text` made safe inside an element or a quoted attribute. */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}

function part(value: unknown): string {
    if (value instanceof Html) return value.value;
    if (Array.isArray(value)) return value.map(part).join('');
    if (value === null || value === undefined || value === false) return '';
    return escapeHtml(String(value));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
    let out = strings[0] ?? '';
    for (const [i, value] of values.entries()) out += part(value) + (strings[i + 1] ?? '');
    return new Html(out);
}

/** `text` taken as HTML as it is: for markup written in this repository only. */
export function raw(text: string): Html {
    return new Html(text);
}
