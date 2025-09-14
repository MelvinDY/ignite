import { z } from "zod";

/**
 * Returns `true` when the hostname of the given URL matches one of the
 * allowed domain roots, either **exactly** or as a **subdomain**.
 *
 * Normalization performed:
 * - Parses with the WHATWG `URL` constructor (rejects invalid/relative URLs).
 * - Strips a leading `www.` (so `www.linkedin.com` is treated as `linkedin.com`).
 * - Compares the normalized hostname against each `allowed` root using:
 *     - exact equality (e.g. `linkedin.com` === `linkedin.com`)
 *     - subdomain match (e.g. `sub.github.com` endsWith `.github.com`)
 *
 *
 * @param u        Any absolute URL string (must include a scheme, e.g. https://)
 * @param allowed  Array of allowed domain roots (lowercase), e.g. ["linkedin.com", "github.com"]
 * @returns        `true` if the hostname is allowed; `false` if not or if `u` is not a valid URL.
 *
 */
export function hostIs(u: string, allowed: string[]): boolean {
  try {
    const h = new URL(u).hostname.replace(/^www\./, "");
    return allowed.some(a => h === a || h.endsWith("." + a));
  } catch {
    return false;
  }
}

/**
 * Reusable Zod schema for a string that is:
 *   1) a syntactically valid **absolute URL**, and
 *   2) uses the **https://** scheme (no http/ftp/mailto/etc.)
 *
 * - `z.string().url()` ensures the string is a valid absolute URL (with a scheme/host).
 * - The `.refine()` enforces HTTPS specifically (no plaintext HTTP).
 */
export const HttpsUrl = z.string().url().refine(u => u.startsWith("https://"), {
  message: "Must start with https://",
});