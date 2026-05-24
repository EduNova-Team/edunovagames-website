"use client";

import { HALF_MOVES_PER_GUESS, MAX_GUESSES } from "@/hooks/useChessle";
import type { GuessRow, TileColor } from "@/hooks/useChessle";

interface GuessGridProps {
  grid: GuessRow[];
  currentGuessIndex: number;
}

function tileStyle(color: TileColor): string {
  const base =
    "flex items-center justify-center rounded text-sm font-mono font-bold border transition-all duration-300 select-none";

  switch (color) {
    case "green":
      return `${base} bg-emerald-600 border-emerald-500 text-white`;
    case "yellow":
      return `${base} bg-amber-500 border-amber-400 text-white`;
    case "gray":
      return `${base} bg-zinc-600 border-zinc-500 text-white`;
    case "pending":
      return `${base} bg-indigo-900/60 border-indigo-500/70 text-indigo-200`;
    case "empty":
    default:
      return `${base} bg-white/5 border-white/10 text-transparent`;
  }
}

function Tile({ move, color, isActive }: { move: string; color: TileColor; isActive: boolean }) {
  return (
    <div
      className={`
        ${tileStyle(color)}
        ${isActive && color === "empty" ? "border-indigo-400/50 bg-white/8" : ""}
      `}
      style={{ width: "52px", height: "52px", fontSize: "0.7rem" }}
    >
      {move || ""}
    </div>
  );
}

export default function GuessGrid({ grid, currentGuessIndex }: GuessGridProps) {
  return (
    <div className="flex flex-col gap-2 w-full" style={{ maxWidth: "min(480px, 90vw)" }}>
      {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
        const row = grid[rowIdx];
        const isCurrentRow = rowIdx === currentGuessIndex && !row.submitted;

        return (
          <div key={rowIdx} className="flex gap-1.5 justify-center">
            {/* Row label: guess number */}
            <div className="flex items-center w-5 shrink-0">
              <span className="text-xs text-white/20 font-mono">{rowIdx + 1}</span>
            </div>

            {Array.from({ length: HALF_MOVES_PER_GUESS }, (_, colIdx) => {
              const tile = row?.tiles[colIdx] ?? { move: "", color: "empty" as TileColor };
              return (
                <Tile
                  key={colIdx}
                  move={tile.move}
                  color={tile.color}
                  isActive={isCurrentRow}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
