import { createChessopsFactory } from "@/lib/engine/chessopsEngine";
import type { Variant3Entry } from "../types";
import type { Opening } from "@/hooks/useChessle";
import type { Difficulty } from "@/components/chessle/DifficultySelect";
import openings from "@/data/atomic-openings.json";
import difficulties from "@/data/atomic-difficulties.json";

const entry: Variant3Entry = {
  key: "atomic",
  engine: createChessopsFactory("atomic"),
  dataset: {
    openings: openings as Opening[],
    difficulties: difficulties.difficulties as Record<string, Difficulty>,
  },
  sharePrefix: "A",
  hasPockets: false,
};

export default entry;
