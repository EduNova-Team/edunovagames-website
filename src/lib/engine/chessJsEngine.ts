import { Chess } from "chess.js";
import type { EngineColor, GameEngine, EngineFactory } from "./types";

// ─── chess.js engine ─────────────────────────────────────────────────────────
// Wraps a chess.js instance behind the GameEngine interface. This is the default
// factory — Chessle and Variantle (KOTH / Three Check) use it and behave exactly
// as before; the chess.js calls just moved out of ChessBoard/useChessle to here.

function wrap(chess: Chess): GameEngine {
  return {
    fen: () => chess.fen(),
    turn: (): EngineColor => (chess.turn() === "w" ? "white" : "black"),
    dests: () => {
      const dests = new Map<string, string[]>();
      for (const move of chess.moves({ verbose: true })) {
        if (!dests.has(move.from)) dests.set(move.from, []);
        dests.get(move.from)!.push(move.to);
      }
      return dests;
    },
    play: (from, to, promotion = "q") => {
      const result = chess.move({ from, to, promotion });
      return result ? result.san : null;
    },
  };
}

export const chessJsFactory: EngineFactory = {
  initial: () => wrap(new Chess()),
  replay: (sans) => {
    const chess = new Chess();
    for (const san of sans) chess.move(san);
    return wrap(chess);
  },
};
