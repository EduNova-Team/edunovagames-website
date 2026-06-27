import { parseFen, makeFen } from "chessops/fen";
import {
  setupPosition,
  Chess,
  Atomic,
  Antichess,
  KingOfTheHill,
  ThreeCheck,
  RacingKings,
  Horde,
  Crazyhouse,
} from "chessops/variant";
import { chessgroundDests } from "chessops/compat";
import { makeSanAndPlay, parseSan } from "chessops/san";
import { parseSquare, makeSquare } from "chessops/util";
import type { Position } from "chessops/chess";
import type { Rules, NormalMove, DropMove, Role } from "chessops/types";
import type { EngineColor, GameEngine, EngineFactory } from "./types";

// ─── chessops engine ─────────────────────────────────────────────────────────
// Wraps a chessops variant Position behind the GameEngine interface. Unlike
// chess.js, chessops natively supports rule-divergent variants (Horde, Atomic,
// Racing Kings, Antichess, Crazyhouse, …), so each variant page just calls
// `createChessopsFactory(rules)` — the variant's authoritative starting position
// comes from the chessops variant class's default().

// Each Rules literal → its variant class (supplies default() start position).
const VARIANT_CLASS: Record<Rules, { default(): Position }> = {
  chess: Chess,
  atomic: Atomic,
  antichess: Antichess,
  kingofthehill: KingOfTheHill,
  "3check": ThreeCheck,
  racingkings: RacingKings,
  horde: Horde,
  crazyhouse: Crazyhouse,
};

// Roles that can sit in a Crazyhouse pocket (a king is never captured/dropped).
const POCKET_ROLES: Role[] = ["pawn", "knight", "bishop", "rook", "queen"];

function createPosition(rules: Rules, fen?: string): Position {
  if (fen) return setupPosition(rules, parseFen(fen).unwrap()).unwrap();
  return VARIANT_CLASS[rules].default();
}

// Structural view of the drop-capable bits of a Crazyhouse position.
interface Droppable {
  pockets?: { white: Record<Role, number>; black: Record<Role, number> };
  dropDests?: () => Iterable<number>;
}

function wrap(pos: Position): GameEngine {
  const engine: GameEngine = {
    fen: () => makeFen(pos.toSetup()),
    turn: (): EngineColor => pos.turn,
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
        const role = roleFromPromotionChar(promotion);
        if (!role) return null;
        move = { from: fromSq, to: toSq, promotion: role };
        if (!pos.isLegal(move)) return null;
      }
      return makeSanAndPlay(pos, move); // mutates pos in place, returns SAN
    },
  };

  // Crazyhouse: expose pocket contents, per-role legal drop squares, and a drop
  // player. Only attached when the position actually has pockets.
  const drop = pos as unknown as Droppable;
  if (drop.pockets) {
    engine.pockets = () => ({
      white: materialToCounts(drop.pockets!.white),
      black: materialToCounts(drop.pockets!.black),
    });
    engine.dropDests = () => {
      const result = new Map<string, string[]>();
      const general = drop.dropDests ? [...drop.dropDests()] : [];
      const side = drop.pockets![pos.turn];
      for (const role of POCKET_ROLES) {
        if ((side[role] ?? 0) <= 0) continue;
        const squares: string[] = [];
        for (const sq of general) {
          if (pos.isLegal({ role, to: sq } as DropMove)) squares.push(makeSquare(sq));
        }
        result.set(role, squares);
      }
      return result;
    };
    engine.playDrop = (role, to) => {
      const toSq = parseSquare(to);
      if (toSq === undefined) return null;
      const move: DropMove = { role: role as Role, to: toSq };
      if (!pos.isLegal(move)) return null;
      return makeSanAndPlay(pos, move);
    };
  }

  return engine;
}

function materialToCounts(side: Record<Role, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const role of POCKET_ROLES) out[role] = side[role] ?? 0;
  return out;
}

function roleFromPromotionChar(ch: string): Role | undefined {
  switch (ch) {
    case "q":
      return "queen";
    case "r":
      return "rook";
    case "b":
      return "bishop";
    case "n":
      return "knight";
    default:
      return undefined;
  }
}

/**
 * Build an EngineFactory for a chessops variant. Omit `initialFen` to start from
 * the variant's canonical position (via the variant class default()); pass one to
 * start from a specific FEN.
 */
export function createChessopsFactory(rules: Rules, initialFen?: string): EngineFactory {
  return {
    initial: () => wrap(createPosition(rules, initialFen)),
    replay: (sans) => {
      const pos = createPosition(rules, initialFen);
      for (const san of sans) {
        const move = parseSan(pos, san);
        if (!move) break;
        pos.play(move);
      }
      return wrap(pos);
    },
  };
}
