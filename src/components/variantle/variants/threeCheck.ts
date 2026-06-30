import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { VariantEntry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/threecheck-openings.json";
import difficulties from "@/data/threecheck-difficulties.json";

const entry: VariantEntry = {
  key: "threeCheck",
  engine: createChessopsFactory("3check"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "T",
  hasPockets: false,
};

export default entry;
