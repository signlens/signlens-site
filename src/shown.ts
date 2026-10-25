// A transaction as SignLens shows it: the committed transaction file and its
// recording, read once.
import { card, type Recording, readRecording } from './explanation.ts';
import type { Html } from './html.ts';
import { readTransaction, type TransactionFile } from './transaction.ts';

const cache = new Map<string, { tx: TransactionFile; recording: Recording }>();

export function load(slug: string): { tx: TransactionFile; recording: Recording } {
    let entry = cache.get(slug);
    if (!entry) {
        const tx = readTransaction(new URL(`../transactions/${slug}.b64`, import.meta.url).pathname, slug);
        entry = { tx, recording: readRecording(slug) };
        cache.set(slug, entry);
    }
    return entry;
}

/** The card for `slug`, as the window shows it. */
export function shown(slug: string): Html {
    const { tx, recording } = load(slug);
    return card(tx, recording);
}

/** Every slug a page showed, so the build can check that each recording is used. */
export function used(): string[] {
    return [...cache.keys()];
}
