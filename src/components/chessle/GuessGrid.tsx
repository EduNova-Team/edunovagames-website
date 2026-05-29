"use client";

import { MAX_GUESSES } from "@/hooks/useChessle";
import type { GuessRow, TileColor } from "@/hooks/useChessle";

interface GuessGridProps {
  grid: GuessRow[];
  currentGuessIndex: number;
  lineLength: number;
}

function tileStyle(color: TileColor, isActiveRow: boolean): string {
  const base =
    "flex items-center justify-center rounded text-xs font-mono font-bold border transition-all duration-300 select-none";

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
      return `${base} bg-white/5 border-white/10 text-white/20 ${
        isActiveRow ? "border-white/20" : ""
      }`;
  }
}

interface TileProps {
  move: string;
  color: TileColor;
  isActiveRow: boolean;
}

function Tile({ move, color, isActiveRow }: TileProps) {
  return (
    <div
      className={tileStyle(color, isActiveRow)}
      style={{ width: "48px", height: "48px" }}
    >
      {move || ""}
    </div>
  );
}

export default function GuessGrid({ grid, currentGuessIndex, lineLength }: GuessGridProps) {
  // When lineLength is 0 (opening not yet loaded), render nothing
  const FULL_MOVES = Math.ceil(lineLength / 2);

  return (
    <div className="flex flex-col gap-2 w-full items-center">
      {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
        const row = grid[rowIdx];
        const isActiveRow = rowIdx === currentGuessIndex && !row?.submitted;

        // Only render rows that have been submitted or are the current active row
        if (rowIdx > currentGuessIndex) return null;

        return (
          <div key={rowIdx} className="flex items-center gap-3">
            {Array.from({ length: FULL_MOVES }, (_, fullMoveIdx) => {
              const whiteIdx = fullMoveIdx * 2;
              const blackIdx = fullMoveIdx * 2 + 1;
              const whiteTile = row?.tiles[whiteIdx] ?? { move: "", color: "empty" as TileColor };
              const blackTile = row?.tiles[blackIdx] ?? { move: "", color: "empty" as TileColor };
              // When lineLength is odd, the last full-move group has no black tile
              const hasBlackTile = blackIdx < lineLength;

              return (
                <div key={fullMoveIdx} className="flex items-center gap-1">
                  {/* Move number label */}
                  <span className="text-xs text-white/30 font-mono w-4 text-right shrink-0">
                    {fullMoveIdx + 1}.
                  </span>

                  {/* White tile */}
                  <Tile
                    move={whiteTile.move}
                    color={whiteTile.color}
                    isActiveRow={isActiveRow}
                  />

                  {/* Black tile — omitted when lineLength is odd and this is the last pair */}
                  {hasBlackTile && (
                    <Tile
                      move={blackTile.move}
                      color={blackTile.color}
                      isActiveRow={isActiveRow}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
