// How SignLens works, what clear signing is, how SignLens compares, and the
// questions people ask.
import { type Html, html } from '../html.ts';
import { article, type Page, published } from '../page.ts';
import { shown } from '../shown.ts';
import { REPOSITORY, SECURITY_EMAIL } from '../site.ts';

export function howItWorksPage(): Page {
    const body = html`<h1>How SignLens works</h1>
<p class="lead">SignLens sits between a dapp and your wallet. Dapps see it as one more wallet to connect, through <a href="https://github.com/anza-xyz/wallet-standard">the standard</a> they use to find wallets in the browser, but it holds no keys: a dapp sends it what it wants signed, SignLens explains it in its own window, and once you say so the request goes unchanged to the wallet you actually sign with.</p>
<p>That is <a href="/clear-signing">clear signing</a>, for whichever Solana wallet you use: you read what a transaction does, in words, before your wallet signs it, rather than a hash or a site's description of it.</p>
<ol>
<li><b>You connect "SignLens" in the dapp.</b> SignLens connects, in turn, to your own wallet in the same page: Phantom, Backpack, Solflare or another Solana wallet.</li>
<li><b>The dapp asks for a signature.</b> SignLens keeps its own copy of the transaction, fetches the extra addresses it refers to from a Solana node (the RPC in the settings), simulates it there, and asks SignLens's server to explain it. When the explanation names accounts that would explain more, such as the proposal a multisig approval or a DAO vote refers to, SignLens reads them from the same node and asks again.</li>
<li><b>The window opens before your wallet does.</b> The verdict and a one-line summary at the top, the findings, what the transaction does to you as a list, each instruction with its fields, and the engine's full text.</li>
<li><b>You decide.</b> Reject, and the dapp is told you refused. Continue, and the exact bytes SignLens explained go to your wallet, which asks you as usual. A page that changes its transaction afterwards changes nothing.</li>
</ol>
<p class="shot"><picture><source media="(prefers-color-scheme: dark)" srcset="/images/popup-dark.webp"><img src="/images/popup-light.webp" width="360" height="392" alt="The SignLens popup: the API ready, and three requests, a warning passed on, an OK swap passed on, and a blocked swap rejected"></picture></p>
<h2 id="verdict">The verdict</h2>
<ul>
<li><b>OK</b>: nothing beyond notes.</li>
<li><b>Warning</b>: findings to read before you approve, shown first.</li>
<li><b>Blocked</b>: something critical, or an instruction SignLens cannot explain, such as one of an <a href="/warnings/unknown-program">unknown program</a>. SignLens refuses it unless you choose "Continue anyway".</li>
<li><b>Error</b>: no explanation, because the API was away or refused. Nothing is known about the transaction, so it is treated as blocked, never as a pass.</li>
</ul>
<h2 id="reading">Reading an explanation</h2>
<p>Every explanation on this site is what the SignLens window shows for a transaction, recorded from the engine's answer.</p>
<dl class="facts">
<dt>The verdict and the summary</dt>
<dd>OK, Warning or Blocked (<a href="#verdict">what each means</a>), then one line saying what the transaction does.</dd>
<dt>Findings</dt>
<dd>What to read before you approve. Critical blocks the request; High and Warning are to read first; a Note is for information.</dd>
<dt>What this does</dt>
<dd>The transaction's effects, as sentences: what is sent, received, approved, created, closed or handed over, and by whom. "You" and "Your wallet" are the signer, and accounts SignLens can prove are the signer's are named so.</dd>
<dt>"(verified)"</dt>
<dd>SignLens knows the token or account by its address, from a verified token list or by deriving it, not by the name it gives itself.</dd>
<dt>"(unverified)"</dt>
<dd>A name or a number SignLens could not check: what a token calls itself, or what an RPC reported.</dd>
<dt>"per your RPC"</dt>
<dd>Words taken from an account your RPC returned, such as the option a DAO vote picks or the steps of a multisig proposal. SignLens checks the account is the one the transaction names and decodes as it should, but cannot check that the RPC told the truth; what it says never lowers a finding.</dd>
<dt>"≥" and "≤"</dt>
<dd>At least and at most. Many amounts are only set when the transaction runs: a swap receives at least its minimum, a deposit takes at most what you allowed. SignLens shows the bound the signed transaction guarantees.</dd>
<dt>"UNLIMITED"</dt>
<dd>The largest amount there is: an approval with no limit.</dd>
<dt>"raw units"</dt>
<dd>An amount of a token whose decimals SignLens does not know, in the token's smallest units: 1,000,000 raw units of a token with six decimals is 1.</dd>
<dt>Short addresses</dt>
<dd>The first and last four characters of an address, such as <code>Ffz5…piwg</code>; hover it for the whole address, or open the full text. Scammers make addresses that share those characters with one you use (<a href="/warnings/address-poisoning">address poisoning</a>), and SignLens flags one that shares them with yours or a contact's.</dd>
<dt>The full text</dt>
<dd>Everything the engine printed: each instruction with its fields, the signers, the fee, and how long the signature stays valid.</dd>
<dt>The line under it</dt>
<dd>Where the transaction comes from (a mainnet transaction, linked to an explorer, or one built to show a case), who it was explained for, and by which engine, on which day.</dd>
</dl>
<h2>Where the words come from</h2>
<p>Each program SignLens explains has a reviewed description of its instructions, built from the program's published interface and checked against real mainnet transactions. "(verified)" marks a token or an account SignLens knows by its address, from a verified token list or by deriving it, not by the name it gives itself. A simulation is a claim by the Solana node that ran it: SignLens holds it against the decoded instructions, and more leaving than they state is a finding.</p>
<h2>What runs where</h2>
<p>Everything that runs in your browser is open source, TypeScript compiled file for file with no bundler, and each release is built reproducibly, with its checksums and a build attestation (<a href="${REPOSITORY}">the source</a>). In this beta the explanation itself is computed on SignLens's server, which keeps verdicts and finding codes, not the transaction; <a href="/privacy">the privacy page</a> has the details.</p>
<h2>Watch-only mode</h2>
<p>SignLens can also connect as any address you give it, with no wallet behind it: it explains what a dapp asks that address to sign, and refuses every request. Useful for checking a dapp before you connect a real wallet.</p>`;
    return {
        path: '/how-it-works',
        title: 'How SignLens works: clear signing for any Solana wallet',
        description:
            'Dapps connect SignLens like a wallet, but it holds no keys: it explains each request in its own window, then passes it unchanged to your real wallet.',
        updated: '2026-10-25',
        body,
    };
}

