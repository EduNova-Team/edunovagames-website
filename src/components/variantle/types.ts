import type { GameDataset } from "@/hooks/useChessle";
import type { EngineFactory } from "@/lib/engine/types";
import type { VariantKey } from "@/components/variantle/VariantSetup";

/**
 * One Variantle variant. Each variant ships its own module (`variants/<key>.ts`)
 * exporting a `VariantEntry`; `registry.ts` collects them and the page is fully
 * registry-driven. Label / blurb / Lichess slug come from VARIANT_META (keyed by
 * `key`), so an entry only carries the wiring.
 */
export interface VariantEntry {
  /** Must be a VariantKey (so VARIANT_META[key] resolves label + slug). */
  key: VariantKey;
  /** chessops-backed engine factory for this variant. */
  engine: EngineFactory;
  /** Opening dataset. */
  dataset: GameDataset;
  /** 1-char share-code prefix, unique across all variants. */
  sharePrefix: string;
  /** Crazyhouse → render the pocket drop UI. */
  hasPockets: boolean;
  /** King of the Hill → tint the four central "hill" squares as a visual cue. */
  highlightCenter?: boolean;
}
