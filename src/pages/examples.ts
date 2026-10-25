// /examples/: real mainnet transactions by kind, each as SignLens shows it.
import { type Html, html } from '../html.ts';
import type { Page } from '../page.ts';
import { shown } from '../shown.ts';

export interface Example {
    slug: string;
    title: string;
    lead: string;
}

export interface Category {
    slug: string;
    name: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    examples: Example[];
}

export const CATEGORIES: Category[] = [
    {
        slug: 'lending',
        name: 'Lending and borrowing',
        title: 'Solana lending transactions, explained | SignLens',
        description:
            'Deposits, borrows and flash-loan leverage on Kamino, marginfi and Jupiter Lend, as SignLens explains them before you sign.',
        h1: 'Lending and borrowing, explained before you sign',
        intro: 'A deposit into a lending market and a transfer to a stranger look the same in a balance preview: tokens leave your wallet. SignLens names the market, what the tokens become (collateral, a loan, a repayment) and which account they reach.',
        examples: [
            {
                slug: 'kamino-lend-deposit',
                title: 'Deposit USDC into Kamino Lend',
                lead: 'A balance preview shows 4,635.28675 USDC leaving. SignLens says where it goes, Kamino Lend, and what it becomes: collateral credited to the obligation, the account that records what you have deposited and borrowed. The reserve refreshes are named as what they are, housekeeping that moves nothing.',
            },
            {
                slug: 'marginfi-borrow',
                title: 'Borrow USDS from marginfi',
                lead: 'A borrow brings tokens in, so a balance preview shows a gain. SignLens says it is a loan, from which lender, and into which of your accounts.',
            },
            {
                slug: 'jupiter-lend-leverage',
                title: 'Open a leveraged position with a Jupiter Lend flash loan',
                lead: 'Four steps in one transaction: borrow USDC for the length of the transaction, swap it for sUSDai, deposit the sUSDai as collateral and borrow USDC against it, then repay the flash loan. A balance preview nets this out to almost nothing; SignLens lists every step, and every transfer in and out of your accounts.',
            },
        ],
    },
    {
        slug: 'liquidity',
        name: 'Liquidity',
        title: 'Adding liquidity on Solana, explained | SignLens',
        description:
            'Raydium CLMM, Orca Whirlpool and Meteora DLMM positions, as SignLens explains them before you sign: the pool, the range and the most each token can cost.',
        h1: 'Providing liquidity, explained before you sign',
        intro: 'Opening a liquidity position sends two tokens into a pool at once, and how much of each the pool takes depends on its price when the transaction lands. SignLens shows the most each side can cost (≤), the pool and the position, and the price range where the program says one.',
        examples: [
            {
                slug: 'raydium-clmm-open-position',
                title: 'Open a Raydium CLMM position',
                lead: 'A concentrated-liquidity position with GOOGLx, a tokenised stock, and USDC. Both tokens are verified, so their names are the mints SignLens knows, not the names the tokens give themselves.',
            },
            {
                slug: 'orca-whirlpool-add-liquidity',
                title: 'Open an Orca Whirlpool position and add liquidity',
                lead: 'Two instructions: open a position between two ticks, then add at most 2.0004 SOL and 0.0019912 ETH to it.',
            },
            {
                slug: 'meteora-dlmm-add-liquidity',
                title: 'Add SOL to a Meteora DLMM position',
                lead: 'The SOL is wrapped into a token account first, then added to a DLMM position, spread over its bins as the instruction says.',
            },
        ],
    },
    {
        slug: 'staking',
        name: 'Staking',
        title: 'Solana staking transactions, explained | SignLens',
        description: 'Liquid staking with Jito, native stake delegation and JUP staking, as SignLens explains them before you sign.',
        h1: 'Staking, explained before you sign',
        intro: 'Staking hands SOL or a token to a pool, a validator or a lock, often for a token in return. SignLens names the pool and the token you get back, and says when a lock renews itself or the rate is set at execution.',
        examples: [
            {
                slug: 'jito-stake',
                title: 'Stake SOL with Jito for JitoSOL',
                lead: "This is how Jito's own staking page builds a stake: your wallet sends the SOL to a one-time key, the key deposits it in Jito's pool, and the JitoSOL comes back to your own account. SignLens names the pool by its token, the JitoSOL stake pool (verified), notes that another signer makes the deposit, and shows the JitoSOL landing in your account. How much JitoSOL you get is the pool's rate when the transaction executes, and SignLens says so rather than guess.",
            },
            {
                slug: 'native-stake',
                title: 'Delegate a stake account to a validator',
                lead: 'Native staking: a new stake account, delegated to the validator named.',
            },
            {
                slug: 'jup-stake',
                title: "Lock and stake JUP in Jupiter's DAO",
                lead: 'Staking JUP for votes, with the lock set to its maximum. SignLens says what a balance preview cannot: the lock renews itself until max lock is turned off.',
            },
        ],
    },
    {
        slug: 'trading',
        name: 'Swaps, perps and orders',
        title: 'Solana swaps, perps and orders, explained | SignLens',
        description:
            'Jupiter swaps, Jupiter Perps positions and limit orders, and prediction-market orders, as SignLens explains them before you sign.',
        h1: 'Swaps, perps and orders, explained before you sign',
        intro: 'A swap says what you give and the least you accept. A leveraged order says its side, its size, its collateral and its trigger: the collateral leaves your wallet now, and a balance preview shows nothing else.',
        examples: [
            {
                slug: 'jupiter-swap',
                title: 'Swap SOL for JUP on Jupiter',
                lead: 'The amount in, and the least that comes out (≥), with both tokens verified.',
            },
            {
                slug: 'jupiter-perps-limit-order',
                title: 'Place a Jupiter Perps limit order',
                lead: 'A balance preview shows 1.922511449 SOL leaving. SignLens says it is collateral for a long order of 10,457.57 USD that triggers below 117.5 USD.',
            },
            {
                slug: 'jupiter-perps-position',
                title: 'Increase a Jupiter Perps position',
                lead: 'A short position grows by 99.28661 USD on 10 USDC of collateral, with the price limit the order carries.',
            },
            {
                slug: 'jupiter-prediction-market',
                title: 'Buy YES contracts in a Jupiter prediction market',
                lead: 'How many contracts, at most what price each, and the 5 JupUSD that pays for them.',
            },
        ],
    },
    {
        slug: 'launchpads',
        name: 'Launchpads and new tokens',
        title: 'Buying new Solana tokens, explained | SignLens',
        description:
            'Pump.fun and Raydium LaunchLab buys as SignLens explains them: unverified tokens named by their mint, and trades that accept almost any output.',
        h1: 'Buying new tokens, explained before you sign',
        intro: "A token launched minutes ago is on no verified list, so SignLens does not repeat the name it gives itself: it shows the amount in the token's raw units and the mint address, marked unverified. It also says when a trade accepts almost any output.",
        examples: [
            {
                slug: 'pump-fun-buy',
                title: 'Buy a token on Pump.fun',
                lead: 'The SOL in, the least of the new token out, by its mint address.',
            },
            {
                slug: 'raydium-launchlab-buy',
                title: 'Buy a token on Raydium LaunchLab, with no minimum',
                lead: 'The trade sets its minimum output to one base unit, so it accepts almost any price. SignLens warns about it.',
            },
        ],
    },
    {
        slug: 'governance',
        name: 'Governance and multisigs',
        title: 'DAO votes and Squads proposals, explained | SignLens',
        description: "Jupiter DAO votes and Squads multisig proposals as SignLens explains them, the proposal's own transaction included.",
        h1: 'Votes and multisig proposals, explained before you sign',
        intro: 'A vote or a proposal moves nothing when you sign it, which is exactly why it needs reading: a multisig proposal is a transaction the multisig will run later. SignLens decodes the transaction inside a Squads proposal, step by step, as if you were signing it.',
        examples: [
            {
                slug: 'jupiter-dao-vote',
                title: 'Vote in the Jupiter DAO',
                lead: 'Which proposal, which option, and with which stake. A vote signs a side\'s number, whose meaning depends on the proposal: on a yes/no proposal side 2 is "for", on an option proposal it is the second option. The transaction you sign says neither which kind the proposal is nor what its options are, so SignLens reads the proposal, its title and its options from your RPC and names the option, as your RPC\'s word. Without them it says what the side means on each kind.',
            },
            {
                slug: 'squads-proposal',
                title: 'Propose and approve a Squads token transfer',
                lead: 'One member creates a proposal, its transaction and their approval at once. SignLens shows what the proposal will do once the threshold is met: transfer 130,000 of an unverified token from the vault.',
            },
        ],
    },
];

