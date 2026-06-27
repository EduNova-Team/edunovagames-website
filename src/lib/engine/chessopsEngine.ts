import { parseFen, makeFen, INITIAL_FEN } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { chessgroundDests } from "chessops/compat";
import { makeSanAndPlay, parseSan } from "chessops/san";
import { parseSquare, charToRole } from "chessops/util";
import type { Position } from "chessops/chess";
import type { Rules, NormalMove } from "chessops/types";
import type { EngineColor, GameEngine, EngineFactory } from "./types";

// ─── chessops engine ─────────────────────────────────────────────────────────
// Wraps a chessops variant Position behind the GameEngine interface. Unlike
// chess.js, chessops natively supports rule-divergent variants (Horde, Atomic,
// Racing Kings, Crazyhouse, …), so Variantle 2 — and any future variant page —
// just calls `createChessopsFactory(rules, initialFen)` with the right rules.

function createPosition(rules: Rules, fen: string): Position {
  const setup = parseFen(fen).unwrap();
  return setupPosition(rules, setup).unwrap();
}

function wrap(pos: Position): GameEngine {
  return {
    fen: () => makeFen(pos.toSetup()),
    turn: (): EngineColor => pos.turn,
    // chessops returns Map<SquareName, SquareName[]>; SquareName is a string
    // subtype, so this is structurally a string-keyed dests map for Chessground.
    dests: () => chessgroundDests(pos) as Map<string, string[]>,
    play: (from, to, promotion = "q") => {
      const fromSq = parseSquare(from);
      const toSq = parseSquare(to);
      if (fromSq === undefined || toSq === undefined) return null;

      // Try as a normal move first. chessops is strict: a promotion move is only
      // legal with a promotion role set, a non-promotion move only without one —
      // so fall back to a (queen) promotion when the plain move isn't legal.
      let move: NormalMove = { from: fromSq, to: toSq };
      if (!pos.isLegal(move)) {
        const role = charToRole(promotion);
        if (!role) return null;
        move = { from: fromSq, to: toSq, promotion: role };
        if (!pos.isLegal(move)) return null;
      }
      return makeSanAndPlay(pos, move); // mutates pos in place, returns SAN
    },
  };
}

export function createChessopsFactory(rules: Rules, initialFen?: string): EngineFactory {
  const startFen = initialFen ?? INITIAL_FEN;
  return {
    initial: () => wrap(createPosition(rules, startFen)),
    replay: (sans) => {
      const pos = createPosition(rules, startFen);
      for (const san of sans) {
        const move = parseSan(pos, san);
        if (!move) break;
        pos.play(move);
      }
      return wrap(pos);
    },
  };
}
