import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { VariantEntry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/koth-openings.json";
import difficulties from "@/data/koth-difficulties.json";

const entry: VariantEntry = {
  key: "koth",
  engine: createChessopsFactory("kingofthehill"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "K",
  hasPockets: false,
  highlightCenter: true,
};

export default entry;
