/**
 * The part of a Trusted Types policy this module uses. The TypeScript DOM library does not declare the API.
 */
type TrustedTypePolicy = {
    createHTML(input: string): unknown;
    createScriptURL(input: string): unknown;
};

/**
 * The name of the Trusted Types policy the library creates. A page whose CSP has a `trusted-types` directive lists it
 * there, for example `require-trusted-types-for 'script'; trusted-types maplibre-gl`.
 */
export const TRUSTED_TYPES_POLICY_NAME = 'maplibre-gl';

let policy: TrustedTypePolicy | null | undefined;

/**
 * Returns the library's Trusted Types policy, creating it on first use, or `null` in a browser without Trusted Types
 * and on a page whose CSP does not allow the policy. Without one the library passes plain strings, as it does in
 * browsers that do not enforce Trusted Types.
 *
 * The policy passes its input through unchanged, so it may only be used where the library itself decides what the
 * value is or makes it safe afterwards: the worker script URL, and markup parsed into an inert document and
 * sanitized before any of it reaches the page.
 */
function getPolicy(): TrustedTypePolicy | null {
    if (policy !== undefined) return policy;

    const trustedTypes = (globalThis as {trustedTypes?: {createPolicy(name: string, rules: TrustedTypePolicy): TrustedTypePolicy}}).trustedTypes;
    try {
        policy = trustedTypes?.createPolicy(TRUSTED_TYPES_POLICY_NAME, {
            createHTML: (input) => input,
            createScriptURL: (input) => input
        }) ?? null;
    } catch {
        policy = null;
    }
    return policy;
}

/**
 * Returns markup that `DOMParser.parseFromString` accepts on a page that enforces Trusted Types. Only for markup that
 * is sanitized after parsing, see {@link DOM.sanitize}.
 */
export function trustedHTML(html: string): string {
    return (getPolicy()?.createHTML(html) ?? html) as string;
}

/**
 * Returns a script URL that the `Worker` constructor accepts on a page that enforces Trusted Types.
 */
export function trustedScriptURL(url: string): string {
    return (getPolicy()?.createScriptURL(url) ?? url) as string;
}
