import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { VariantEntry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/crazyhouse-openings.json";
import difficulties from "@/data/crazyhouse-difficulties.json";

const entry: VariantEntry = {
  key: "crazyhouse",
  engine: createChessopsFactory("crazyhouse"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "Z",
  hasPockets: true,
};

export default entry;
