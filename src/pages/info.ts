// Install, privacy, security, and the page for a path that does not exist.
import { html } from '../html.ts';
import type { Page } from '../page.ts';
import { RELEASES, REPOSITORY, SECURITY_EMAIL, SITE_REPOSITORY, VERSION } from '../site.ts';

export function installPage(): Page {
    const body = html`<h1>Install SignLens</h1>
<p class="lead">SignLens ${VERSION} is a beta for desktop Chrome, Brave and Edge (version 111 or later) and Firefox (140 or later). Until it is in the Chrome Web Store and on Firefox Add-ons, you install it from its GitHub release.</p>
<h2>1. Download it</h2>
<p>From the <a href="${RELEASES}">latest release</a>: <code>signlens-extension-${VERSION}.zip</code> for Chrome, Brave and Edge, or <code>signlens-extension-firefox-${VERSION}.zip</code> for Firefox. Each comes with its SHA-256 checksum and a build attestation; the <a href="${REPOSITORY}#verifying-a-package">README says how to check them</a>.</p>
<h2>2. Load it</h2>
<ul>
<li><b>Chrome, Brave, Edge:</b> unzip it, open <code>chrome://extensions</code>, turn on "Developer mode", choose "Load unpacked" and pick the unzipped folder.</li>
<li><b>Firefox:</b> open <code>about:debugging#/runtime/this-firefox</code>, choose "Load Temporary Add-on…" and pick the zip. Firefox keeps an add-on loaded this way only until it restarts. If the SignLens popup says the browser has not let it reach the API, press "Allow https access" there.</li>
</ul>
<h2>3. Use it</h2>
<p>In a dapp, choose <b>SignLens</b> when it asks you to connect a wallet. SignLens connects, in turn, to your own wallet in the same page, and from then on every request opens the SignLens window first. Continue, and your wallet asks you as usual. If you turn off "Show the explanation and ask first" in the settings, only the requests SignLens would refuse open the window; the rest go straight on to your wallet.</p>
<p>In the popup's settings you can pick which of your wallets SignLens passes requests to, list your own addresses so explanations can say "you", keep an address book so transfers name the people you pay and <a href="/warnings/address-poisoning">lookalikes</a> stand out, and choose the Solana node SignLens asks for what a transaction refers to (the RPC).</p>
<p class="note">SignLens never asks for a seed phrase or a private key, and never signs anything. Anything that asks you for one, in SignLens's name or not, is a scam.</p>`;
    return {
        path: '/install',
        title: 'Install SignLens for Chrome and Firefox',
        description: `Install the SignLens ${VERSION} beta in Chrome, Brave, Edge or Firefox from its GitHub release, and connect it in front of your Solana wallet.`,
        updated: '2026-10-25',
        body,
    };
}

