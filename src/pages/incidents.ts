// /incidents/: attacks that needed a signature, the transactions read by
// SignLens, and what it can and cannot claim about them.
import { type Html, html } from '../html.ts';
import { article, type Page, published } from '../page.ts';
import { shown } from '../shown.ts';

interface Incident {
    slug: string;
    /** When the page was first published (YYYY-MM-DD). */
    published: string;
    name: string;
    title: string;
    description: string;
    h1: string;
    gist: string;
    body: Html;
    sources: [string, string][];
}

export const INCIDENTS: Incident[] = [
    {
        slug: 'drift-2026',
        published: '2026-10-25',
        name: 'The Drift takeover, April 2026',
        title: 'The Drift hack: what the signers signed, read by SignLens',
        description:
            'On 1 April 2026 two pre-signed durable-nonce transactions handed Drift Protocol to an attacker. The two transactions, as SignLens reads them.',
        h1: 'The Drift takeover: two signatures, read by SignLens',
        gist: 'Two members of a multisig each signed a transaction that never expires; together they handed the protocol to an attacker. Between $270 and $286 million left Drift.',
        body: html`<p class="lead">On 1 April 2026 an attacker took control of Drift Protocol, a perpetuals exchange on Solana, and withdrew between $270 and $286 million by different estimates. No code was exploited and no seed phrase stolen: two members of the multisig that controlled Drift each signed a transaction that handed control to the attacker. Both transactions are on chain. This is what they say.</p>
<h2>What happened</h2>
<dl class="facts">
<dt>The setup</dt>
<dd>Drift's admin, the key that can list markets, set their oracles and change withdrawal limits, was a vault of a Squads multisig: two approvals of five members, with no time lock since late March. On 24 and 31 March (UTC) another wallet created two durable nonce accounts and made two council members their authorities. A transaction built on a durable nonce <a href="/warnings/durable-nonce">never expires</a>.</dd>
<dt>The first signature</dt>
<dd>One member signed, alone, a transaction that creates a multisig transaction whose one step is Drift's <code>updateAdmin</code> to the attacker's key, proposes it and approves it.</dd>
<dt>The second signature</dt>
<dd>Another member signed, alone, a transaction that approves that proposal and executes it.</dd>
<dt>16:05:18 and 16:05:19 UTC</dt>
<dd>The attacker submitted both, one second apart. Drift's admin became <code>H7PiGqqUaanBovwKgEtreJbKmQe6dbq6VTrw6guy7ZgL</code>. Within minutes it listed a market for a token it controlled, priced by an oracle it controlled, raised the withdrawal limits and withdrew.</dd>
<dt>How the signatures were obtained</dt>
<dd>Drift has said the attackers spent about six months building trust in person as a quantitative trading firm, and that the likely ways in were a cloned code repository and a test app presented as a wallet product. Drift, with the Security Alliance's SEAL 911, says with medium-high confidence that it was the North Korea-linked group behind the Radiant Capital hack of 2024, which Mandiant attributes to UNC4736; Mandiant has not formally attributed the Drift attack. What the signers' screens showed has not been made public.</dd>
</dl>
<h2>The first signature, as SignLens reads it</h2>
<p>SignLens reads the proposal's transaction inside the signature and explains its step as it would any instruction: it hands the admin of Drift to an address that is not the signer's. Two high findings: what an admin can do over every user's deposits, and that the signature never expires.</p>
${shown('drift-signer-1')}
<h2>The second signature, as SignLens reads it</h2>
<p>The second member approved and executed the proposal the first signature creates. Its content is not in the bytes they signed, so SignLens cannot say what it does, and says that, beside the durable nonce. Nor was it anywhere on chain to be read when they signed: the proposal and the transaction it stores were created by the first signature, submitted at 16:05:18, and the second, like the first, had been signed in advance on a durable nonce.</p>
${shown('drift-signer-2')}
<h2>What this does and does not show</h2>
<p>The handover was in the bytes, in plain words: anyone reading the first transaction could see that it gave Drift away, and that both signatures stayed valid forever. That is the claim, and the only one. Whether SignLens would have stopped the attack, nobody can say: if the signers' devices or the app they signed with were compromised, as Drift's account suggests, a browser extension may never have been in the path.</p>`,
        sources: [
            ['Drift Protocol, update of 5 April 2026', 'https://x.com/DriftProtocol/status/2040611161121370409'],
            ['The Block: Drift attributes the attack (5 April 2026)', 'https://www.theblock.co/post/396361'],
            [
                'BlockSec: multisig governance compromise via durable nonce',
                'https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation',
            ],
            [
                'Elliptic: Drift Protocol exploited for $286 million',
                'https://www.elliptic.co/blog/drift-protocol-exploited-for-286-million-in-suspected-dprk-linked-attack',
            ],
            [
                'CoinDesk: how a Solana feature let an attacker drain Drift (2 April 2026)',
                'https://www.coindesk.com/tech/2026/04/02/how-a-solana-feature-designed-for-convenience-let-an-attacker-drain-usd270-million-from-drift',
            ],
            ['Chainalysis: lessons from the Drift hack', 'https://www.chainalysis.com/blog/lessons-from-the-drift-hack/'],
            ['Solana: durable nonce deprecation', 'https://solana.com/upgrades/durable-nonce-deprecation'],
            [
                'The first signature on the Solana Explorer',
                'https://explorer.solana.com/tx/2HvMSgDEfKhNryYZKhjowrBY55rUx5MWtcWkG9hqxZCFBaTiahPwfynP1dxBSRk9s5UTVc8LFeS4Btvkm9pc2C4H',
            ],
            [
                'The second signature on the Solana Explorer',
                'https://explorer.solana.com/tx/4BKBmAJn6TdsENij7CsVbyMVLJU1tX27nfrMM1zgKv1bs2KJy6Am2NqdA3nJm4g9C6eC64UAf5sNs974ygB9RsN1',
            ],
        ],
    },
    {
        slug: 'owner-change-phishing-2025',
        published: '2026-10-25',
        name: 'Owner-change phishing, November 2025',
        title: 'The $3M Solana owner-change phish, read by SignLens',
        description:
            'In November 2025 a victim signed transactions whose preview showed no balance change; they handed the wallet to a drainer. As SignLens reads them.',
        h1: 'An owner-change phish: no balance change, the whole wallet',
        gist: 'A preview that "showed no fund changes" hid an unlimited approval on eight token accounts and the wallet itself handed to a drainer. Over $3 million.',
        body: html`<p class="lead">On 26 November 2025 a Solana user signed transactions that a balance preview showed as changing nothing. Eighteen seconds later their wallet was empty. SlowMist, which investigated, put the loss above $3 million, of which about $2 million sitting in DeFi positions was later recovered.</p>
<h2>What the transactions did</h2>
<p>The attacker paid the fees. At the top level the transactions held only compute-budget settings and calls to a program of the attacker's own. Inside it, that program approved the attacker to spend an <a href="/warnings/unlimited-token-approval">unlimited amount</a> from eight of the victim's token accounts, then used the system program's Assign to hand the victim's wallet account itself to a drainer program: an <a href="/warnings/token-account-owner-change">owner change</a>. Nothing left the wallet at signing, so the preview showed nothing.</p>
<h2>As SignLens reads it</h2>
${shown('owner-change-phishing')}
<p>SignLens does not name the approvals and the Assign: they run inside the attacker's program, which it has no description of. It blocks the transaction for that reason, with three critical findings, and notes that the fee is paid by someone else, an unusual thing for a transaction you start yourself.</p>`,
        sources: [
            [
                'SlowMist: wallet owner permissions may be altered',
                'https://slowmist.medium.com/beware-of-solana-phishing-attacks-wallet-owner-permissions-may-be-altered-708bbb30518e',
            ],
            ['PANews on the SlowMist case', 'https://panews.io/articles/397198c5-b7fe-4262-b79b-a87c8109ca8e'],
            [
                'The transaction on the Solana Explorer',
                'https://explorer.solana.com/tx/524t8LW1PFWd4DLYDgvtKxCX6HmxLFy2Ho9YSGzuo9mX4iiGDhtBTejx7z7bK4C9RocL8hfeuKF1QaYMnK3itMVJ',
            ],
        ],
    },
    {
        slug: 'blind-signing',
        published: '2026-10-25',
        name: 'Blind signing: Bybit, Radiant, WazirX',
        title: 'Blind signing: what the Bybit, Radiant and WazirX signers saw',
        description:
            'Three well-known hacks of 2024 and 2025 were signatures on transactions the signers could not read. What clear signing changes, and what it cannot.',
        h1: 'Blind signing: what the signers saw, and what they signed',
        gist: 'Three well-known hacks of 2024 and 2025 were signers approving transactions their screens misdescribed. What clear signing changes, and what it cannot.',
        body: html`<p class="lead">Blind signing is approving a transaction you cannot read: a hash on a hardware wallet, or an interface's description of what it says the bytes do. <a href="/clear-signing">Clear signing</a> is the opposite: the transaction itself, decoded into words, before you sign. Three well-known thefts of 2024 and 2025 happened on Ethereum and chains like it, which SignLens does not explain yet (Ethereum is next), and they are the case for it.</p>
<h2>Bybit, 21 February 2025: about $1.5 billion</h2>
<p>Attackers compromised a developer's computer at Safe{Wallet} and changed the JavaScript of Safe's web interface for Bybit's signers only. The signers saw a routine transfer from cold storage to a hot wallet. What they signed was a delegate call to the attacker's contract, which replaced the logic of the multisig itself. Their hardware wallets showed data the signers could not read.</p>
<h2>Radiant Capital, 16 October 2024: about $50 million</h2>
<p>Malware reached a developer through a message from a fake former contractor. The multisig's interface and its simulations showed legitimate transactions; the hardware wallets were given transfers of the lending pools' ownership, collected through requests to sign again after a supposed failure.</p>
<h2>WazirX, 18 July 2024: about $230 million</h2>
<p>According to WazirX, the signers saw the expected tokens and a whitelisted destination in their custody provider's interface, and got email confirmations; the payload upgraded the multisig to a contract the attacker controlled. Liminal, the custody provider, disputes WazirX's account.</p>
<h2>What clear signing changes, and what it cannot</h2>
<p>In each case the screen described one transaction and the signers signed another. Decoding the bytes being signed, rather than trusting a description of them, is the defence, which is what SignLens does: for Solana today, and for Ethereum next. It is not a defence against everything: a computer whose browser is compromised can show anything, SignLens's window included, and nothing a transaction explainer does helps when keys are stolen outright.</p>
<p>On Solana, the Slope wallet's leak of seed phrases in 2022, the DEXX key leak in 2024 and the backdoored <code>@solana/web3.js</code> versions of December 2024 stole keys; Mango Markets (2022) and Loopscale (2025) exploited how prices were set; Wormhole, Cashio and Crema (2022) were bugs in programs. None of them asked a victim to sign anything.</p>`,
        sources: [
            [
                'NCC Group: technical analysis of the Bybit hack',
                'https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/',
            ],
            ['Radiant Capital post-mortem', 'https://medium.com/@RadiantCapital/radiant-post-mortem-fecd6cd38081'],
            ['WazirX: preliminary report', 'https://wazirx.com/blog/preliminary-report-cyber-attack-on-wazirx-multisig-wallet/'],
            [
                'Cointelegraph: WazirX finds no evidence of compromised devices',
                'https://cointelegraph.com/news/wazir-x-finds-no-evidence-compromised-devices-preliminary-investigation',
            ],
            [
                'The Block: Slope saved seed phrases in plain text',
                'https://www.theblock.co/news/business/2022-08-04-slope-wallet-provider-saved-user-seed-phrases-in-plain-text-solana-security-researchers-find-161425',
            ],
            ['@solana/web3.js advisory', 'https://github.com/solana-labs/solana-web3.js/security/advisories/GHSA-jcxm-7wvp-g6p5'],
        ],
    },
];

