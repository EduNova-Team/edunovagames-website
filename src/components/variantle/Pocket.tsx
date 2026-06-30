"use client";

import React from "react";

interface PocketProps {
  pieces: Record<string, number>; // role name -> count, e.g. { pawn: 2, queen: 1 }
  color: "white" | "black";
  onDragStart: (
    role: string,
    color: "white" | "black",
    e: React.MouseEvent | React.TouchEvent
  ) => void;
}

// Droppable roles, rendered left-to-right in this order.
const ROLE_ORDER = ["queen", "rook", "bishop", "knight", "pawn"] as const;

const CELL = 42; // px

export default function Pocket({ pieces, color, onDragStart }: PocketProps) {
  const handleStart =
    (role: string) => (e: React.MouseEvent | React.TouchEvent) => {
      // Stop the browser's native drag / text-selection / scroll from interfering.
      e.preventDefault();
      onDragStart(role, color, e);
    };

  return (
    <div
      style={{ width: "min(480px, 90vw)" }}
      className="mx-auto flex items-center gap-2 rounded-lg border border-white/10 bg-[#0A0A16] px-2 py-1"
    >
      <div className="flex flex-1 items-center gap-2" style={{ minHeight: CELL + 6 }}>
        {ROLE_ORDER.filter((role) => (pieces[role] ?? 0) > 0).map((role) => {
          const count = pieces[role] ?? 0;
          return (
            // `.cg-wrap` ancestor is required for the cburnett sprite selector
            // (`.cg-wrap piece.<role>.<color>`) to apply. A light tile background
            // keeps BOTH white and black pieces clearly visible on the dark UI
            // (cburnett black pieces would vanish on #0A0A16 otherwise).
            <div
              key={role}
              onMouseDown={handleStart(role)}
              onTouchStart={handleStart(role)}
              title={`${color} ${role} ×${count}`}
              className="cg-wrap cursor-grab select-none active:cursor-grabbing"
              style={{
                position: "relative",
                width: CELL,
                height: CELL,
                borderRadius: 6,
                background: "#dfe3ea",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
              }}
            >
              {/* Override chessground's 12.5% board-square sizing so the sprite
                  fills the pocket cell. */}
              {React.createElement("piece", {
                className: `${color} ${role}`,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                },
              })}
              {count > 1 && (
                <span
                  className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-black px-1 text-[10px] font-bold leading-tight text-white ring-1 ring-white/30"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