export function clearSigningPage(): Page {
    const h1 = 'Clear signing and blind signing on Solana';
    const body = html`<h1>${h1}</h1>
${published('2026-10-28')}
<p class="lead">Clear signing is reading what a transaction will do, in words decoded from the bytes you sign, before you approve it: deposit 4,635 USDC into Kamino Lend as collateral, let this key spend your USDC, hand this account to that program. Blind signing is approving a transaction you cannot read: a hash on a hardware wallet's screen, or a dapp's own account of what its bytes do. Most Solana transactions today are signed with something in between, and the costliest attacks live in the gap.</p>
<h2 id="today">What signing looks like on Solana today</h2>
<dl class="facts">
<dt>On a hardware wallet</dt>
<dd>Ledger's Solana app shows in words only "simple instructions like a single transfer" and a few pairs, such as creating an account and funding it. Anything else needs its blind-signing setting turned on: "Blind signing must be on for the Ledger to sign SPL token transfers and smart contract transactions on Solana", says Solflare's guide, and firmware and app updates turn it off again. A swap, a deposit or a vote is then approved on a screen that cannot display it.</dd>
<dt>In a software wallet</dt>
<dd>Phantom, Backpack, Solflare and other wallets simulate the transaction and show the balance changes it would cause, with warnings for some known dangers. That says how much, not what for: a deposit, a liquidity position and a drain can show the same line. When the simulation fails, the wallets' own help pages say the transaction may succeed anyway.</dd>
<dt>In the dapp</dt>
<dd>The dapp builds the bytes and describes them: a button that says Claim, Swap or Sign in. That description is what an attacker who controls the page gets to write. In February 2025, on Ethereum, Bybit's signers saw a routine transfer from cold storage in an interface attackers had altered, and signed a change to their multisig's own logic: about $1.5 billion (<a href="/incidents/blind-signing">what they saw, and what they signed</a>).</dd>
</dl>
<h2 id="why">Why it matters on Solana</h2>
<p>The transactions that cost the most move nothing when you sign them: they hand over the right to take it later. A balance preview shows no change, and a hardware wallet in blind-signing mode shows nothing it can read.</p>
<ul>
<li><a href="/warnings/token-account-owner-change">Owner changes</a> hand a token account, or the wallet itself, to someone else. In one academic study of Solana phishing (SolPhishHunter, 2025), owner transfers were 2,171 of 8,058 phishing transactions but 73.85% of the $1.1 million in losses it measured. In November 2025 a victim lost over $3 million after a preview that "showed no fund changes" (<a href="/incidents/owner-change-phishing-2025">the case</a>).</li>
<li><a href="/warnings/unlimited-token-approval">Unlimited approvals</a> let another key spend from one of your token accounts at any time, up to the largest amount there is. The same victim's transactions approved it on eight token accounts.</li>
<li><a href="/warnings/durable-nonce">Durable nonces</a> make a signature that never expires. Two members of Drift's multisig each signed one, and on 1 April 2026 the attacker who held them took control of the protocol; between $270 and $286 million left it (<a href="/incidents/drift-2026">the two signatures</a>).</li>
<li><a href="/warnings/multisig-approval">Multisig approvals</a> sign a reference to a proposal stored on chain, not what it does, so no wallet can show it from the bytes alone.</li>
</ul>
<h2 id="example">What clear signing shows</h2>
<p>A real deposit into Kamino Lend. A balance preview shows 4,635.28675 USDC leaving the wallet. Decoded from its instructions, the transaction deposits it into Kamino Lend as collateral, as SignLens shows it:</p>
${shown('kamino-lend-deposit')}
<p>Three things make that possible: a description of each program's instructions, from a source you can trust, to decode the bytes into what they do; names checked by address, so that a token called USDC is the USDC (<a href="/how-it-works#reading">"(verified)"</a>); and decoding the bytes that will be signed, not what the dapp says they are. It is not a defence against everything: a compromised computer can show anything, and a stolen key needs no signature.</p>
<h2 id="srfc-39">sRFC 39: a standard for clear signing on Solana</h2>
<p>On 27 October 2025 a draft, sRFC 39 "Solana Clear Sign", was opened in the Solana Foundation's repository of standards proposals. Its starting point: the interface descriptions programs publish, their IDLs, "provide no guidance on how to present transaction data to users", so users "must blindly sign transactions, a process prone to error and misunderstanding, which often leads to loss of funds."</p>
<p>It proposes that each program's IDL carry display rules: an intent for each instruction, such as "Transfer 10 wSOL to toly.sol.", labels for its accounts and arguments, and how to format amounts, dates and durations. Wallets would fetch them with the IDL; hardware wallets would carry them in their firmware or be given them while signing, and must be able to show the intent from the IDL and the instruction data alone.</p>
<p>The open question is trust. An IDL is written by the program's own authors, and a drainer can describe its program as harmless: replies in the discussion propose curated lists of trusted programs, and verified builds to establish where an IDL comes from. Ledger has proposed additions, and published an extension that follows value across instructions to state what a whole transaction does. As of October 2026 sRFC 39 is still a draft. On Ethereum the equivalent is ERC-7730, the clear-signing standard Ledger started and handed to the Ethereum Foundation on 12 May 2026.</p>
<h2 id="now">Clear signing on Solana now</h2>
<p>Until wallets and hardware wallets read display rules like sRFC 39's, clear signing on Solana means decoding a transaction before your wallet asks you to sign it. That is what SignLens does: dapps connect it like a wallet, and it explains each transaction in its own window, from a reviewed description of each program it knows, then passes it on unchanged to your wallet (<a href="/how-it-works">how it works</a>). A program it has no description of is not guessed at: the request is <a href="/warnings/unknown-program">blocked</a>. It is free, works in front of Phantom, Backpack, Solflare and other Solana wallets, and runs in Chrome, Brave, Edge and Firefox on a computer. <a href="/compare">How it compares</a> with wallet previews, scam lists, explorers and hardware wallets.</p>
<h2 id="meanwhile">Whatever you sign with</h2>
<ul>
<li>Reject a transaction that hands over an account or approves an unlimited amount, unless you know why it must.</li>
<li>Sign a transaction that never expires only when you meant to sign something to be sent later, and know who will hold it.</li>
<li>On a Ledger, turn blind signing on for the dapp that needs it and off again afterwards, as Solflare's guide advises.</li>
<li>Check what a large transaction does somewhere other than the page asking you to sign it.</li>
</ul>
<h2>Sources</h2>
<ul class="sources">
<li><a href="https://github.com/solana-foundation/SRFCs/discussions/4">sRFC 39: Solana Clear Sign (draft, Solana Foundation)</a></li>
<li><a href="https://github.com/LedgerHQ/solana-srfc39-meta-intent-extension">Ledger: an extension of sRFC 39 to whole transactions</a></li>
<li><a href="https://developers.ledger.com/docs/device-interaction/references/signers/solana">Ledger: the Solana signer ("only supports simple instructions like a single transfer")</a></li>
<li><a href="https://docs.solflare.com/solflare/onboarding/web-app-and-extension/import-your-ledger-device">Solflare: import your Ledger device (blind signing)</a></li>
<li><a href="https://developers.ledger.com/docs/clear-signing/overview">Ledger: Clear Signing and ERC-7730</a></li>
<li><a href="https://jup.ag/wallet/security">Jupiter Wallet: security ("Approval previews estimate balance changes")</a></li>
<li><a href="https://help.solflare.com/en/articles/9263757-why-did-my-transaction-fail">Solflare: why did my transaction fail</a></li>
<li><a href="https://arxiv.org/html/2505.04094v1">SolPhishHunter: phishing on Solana (arXiv, 2025)</a></li>
<li><a href="https://slowmist.medium.com/beware-of-solana-phishing-attacks-wallet-owner-permissions-may-be-altered-708bbb30518e">SlowMist: wallet owner permissions altered (2025)</a></li>
<li><a href="https://www.chainalysis.com/blog/lessons-from-the-drift-hack/">Chainalysis: lessons from the Drift hack</a></li>
<li><a href="https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/">NCC Group: technical analysis of the Bybit hack</a></li>
</ul>`;
    return {
        path: '/clear-signing',
        title: 'Clear signing on Solana: what it is and why it matters',
        description:
            'Clear signing shows what a Solana transaction does, in words, before you sign it. What blind signing looks like on Solana today, why it matters, and sRFC 39.',
        updated: '2026-10-28',
        body,
        jsonLd: article(h1, '2026-10-28', '2026-10-28'),
    };
}

