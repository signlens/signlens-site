// The home page: what SignLens is, in the first sentence, then the proof.
import { html } from '../html.ts';
import type { Page } from '../page.ts';
import { load } from '../shown.ts';
import { NAME, ORIGIN, RELEASES, REPOSITORY, VERSION } from '../site.ts';
import { INCIDENTS } from './incidents.ts';
import { WARNINGS } from './warnings.ts';

/** What a balance preview shows leaving the wallet, beside what SignLens says, for the table. */
const TABLE: { on: string; slug: string; leaves: string; example: string }[] = [
    { on: 'Kamino', slug: 'kamino-lend-deposit', leaves: '4,635.28675 USDC', example: '/examples/lending' },
    {
        on: 'Raydium',
        slug: 'raydium-clmm-open-position',
        leaves: 'up to 33.874114 USDC and 0.00985543 GOOGLx',
        example: '/examples/liquidity',
    },
    { on: 'Orca', slug: 'orca-whirlpool-add-liquidity', leaves: 'up to 2.0004 SOL and 0.0019912 ETH', example: '/examples/liquidity' },
    { on: 'Jito', slug: 'jito-stake', leaves: '0.01 SOL', example: '/examples/staking' },
    { on: 'Jupiter', slug: 'jupiter-perps-limit-order', leaves: '1.922511449 SOL', example: '/examples/trading' },
];

const WORKS_WITH: [string, string][] = [
    [
        'Jupiter',
        'Aggregator v6, Order Engine, Limit Order v2, Perpetuals, Lend (Earn, Borrow, Flashloan), Lock, DAO staking and governance, Genie and merkle distributors, prediction market, Doves oracle',
    ],
    ['Kamino', 'Lend, Lending Vault, Farms, Limit Orders, Scope'],
    ['Meteora', 'DLMM, DAMM v2, Dynamic Bonding Curve, Alpha Vault, Zap, liquidity distributor'],
    ['Raydium', 'AMM v4, CPMM, CLMM, LaunchLab, router'],
    ['Orca', 'Whirlpool'],
    ['marginfi', 'Project 0'],
    ['Pump', 'Pump.fun, PumpSwap, Pump Fees, Pump stables router'],
    ['Stake pools', "SPL Stake Pool, which Jito's JitoSOL and many others run on"],
    ['MetaDAO', 'Futarchy, Conditional Vault'],
    ['Squads', 'v4 multisig, the transaction inside a proposal included'],
    ['Drift', "the handover of the protocol's admin, only"],
    [
        'Aggregators and routers',
        'DFlow, Titan, OKX DEX Router, 0x Settler, LI.FI, Rango, Binance router and fee router, Kobayashi router, Liquid Mesh router',
    ],
    ['Lighthouse', 'the checks some wallets add to a transaction'],
    [
        "Solana's own programs",
        'SOL transfers, tokens and Token-2022, associated token accounts, native staking, compute budget and fees, memos, lookup tables, program deploys and upgrades',
    ],
];

