"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuessGrid from "@/components/chessle/GuessGrid";
import EndOfGame from "@/components/chessle/EndOfGame";
import { useChessle, HALF_MOVES_PER_GUESS, MAX_GUESSES } from "@/hooks/useChessle";
import { encodeOpeningIndex, decodeOpeningCode } from "@/lib/chessle-ids";

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
  const [loadIndex, setLoadIndex] = useState<number | undefined>(undefined);

  const {
    opening,
    openingIndex,
    chess,
    grid,
    currentGuessIndex,
    currentMoveIndex,
    phase,
    onMove,
    submitGuess,
    undoMove,
    fillGreen,
    cheatSolve,
    playAgain,
    canSubmit,
    canUndo,
    canFillGreen,
  } = useChessle(loadIndex);

  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Share");
  const [loadOpen, setLoadOpen] = useState(false);
  const [loadInput, setLoadInput] = useState("");
  const [loadError, setLoadError] = useState("");
  const loadInputRef = useRef<HTMLInputElement>(null);

  // Reset dismissal whenever game phase resets (new game)
  useEffect(() => {
    setOverlayDismissed(false);
  }, [phase]);

  // Left arrow → undo
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canUndo) undoMove();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canUndo, undoMove]);


  function handleShare() {
    if (openingIndex === null) return;
    const code = encodeOpeningIndex(openingIndex);
    navigator.clipboard.writeText(code).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Share"), 2000);
    });
  }

  function handleLoadOpen() {
    setLoadOpen(true);
    setLoadInput("");
    setLoadError("");
    setTimeout(() => loadInputRef.current?.focus(), 0);
  }

  function handleLoadSubmit() {
    if (loadInput.trim() === "Jimmy**") {
      cheatSolve();
      setLoadOpen(false);
      setLoadInput("");
      return;
    }
    const idx = decodeOpeningCode(loadInput);
    if (idx === null) {
      setLoadError("Unrecognized code.");
      return;
    }
    setLoadIndex(idx);
    // Reload the hook by remounting via key — simplest way to reset all state
    // when loadIndex changes. We trigger playAgain with the decoded index instead.
    playAgain(idx);
    setLoadOpen(false);
    setLoadInput("");
    setLoadError("");
  }

  // opening is null during SSR and until the first useEffect fires on the client.
  if (!opening || openingIndex === null) {
    return (
      <div className="min-h-screen bg-[#0A0A16] flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-gray-500 font-mono text-sm animate-pulse">
            Loading opening…
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A16] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pt-8 pb-16 px-4 gap-6">
        {/* Page heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-space bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">
            Chessle
          </h1>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          <span>
            Guess{" "}
            <span className="text-white font-semibold">{currentGuessIndex + 1}</span>
            {" "}/ {MAX_GUESSES}
          </span>
          <span>
            {phase === "playing"
              ? currentMoveIndex === HALF_MOVES_PER_GUESS
                ? "Row full — press Submit"
                : ""
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

        {/* Primary controls */}
        <div
          className="flex flex-col gap-2 w-full"
          style={{ maxWidth: "min(540px, 95vw)" }}
        >
          <div className="flex gap-3">
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
              onClick={fillGreen}
              disabled={!canFillGreen}
              className="flex-1 py-2.5 px-4 rounded-lg border border-emerald-600/50 text-sm font-semibold text-emerald-400
                hover:bg-emerald-600/10 hover:text-emerald-300 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ✦ Fill Green
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

          {/* Share / Load row */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-2 px-4 rounded-lg border border-white/10 text-sm font-semibold text-gray-300
                hover:bg-white/5 hover:text-white transition-all"
            >
              {copyLabel}
            </button>
            <button
              onClick={handleLoadOpen}
              className="flex-1 py-2 px-4 rounded-lg border border-white/10 text-sm font-semibold text-gray-300
                hover:bg-white/5 hover:text-white transition-all"
            >
              Load
            </button>
          </div>

          {/* Inline load input */}
          {loadOpen && (
            <div className="flex gap-2 items-center">
              <input
                ref={loadInputRef}
                value={loadInput}
                onChange={(e) => { setLoadInput(e.target.value); setLoadError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLoadSubmit(); if (e.key === "Escape") setLoadOpen(false); }}
                placeholder="Paste game code…"
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono
                  placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60"
              />
              <button
                onClick={handleLoadSubmit}
                className="py-2 px-4 rounded-lg text-sm font-semibold text-white
                  bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 transition-opacity"
              >
                Go
              </button>
              <button
                onClick={() => setLoadOpen(false)}
                className="py-2 px-3 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>
          )}
          {loadError && (
            <p className="text-xs text-red-400 font-mono pl-1">{loadError}</p>
          )}
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
      </main>

      <Footer />

      {/* End of game overlay */}
      {!overlayDismissed && (
        <EndOfGame
          phase={phase}
          opening={opening}
          openingIndex={openingIndex}
          onPlayAgain={() => playAgain()}
          onDismiss={() => setOverlayDismissed(true)}
        />
      )}
    </div>
  );
}
