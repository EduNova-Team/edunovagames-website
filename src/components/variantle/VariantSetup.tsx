"use client";

import { useState } from "react";
import type { Difficulty } from "@/components/chessle/DifficultySelect";

export type VariantKey = "koth" | "threeCheck";

export const VARIANT_META: Record<
  VariantKey,
  { label: string; blurb: string; slug: "kingOfTheHill" | "threeCheck" }
> = {
  koth: {
    label: "King of the Hill",
    blurb: "March your king to the center to win.",
    slug: "kingOfTheHill",
  },
  threeCheck: {
    label: "Three Check",
    blurb: "Check the enemy king three times to win.",
    slug: "threeCheck",
  },
};

interface VariantSetupProps {
  onStart: (variant: VariantKey, difficulty: Difficulty, depth: number) => void;
  initialVariant?: VariantKey;
  initialDifficulty?: Difficulty;
  initialDepth?: number;
}

const DEPTH_OPTIONS = [6, 8, 10, 12, 14];
const DEFAULT_DEPTH = 10;

export default function VariantSetup({
  onStart,
  initialVariant,
  initialDifficulty,
  initialDepth,
}: VariantSetupProps) {
  // Always start on the variant step so the player picks a variant each game.
  // Previous picks seed the later steps as defaults.
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [variant, setVariant] = useState<VariantKey | null>(initialVariant ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty ?? null);
  const [depth, setDepth] = useState(initialDepth ?? DEFAULT_DEPTH);

  function handleVariant(v: VariantKey) {
    setVariant(v);
    setStep(2);
  }

  function handleDifficulty(d: Difficulty) {
    setDifficulty(d);
    setStep(3);
  }

  function handlePlay() {
    if (!variant || !difficulty) return;
    onStart(variant, difficulty, depth);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0A0A16] shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE]" />

        <div className="p-6 flex flex-col gap-4">
          {/* Welcome header */}
          <div className="text-center mb-1">
            <h2 className="text-2xl font-bold font-space bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent">
              Welcome to Variantle!
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Guess the variant opening in {"{"}6{"}"} tries
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 w-9 rounded-full transition-colors ${
                  step >= s ? "bg-indigo-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <p className="text-center text-sm text-gray-400">Select variant</p>

              {(Object.keys(VARIANT_META) as VariantKey[]).map((v) => (
                <button
                  key={v}
                  onClick={() => handleVariant(v)}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 text-left
                    hover:bg-white/5 hover:border-white/30 transition-all duration-200"
                >
                  <span className="block font-semibold text-white">{VARIANT_META[v].label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{VARIANT_META[v].blurb}</span>
                </button>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-sm text-gray-400">Select difficulty</p>

              <button
                onClick={() => handleDifficulty("easy")}
                className="w-full py-3 rounded-xl border border-emerald-600/50 text-emerald-400 font-semibold
                  hover:bg-emerald-600/10 hover:border-emerald-500 transition-all duration-200"
              >
                Easy
              </button>
              <button
                onClick={() => handleDifficulty("medium")}
                className="w-full py-3 rounded-xl border border-amber-500/50 text-amber-400 font-semibold
                  hover:bg-amber-500/10 hover:border-amber-400 transition-all duration-200"
              >
                Medium
              </button>
              <button
                onClick={() => handleDifficulty("hard")}
                className="w-full py-3 rounded-xl border border-red-500/50 text-red-400 font-semibold
                  hover:bg-red-500/10 hover:border-red-400 transition-all duration-200"
              >
                Hard
              </button>

              <button
                onClick={() => setStep(1)}
                className="mt-1 w-full py-2.5 rounded-xl border border-white/10 text-sm text-gray-400
                  hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                ← Back
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-center text-sm text-gray-400">Select move depth</p>

              <div className="flex justify-center gap-2">
                {DEPTH_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold font-mono border transition-all duration-200
                      ${
                        depth === d
                          ? "bg-gradient-to-br from-[#6366F1] to-[#22D3EE] border-transparent text-white shadow-lg"
                          : "border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                      }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-600 font-mono -mt-1">half-moves to guess</p>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400
                    hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  onClick={handlePlay}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white
                    bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 transition-opacity active:scale-95"
                >
                  Play
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
