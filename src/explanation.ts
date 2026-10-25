// An explanation document (`signlens-explanation/1`) as the SignLens window
// shows it, in HTML that needs no script: the verdict and the summary, the
// findings, what the transaction does as sentences, and the engine's full
// text. The sentences follow the extension's `src/ui/render.ts`.
import { readFileSync } from 'node:fs';
import { type Html, html } from './html.ts';
import { explorer } from './site.ts';
import type { TransactionFile } from './transaction.ts';

type Trust = 'fact' | 'verified' | 'claimed';
type Bound = 'exact' | 'at_least' | 'at_most' | 'unlimited' | 'unknown';
export type Verdict = 'ok' | 'warn' | 'block';
type Severity = 'info' | 'warning' | 'high' | 'critical';

interface Address {
    address: string;
    label: string | null;
    label_trust: Trust;
    is_self: boolean;
}
interface Amount {
    units: string;
    asset: { id: string; symbol: string | null; decimals: number | null; trust: Trust };
    bound: Bound;
    note: string | null;
}
type Lifetime = { type: 'recent_blockhash' } | { type: 'durable_nonce'; value: { nonce_account: Address } };
type Effect =
    | { type: 'transfer'; value: { from: Address; to: Address; amount: Amount } }
    | { type: 'burn'; value: { account: Address; amount: Amount } }
    | { type: 'authority_change'; value: { subject: Address; authority: string; new_authority: Address | null } }
    | { type: 'delegate'; value: { subject: Address; delegate: Address; amount: Amount } }
    | { type: 'revoke'; value: { subject: Address } }
    | { type: 'create'; value: { account: Address; owner: Address; deposit: Amount | null; if_missing: boolean } }
    | { type: 'close'; value: { account: Address; destination: Address } }
    | { type: 'fee'; value: { payer: Address; amount: Amount } }
    | { type: 'lifetime'; value: Lifetime }
    | { type: 'proposed'; value: { by: Address; effect: Effect } }
    | { type: 'other'; value: { description: string } };

export interface Explanation {
    schema: string;
    summary: string;
    verdict: Verdict;
    findings: { severity: Severity; code: string; message: string; instruction: number | null }[];
    effects: Effect[];
    raw: { format: string; digest: string | null } | null;
    text: string;
}

/** A recording: what the API answered for a transaction, and when. */
export interface Recording {
    recorded: string;
    engine: string;
    explanation: Explanation;
}

export function readRecording(slug: string): Recording {
    return JSON.parse(readFileSync(new URL(`../recordings/${slug}.json`, import.meta.url), 'utf8')) as Recording;
}

export const VERDICT_WORD: Record<Verdict, string> = { ok: 'OK', warn: 'Warning', block: 'Blocked' };
const SEVERITY_WORD: Record<Severity, string> = { info: 'Note', warning: 'Warning', high: 'High', critical: 'Critical' };
const PREFIX: Record<Bound, string> = { exact: '', at_least: '≥ ', at_most: '≤ ', unlimited: 'UNLIMITED ', unknown: 'unknown amount of ' };

/** What a marker on a card means, for a reader who hovers it; /how-it-works#reading says it at length. */
const HELP = {
    verified: 'Known by its address, from a verified token list or by derivation, not by the name it gives itself',
    claimed: 'Not checked: what the token calls itself, or what an RPC reported',
    at_least: 'At least: the exact amount is set when the transaction runs, and will not be less',
    at_most: 'At most: the program may take less, never more',
    unlimited: 'The largest amount there is: no limit',
    raw: "SignLens does not know this token's decimals, so the amount is in the token's smallest units",
} as const;

function term(text: string, help: string): Html {
    return html`<abbr class="term" title="${help}">${text}</abbr>`;
}

/** The marker after a name or an amount: nothing for a fact, else what it rests on. */
function marker(trust: Trust): Html | string {
    if (trust === 'verified') return html` ${term('(verified)', HELP.verified)}`;
    if (trust === 'claimed') return html` ${term('(unverified)', HELP.claimed)}`;
    return '';
}

/** The bound before an amount, with what it means. */
function prefix(bound: Bound): Html | string {
    if (bound === 'at_least' || bound === 'at_most' || bound === 'unlimited') {
        return html`${term(PREFIX[bound].trim(), HELP[bound])} `;
    }
    return PREFIX[bound];
}