function categoryPage(category: Category): Page {
    const body: Html = html`<p class="crumbs"><a href="/examples/">Examples</a> › ${category.name}</p>
<h1>${category.h1}</h1>
<p class="lead">${category.intro}</p>
${category.examples.map(
    (example) => html`<h2 id="${example.slug}">${example.title}</h2>
<p>${example.lead}</p>
${shown(example.slug)}`,
)}
<p>More: ${CATEGORIES.filter((c) => c !== category).map((c, i) => html`${i > 0 ? ', ' : ''}<a href="/examples/${c.slug}">${c.name.toLowerCase()}</a>`)}. What SignLens <a href="/warnings/">warns about</a>.</p>`;
    return { path: `/examples/${category.slug}`, title: category.title, description: category.description, updated: '2026-10-25', body };
}

function indexPage(): Page {
    const body = html`<h1>What SignLens shows, on real Solana transactions</h1>
<p class="lead">Every example here is a mainnet transaction, explained by the SignLens engine for the wallet that signed it and shown as the SignLens window shows it. Each links to the transaction on the Solana Explorer, so you can check it.</p>
<ul class="cards">
${CATEGORIES.map(
    (c) =>
        html`<li><h2><a href="/examples/${c.slug}">${c.name}</a></h2><p>${c.intro}</p><p class="muted">${c.examples.map((e, i) => html`${i > 0 ? ' · ' : ''}${e.title}`)}</p></li>`,
)}
</ul>`;
    return {
        path: '/examples/',
        title: 'Solana transactions, explained: examples | SignLens',
        description:
            'Real Solana mainnet transactions on Kamino, Raydium, Orca, Meteora, Jito, Jupiter, Pump.fun and Squads, as SignLens explains them before you sign.',
        updated: '2026-10-25',
        body,
    };
}

export function examplePages(): Page[] {
    return [indexPage(), ...CATEGORIES.map(categoryPage)];
}
