import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { VariantEntry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/horde-openings.json";
import difficulties from "@/data/horde-difficulties.json";

const entry: VariantEntry = {
  key: "horde",
  engine: createChessopsFactory("horde"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "H",
  hasPockets: false,
};

export default entry;
