"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuessGrid from "@/components/chessle/GuessGrid";
import EndOfGame from "@/components/chessle/EndOfGame";
import {
  useChessle,
  MAX_GUESSES,
  HALF_MOVES_PER_GUESS,
  type Opening,
  type GameDataset,
} from "@/hooks/useChessle";
import { encodeOpeningIndex, decodeOpeningCode } from "@/lib/chessle-ids";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import VariantSetup, { VARIANT_META, type VariantKey } from "@/components/variantle/VariantSetup";
import kothOpenings from "@/data/koth-openings.json";
import kothDifficulties from "@/data/koth-difficulties.json";
import threecheckOpenings from "@/data/threecheck-openings.json";
import threecheckDifficulties from "@/data/threecheck-difficulties.json";

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

// One dataset per variant, built once at module scope (stable identity for the hook).
const DATASETS: Record<VariantKey, GameDataset> = {
  koth: {
    openings: kothOpenings as Opening[],
    difficulties: kothDifficulties.difficulties as Record<string, Difficulty>,
  },
  threeCheck: {
    openings: threecheckOpenings as Opening[],
    difficulties: threecheckDifficulties.difficulties as Record<string, Difficulty>,
  },
};

// Stable empty dataset used before the player has chosen a variant (the setup
// overlay is up at that point, so nothing is actually playable yet).
const EMPTY_DATASET: GameDataset = { openings: [], difficulties: {} };

// Share-code variant prefixes (1 char), so a code knows which dataset it indexes.
const VARIANT_PREFIX: Record<VariantKey, string> = { koth: "K", threeCheck: "T" };
const PREFIX_TO_VARIANT: Record<string, VariantKey> = { K: "koth", T: "threeCheck" };

export default function VariantlePage() {
  const [variant, setVariant] = useState<VariantKey | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [showSetup, setShowSetup] = useState(true);
  const [targetDepth, setTargetDepth] = useState(HALF_MOVES_PER_GUESS);

  const dataset = variant ? DATASETS[variant] : EMPTY_DATASET;

  const {
    opening,
    openingIndex,
    chess,
    grid,
    currentGuessIndex,
    currentMoveIndex,
    phase,
    lineLength,
    onMove,
    submitGuess,
    undoMove,
    fillGreen,
    cheatSolve,
    playAgain,
    canSubmit,
    canUndo,
    canFillGreen,
  } = useChessle(dataset, undefined, difficulty, targetDepth);

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

  // Called by the setup overlay when the player confirms variant + difficulty + depth
  function handleStart(newVariant: VariantKey, newDifficulty: Difficulty, newDepth: number) {
    setVariant(newVariant);
    setDifficulty(newDifficulty);
    setTargetDepth(newDepth);
    setShowSetup(false);
    // Pass the freshly-selected dataset explicitly — its state hasn't flushed yet.
    playAgain(undefined, newDifficulty, newDepth, DATASETS[newVariant]);
  }

  // Called by any "Play Again" button — shows the setup overlay again
  function handlePlayAgain() {
    setOverlayDismissed(true);
    setShowSetup(true);
  }

  function handleShare() {
    if (openingIndex === null || !variant) return;
    const code = VARIANT_PREFIX[variant] + encodeOpeningIndex(openingIndex);
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
    const raw = loadInput.trim();
    if (raw === "Jimmy**") {
      cheatSolve();
      setLoadOpen(false);
      setLoadInput("");
      return;
    }
    const v = PREFIX_TO_VARIANT[raw[0]?.toUpperCase()];
    const idx = v ? decodeOpeningCode(raw.slice(1)) : null;
    if (!v || idx === null) {
      setLoadError("Unrecognized code.");
      return;
    }
    setVariant(v);
    setShowSetup(false);
    playAgain(idx, undefined, undefined, DATASETS[v]);
    setLoadOpen(false);
    setLoadInput("");
    setLoadError("");
  }

  const variantLabel = variant ? VARIANT_META[variant].label : "";

  return (
    <div className="min-h-screen bg-[#0A0A16] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pt-8 pb-16 px-4 gap-6">
        {/* Page heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-space bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">
            Variantle
          </h1>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono w-full" style={{ maxWidth: "min(540px, 95vw)" }}>
          <span>
            Guess{" "}
            <span className="text-white font-semibold">{currentGuessIndex + 1}</span>
            {" "}/ {MAX_GUESSES}
          </span>
          <span>
            {phase === "playing"
              ? lineLength > 0 && currentMoveIndex === lineLength
                ? "Row full — press Submit"
                : ""
              : phase === "won"
              ? "🎉 Solved!"
              : "Game over"}
          </span>
          <span className="ml-auto text-gray-500">
            {variantLabel && <span className="text-white font-semibold">{variantLabel}</span>}
            {variantLabel && " · "}
            <span className="text-white font-semibold">{lineLength || targetDepth}</span> moves
          </span>
        </div>

        {/* Chessboard */}
        <ChessBoard
          chess={chess}
          onMove={onMove}
          disabled={phase !== "playing" || currentMoveIndex >= lineLength}
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

          {/* Play Again */}
          <button
            onClick={handlePlayAgain}
            disabled={phase === "playing"}
            className="w-full py-2 px-4 rounded-lg border border-white/10 text-sm font-semibold text-gray-300
              hover:bg-white/5 hover:text-white transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Play Again
          </button>

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
        <GuessGrid grid={grid} currentGuessIndex={currentGuessIndex} lineLength={lineLength} />

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

      {/* Setup overlay — shown before first game and on Play Again */}
      {showSetup && (
        <VariantSetup
          onStart={handleStart}
          initialVariant={variant}
          initialDifficulty={difficulty}
          initialDepth={targetDepth}
        />
      )}

      {/* End of game overlay */}
      {!overlayDismissed && opening && openingIndex !== null && variant && (
        <EndOfGame
          phase={phase}
          opening={opening}
          openingIndex={openingIndex}
          lineLength={lineLength}
          variant={VARIANT_META[variant].slug}
          onPlayAgain={handlePlayAgain}
          onDismiss={() => setOverlayDismissed(true)}
        />
      )}
    </div>
  );
}
