import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import openingsData from "@/data/chessle-openings.json";

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
  moves: string[]; // exactly 10 half-moves
  pgn: string;
}

export type GamePhase = "playing" | "won" | "lost";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickRandomOpening(): Opening {
  const openings = openingsData as Opening[];
  return openings[Math.floor(Math.random() * openings.length)];
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

function buildEmptyRow(): GuessRow {
  return {
    tiles: Array.from({ length: HALF_MOVES_PER_GUESS }, () => ({
      move: "",
      color: "empty" as TileColor,
    })),
    submitted: false,
  };
}

function buildEmptyGrid(): GuessRow[] {
  return Array.from({ length: MAX_GUESSES }, buildEmptyRow);
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
export function useChessle() {
  // ── Fix: initialize opening as null and set in useEffect so that random
  //    selection only ever happens on the client. This prevents the SSR/client
  //    hydration mismatch (server picks ECO "C39", client picks "E08", crash).
  const [opening, setOpening] = useState<Opening | null>(null);
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [grid, setGrid] = useState<GuessRow[]>(buildEmptyGrid);
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");

  // ── Fix: track the SAN moves entered in the current guess row so we can
  //    replay them on undo without relying on chess.undo() (which mutates in
  //    place and doesn't change the object reference, so ChessBoard's effect
  //    never fires and the board stays stale).
  const [currentMoves, setCurrentMoves] = useState<string[]>([]);

  // Pick opening on client only (avoids SSR/hydration mismatch)
  useEffect(() => {
    setOpening(pickRandomOpening());
  }, []);

  /** Called by ChessBoard when a legal move is made */
  const onMove = useCallback(
    (san: string) => {
      if (phase !== "playing") return;
      if (currentMoveIndex >= HALF_MOVES_PER_GUESS) return;

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
    [phase, currentGuessIndex, currentMoveIndex]
  );

  /** Called when the player clicks Submit */
  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    if (currentMoveIndex < HALF_MOVES_PER_GUESS) return;
    if (!opening) return;

    const currentRow = grid[currentGuessIndex];
    const guessedMoves = currentRow.tiles.map((t) => t.move);
    const colors = evaluateGuess(guessedMoves, opening.moves);

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
  }, [phase, currentMoveIndex, currentGuessIndex, grid, opening]);

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

  /** Reset everything and pick a new random opening */
  const playAgain = useCallback(() => {
    setOpening(pickRandomOpening());
    setChess(new Chess());
    setGrid(buildEmptyGrid());
    setCurrentMoves([]);
    setCurrentGuessIndex(0);
    setCurrentMoveIndex(0);
    setPhase("playing");
  }, []);

  return {
    opening,          // null until client mounts
    chess,
    grid,
    currentGuessIndex,
    currentMoveIndex,
    phase,
    onMove,
    submitGuess,
    undoMove,
    playAgain,
    canSubmit: currentMoveIndex === HALF_MOVES_PER_GUESS && phase === "playing",
    canUndo: currentMoveIndex > 0 && phase === "playing",
  };
}