export function homePage(): Page {
    const body = html`<section class="hero">
<div>
<h1>Know what you're signing on Solana</h1>
<p class="lead">${NAME} is a Solana transaction explainer: a free browser extension that explains, in plain words, each transaction a dapp asks you to sign, before your wallet signs it, and says so when it cannot. Your wallet's preview shows what leaves your wallet; SignLens says where it goes and what it is for.</p>
<p>It works beside the wallet you already use, Phantom, Backpack, Solflare and other Solana wallets. It holds no keys: it explains each request in its own window, and once you say so passes it on, unchanged, to your wallet, where you approve or reject as usual.</p>
<div class="actions"><a class="button primary" href="/install">Install for Chrome or Firefox</a><a class="button" href="/examples/">See real examples</a></div>
<p class="muted">Beta, version ${VERSION}. The extension is open source. <a href="/privacy">The explanation is computed on SignLens's server</a> for now.</p>
</div>
<figure><picture><source media="(prefers-color-scheme: dark)" srcset="/images/deposit-dark.png"><img src="/images/deposit-light.png" width="440" height="575" alt="The SignLens window on a deposit: OK, Deposit 4,635.28675 USDC (verified) into Kamino Lend as collateral; what it does, from your wallet to Kamino Lend, the fee and how long it is valid; and Reject and Continue to Phantom"></picture></figure>
</section>
<div class="prose">
<h2>More than a balance preview</h2>
<p>Before you sign, your wallet can show what a transaction will take from you. It does not say where that goes or what it buys. A deposit into a lending market, a liquidity position, a stake, a leveraged order and a drain can all look the same there. SignLens reads the transaction itself, every instruction of it, and says in words what it does.</p>
<p>Real mainnet transactions, by what leaves the wallet and by SignLens's summary of them:</p>
<div class="table stack"><table role="table">
<thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">On</th><th scope="col" role="columnheader">Leaves your wallet</th><th scope="col" role="columnheader">SignLens says</th></tr></thead>
<tbody role="rowgroup">${TABLE.map((row) => html`<tr role="row"><td role="cell" data-label="On"><a href="${row.example}">${row.on}</a></td><td role="cell" data-label="Leaves your wallet">${row.leaves}</td><td role="cell" data-label="SignLens says">${load(row.slug).recording.explanation.summary}</td></tr>`)}</tbody>
</table></div>
<p>"(verified)" marks a token or an account SignLens knows by its address, not by the name it gives itself; "≤" an amount the program may take less of. <a href="/examples/">More examples</a>, from lending to multisig proposals.</p>
<h2>It warns about what a balance preview cannot show</h2>
<p>Some of the worst transactions take nothing when you sign them: they hand over the right to take it later. SignLens names them right under the verdict: ${WARNINGS.map((w, i) => html`${i === 0 ? '' : i === WARNINGS.length - 1 ? ' and ' : ', '}<a href="/warnings/${w.slug}">${w.name.toLowerCase()}</a>`)}. <a href="/warnings/">What each one is</a>.</p>
<h2>Real attacks, read by SignLens</h2>
<p>The transactions behind attacks that needed a signature, as SignLens reads them, and what that does and does not prove:</p>
<ul>${INCIDENTS.map((i) => html`<li><a href="/incidents/${i.slug}">${i.name}</a></li>`)}</ul>
<h2>What it isn't</h2>
<ul>
<li><b>Not a wallet.</b> It holds no keys and signs nothing. Your wallet still asks you for every signature, as it did before.</li>
<li><b>Not a guarantee.</b> OK means SignLens read every instruction and found nothing to warn about, not that a trade is a good one or a token worth holding. It can be wrong, and the strip under each explanation is where to say so.</li>
<li><b>Not a guess.</b> What it cannot read, it says it cannot read, and a program it does not know blocks the request. A simulation, or an account it reads, is shown as the claim of the Solana node that gave it, not as fact.</li>
<li><b>Not offline, in this beta.</b> The explanation is computed on SignLens's server, which sees the transaction; <a href="/privacy">the privacy page</a> says what it keeps.</li>
<li><b>Not on every chain yet.</b> SignLens explains Solana mainnet today and is built to take on other chains; Ethereum is next. It runs in Chrome, Brave, Edge and Firefox on a computer.</li>
</ul>
<h2 id="works-with">Works with</h2>
<p>SignLens explains the programs below, whichever site calls them: a Jupiter swap reads the same on jup.ag as in another site's swap widget.</p>
<ul>${WORKS_WITH.map(([project, what]) => html`<li><b>${project}</b>: ${what}</li>`)}</ul>
<p>A program not on the list is shown as unknown, and its transaction blocked. SignLens is not affiliated with any of these projects; their names are their owners' trademarks.</p>
<h2>Get it</h2>
<p>SignLens ${VERSION} is on <a href="${RELEASES}">GitHub</a>, for Chrome and Firefox, built reproducibly and published with its checksums. <a href="/install">How to install it</a>, <a href="/how-it-works">how it works</a>, and <a href="/faq">questions people ask</a>.</p>
</div>`;
    return {
        path: '/',
        title: 'SignLens: Solana transaction explainer for your wallet',
        description:
            'A free browser extension that explains, in plain words, each Solana transaction a dapp asks you to sign. Works with Phantom, Backpack and Solflare.',
        updated: '2026-10-25',
        wide: true,
        body,
        jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
                { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: NAME },
                {
                    '@type': 'Organization',
                    '@id': `${ORIGIN}/#organization`,
                    name: NAME,
                    url: `${ORIGIN}/`,
                    logo: `${ORIGIN}/icon-128.png`,
                    sameAs: [REPOSITORY],
                },
                {
                    '@type': 'SoftwareApplication',
                    name: NAME,
                    description:
                        'A browser extension that explains each Solana transaction a dapp asks you to sign, in plain words, before your wallet signs it.',
                    applicationCategory: 'SecurityApplication',
                    operatingSystem: 'Chrome, Firefox',
                    softwareVersion: VERSION,
                    downloadUrl: RELEASES,
                    license: 'https://www.apache.org/licenses/LICENSE-2.0',
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                    publisher: { '@id': `${ORIGIN}/#organization` },
                },
            ],
        },
    };
}
