import type { Variant3Entry } from "./types";
import atomic from "./variants/atomic";
import racingkings from "./variants/racingkings";
import antichess from "./variants/antichess";
import crazyhouse from "./variants/crazyhouse";

// Order here = order shown in the setup overlay.
export const VARIANTS_REGISTRY: Variant3Entry[] = [atomic, racingkings, antichess, crazyhouse];
