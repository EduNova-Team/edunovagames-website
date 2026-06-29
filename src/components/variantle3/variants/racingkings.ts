import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { Variant3Entry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/racingkings-openings.json";
import difficulties from "@/data/racingkings-difficulties.json";

const entry: Variant3Entry = {
  key: "racingkings",
  engine: createChessopsFactory("racingkings"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "R",
  hasPockets: false,
};

export default entry;
