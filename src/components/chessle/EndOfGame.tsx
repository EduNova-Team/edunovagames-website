"use client";

import type { Opening, GamePhase } from "@/hooks/useChessle";

interface EndOfGameProps {
  phase: GamePhase;
  opening: Opening;
  openingIndex: number;
  lineLength: number;
  onPlayAgain: () => void;
  onDismiss: () => void;
  // When set, the "Study on Lichess" link opens the variant analysis board.
  variant?:
    | "kingOfTheHill"
    | "threeCheck"
    | "horde"
    | "atomic"
    | "racingKings"
    | "antichess"
    | "crazyhouse";
}

function buildPgn(moves: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) parts.push(`${Math.floor(i / 2) + 1}. ${moves[i]}`);
    else parts.push(moves[i]);
  }
  return parts.join(" ");
}

export default function EndOfGame({ phase, opening, openingIndex: _openingIndex, lineLength, onPlayAgain, onDismiss, variant }: EndOfGameProps) {
  if (phase === "playing") return null;

  const won = phase === "won";

  // Truncate to the moves actually played (lineLength may be < opening.moves.length)
  const displayMoves = opening.moves.slice(0, lineLength);
  const pgn = displayMoves.length === opening.moves.length ? opening.pgn : buildPgn(displayMoves);
  const analysisBase = variant
    ? `https://lichess.org/analysis/${variant}/pgn/`
    : `https://lichess.org/analysis/pgn/`;
  const lichessUrl = `${analysisBase}${encodeURIComponent(pgn)}#explorer`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A16] shadow-2xl overflow-hidden">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Gradient accent bar */}
        <div
          className={`h-1 w-full ${
            won
              ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
              : "bg-gradient-to-r from-red-500 to-orange-400"
          }`}
        />

        <div className="p-8 flex flex-col items-center gap-6 text-center">
          {/* Result emoji + heading */}
          <div>
            <p className="text-5xl mb-3">{won ? "♟️" : "😔"}</p>
            <h2 className="text-2xl font-bold text-white font-space">
              {won ? "Solved!" : "Better luck next time"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {won
                ? "You matched the opening exactly."
                : "You've used all your guesses."}
            </p>
          </div>

          {/* Opening info */}
          <div className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-left">
            <p className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-1">
              {variant ? "—" : opening.eco || "—"}
            </p>
            <p className="text-white font-semibold text-base leading-snug">
              {/* Variants have no meaningful opening names (and Crazyhouse's
                  standard-chess name is misleading once captures/drops diverge),
                  so show the played move list for every variant. */}
              {variant ? pgn || "Unnamed line" : opening.name || opening.pgn || "Unnamed line"}
            </p>

            {/* Move sequence */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {displayMoves.map((move, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/10 text-gray-200 font-mono"
                >
                  {i % 2 === 0 && (
                    <span className="text-white/30">{Math.floor(i / 2) + 1}.</span>
                  )}
                  {move}
                </span>
              ))}
            </div>
          </div>

          {/* Lichess link */}
          <a
            href={lichessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 6v2H5v11h11v-5h2v7H3V6z" />
              <path d="M21 3l-6 6-1.5-1.5L19 3H15V1h8v8h-2z" />
            </svg>
            Study this opening on Lichess
          </a>

          {/* Play Again */}
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 transition-opacity active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
