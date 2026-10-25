// /warnings/: what a balance preview cannot show, one pattern per page.
import { type Html, html } from '../html.ts';
import { article, type Page, published } from '../page.ts';
import { shown } from '../shown.ts';

interface Warning {
    slug: string;
    /** When the page was first published (YYYY-MM-DD). */
    published: string;
    name: string;
    title: string;
    description: string;
    h1: string;
    /** One sentence for the index and the home page. */
    gist: string;
    body: Html;
}

const sources = (items: [string, string][]): Html =>
    html`<h2>Sources</h2><ul class="sources">${items.map(([label, url]) => html`<li><a href="${url}">${label}</a></li>`)}</ul>`;

export const WARNINGS: Warning[] = [
    {
        slug: 'token-account-owner-change',
        published: '2026-10-25',
        name: 'Accounts given away',
        title: 'Solana owner-change phishing, and what SignLens shows | SignLens',
        description:
            'SetAuthority and Assign hand a token account or a whole wallet to someone else without moving a token, so a balance preview shows nothing. SignLens blocks it.',
        h1: 'Owner changes: a signature that gives an account away',
        gist: 'A token account, or the wallet itself, handed to a new owner. Nothing moves when you sign, so a balance preview shows nothing; SignLens blocks it.',
        body: html`<p class="lead">On Solana an account's owner can be changed. The token program's SetAuthority hands a token account to a new owner; the system program's Assign hands a whole wallet account to a program. Neither moves a token when you sign, so a balance preview shows no change at all. From then on the new owner can take everything in the account, and you cannot take it back.</p>
<h2>How it is used</h2>
<p>A phishing site asks you to sign what looks like a claim, a mint or a login, with an owner change inside. In one academic study of Solana phishing (SolPhishHunter, 2025), owner transfers were 2,171 of 8,058 phishing transactions but 73.85% of the $1.1 million in losses it measured. In December 2025 SlowMist reported a November case: a victim who lost over $3 million this way after a preview that "showed no fund changes": see <a href="/incidents/owner-change-phishing-2025">the case, read by SignLens</a>.</p>
<h2>What SignLens shows</h2>
<p>An owner change of your own account is a critical finding, so SignLens blocks the request unless you choose "Continue anyway". A constructed example, the token program's SetAuthority on the signer's USDC account:</p>
${shown('token-account-handed-over')}
<p>Drainers often hide the owner change inside a program of their own, as in the November 2025 case. SignLens cannot name what such a program does, but it blocks any program it has no reviewed description of, which is what happened there: <a href="/incidents/owner-change-phishing-2025">the case, read by SignLens</a>, is blocked with a critical finding for each call to that program.</p>
<h2>What to do</h2>
<p>Reject it. No dapp needs to own your token account or your wallet to trade, lend, stake or claim.</p>
${sources([
    ['SolPhishHunter: phishing on Solana (arXiv, 2025)', 'https://arxiv.org/html/2505.04094v1'],
    [
        'SlowMist: wallet owner permissions altered (2025)',
        'https://slowmist.medium.com/beware-of-solana-phishing-attacks-wallet-owner-permissions-may-be-altered-708bbb30518e',
    ],
])}`,
    },
    {
        slug: 'unlimited-token-approval',
        published: '2026-10-25',
        name: 'Spending rights',
        title: 'Unlimited token approvals on Solana, explained | SignLens',
        description:
            'A token approval lets someone else spend from your account later, without asking again. SignLens names the delegate and the amount, and warns on unlimited ones.',
        h1: 'Token approvals: someone else may spend from your account',
        gist: 'An approval lets another key spend from your token account later, up to an amount or without limit. SignLens names who, how much, and warns.',
        body: html`<p class="lead">The token program's Approve names a delegate who may spend from one of your token accounts, up to an amount, at any time and without asking you again. It has legitimate uses; a drainer asks for the largest amount there is, 18,446,744,073,709,551,615 base units, and empties the account whenever it likes.</p>
<p>Nothing leaves your wallet when you sign an approval, so a balance preview shows nothing. In the November 2025 owner-change case, the victim's transactions also approved that amount on eight token accounts to the attacker, inside a program of the attacker's own (<a href="/incidents/owner-change-phishing-2025">the case</a>).</p>
<h2>What SignLens shows</h2>
<p>The delegate, the account and the amount, with "UNLIMITED" spelled out, and a high finding. A constructed example:</p>
${shown('unlimited-approval')}
<p>The plain Approve instruction does not name the token, only the account; SignLens says so rather than guess. Where a dapp uses ApproveChecked, the token is named too.</p>
<h2>What to do</h2>
<p>Approve only what an order needs, to a program you recognise, and revoke approvals you no longer use.</p>
${sources([['SlowMist: wallet owner permissions altered (2025)', 'https://slowmist.medium.com/beware-of-solana-phishing-attacks-wallet-owner-permissions-may-be-altered-708bbb30518e']])}`,
    },
    {
        slug: 'durable-nonce',
        published: '2026-10-25',
        name: 'Signatures that never expire',
        title: 'Durable nonces: Solana signatures that never expire | SignLens',
        description:
            'A Solana transaction on a durable nonce stays valid until the nonce is used: whoever holds it can submit it next month. SignLens says "Valid FOREVER".',
        h1: 'Durable nonces: a signature that never expires',
        gist: 'A transaction built on a durable nonce stays valid until the nonce is used, so whoever holds it can send it next month. SignLens says "Valid FOREVER".',
        body: html`<p class="lead">An ordinary Solana transaction carries a recent blockhash and expires about a minute after it is made. One built on a durable nonce carries a nonce instead and stays valid until that nonce is advanced: whoever holds the signed transaction can submit it at any time, next week or next year.</p>
<p>Durable nonces exist for signing offline and for coordinating several signers. They are also how the Drift Protocol takeover of April 2026 worked: two members of Drift's multisig signed transactions on durable nonces that someone else had set up for them, and the attacker submitted both, one second apart, when ready (<a href="/incidents/drift-2026">the case, read by SignLens</a>). Solana plans to remove durable nonces about six months after a replacement is ready, with no date set yet, and asks wallets to "tell the user they are signing a delayed transaction", one that "stays valid until it is used or cancelled".</p>
<h2>What SignLens shows</h2>
<p>A high finding, "This signature never expires", and "Valid FOREVER" in what the transaction does, with the nonce account. A real transfer on a durable nonce:</p>
${shown('durable-nonce-transfer')}
<p class="shot"><picture><source media="(prefers-color-scheme: dark)" srcset="/images/window-dark.png"><img src="/images/window-light.png" width="440" height="575" alt="The SignLens window on a USDC transfer on a durable nonce: a warning that the signature never expires, what the transaction does, the simulated outcome, and Reject and Continue to Phantom"></picture></p>
<h2>What to do</h2>
<p>Sign a durable-nonce transaction only when you meant to sign something to be sent later, and know who will hold it.</p>
${sources([
    ['Solana: durable nonce deprecation', 'https://solana.com/upgrades/durable-nonce-deprecation'],
    [
        'CoinDesk: how a Solana feature let an attacker drain Drift (2026-04-02)',
        'https://www.coindesk.com/tech/2026/04/02/how-a-solana-feature-designed-for-convenience-let-an-attacker-drain-usd270-million-from-drift',
    ],
])}`,
    },
    {
        slug: 'address-poisoning',
        published: '2026-10-25',
        name: 'Lookalike addresses',
        title: 'Address poisoning on Solana: lookalike addresses | SignLens',
        description:
            "Scammers plant addresses that start and end like yours or your contacts'. SignLens compares every recipient with your own addresses and your address book.",
        h1: 'Address poisoning: an address that only looks like the right one',
        gist: "An address that shares only its first and last four characters with yours or a contact's: the address-poisoning trick. SignLens flags it.",
        body: html`<p class="lead">People check an address by its first and last few characters. Address poisoning exploits that: a scammer sends you a tiny transfer from an address that starts and ends like one you use, so that the next time you copy a recipient from your history, you copy theirs.</p>
<p>It works at scale. Bitquery counted 4,497,798 Solana wallets targeted between 30 October 2025 and 7 October 2026; among the wallets poisoned up to July 2026, at least 1,104 paid a lookalike, at least $940,106 in all. In December 2024 Scam Sniffer reported two victims losing 272 SOL this way.</p>
<h2>What SignLens shows</h2>
<p>SignLens holds your own addresses and an address book you keep in its settings. It compares every address a transaction pays, delegates to, hands authority to or closes an account into with those, four characters at each end, and a lookalike is a high finding. A constructed example, with "Bob" in the address book:</p>
${shown('lookalike-recipient')}
<p>An address in your book is named in the window; a recipient nobody has named says so.</p>
<h2>What to do</h2>
<p>Keep the addresses you pay in SignLens's address book, and never copy a recipient from your transaction history.</p>
${sources([
    [
        'CryptoSlate: fake payment addresses targeted 4.5 million Solana wallets (Bitquery, 2026)',
        'https://cryptoslate.com/fake-payment-addresses-targeted-4-5-million-solana-wallets-study-finds/',
    ],
    ['Scam Sniffer: 272 SOL lost to address poisoning (2024)', 'https://www.bitget.com/news/detail/12560604422090'],
])}`,
    },
    {
        slug: 'unknown-program',
        published: '2026-10-25',
        name: 'Programs it does not know',
        title: 'Unknown Solana programs: blocked, not guessed | SignLens',
        description:
            'When a transaction calls a program SignLens has no reviewed description of, SignLens blocks it by default instead of guessing what it does.',
        h1: 'Unknown programs: blocked, not guessed',
        gist: 'A program SignLens has no reviewed description of is shown as unknown, and the request blocked by default, never called safe.',
        body: html`<p class="lead">SignLens explains a program from a reviewed description of its instructions. When a transaction calls a program it has none for, it cannot say what that program will do with your accounts, so it says exactly that, and blocks the request by default. You can still choose "Continue anyway".</p>
<p>A drainer's own program is unknown by nature, and the instructions that do the damage can run inside it, where no preview of the transaction's top level shows them. That is how the November 2025 owner-change phishing worked: its transaction called the attacker's program three times, and SignLens blocks it with a critical finding for each (<a href="/incidents/owner-change-phishing-2025">the case, read by SignLens</a>).</p>
<p>New and small dapps are unknown too, so a block is not a verdict that a dapp is malicious: it says SignLens cannot vouch for it. The <a href="/#works-with">programs SignLens explains</a> grow with each release; the feedback strip under every explanation is how to ask for one.</p>`,
    },
    {
        slug: 'multisig-approval',
        published: '2026-10-25',
        name: 'Multisig approvals you cannot see',
        title: 'Squads multisig approvals: what you are approving | SignLens',
        description:
            "Approving a Squads proposal signs only a reference to it. SignLens shows the proposal's transaction from the bytes, or from its account as your RPC's word.",
        h1: 'Multisig approvals: when the bytes do not say what you approve',
        gist: "A multisig approval names a proposal, not what it does. SignLens reads the proposal's transaction from the bytes or from your RPC, and says when it cannot.",
        body: html`<p class="lead">A Squads multisig runs a transaction once enough members approve it. The member who proposes it signs the whole transaction into the proposal; the members who approve later sign only a reference to a proposal stored on chain. Their wallets cannot show what they approve from the bytes they sign.</p>
<p>The Security Alliance's guide to verifying Squads transactions puts it plainly: "Limited tooling is available for Solana verification compared to EVM."</p>
<h2>What SignLens shows</h2>
<p>When the proposal is created in the transaction you sign, SignLens decodes its transaction step by step, as if you were signing it (see <a href="/examples/governance">a proposal of a token transfer</a>).</p>
<p>When you only approve, what you sign names the proposal and nothing more. SignLens then reads the proposal and the transaction it stores from your RPC, checks that they are the accounts the approval names and decode as Squads writes them, and shows the steps as your RPC's word. The high finding stays: the steps come from your RPC, not from what you sign. A member's approval of a 3,000 USDT transfer, with the two accounts as an RPC returned them:</p>
${shown('squads-approval-read')}
<p>When the RPC has nothing to give, because the proposal has been closed or does not exist yet, SignLens says it cannot show what you approve. Three approvals whose proposals have since been closed:</p>
${shown('squads-approvals')}
<p>Both kinds of signature handed Drift's admin to an attacker in April 2026. The second member approved a proposal that did not exist yet when they signed, so nothing could have read it for them: <a href="/incidents/drift-2026">the two signatures, read by SignLens</a>.</p>
<h2>What to do</h2>
<p>Read the steps before approving, and remember where they come from: a dishonest RPC could show a harmless transaction. For a large transfer, check them against the proposer's signature or the proposal account on an explorer you trust, not against the interface that asks you to approve.</p>
${sources([
    [
        'SEAL Frameworks: Squads multisig verification',
        'https://frameworks.securityalliance.org/wallet-security/signing-and-verification/secure-multisig-squads-verification',
    ],
])}`,
    },
    {
        slug: 'swap-output-elsewhere',
        published: '2026-10-25',
        name: 'A swap paying someone else',
        title: "A Solana swap that pays someone else's account | SignLens",
        description: 'A swap can send its output to any account. SignLens checks that it reaches one of yours, and warns when it does not.',
        h1: 'A swap that pays someone else',
        gist: 'A swap whose output goes to an account that is not yours. SignLens checks where the output lands and warns.',
        body: html`<p class="lead">A swap instruction names the account its output goes to. A dapp that wants to pay someone on your behalf sets it to theirs; a compromised or malicious front end can do the same without telling you. A balance preview shows your tokens leaving and nothing arriving.</p>
<h2>What SignLens shows</h2>
<p>Where the router says where its output goes, SignLens checks that it is one of your accounts and warns when it is not. In this example the signer receives the USDT first and swaps it for another account, which may well be a payment it meant to make; SignLens cannot know that, so it says where the output goes:</p>
${shown('swap-paid-elsewhere')}
<h2>What to do</h2>
<p>Reject a swap that pays someone else unless paying them is what you asked for.</p>`,
    },
];

