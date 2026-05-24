"use client";

import { useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessground } from "@lichess-org/chessground";

// Chessground type aliases (avoids subpath import issues with bundler moduleResolution)
type Key = string; // e.g. "e2", "e4"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;

interface ChessBoardProps {
  chess: Chess;
  onMove: (san: string) => void;
  disabled?: boolean;
}

/** Convert chess.js dests map to chessground format */
function toDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  const moves = chess.moves({ verbose: true });
  for (const move of moves) {
    const from = move.from as Key;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from)!.push(move.to as Key);
  }
  return dests;
}

/** Convert chess.js color to chessground color */
function toColor(chess: Chess): "white" | "black" {
  return chess.turn() === "w" ? "white" : "black";
}

export default function ChessBoard({ chess, onMove, disabled = false }: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  // Keep a stable ref to onMove so the chessground callback doesn't stale-close
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const handleMove = useCallback(
    (orig: Key, dest: Key) => {
      // Attempt move in chess.js
      const result = chess.move({ from: orig, to: dest, promotion: "q" });
      if (!result) {
        // Illegal — reset board visuals
        cgRef.current?.set({ fen: chess.fen() });
        return;
      }
      // Update chessground with new state
      cgRef.current?.set({
        fen: chess.fen(),
        turnColor: toColor(chess),
        movable: {
          color: disabled ? undefined : toColor(chess),
          dests: disabled ? new Map() : toDests(chess),
        },
        lastMove: [orig, dest],
      });
      onMoveRef.current(result.san);
    },
    [chess, disabled]
  );

  // Initialize chessground on mount
  useEffect(() => {
    if (!boardRef.current) return;

    cgRef.current = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation: "white",
      turnColor: toColor(chess),
      movable: {
        free: false,
        color: disabled ? undefined : toColor(chess),
        dests: disabled ? new Map() : toDests(chess),
        events: {
          after: handleMove,
        },
      },
      animation: { enabled: true, duration: 150 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      draggable: { enabled: true },
    });

    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync chessground when chess instance changes (play again resets)
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      fen: chess.fen(),
      turnColor: toColor(chess),
      movable: {
        color: disabled ? undefined : toColor(chess),
        dests: disabled ? new Map() : toDests(chess),
      },
      lastMove: [],
    });
  }, [chess, disabled]);

  // Update move handler ref in chessground when it changes
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      movable: {
        events: { after: handleMove },
      },
    });
  }, [handleMove]);

  return (
    <div
      className="relative"
      style={{ width: "min(480px, 90vw)", height: "min(480px, 90vw)" }}
    >
      <div
        ref={boardRef}
        className="w-full h-full"
        style={{ borderRadius: "4px", overflow: "hidden" }}
      />
    </div>
  );
}
