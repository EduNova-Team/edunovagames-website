/** Base-62 alphabet — digit value equals position in this string. Case-sensitive. */
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Encodes a non-negative integer opening index to a base-62 string.
 * Returns "0" for invalid input (NaN, negative, non-integer).
 */
export function encodeOpeningIndex(index: number): string {
  if (!Number.isInteger(index) || index < 0) return "0";
  if (index === 0) return "0";
  let n = index;
  let out = "";
  while (n > 0) {
    out = ALPHABET[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out;
}

/**
 * Decodes a base-62 string back to an opening index.
 * Returns null if the code is empty or contains characters outside the alphabet.
 * Does NOT range-check against any dataset — out-of-range values are handled downstream.
 */
export function decodeOpeningCode(code: string): number | null {
  const trimmed = code.trim(); // NOTE: do NOT uppercase — base-62 is case-sensitive
  if (trimmed.length === 0) return null;
  let n = 0;
  for (const ch of trimmed) {
    const v = ALPHABET.indexOf(ch);
    if (v === -1) return null;
    n = n * 62 + v;
  }
  return n;
}
