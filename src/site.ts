// What every page shares: where the site lives and where it points.

export const ORIGIN = 'https://signlens.dev';
export const NAME = 'SignLens';
/** The extension's repository, its releases, and this site's. */
export const REPOSITORY = 'https://github.com/signlens/signlens-extension';
export const RELEASES = `${REPOSITORY}/releases`;
export const SITE_REPOSITORY = 'https://github.com/signlens/signlens-site';
/** The extension's current release. */
export const VERSION = '0.1.0';
export const SECURITY_EMAIL = 'security@signlens.dev';
/** Explorer link for a transaction signature. */
export function explorer(signature: string): string {
    return `https://explorer.solana.com/tx/${signature}`;
}
