// ─── Engine abstraction ──────────────────────────────────────────────────────
// A tiny interface over a chess rules engine, so the guessing game (useChessle)
// and the board (ChessBoard) don't depend on one specific library.
//
// - chess.js powers standard-legal games (Chessle, Variantle's KOTH / Three Check).
// - chessops powers rule-divergent variants (Variantle 2: Horde, and later Atomic,
//   Racing Kings, Crazyhouse) that chess.js cannot even represent.
//
// The contract mirrors the existing architecture: `play` mutates in place during a
// guess row (the board updates Chessground itself), while undo / fill-green /
// play-again rebuild a fresh engine via the factory so the object reference changes
// and ChessBoard's effect re-fires.

export type EngineColor = "white" | "black";

export interface GameEngine {
  /** FEN of the current position (fed to Chessground for display). */
  fen(): string;
  /** Side to move. */
  turn(): EngineColor;
  /** Legal destinations keyed by origin square, in Chessground's Map format. */
  dests(): Map<string, string[]>;
  /**
   * Attempt a board move from→to (with optional promotion role, default queen).
   * Mutates this engine in place. Returns the move's SAN, or null if illegal.
   */
  play(from: string, to: string, promotion?: string): string | null;
}

export interface EngineFactory {
  /** A fresh engine at the variant's starting position. */
  initial(): GameEngine;
  /** A fresh engine with the given SAN moves replayed from the start. */
  replay(sans: string[]): GameEngine;
}
