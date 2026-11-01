// An explanation document (`signlens-explanation/2`) as the SignLens window
// shows it, in HTML that needs no script: the verdict and the summary, or
// each action, the findings, what the transaction does, and the engine's
// full text. Every sentence is the engine's words; the amounts and
// addresses they name are laid out as the extension's `src/ui/render.ts`
// lays them out, with a badge on what SignLens verified.
import { readFileSync } from 'node:fs';
import { type Html, html } from './html.ts';
import { explorer } from './site.ts';
import type { TransactionFile } from './transaction.ts';

type Trust = 'fact' | 'verified' | 'claimed';
type Bound = 'exact' | 'at_least' | 'at_most' | 'unlimited' | 'unknown';
export type Verdict = 'ok' | 'warn' | 'block';
type Severity = 'info' | 'warning' | 'high' | 'critical';

/** The engine's words: the text, and the values it names, part by part. */
interface Message {
    id: string;
    text: string;
    parts: Part[];
}
interface Part {
    text: string;
    value?: Value;
    /** An address written short. */
    short?: Address;
    /** Words the engine emphasises ("UNLIMITED", "NO TIME LIMIT"). */
    emphasis?: boolean;
}
type Value =
    | { type: 'amount'; value: Amount }
    | { type: 'address'; value: Address }
    | { type: 'words'; value: Message }
    | { type: 'text' | 'integer'; value: string };
interface Amount {
    units: string;
    asset: { id: string | null; symbol: string | null; decimals: number | null; trust: Trust };
    bound: Bound;
    note: Message | null;
    /** The note in the explanation's language's brackets. */
    note_words: Message | null;
    words: Message;
}
interface Address {
    /** Null where words stand in for an address the engine does not know. */
    address: string | null;
    label: Message | null;
    label_trust: Trust;
    is_self: boolean;
    stand_in: Message | null;
    /** The label and the short address, in the language's order and brackets. */
    words: Message | null;
}

export interface Explanation {
    schema: string;
    summary: Message;
    actions: { instruction: number | null; summary: Message }[];
    verdict: Verdict;
    findings: { severity: Severity; code: string; message: Message; instruction: number | null }[];
    effects: { type: string; message: Message }[];
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
const SEVERITY_WORD: Record<Severity, string> = { info: 'Info', warning: 'Warning', high: 'High', critical: 'Critical' };

/** What a marker on a card means, for a reader who hovers it, in the window's words; /how-it-works#reading says it at length. */
const HELP = {
    verified:
        'This name comes from SignLens or from you: its reviewed descriptors, its verified token list, your addresses in its settings, or your address book. The site could not have supplied it.',
    claimed:
        'This came from the site or from the RPC the extension asked, not from the transaction itself. SignLens could not check it, so do not rely on it.',
} as const;

function term(text: string, help: string, className = 'term'): Html {
    return html`<abbr class="${className}" title="${help}">${text}</abbr>`;
}

/** A verified value's badge: a check in a ring, drawn rather than written, so that no name can carry it. */
export const VERIFIED_BADGE = html`<span class="verified-badge" role="img" aria-label="verified" title="${HELP.verified}"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2 7.1 10.3 11 6"/></svg></span>`;

/** The marker after a name or an amount: the badge for what SignLens verified, a claim's warning in words, nothing for a fact. */
function marker(trust: Trust): Html | string {
    if (trust === 'verified') return VERIFIED_BADGE;
    if (trust === 'claimed') return html` ${term('(claimed, unverified)', HELP.claimed, 'term unverified')}`;
    return '';
}

function group(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function short(address: string): string {
    return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

/** A message: its words as text, and each value it names laid out as that value is. */
function messageHtml(message: Message | null): Html {
    return html`${(message?.parts ?? []).map(partHtml)}`;
}

function partHtml(part: Part): Html | string {
    if (part.value) return valueHtml(part.value);
    if (part.short) return keyHtml(part.short, true);
    if (part.emphasis) return html`<strong class="emphasis">${part.text}</strong>`;
    return part.text;
}

function valueHtml(value: Value): Html | string {
    switch (value.type) {
        case 'amount':
            return amountHtml(value.value);
        case 'address':
            return addressHtml(value.value);
        case 'words':
            return messageHtml(value.value);
        case 'text':
        case 'integer':
            return value.value;
    }
}

/** An amount as the engine words it, with its marker, and its note after it. */
function amountHtml(amount: Amount): Html {
    return html`<b class="amount">${messageHtml(amount.words)}${marker(amount.asset.trust)}</b>${messageHtml(amount.note_words)}`;
}

/** An address: its label in bold and its short form, or the address itself; the signer's own label is green. */
function addressHtml(address: Address): Html {
    const self = address.is_self ? ' self' : '';
    if (!address.label || !address.words) return html`<span class="address${self}">${keyHtml(address, false)}</span>`;
    const parts = address.words.parts.map((part) => {
        if (part.value?.type === 'words') return html`<b>${part.value.value.text}</b>`;
        if (part.short) return keyHtml(address, true);
        return part.text;
    });
    return html`<span class="address${self}">${parts}${marker(address.label_trust)}</span>`;
}

/** The address itself, shortened with its whole on hover when `shorten`; or the words that stand in for it. */
function keyHtml(address: Address, shorten: boolean): Html {
    if (address.address === null) return messageHtml(address.stand_in);
    const whole = address.address;
    if (!shorten || short(whole) === whole) return html`<code>${whole}</code>`;
    return html`<code>${term(short(whole), whole)}</code>`;
}

/** A recording's summary, as the window's band shows it: the engine's words, with what they name laid out. */
export function summaryHtml(recording: Recording): Html {
    return messageHtml(recording.explanation.summary);
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

/** The card for one transaction, as the window shows it: several actions are counted at the top and listed one a line. */
export function card(tx: TransactionFile, recording: Recording): Html {
    const e = recording.explanation;
    const several = e.actions.length > 1;
    return html`<figure class="explanation verdict-${e.verdict}">
<div class="head"><span class="badge">${VERDICT_WORD[e.verdict]}</span><p class="summary">${several ? `${e.actions.length} actions` : messageHtml(e.summary)}</p></div>
${several ? html`<ol class="actions">${e.actions.map((action) => html`<li>${messageHtml(action.summary)}</li>`)}</ol>` : ''}
${
    e.findings.length > 0
        ? html`<p class="label">What SignLens found</p>
<ul class="findings">${e.findings.map((f) => html`<li class="finding ${f.severity}"><span class="severity">${SEVERITY_WORD[f.severity]}</span> ${messageHtml(f.message)}</li>`)}</ul>`
        : ''
}
<p class="label">What this does</p>
<ul class="effects">${e.effects.map((effect) => html`<li>${messageHtml(effect.message)}</li>`)}</ul>
<details class="full"><summary>Full text, as the engine prints it</summary><pre tabindex="0" aria-label="The full text">${e.text}</pre></details>
<figcaption>${caption(tx, recording)} <a href="/how-it-works#reading">How to read this</a>.</figcaption>
</figure>`;
}
