import type { GameDataset } from "@/hooks/useChessle";
import type { EngineFactory } from "@/lib/engine/types";
import type { VariantKey } from "@/components/variantle/VariantSetup";

/**
 * One Variantle 3 variant. Each variant ships its own module (`variants/<key>.ts`)
 * exporting a `Variant3Entry`; `registry.ts` collects them and the page is fully
 * registry-driven. Label / blurb / Lichess slug come from VARIANT_META (keyed by
 * `key`), so an entry only carries the wiring.
 */
export interface Variant3Entry {
  /** Must be a widened VariantKey (so VARIANT_META[key] resolves label + slug). */
  key: VariantKey;
  /** chessops-backed engine factory for this variant. */
  engine: EngineFactory;
  /** Opening dataset (empty until the variant is crawled). */
  dataset: GameDataset;
  /** 1-char share-code prefix, unique within Variantle 3. */
  sharePrefix: string;
  /** Crazyhouse → render the pocket drop UI. */
  hasPockets: boolean;
}
