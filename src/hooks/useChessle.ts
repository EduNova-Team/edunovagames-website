import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import openingsData from "@/data/chessle-openings.json";
import difficultiesData from "@/data/chessle-difficulties.json";
import type { Difficulty } from "@/components/chessle/DifficultySelect";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const openings = openingsData as Opening[];
const difficultyMap = difficultiesData.difficulties as Record<string, Difficulty>;

// Pre-build index pools per difficulty so filtering is O(1) at pick time
const difficultyPools: Record<Difficulty, number[]> = { easy: [], medium: [], hard: [] };
for (const [idx, diff] of Object.entries(difficultyMap)) {
  difficultyPools[diff].push(parseInt(idx));
}

function pickRandomIndex(difficulty?: Difficulty): number {
  if (difficulty) {
    const pool = difficultyPools[difficulty];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return Math.floor(Math.random() * openings.length);
}

function getOpeningByIndex(index: number): Opening {
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

/** Rebuild a Chess instance by replaying a sequence of SAN moves from scratch. */
function replayMoves(sans: string[]): Chess {
  const c = new Chess();
  for (const san of sans) {
    c.move(san);
  }
  return c;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useChessle(initialIndex?: number, difficulty?: Difficulty, targetDepth: number = HALF_MOVES_PER_GUESS) {
  // ── Fix: initialize opening as null and set in useEffect so that random
  //    selection only ever happens on the client. This prevents the SSR/client
  //    hydration mismatch (server picks ECO "C39", client picks "E08", crash).
  const [opening, setOpening] = useState<Opening | null>(null);
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  const [chess, setChess] = useState<Chess>(() => new Chess());
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
    const op = getOpeningByIndex(initialIndex);
    setOpening(op);
    setOpeningIndex(initialIndex);
    setChess(new Chess());
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
      // New Chess instance for the next guess row
      setChess(new Chess());
    }
  }, [phase, currentMoveIndex, currentGuessIndex, grid, opening, lineLength, targetDepth]);

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
    const newChess = replayMoves(newMoves);

    setChess(newChess);
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
  }, [phase, currentMoveIndex, currentGuessIndex, currentMoves]);

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
    const newChess = replayMoves(newMoves);

    setChess(newChess);
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
  }, [phase, currentGuessIndex, currentMoveIndex, currentMoves, grid, lineLength]);

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

    setChess(replayMoves(targetMoves));
    setCurrentMoves(targetMoves);
    setCurrentMoveIndex(lineLength);
    setGrid((prev) => {
      const next = prev.map((row) => ({ ...row, tiles: [...row.tiles] }));
      next[currentGuessIndex] = { tiles: solvedTiles, submitted: true };
      return next;
    });
    setPhase("won");
  }, [phase, opening, currentGuessIndex, lineLength, targetDepth]);

  /**
   * Reset everything for a new game.
   * - Pass `index` to load a specific opening (Load-by-code feature).
   * - Pass `newDifficulty` to pick randomly from that pool.
   * - Omit both to re-use the current difficulty.
   */
  const playAgain = useCallback((index?: number, newDifficulty?: Difficulty) => {
    const activeDifficulty = newDifficulty ?? difficulty;
    const idx = index !== undefined ? index : pickRandomIndex(activeDifficulty);
    const op = getOpeningByIndex(idx);
    setOpening(op);
    setOpeningIndex(idx);
    setChess(new Chess());
    setGrid(buildEmptyGrid(op.moves.length));
    setCurrentMoves([]);
    setCurrentGuessIndex(0);
    setCurrentMoveIndex(0);
    setPhase("playing");
  }, [difficulty]);

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
    chess,
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
