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
      <div
        className="flex flex-1 items-center gap-2"
        style={{ minHeight: 44 }}
      >
        {ROLE_ORDER.filter((role) => (pieces[role] ?? 0) > 0).map((role) => {
          const count = pieces[role] ?? 0;
          return (
            <div
              key={role}
              onMouseDown={handleStart(role)}
              onTouchStart={handleStart(role)}
              title={`${role} ×${count}`}
              className="cg-wrap cursor-grab select-none active:cursor-grabbing"
              style={{ position: "relative", width: 44, height: 44 }}
            >
              {/* Reuse chessground's cburnett sprite: `.cg-wrap piece.<role>.<color>`. */}
              {React.createElement("piece", {
                className: `${color} ${role}`,
                style: {
                  position: "absolute",
                  inset: 0,
                  backgroundSize: "cover",
                },
              })}
              <span
                className="pointer-events-none absolute bottom-0 right-0 rounded bg-black/70 px-1 text-[11px] font-semibold leading-tight text-white"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                ×{count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
