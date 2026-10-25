// Records what a SignLens API makes of every transaction under
// transactions/ (or of the slugs given): `recordings/<slug>.json`, the
// explanation and the engine that wrote it. The site shows only what is
// recorded, so a change to the engine shows up as a diff here first.
//
//   SIGNLENS_API_URL=http://127.0.0.1:8787 npm run record [-- slug …]
import { readdirSync, writeFileSync } from 'node:fs';
import { readTransaction } from '../src/transaction.ts';

const api = (process.env.SIGNLENS_API_URL ?? 'http://127.0.0.1:8787').replace(/\/+$/, '');
const dir = new URL('../transactions/', import.meta.url);
const wanted = process.argv.slice(2);
const slugs = readdirSync(dir)
    .filter((f) => f.endsWith('.b64'))
    .map((f) => f.slice(0, -4))
    .filter((slug) => wanted.length === 0 || wanted.includes(slug))
    .sort();

const packs = (await (await fetch(`${api}/v1/packs`)).json()) as { engine?: string };
const engine = `the SignLens engine ${packs.engine ?? ''}`.trim();
const recorded = new Date().toISOString().slice(0, 10);

for (const slug of slugs) {
    const tx = readTransaction(new URL(`${slug}.b64`, dir).pathname, slug);
    const body = {
        transaction: tx.base64,
        kind: 'transaction',
        own_keys: [tx.signer],
        loaded_writable: tx.loadedWritable,
        loaded_readonly: tx.loadedReadonly,
        contacts: tx.contacts.map((c) => ({ name: c.name, address: c.key })),
        // As the extension asks the second time, with the accounts it read.
        ...(tx.accounts.length > 0 ? { accounts: tx.accounts } : {}),
        render: true,
    };
    const response = await fetch(`${api}/v1/explain`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const answer = (await response.json()) as { error?: { message: string }; raw?: { digest: string | null } };
    if (!response.ok || answer.error) throw new Error(`${slug}: ${response.status} ${answer.error?.message ?? ''}`);
    if (answer.raw?.digest !== tx.digest) throw new Error(`${slug}: the API explained other bytes`);
    writeFileSync(
        new URL(`../recordings/${slug}.json`, import.meta.url),
        `${JSON.stringify({ recorded, engine, explanation: answer }, null, 2)}\n`,
    );
    console.log(`${slug}: ${(answer as { verdict?: string }).verdict}`);
}