function warningPage(w: Warning): Page {
    const body = html`<p class="crumbs"><a href="/warnings/">Warnings</a> › ${w.name}</p>
<h1>${w.h1}</h1>
${published(w.published)}
${w.body}
<p>Other warnings: ${WARNINGS.filter((o) => o !== w).map((o, i) => html`${i > 0 ? ', ' : ''}<a href="/warnings/${o.slug}">${o.name.toLowerCase()}</a>`)}.</p>`;
    const updated = '2026-10-25';
    return {
        path: `/warnings/${w.slug}`,
        title: w.title,
        description: w.description,
        updated,
        body,
        jsonLd: article(w.h1, w.published, updated),
    };
}

function indexPage(): Page {
    const body = html`<h1>What a balance preview cannot show</h1>
<p class="lead">Some of the worst Solana transactions take nothing when you sign them: they hand over the right to take it later. A wallet's preview of balance changes shows nothing for those. SignLens reads the instructions themselves and names them, right under the verdict.</p>
<ul class="cards">${WARNINGS.map((w) => html`<li><h2><a href="/warnings/${w.slug}">${w.name}</a></h2><p>${w.gist}</p></li>`)}</ul>`;
    return {
        path: '/warnings/',
        title: 'What SignLens warns about on Solana | SignLens',
        description:
            'Owner changes, unlimited approvals, durable nonces, lookalike addresses, unknown programs and blind multisig approvals: what SignLens warns about.',
        updated: '2026-10-25',
        body,
    };
}

export function warningPages(): Page[] {
    return [indexPage(), ...WARNINGS.map(warningPage)];
}
