// A transaction file: `#` header lines (the signature, the slot, the signer
// SignLens explains it for, the addresses its lookup tables load, contacts),
// then the wire bytes in base64.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface Contact {
    name: string;
    key: string;
}

export interface TransactionFile {
    slug: string;
    /** The first signature, base58; null for a constructed transaction. */
    signature: string | null;
    slot: number | null;
    /** Hand-built to show a case, never on mainnet. */
    constructed: boolean;
    /** The key SignLens explains it for: the `# signer:` line, else the fee payer. */
    signer: string;
    loadedWritable: string[];
    loadedReadonly: string[];
    contacts: Contact[];
    /** The wire bytes, base64. */
    base64: string;
    /** SHA-256 of the message bytes, as an explanation's `raw.digest` gives it. */
    digest: string;
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58(bytes: Uint8Array): string {
    let n = 0n;
    for (const b of bytes) n = n * 256n + BigInt(b);
    let out = '';
    while (n > 0n) {
        out = (ALPHABET[Number(n % 58n)] ?? '') + out;
        n /= 58n;
    }
    for (const b of bytes) {
        if (b !== 0) break;
        out = `1${out}`;
    }
    return out;
}

/** Solana's compact-u16 at `at`: the value and the offset after it. */
function compact(bytes: Uint8Array, at: number): [number, number] {
    let value = 0;
    for (let shift = 0, i = at; ; shift += 7, i += 1) {
        const b = bytes[i];
        if (b === undefined) throw new Error('truncated');
        value |= (b & 0x7f) << shift;
        if ((b & 0x80) === 0) return [value, i + 1];
    }
}

function header(lines: string[], key: string): string | null {
    const prefix = `# ${key}:`;
    const line = lines.find((l) => l.startsWith(prefix));
    return line === undefined ? null : line.slice(prefix.length).trim();
}

export function readTransaction(path: string, slug: string): TransactionFile {
    const lines = readFileSync(path, 'utf8').split('\n');
    const base64 = lines
        .filter((l) => !l.startsWith('#'))
        .map((l) => l.trim())
        .join('');
    const bytes = Buffer.from(base64, 'base64');
    const [signatures, start] = compact(bytes, 0);
    let at = start + 64 * signatures;
    const message = bytes.subarray(at);
    if (((bytes[at] ?? 0) & 0x80) !== 0) at += 1;
    at += 3;
    const [, keysAt] = compact(bytes, at);
    const payer = base58(bytes.subarray(keysAt, keysAt + 32));
    const constructed = lines.some((l) => /^# (Synthetic|Constructed)/.test(l));
    const signature = constructed ? null : header(lines, 'signature');
    const slot = header(lines, 'slot');
    const list = (key: string) => (header(lines, key) ?? '').split(/\s+/).filter(Boolean);
    const contacts = lines
        .filter((l) => l.startsWith('# contact:'))
        .map((l) => {
            const match = /^# contact: (.+) <(\w+)>$/.exec(l);
            if (!match?.[1] || !match[2]) throw new Error(`${path}: a contact line is "# contact: Name <key>"`);
            return { name: match[1], key: match[2] };
        });
    return {
        slug,
        signature,
        slot: slot === null ? null : Number(slot),
        constructed,
        signer: header(lines, 'signer') ?? payer,
        loadedWritable: list('loaded-writable'),
        loadedReadonly: list('loaded-readonly'),
        contacts,
        base64,
        digest: createHash('sha256').update(message).digest('hex'),
    };
}
