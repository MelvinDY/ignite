import { z } from "zod";

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