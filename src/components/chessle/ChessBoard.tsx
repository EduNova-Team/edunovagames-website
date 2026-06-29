"use client";

import { useEffect, useRef, useCallback } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { GameEngine } from "@/lib/engine/types";

// Chessground type aliases (avoids subpath import issues with bundler moduleResolution)
type Key = string; // e.g. "e2", "e4"
type Api = any;
type Piece = { role: string; color: "white" | "black" };

interface ChessBoardProps {
  engine: GameEngine;
  onMove: (san: string) => void;
  disabled?: boolean;
  // Exposes the chessground API once ready (null on unmount) so a parent (e.g. a
  // Crazyhouse Pocket) can call api.dragNewPiece to start a drop.
  onApiReady?: (api: Api | null) => void;
}

export default function ChessBoard({ engine, onMove, disabled = false, onApiReady }: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  // Keep stable refs so chessground callbacks don't stale-close
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onApiReadyRef = useRef(onApiReady);
  onApiReadyRef.current = onApiReady;

  const handleMove = useCallback(
    (orig: Key, dest: Key) => {
      // Attempt move in the engine
      const san = engine.play(orig, dest, "q");
      if (!san) {
        // Illegal — reset board visuals
        cgRef.current?.set({ fen: engine.fen() });
        return;
      }
      // Update chessground with new state
      cgRef.current?.set({
        fen: engine.fen(),
        turnColor: engine.turn(),
        movable: {
          color: disabled ? undefined : engine.turn(),
          dests: disabled ? new Map() : engine.dests(),
        },
        lastMove: [orig, dest],
      });
      onMoveRef.current(san);
    },
    [engine, disabled]
  );

  // Crazyhouse: a pocket piece was dropped on the board.
  const handleDrop = useCallback(
    (piece: Piece, key: Key) => {
      const san = engine.playDrop?.(piece.role, key);
      if (!san) {
        // Illegal (or non-droppable variant) — re-sync to drop the ghost piece
        cgRef.current?.set({ fen: engine.fen() });
        return;
      }
      cgRef.current?.set({
        fen: engine.fen(),
        turnColor: engine.turn(),
        movable: {
          color: disabled ? undefined : engine.turn(),
          dests: disabled ? new Map() : engine.dests(),
        },
        lastMove: [key],
      });
      onMoveRef.current(san);
    },
    [engine, disabled]
  );

  // Initialize chessground on mount
  useEffect(() => {
    if (!boardRef.current) return;

    cgRef.current = Chessground(boardRef.current, {
      fen: engine.fen(),
      orientation: "white",
      turnColor: engine.turn(),
      movable: {
        free: false,
        color: disabled ? undefined : engine.turn(),
        dests: disabled ? new Map() : engine.dests(),
        events: {
          after: handleMove,
        },
      },
      events: {
        dropNewPiece: handleDrop,
      },
      animation: { enabled: true, duration: 150 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      draggable: { enabled: true },
    });

    onApiReadyRef.current?.(cgRef.current);

    return () => {
      onApiReadyRef.current?.(null);
      cgRef.current?.destroy();
      cgRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync chessground when the engine instance changes (play again resets)
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      fen: engine.fen(),
      turnColor: engine.turn(),
      movable: {
        color: disabled ? undefined : engine.turn(),
        dests: disabled ? new Map() : engine.dests(),
      },
      lastMove: [],
    });
  }, [engine, disabled]);

  // Update handler refs in chessground when they change
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      movable: { events: { after: handleMove } },
      events: { dropNewPiece: handleDrop },
    });
  }, [handleMove, handleDrop]);

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