export function comparePage(): Page {
    const body = html`<h1>SignLens compared with wallet previews, scam lists and explorers</h1>
<p class="lead">Solana wallets already show you something before you sign: the balance changes a simulation estimates, and warnings for some known dangers. SignLens adds what a transaction is for, read from its instructions, and checks what it reads. It works alongside your wallet's own checks, not instead of them.</p>
<div class="table stack"><table role="table">
<thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Tool</th><th scope="col" role="columnheader">When</th><th scope="col" role="columnheader">What it shows</th><th scope="col" role="columnheader">What it misses</th></tr></thead>
<tbody role="rowgroup">
<tr role="row"><td role="cell" data-label="Tool">Wallet balance preview (Phantom, Backpack, Solflare, Jupiter Wallet)</td><td role="cell" data-label="When">When you sign</td><td role="cell" data-label="What it shows">The balance changes a simulation estimates, and warnings for some known dangers</td><td role="cell" data-label="What it misses">Often what a transaction is for; owner changes and approvals beyond the cases their warnings cover; little when the simulation fails</td></tr>
<tr role="row"><td role="cell" data-label="Tool">Scam lists (in wallets, and extensions such as Scam Sniffer)</td><td role="cell" data-label="When">When you browse or sign</td><td role="cell" data-label="What it shows">Whether a site or address is already known to be malicious</td><td role="cell" data-label="What it misses">What nobody has reported yet; legitimate dapps are sometimes flagged too</td></tr>
<tr role="row"><td role="cell" data-label="Tool">Explorers (Solana Explorer, Solscan)</td><td role="cell" data-label="When">Mostly after the transaction lands</td><td role="cell" data-label="What it shows">Every instruction, decoded</td><td role="cell" data-label="What it misses">Once it has landed it is too late, and inspecting one before means copying it out of the dapp</td></tr>
<tr role="row"><td role="cell" data-label="Tool">Hardware clear signing (Ledger)</td><td role="cell" data-label="When">On the device</td><td role="cell" data-label="What it shows">Simple transfers and a few other cases, in words</td><td role="cell" data-label="What it misses">On Solana, most DeFi transactions are signed blind</td></tr>
<tr role="row"><td role="cell" data-label="Tool"><b>SignLens</b></td><td role="cell" data-label="When">When you sign, before your wallet asks</td><td role="cell" data-label="What it shows">What each instruction does, in words, with findings and verified token and account names</td><td role="cell" data-label="What it misses">Programs it has no reviewed description of, which it blocks; it runs on a computer, not on phones</td></tr>
</tbody></table></div>
<h2>Why a balance preview is not enough</h2>
<p>A preview simulates the transaction and shows how your balances would change. That says how much, not what for: a deposit, a liquidity position and a drain can show the same line. And the transactions that hand over control (an <a href="/warnings/token-account-owner-change">owner change</a>, an <a href="/warnings/unlimited-token-approval">unlimited approval</a>, a <a href="/warnings/durable-nonce">signature that never expires</a>) move nothing when you sign them. Wallets add warnings for some of these, and when the simulation fails their own help pages say the transaction may succeed anyway.</p>
<h2>Why a scam list is not enough</h2>
<p>A list catches what someone has already reported. A drainer site launched an hour ago is on no list, and a legitimate new dapp can be on one by mistake. SignLens does not judge the site: it reads what the transaction would do.</p>
<h2>Sources</h2>
<ul class="sources">
<li><a href="https://phantom.com/learn/blog/security-at-phantom">Phantom: security at Phantom</a></li>
<li><a href="https://jup.ag/wallet/security">Jupiter Wallet: security ("Approval previews estimate balance changes")</a></li>
<li><a href="https://help.solflare.com/en/articles/9263757-why-did-my-transaction-fail">Solflare: why did my transaction fail</a></li>
<li><a href="https://developers.ledger.com/docs/device-interaction/references/signers/solana">Ledger: the Solana signer ("only supports simple instructions like a single transfer or combos like createAccount + fundAccount")</a></li>
</ul>`;
    return {
        path: '/compare',
        title: 'SignLens vs wallet previews, scam lists and explorers',
        description:
            'How SignLens compares with Solana wallet balance previews, scam blocklists, explorers and hardware clear signing, and why it works alongside them.',
        updated: '2026-10-25',
        body,
    };
}

