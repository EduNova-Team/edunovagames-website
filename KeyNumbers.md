# KeyNumbers.md

Quick-reference for the search/crawl parameters and dataset figures behind Chessle and Variantle. Keep this updated whenever the pipeline or datasets change.

_Last updated: 2026-06-27. Variant opening counts marked **(pending)** are filled in once the 2000+ crawl + build completes._

---

## Crawl / search parameters

| Parameter | Standard (Chessle) | Variants (Variantle) |
|---|---|---|
| Lichess DB | Masters (`/masters`) | General (`/lichess?variant=…`) |
| Rating filter | masters-only (inherent) | **2000+ only** (`ratings=2000,2200,2500`) — standard for all variants |
| Speed filter | n/a | all speeds |
| `--min-games` (prune) | 100 | **scaled** per variant (see below) |
| `--max-ply` (crawl depth) | 40 (then sliced) | 14 (single combined dataset) |
| Traversal | BFS-by-ply + per-depth build | single-pass DFS, emit terminal-or-maxply |
| Dedup key | normalized FEN (4 fields) | FEN (4 fields); 3+ also appends `+wChecks+bChecks` |
| Difficulty split | 33 / 66 percentile of game count | same |
| Network transport | Node fetch | `curl` (this env blocks Node sockets) |

UI / game config (from `src/hooks/useChessle.ts`): `MAX_GUESSES = 6`, `HALF_MOVES_PER_GUESS = 10` (default depth), depth selector options `[6, 8, 10, 12, 14]`.

---

## Root game volumes (games at the start position)

| DB | Root games |
|---|---|
| Standard **masters** | **2,879,587** |
| KOTH — all ratings | 8,140,134 |
| KOTH — 1600+ | 5,951,310 |
| KOTH — **2000+** (used) | **1,561,863** |
| KOTH — 2200+ | 325,615 |
| Three Check — all ratings | 10,258,950 |
| Three Check — **2000+** (used) | **1,461,159** |

Rating context: for KOTH, sub-1600 ≈ 27% of all games; 2000+ ≈ 19%. So the 2000+ standard keeps the strongest fifth of play.

---

## `--min-games` scaling rule

Threshold is kept **roughly proportional to standard's search density**:

```
min-games ≈ 100 × (variant 2000+ root games ÷ 2,879,587)
```

| Variant | 2000+ root | ratio vs standard | computed | used |
|---|---|---|---|---|
| KOTH | 1,561,863 | 0.54× | 54 | **50** |
| Three Check | 1,461,159 | 0.51× | 51 | **50** |

(Standard reference: 100 games / 2,879,587 masters root.)

---

## Dataset sizes (committed `src/data/*.json`)

| Dataset | Openings | Easy | Medium | Hard | Depth |
|---|---|---|---|---|---|
| Chessle (standard, depth-14) | 6,879 | 2,274 | 2,308 | 2,297 | ≤14 |
| KOTH (`koth-openings.json`) | **(pending)** | — | — | — | ≤14 |
| Three Check (`threecheck-openings.json`) | **(pending)** | — | — | — | ≤14 |

Each opening entry: `{ eco, name, moves[], pgn, games, depth }`. Difficulty is per-index in the matching `*-difficulties.json` (`{ "difficulties": { "0": "hard", … } }`).

---

## Pipeline reference

- Crawler: `scripts/fetch-variant-tree.mjs` → `src/data/<key>-openings.raw.json` (gitignored)
- Finalizer: `scripts/build-variant-dataset.mjs` → committed `<key>-openings.json` + `<key>-difficulties.json`
- Cache (resumable, per variant + rating filter): `scripts/.variant-<key>-r2000-cache.json` (gitignored)
- Progress log: `logs` (gitignored; timestamped, tagged `[KOTH]` / `[3+]`)
