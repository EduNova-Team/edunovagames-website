import { useState, useCallback, useEffect } from "react";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import type { GameEngine, EngineFactory } from "@/lib/engine/types";
import { chessJsFactory } from "@/lib/engine/chessJsEngine";

// ─── Config (change here to propagate everywhere) ───────────────────────────
export const HALF_MOVES_PER_GUESS = 10;
export const MAX_GUESSES = 6;

// ─── Types ───────────────────────────────────────────────────────────────────
export type TileColor = "green" | "yellow" | "gray" | "empty" | "pending";

export interface TileFeedback {
  move: string;
  color: TileColor;
}

export interface GuessRow {
  tiles: TileFeedback[];
  submitted: boolean;
}

export interface Opening {
  eco: string;
  name: string;
  moves: string[]; // variable length (≤ target depth); current dataset is 10 half-moves
  pgn: string;
}

export type GamePhase = "playing" | "won" | "lost";

/**
 * A self-contained game dataset: the opening list plus a difficulty label per
 * index. Chessle and each Variantle variant pass their own. The hook operates on
 * whatever dataset it's given instead of importing one specific JSON file.
 */
export interface GameDataset {
  openings: Opening[];
  difficulties: Record<string, Difficulty>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Difficulty index pools are derived once per dataset and memoized by the
// dataset's object identity, so repeated picks are O(1) and switching datasets
// (e.g. variant change) rebuilds lazily.
const poolsCache = new WeakMap<GameDataset, Record<Difficulty, number[]>>();

function getPools(dataset: GameDataset): Record<Difficulty, number[]> {
  let pools = poolsCache.get(dataset);
  if (!pools) {
    pools = { easy: [], medium: [], hard: [] };
    for (const [idx, diff] of Object.entries(dataset.difficulties)) {
      pools[diff].push(parseInt(idx));
    }
    poolsCache.set(dataset, pools);
  }
  return pools;
}

/**
 * Pick a random opening index for the given difficulty, restricted to openings
 * that are at least `depth` half-moves long. Excluding shorter lines guarantees
 * lineLength === targetDepth for every game (an opening shorter than the
 * selected depth would otherwise shrink the line below what the player chose).
 */
function pickRandomIndex(dataset: GameDataset, difficulty?: Difficulty, depth = 0): number {
  const { openings } = dataset;
  const basePool = difficulty ? getPools(dataset)[difficulty] : openings.map((_, i) => i);
  const pool =
    depth > 0 ? basePool.filter((i) => openings[i].moves.length >= depth) : basePool;
  // Fallback to the unfiltered pool if nothing is long enough. This keeps
  // pickRandomIndex total even for a sparse depth/difficulty combo.
  const chosen = pool.length > 0 ? pool : basePool;
  return chosen[Math.floor(Math.random() * chosen.length)];
}

function getOpeningByIndex(dataset: GameDataset, index: number): Opening | null {
  const { openings } = dataset;
  if (openings.length === 0) return null;
  // Clamp gracefully so an out-of-range ID never crashes
  const safe = ((index % openings.length) + openings.length) % openings.length;
  return openings[safe];
}

/**
 * Evaluate a submitted guess against the target opening.
 * Green first (locked), then yellow — prevents double-counting.
 */
function evaluateGuess(guess: string[], target: string[]): TileColor[] {
  const colors: TileColor[] = new Array(guess.length).fill("gray");
  const targetUsed = new Array(target.length).fill(false);

  // Pass 1: greens
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      colors[i] = "green";
      targetUsed[i] = true;
    }
  }

  // Pass 2: yellows
  for (let i = 0; i < guess.length; i++) {
    if (colors[i] === "green") continue;
    for (let j = 0; j < target.length; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) {
        colors[i] = "yellow";
        targetUsed[j] = true;
        break;
      }
    }
  }

  return colors;
}

function buildEmptyRow(len: number): GuessRow {
  return {
    tiles: Array.from({ length: len }, () => ({
      move: "",
      color: "empty" as TileColor,
    })),
    submitted: false,
  };
}