const FAQ: [string, string | Html][] = [
    [
        'What is SignLens?',
        'A free browser extension for Chrome, Brave, Edge and Firefox that explains, in plain words, each Solana transaction a dapp asks you to sign, before your wallet signs it, and warns about what a balance preview cannot show.',
    ],
    [
        'Is SignLens a wallet? Do I have to move my funds?',
        'No. SignLens holds no keys and signs nothing. It sits in front of the wallet you already use, and passes each request on to it unchanged once you say so. Your funds stay where they are.',
    ],
    ['Which wallets does it work with?', 'Phantom, Backpack, Solflare and the other Solana wallets dapps can connect to in the browser.'],
    [
        'What is clear signing? What is blind signing?',
        html`Clear signing is seeing the transaction itself, decoded into words, before you sign. Blind signing is approving a transaction you cannot read: a hash, or an interface's description of what the bytes do. SignLens brings clear signing to Solana transactions in the browser. <a href="/clear-signing">Clear signing on Solana</a> has what each looks like today, and why it matters.`,
    ],
    [
        "How is it different from my wallet's transaction preview?",
        'A preview shows the balance changes a simulation estimates: how much, not what for. SignLens reads the instructions and says what they do: deposit as collateral, open a position, stake for a token, hand an account to someone. It also catches what moves nothing when you sign, such as an owner change or an unlimited approval.',
    ],
    [
        'What does "(verified)" mean?',
        'That SignLens knows the token or account by its address, from a verified token list or by deriving it, not by the name it gives itself. A token SignLens cannot verify is shown by its mint address and marked unverified.',
    ],
    [
        'What is a wallet drainer?',
        html`A site, or a transaction, made to empty your wallet. On Solana a drainer often gets you to sign something that moves nothing at once but hands over control: an <a href="/warnings/token-account-owner-change">owner change</a> of a token account or of the wallet itself, an <a href="/warnings/unlimited-token-approval">unlimited approval</a>, or transfers hidden inside a program of its own. A balance preview can show nothing for those.`,
    ],
    [
        'Can SignLens stop a wallet drainer?',
        html`It reads each transaction before your wallet signs it. An owner change of your own account is a critical finding and blocks the request; an unlimited approval is a high finding; and a drainer's own program, which SignLens has no description of, blocks the request as unknown, as in <a href="/incidents/owner-change-phishing-2025">the November 2025 case</a>. It cannot help when a seed phrase or a key is stolen, which needs no signature, or when the computer itself is compromised.`,
    ],
    [
        'What happens with a program SignLens does not know?',
        html`It is shown as unknown, and the request is <a href="/warnings/unknown-program">blocked by default</a>. You can still choose "Continue anyway". A block means SignLens cannot vouch for the program, not that the dapp is malicious.`,
    ],
    [
        'Can SignLens be wrong?',
        'Yes. OK means it read every instruction and found nothing to warn about, not that a trade is a good one. It can misread a program or miss something; the feedback strip under every explanation is there to say so.',
    ],
    [
        'What does SignLens send to its server?',
        html`In this beta, the transaction to explain, the extra addresses it refers to, the outcome of the simulation, the accounts the explanation names as your RPC returned them, your addresses from the settings and your address book. The server logs the verdict, the finding codes and a hash of the transaction, not the transaction itself. <a href="/privacy">The privacy page</a> has the details.`,
    ],
    ['Does it cost anything?', 'No. SignLens is free, and the extension is open source under the Apache 2.0 licence.'],
    ['Does it work on my phone?', 'No. It is an extension for desktop Chrome, Brave, Edge and Firefox.'],
    ['Which chains?', 'Solana mainnet today. SignLens is built so that other chains can be added, and Ethereum is next.'],
    [
        'Why does SignLens warn that a signature never expires?',
        html`The transaction is built on a <a href="/warnings/durable-nonce">durable nonce</a>: it stays valid until the nonce is used, so whoever holds it can send it at any later time. That is how <a href="/incidents/drift-2026">the Drift takeover of April 2026</a> worked.`,
    ],
    [
        'What if the SignLens server is down?',
        'The window says it has no explanation, and the request is treated as blocked, never passed as safe. You can still choose to continue.',
    ],
    [
        'Can it check a Squads multisig proposal?',
        html`When the proposal is created in the transaction you sign, yes: SignLens decodes its transaction step by step. When you only <a href="/warnings/multisig-approval">approve a proposal created earlier</a>, the bytes you sign do not contain it: SignLens reads the proposal and the transaction it stores from your RPC and shows its steps, as your RPC's word. When the RPC has nothing to give, SignLens says it cannot show what you approve.`,
    ],
    [
        'How do I report a wrong explanation or a security problem?',
        html`A wrong or unclear explanation: the feedback strip under it. A security problem: write to <a href="mailto:${SECURITY_EMAIL}">${SECURITY_EMAIL}</a>, as <a href="/security">the security page</a> says.`,
    ],
];

export function faqPage(): Page {
    const body = html`<h1>Questions about SignLens</h1>
${FAQ.map(([q, a]) => html`<h2>${q}</h2><p>${a}</p>`)}`;
    return {
        path: '/faq',
        title: 'SignLens FAQ: clear signing for Solana, explained',
        description:
            'Is SignLens a wallet? Which wallets does it work with? What is blind signing? What does it send to its server? Answers about SignLens.',
        updated: '2026-10-28',
        body,
    };
}