function group(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** An amount's quantity as the engine writes it: scaled by the asset's decimals, or raw units. */
function quantity(amount: Amount): Html | string {
    const decimals = amount.asset.decimals;
    const units = BigInt(amount.units);
    if (decimals === null) return html`${String(units)} ${term('raw units', HELP.raw)}`;
    const sign = units < 0n ? '-' : '';
    const magnitude = units < 0n ? -units : units;
    const scale = 10n ** BigInt(decimals);
    const fraction = (magnitude % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
    const integer = group((magnitude / scale).toString());
    return `${sign}${fraction ? `${integer}.${fraction}` : integer}`;
}

export function short(address: string): string {
    return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

function amountHtml(amount: Amount): Html {
    const before = prefix(amount.bound);
    const symbol = amount.asset.symbol;
    let text: Html;
    if ((amount.bound === 'unlimited' || amount.bound === 'unknown') && symbol) text = html`${before}${symbol}`;
    else if (amount.bound === 'unlimited') text = html`${before}unverified token`;
    else if (amount.bound === 'unknown') text = html`unknown amount of an unverified token`;
    else if (symbol) text = html`${before}${quantity(amount)} ${symbol}`;
    else text = html`${before}${quantity(amount)} of an unverified token`;
    let tail = '';
    if (amount.note) tail += ` (${amount.note})`;
    if (!symbol) tail += ` (${amount.asset.id})`;
    return html`<b class="amount">${text}${marker(amount.asset.trust)}</b>${tail}`;
}

function addressHtml(address: Address): Html {
    const self = address.is_self ? ' self' : '';
    if (address.label)
        return html`<span class="address${self}"><b>${address.label}</b> (<code>${term(short(address.address), address.address)}</code>)${marker(address.label_trust)}</span>`;
    return html`<span class="address${self}"><code>${address.address}</code></span>`;
}

/** One effect as a sentence, in the second person where it happens to the signer. */
function effectHtml(effect: Effect): Html {
    switch (effect.type) {
        case 'transfer': {
            const v = effect.value;
            if (v.from.is_self && !v.to.is_self)
                return html`You send ${amountHtml(v.amount)} from ${addressHtml(v.from)} to ${addressHtml(v.to)}`;
            if (v.to.is_self && !v.from.is_self)
                return html`You receive ${amountHtml(v.amount)} into ${addressHtml(v.to)} from ${addressHtml(v.from)}`;
            return html`Transfer ${amountHtml(v.amount)} from ${addressHtml(v.from)} to ${addressHtml(v.to)}`;
        }
        case 'burn':
            return html`${effect.value.account.is_self ? 'You burn' : 'Burn'} ${amountHtml(effect.value.amount)} from ${addressHtml(effect.value.account)}`;
        case 'authority_change': {
            const v = effect.value;
            return v.new_authority
                ? html`Give the ${v.authority} authority over ${addressHtml(v.subject)} to ${addressHtml(v.new_authority)}`
                : html`Permanently remove the ${v.authority} authority over ${addressHtml(v.subject)}`;
        }
        case 'delegate': {
            const v = effect.value;
            return html`Allow ${addressHtml(v.delegate)} to spend ${amountHtml(v.amount)} from ${addressHtml(v.subject)}`;
        }
        case 'revoke':
            return html`Revoke the delegate on ${addressHtml(effect.value.subject)}`;
        case 'create': {
            const v = effect.value;
            return html`Create ${addressHtml(v.account)} owned by ${addressHtml(v.owner)}${v.deposit ? html`, depositing ${amountHtml(v.deposit)}` : ''}${v.if_missing ? ' unless it already exists' : ''}`;
        }
        case 'close':
            return html`Close ${addressHtml(effect.value.account)} and send its balance to ${addressHtml(effect.value.destination)}`;
        case 'fee': {
            const v = effect.value;
            return v.payer.is_self
                ? html`You pay a fee of ${amountHtml(v.amount)}`
                : html`${addressHtml(v.payer)} pays a fee of ${amountHtml(v.amount)}`;
        }
        case 'lifetime': {
            const v = effect.value;
            return v.type === 'durable_nonce'
                ? html`<b>Valid FOREVER</b> until nonce account ${addressHtml(v.value.nonce_account)} is advanced (durable nonce)`
                : html`Valid for about a minute (recent blockhash)`;
        }
        case 'proposed':
            return html`Once approved, ${addressHtml(effect.value.by)} would: ${effectHtml(effect.value.effect)}`;
        case 'other':
            return html`${effect.value.description}`;
    }
}

/** The line under a card: where the transaction comes from, and for whom it was explained. */
function caption(tx: TransactionFile, recording: Recording): Html {
    const origin = tx.signature
        ? html`Mainnet transaction <a href="${explorer(tx.signature)}"><code>${short(tx.signature)}</code></a>${tx.slot === null ? '' : html`, slot ${group(String(tx.slot))}`}`
        : html`A constructed transaction, built to show this case; it was never sent`;
    const read =
        tx.accounts.length === 0
            ? ''
            : html`, with the ${tx.accounts.length === 1 ? 'account' : `${tx.accounts.length} accounts`} the explanation asked for, as an RPC returned them on ${tx.accountsRead}`;
    return html`${origin}. Explained for <code>${short(tx.signer)}</code> as the signer, by ${recording.engine}, on ${recording.recorded}${read}.`;
}

/** The card for one transaction, as the window shows it. */
export function card(tx: TransactionFile, recording: Recording): Html {
    const e = recording.explanation;
    return html`<figure class="explanation verdict-${e.verdict}">
<div class="head"><span class="badge">${VERDICT_WORD[e.verdict]}</span><p class="summary">${e.summary}</p></div>
${
    e.findings.length > 0
        ? html`<ul class="findings">${e.findings.map((f) => html`<li class="finding ${f.severity}"><span class="severity">${SEVERITY_WORD[f.severity]}</span> ${f.message}</li>`)}</ul>`
        : ''
}
<p class="label">What this does</p>
<ul class="effects">${e.effects.map((effect) => html`<li>${effectHtml(effect)}</li>`)}</ul>
<details class="full"><summary>Full text, as the engine prints it</summary><pre tabindex="0" aria-label="The full text">${e.text}</pre></details>
<figcaption>${caption(tx, recording)} <a href="/how-it-works#reading">How to read this</a>.</figcaption>
</figure>`;
}
