import idMap from "@/data/chessle-ids.json";

const { indexToCode, codeToIndex } = idMap as {
  indexToCode: Record<string, string>;
  codeToIndex: Record<string, number>;
};

/** Returns the shareable code for a given opening index. */
export function encodeOpeningIndex(index: number): string {
  return indexToCode[index] ?? "";
}

/** Returns the opening index for a given code, or null if unrecognized. */
export function decodeOpeningCode(code: string): number | null {
  const trimmed = code.trim().toUpperCase();
  const idx = codeToIndex[trimmed];
  return idx !== undefined ? idx : null;
}