export function privacyPage(): Page {
    const body = html`<h1>Privacy</h1>
<p class="lead">What the SignLens extension and this site send, to whom, and what is kept. Last changed 25 October 2026.</p>
<h2>The extension</h2>
<h3>What goes to the SignLens API</h3>
<p>In this beta, SignLens's server computes the explanation. For each transaction a dapp asks you to sign, the extension sends the SignLens API: the transaction, the addresses its lookup tables load, the outcome of the simulation if it ran, your addresses from the settings (in watch-only mode the watched one), so that the explanation can say "you", and your address book, names and addresses, so that contacts can be named. When account lookup is on and the explanation names accounts it would read, such as a multisig proposal and the transaction it stores or a DAO proposal and its options, it asks again with those accounts as your RPC returned them, at most twice. When token lookup is on and the explanation leaves tokens unnamed, it asks again with their symbols. This happens when the dapp asks, before the window opens, and also when "Show the explanation and ask first" is off and no window opens.</p>
<p>For each request the API logs the time, how long it took, the verdict, the finding codes, the program names, the size and a SHA-256 hash of the transaction's message, and keeps nothing else. The hash cannot be turned back into the transaction, but once the transaction is on chain anyone can compute the same hash from it, so a log line can be matched to that transaction and its signer. Messages to sign never leave the extension.</p>
<h3>Your IP address</h3>
<p>Every request reaches the API through Cloudflare, which sees your IP address, as it does for any site it serves. The API uses the address only to count your requests against its limit, in memory and as a keyed hash, and logs it nowhere.</p>
<h3>Your RPC and the token list</h3>
<p>The RPC in the settings, by default the public <code>solana-rpc.publicnode.com</code>, is asked for the lookup tables of every transaction that uses any, sees the whole transaction when simulation is on, is asked for the accounts an explanation names when account lookup is on, and for the mints of unlisted tokens when token lookup is on. Those mints also go to the token list, by default Jupiter's <code>lite-api.jup.ag</code>. Simulation, account lookup and token lookup are on by default; the settings turn them off, and the RPC and the token list can be your own.</p>
<h3>Feedback</h3>
<p>The feedback strip under an explanation sends nothing until you rate it, and says what a rating sends before you give one. A rating sends, for each transaction explained: the rating, your comment, a hash of the transaction, the site's host and the extension's version (in Firefox only once you allow them), the wallet method the site called, and what the window showed you: the verdict, the summary, the findings by code and severity, and the program each instruction calls. The transaction itself goes only if you tick "Send this transaction to SignLens so it can be looked into", which is offered unticked. Feedback is kept to improve the explanations; to have yours deleted, write to <a href="mailto:${SECURITY_EMAIL}">${SECURITY_EMAIL}</a> with the time you sent it.</p>
<h3>What the dapp learns</h3>
<p>The dapp is told whether the request was passed on, rejected by you, or refused by SignLens and why, never the verdict or the explanation. In watch-only mode it learns the watched address only once you allow it.</p>
<h2>This site</h2>
<p>signlens.dev is static pages served by Cloudflare. It sets no cookies of its own and runs no script but Cloudflare Web Analytics, which counts visits, the pages viewed, the referring site and the visitor's country, without cookies or local storage. Cloudflare processes those requests for us; its own security systems may set a strictly necessary cookie when they inspect traffic.</p>
<h2>What SignLens does not do</h2>
<p>No accounts, no advertising, no selling or sharing of data, no tracking across sites. The extension's source is public (<a href="${REPOSITORY}">${REPOSITORY.replace('https://', '')}</a>), and so is this site's (<a href="${SITE_REPOSITORY}">${SITE_REPOSITORY.replace('https://', '')}</a>).</p>
<h2>Questions</h2>
<p>Write to <a href="mailto:${SECURITY_EMAIL}">${SECURITY_EMAIL}</a>.</p>`;
    return {
        path: '/privacy',
        title: 'Privacy | SignLens',
        description:
            'What the SignLens extension sends to its API, your RPC and the token list, what is kept, and what signlens.dev counts.',
        updated: '2026-10-25',
        body,
    };
}

export function securityPage(): Page {
    const body = html`<h1>Security</h1>
<p class="lead">How to report a problem, and how to check that the SignLens you run is the one published.</p>
<h2>Reporting a vulnerability</h2>
<p>A way to make SignLens show a transaction as something it is not, pass a request on without your decision, or send what it says it does not: write to <a href="mailto:${SECURITY_EMAIL}">${SECURITY_EMAIL}</a>, not to the issue tracker, as the extension's <a href="${REPOSITORY}/blob/master/SECURITY.md">security policy</a> says. An explanation that is wrong or unclear goes through the feedback strip under it.</p>
<h2>What SignLens never does</h2>
<ul>
<li>It never asks for a seed phrase or a private key, and holds none.</li>
<li>It never signs anything: every signature is your own wallet's, after its own prompt.</li>
<li>It never changes a transaction: what goes to your wallet is the copy of the bytes it explained.</li>
</ul>
<h2>Checking a release</h2>
<p>Each release package is built reproducibly, on Linux, macOS and Windows, which must produce the same bytes, and is published with its SHA-256 and a build provenance attestation. The README's <a href="${REPOSITORY}#verifying-a-package">verifying a package</a> shows how to check both, and how to rebuild a release from its tag and get the same bytes.</p>
<h2>Permissions</h2>
<p>The extension stores its settings, and reaches the API, the RPC and the token list in the settings. It runs in the pages you visit to offer itself as a wallet to dapps there.</p>`;
    return {
        path: '/security',
        title: 'Security | SignLens',
        description: 'How to report a SignLens vulnerability, what SignLens never does, and how to verify a release package.',
        updated: '2026-10-25',
        body,
    };
}

export function notFoundPage(): Page {
    const body = html`<h1>Nothing here</h1>
<p class="lead">There is no page at this address.</p>
<p>The <a href="/">home page</a> says what SignLens is; the <a href="/examples/">examples</a> show it on real transactions.</p>`;
    return {
        path: '/404',
        title: 'Not found | SignLens',
        description: 'There is no page at this address.',
        updated: '2026-10-25',
        body,
        hidden: true,
    };
}