function buildEmptyGrid(len: number): GuessRow[] {
  return Array.from({ length: MAX_GUESSES }, () => buildEmptyRow(len));
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useChessle(
  dataset: GameDataset,
  initialIndex?: number,
  difficulty?: Difficulty,
  targetDepth: number = HALF_MOVES_PER_GUESS,
  engineFactory: EngineFactory = chessJsFactory
) {
  // The active dataset is held in state so it can be swapped at runtime (e.g.
  // Variantle switching King of the Hill ↔ Three Check). playAgain threads a new
  // dataset in explicitly to avoid the stale-closure trap; the prop seeds it.
  const [activeDataset, setActiveDataset] = useState<GameDataset>(dataset);

  // ── Fix: initialize opening as null and set in useEffect so that random
  //    selection only ever happens on the client. This prevents the SSR/client
  //    hydration mismatch (server picks ECO "C39", client picks "E08", crash).
  const [opening, setOpening] = useState<Opening | null>(null);
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  const [engine, setEngine] = useState<GameEngine>(() => engineFactory.initial());
  const [grid, setGrid] = useState<GuessRow[]>([]);
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");

  // ── Fix: track the SAN moves entered in the current guess row so we can
  //    replay them on undo without relying on chess.undo() (which mutates in
  //    place and doesn't change the object reference, so ChessBoard's effect
  //    never fires and the board stays stale).
  const [currentMoves, setCurrentMoves] = useState<string[]>([]);

  // Derived: how many half-moves the current opening requires (0 while loading)
  const lineLength = opening ? Math.min(opening.moves.length, targetDepth) : 0;

  // Only used when a specific opening is loaded by index (Share/Load feature).
  // Difficulty-based selection is handled by playAgain() called from the page.
  useEffect(() => {
    if (initialIndex === undefined) return;
    const op = getOpeningByIndex(activeDataset, initialIndex);
    if (!op) return;
    setOpening(op);
    setOpeningIndex(initialIndex);
    setEngine(engineFactory.initial());
    setGrid(buildEmptyGrid(op.moves.length));
    setCurrentMoves([]);
    setCurrentGuessIndex(0);
    setCurrentMoveIndex(0);
    setPhase("playing");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  /** Called by ChessBoard when a legal move is made */
  const onMove = useCallback(
    (san: string) => {
      if (phase !== "playing") return;
      if (currentMoveIndex >= lineLength) return;

      setCurrentMoves((prev) => [...prev, san]);
      setGrid((prev) => {
        const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
        next[currentGuessIndex].tiles[currentMoveIndex] = {
          move: san,
          color: "pending",
        };
        return next;
      });
      setCurrentMoveIndex((i) => i + 1);
    },
    [phase, currentGuessIndex, currentMoveIndex, lineLength]
  );

  /** Called when the player clicks Submit */
  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    if (currentMoveIndex < lineLength) return;
    if (!opening) return;

    const currentRow = grid[currentGuessIndex];
    const guessedMoves = currentRow.tiles.slice(0, lineLength).map((t) => t.move);
    const colors = evaluateGuess(guessedMoves, opening.moves.slice(0, lineLength));

    const updatedTiles: TileFeedback[] = guessedMoves.map((move, i) => ({
      move,
      color: colors[i],
    }));

    const isWin = colors.every((c) => c === "green");
    const isLastGuess = currentGuessIndex === MAX_GUESSES - 1;

    setGrid((prev) => {
      const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
      next[currentGuessIndex] = { tiles: updatedTiles, submitted: true };
      return next;
    });

    if (isWin) {
      setPhase("won");
    } else if (isLastGuess) {
      setPhase("lost");
    } else {
      setCurrentGuessIndex((i) => i + 1);
      setCurrentMoveIndex(0);
      setCurrentMoves([]);
      // Fresh engine for the next guess row
      setEngine(engineFactory.initial());
    }
  }, [phase, currentMoveIndex, currentGuessIndex, grid, opening, lineLength, targetDepth, engineFactory]);

  /**
   * Undo the last move in the current (unsubmitted) guess.
   *
   * Fix: instead of calling chess.undo() which mutates in place (same
   * reference → ChessBoard effect never fires), we rebuild a brand-new Chess
   * instance by replaying all moves except the last one. The new reference
   * triggers ChessBoard's useEffect and the board visually steps back.
   */
  const undoMove = useCallback(() => {
    if (phase !== "playing") return;
    if (currentMoveIndex === 0) return;

    const newMoves = currentMoves.slice(0, -1);

    setEngine(engineFactory.replay(newMoves));
    setCurrentMoves(newMoves);
    setGrid((prev) => {
      const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
      next[currentGuessIndex].tiles[currentMoveIndex - 1] = {
        move: "",
        color: "empty",
      };
      return next;
    });
    setCurrentMoveIndex((i) => i - 1);
  }, [phase, currentMoveIndex, currentGuessIndex, currentMoves, engineFactory]);

  /**
   * Auto-play the next consecutive run of green tiles from the previous
   * submitted row, starting at currentMoveIndex. Stops at the first
   * non-green tile so the player can manually bridge the gap, then call
   * again to continue with the next green run.
   */
  const fillGreen = useCallback(() => {
    if (phase !== "playing") return;
    if (currentGuessIndex === 0) return;

    const prevRow = grid[currentGuessIndex - 1];
    if (!prevRow?.submitted) return;

    // Collect the consecutive green run from currentMoveIndex
    const greenMoves: string[] = [];
    for (let i = currentMoveIndex; i < lineLength; i++) {
      if (prevRow.tiles[i].color === "green") {
        greenMoves.push(prevRow.tiles[i].move);
      } else {
        break;
      }
    }

    if (greenMoves.length === 0) return;

    const newMoves = [...currentMoves, ...greenMoves];

    setEngine(engineFactory.replay(newMoves));
    setCurrentMoves(newMoves);
    setGrid((prev) => {
      const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
      greenMoves.forEach((move, i) => {
        next[currentGuessIndex].tiles[currentMoveIndex + i] = {
          move,
          color: "pending",
        };
      });
      return next;
    });
    setCurrentMoveIndex((idx) => idx + greenMoves.length);
  }, [phase, currentGuessIndex, currentMoveIndex, currentMoves, grid, lineLength, engineFactory]);

  /**
   * Secret solver: instantly fills the current row with the correct moves
   * and marks the game as won. Triggered by the "Jimmy**" cheat code.
   */
  const cheatSolve = useCallback(() => {
    if (phase !== "playing") return;
    if (!opening) return;

    const targetMoves = opening.moves.slice(0, lineLength);
    const colors = evaluateGuess(targetMoves, targetMoves); // all green
    const solvedTiles: TileFeedback[] = targetMoves.map((move, i) => ({
      move,
      color: colors[i],
    }));

    setEngine(engineFactory.replay(targetMoves));
    setCurrentMoves(targetMoves);
    setCurrentMoveIndex(lineLength);
    setGrid((prev) => {
      const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
      next[currentGuessIndex] = { tiles: solvedTiles, submitted: true };
      return next;
    });
    setPhase("won");
  }, [phase, opening, currentGuessIndex, lineLength, targetDepth, engineFactory]);

  /**
   * Reset everything for a new game.
   * - Pass `index` to load a specific opening (Load-by-code feature).
   * - Pass `newDifficulty` to pick randomly from that pool.
   * - Pass `newDataset` to switch datasets (Variantle variant change).
   * - Omit all to re-use the current difficulty/depth/dataset.
   */
  const playAgain = useCallback(
    (index?: number, newDifficulty?: Difficulty, newDepth?: number, newDataset?: GameDataset) => {
      const activeDifficulty = newDifficulty ?? difficulty;
      // Use the explicitly-passed depth/dataset (handleStart passes the freshly
      // selected values before their setState has flushed) and fall back to the
      // current ones for callers that don't change them (e.g. Load-by-code).
      const activeDepth = newDepth ?? targetDepth;
      const ds = newDataset ?? activeDataset;
      const idx = index !== undefined ? index : pickRandomIndex(ds, activeDifficulty, activeDepth);
      const op = getOpeningByIndex(ds, idx);
      if (!op) return;
      if (newDataset) setActiveDataset(newDataset);
      setOpening(op);
      setOpeningIndex(idx);
      setEngine(engineFactory.initial());
      setGrid(buildEmptyGrid(op.moves.length));
      setCurrentMoves([]);
      setCurrentGuessIndex(0);
      setCurrentMoveIndex(0);
      setPhase("playing");
    },
    [difficulty, targetDepth, activeDataset, engineFactory]
  );

  const prevRow = currentGuessIndex > 0 ? grid[currentGuessIndex - 1] : null;
  const canFillGreen =
    phase === "playing" &&
    lineLength > 0 &&
    currentMoveIndex < lineLength &&
    prevRow?.submitted === true &&
    prevRow.tiles[currentMoveIndex]?.color === "green";

  return {
    opening,          // null until client mounts
    openingIndex,     // null until client mounts
    engine,
    grid,
    currentGuessIndex,
    currentMoveIndex,
    phase,
    lineLength,
    onMove,
    submitGuess,
    undoMove,
    fillGreen,
    cheatSolve,
    playAgain,
    canSubmit: lineLength > 0 && currentMoveIndex === lineLength && phase === "playing",
    canUndo: currentMoveIndex > 0 && phase === "playing",
    canFillGreen,
  };
}
