"use client";

import { useState, useEffect } from "react";

interface DepthSelectorProps {
  depth: number;
  onChange: (depth: number) => void;
}

const DEPTH_OPTIONS = [6, 8, 10, 12, 14];

export default function DepthSelector({ depth, onChange }: DepthSelectorProps) {
  const [pendingDepth, setPendingDepth] = useState(depth);

  // Sync if parent resets depth externally
  useEffect(() => {
    setPendingDepth(depth);
  }, [depth]);

  const idx = DEPTH_OPTIONS.indexOf(pendingDepth);
  const canDec = idx > 0;
  const canInc = idx < DEPTH_OPTIONS.length - 1;
  const isDirty = pendingDepth !== depth;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono select-none">
      <span className="text-gray-500">Depth</span>
      <button
        onClick={() => canDec && setPendingDepth(DEPTH_OPTIONS[idx - 1])}
        disabled={!canDec}
        className="w-5 h-5 flex items-center justify-center rounded border border-white/10 text-gray-400
          hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease depth"
      >
        ‹
      </button>
      <span className={`font-semibold w-6 text-center transition-colors ${isDirty ? "text-amber-400" : "text-white"}`}>
        {pendingDepth}
      </span>
      <button
        onClick={() => canInc && setPendingDepth(DEPTH_OPTIONS[idx + 1])}
        disabled={!canInc}
        className="w-5 h-5 flex items-center justify-center rounded border border-white/10 text-gray-400
          hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase depth"
      >
        ›
      </button>
      {isDirty && (
        <button
          onClick={() => onChange(pendingDepth)}
          className="px-2 py-0.5 rounded text-xs font-semibold text-white
            bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 transition-opacity active:scale-95"
        >
          Set
        </button>
      )}
    </div>
  );
}
