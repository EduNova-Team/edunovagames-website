"use client";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export default function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0A0A16] shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE]" />

        <div className="p-6 flex flex-col gap-3">
          <h2 className="text-xl font-bold font-space text-white text-center mb-1">
            Select Difficulty
          </h2>

          <button
            onClick={() => onSelect("easy")}
            className="w-full py-3 rounded-xl border border-emerald-600/50 text-emerald-400 font-semibold
              hover:bg-emerald-600/10 hover:border-emerald-500 transition-all duration-200"
          >
            Easy
          </button>

          <button
            onClick={() => onSelect("medium")}
            className="w-full py-3 rounded-xl border border-amber-500/50 text-amber-400 font-semibold
              hover:bg-amber-500/10 hover:border-amber-400 transition-all duration-200"
          >
            Medium
          </button>

          <button
            onClick={() => onSelect("hard")}
            className="w-full py-3 rounded-xl border border-red-500/50 text-red-400 font-semibold
              hover:bg-red-500/10 hover:border-red-400 transition-all duration-200"
          >
            Hard
          </button>
        </div>
      </div>
    </div>
  );
}