function incidentPage(i: Incident): Page {
    const body = html`<p class="crumbs"><a href="/incidents/">Incidents</a> › ${i.name}</p>
<h1>${i.h1}</h1>
${published(i.published)}
${i.body}`;
    const updated = '2026-10-25';
    return {
        path: `/incidents/${i.slug}`,
        title: i.title,
        description: i.description,
        updated,
        body,
        sources: i.sources,
        jsonLd: article(i.h1, i.published, updated),
    };
}

function indexPage(): Page {
    const body = html`<h1>Attacks that needed a signature</h1>
<p class="lead">Some of the costliest attacks on Solana did not break a program or steal a key: they got someone to sign. Here are their transactions, as SignLens reads them, and what that does and does not prove.</p>
<ul class="cards">${INCIDENTS.map((i) => html`<li><h2><a href="/incidents/${i.slug}">${i.name}</a></h2><p>${i.gist}</p></li>`)}</ul>`;
    return {
        path: '/incidents/',
        title: 'Solana attacks that needed a signature | SignLens',
        description:
            'The Drift takeover, owner-change phishing and blind signing: the transactions behind them, as SignLens reads them, and the limits of that.',
        updated: '2026-10-25',
        body,
    };
}

export function incidentPages(): Page[] {
    return [indexPage(), ...INCIDENTS.map(incidentPage)];
}
