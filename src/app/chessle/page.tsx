"use client";

import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuessGrid from "@/components/chessle/GuessGrid";
import EndOfGame from "@/components/chessle/EndOfGame";
import { useChessle, HALF_MOVES_PER_GUESS } from "@/hooks/useChessle";

// Chessground relies on browser APIs — load it client-side only
const ChessBoard = dynamic(() => import("@/components/chessle/ChessBoard"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded bg-white/5 border border-white/10 animate-pulse"
      style={{ width: "min(480px, 90vw)", height: "min(480px, 90vw)" }}
    />
  ),
});

export default function ChesslePage() {
  const {
    opening,
    chess,
    grid,
    currentGuessIndex,
    currentMoveIndex,
    phase,
    onMove,
    submitGuess,
    undoMove,
    playAgain,
    canSubmit,
    canUndo,
  } = useChessle();

  const movesRemaining = HALF_MOVES_PER_GUESS - currentMoveIndex;

  return (
    <div className="min-h-screen bg-[#0A0A16] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pt-8 pb-16 px-4 gap-6">
        {/* Page heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-space bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">
            Chessle
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Guess the chess opening in {6} tries
          </p>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          <span>
            Guess{" "}
            <span className="text-white font-semibold">{currentGuessIndex + 1}</span>{" "}
            / 6
          </span>
          <span className="text-white/20">|</span>
          <span>
            {phase === "playing"
              ? currentMoveIndex === HALF_MOVES_PER_GUESS
                ? "Row full — press Submit"
                : `${movesRemaining} move${movesRemaining !== 1 ? "s" : ""} remaining`
              : phase === "won"
              ? "🎉 Solved!"
              : "Game over"}
          </span>
        </div>

        {/* Chessboard */}
        <ChessBoard
          chess={chess}
          onMove={onMove}
          disabled={phase !== "playing" || currentMoveIndex >= HALF_MOVES_PER_GUESS}
        />

        {/* Controls */}
        <div className="flex gap-3 w-full justify-center" style={{ maxWidth: "min(480px, 90vw)" }}>
          <button
            onClick={undoMove}
            disabled={!canUndo}
            className="flex-1 py-2.5 px-4 rounded-lg border border-white/10 text-sm font-semibold text-gray-300
              hover:bg-white/5 hover:text-white transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↩ Undo
          </button>
          <button
            onClick={submitGuess}
            disabled={!canSubmit}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white
              bg-gradient-to-r from-[#6366F1] to-[#22D3EE]
              hover:opacity-90 transition-opacity active:scale-95
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Submit →
          </button>
        </div>

        {/* Guess grid */}
        <GuessGrid grid={grid} currentGuessIndex={currentGuessIndex} />

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-600" />
            <span>Correct position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span>Wrong position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-600" />
            <span>Not in opening</span>
          </div>
        </div>

        {/* ECO hint (subtle) */}
        {phase !== "playing" ? null : (
          <p className="text-white/10 text-xs font-mono">
            ECO {opening.eco}
          </p>
        )}
      </main>

      <Footer />

      {/* End of game overlay */}
      <EndOfGame phase={phase} opening={opening} onPlayAgain={playAgain} />
    </div>
  );
}
