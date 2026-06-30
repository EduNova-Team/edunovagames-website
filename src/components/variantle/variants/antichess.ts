import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { VariantEntry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/antichess-openings.json";
import difficulties from "@/data/antichess-difficulties.json";

const entry: VariantEntry = {
  key: "antichess",
  engine: createChessopsFactory("antichess"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "N",
  hasPockets: false,
};

export default entry;
