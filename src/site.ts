// What every page shares: where the site lives and where it points.

export const ORIGIN = 'https://signlens.dev';
export const NAME = 'SignLens';
/** The extension's repository, its releases, and this site's. */
export const REPOSITORY = 'https://github.com/signlens/signlens-extension';
export const RELEASES = `${REPOSITORY}/releases`;
/** The extension on Firefox Add-ons. */
export const FIREFOX = 'https://addons.mozilla.org/firefox/addon/signlens-beta/';
export const SITE_REPOSITORY = 'https://github.com/signlens/signlens-site';
/** The extension's current release. */
export const VERSION = '0.2.0';
/** Where vulnerabilities are reported (the security page, security.txt). */
export const SECURITY_EMAIL = 'security@signlens.dev';
/** Where everything else goes: questions, and having one's feedback deleted. */
export const SUPPORT_EMAIL = 'support@signlens.dev';
/** Explorer link for a transaction signature. */
export function explorer(signature: string): string {
    return `https://explorer.solana.com/tx/${signature}`;
}
