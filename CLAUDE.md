# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (runs before Vercel deploys)
npm run lint       # ESLint via Next.js
```

No test suite exists. Install Shadcn components with `npm install shadcn` — the old `npx shadcn-ui@latest` package name no longer works.

## Data pipeline (run once after major opening-set changes)

```bash
# 1. Crawl the Lichess Masters tree (takes hours; resumable via cache)
LICHESS_TOKEN=<token> node scripts/fetch-opening-tree.mjs
# Writes src/data/chessle-tree.json (gitignored, ~31 MB)
# Revoke the token when done.

# 2. Build all depth datasets from the tree (seconds; no network)
node scripts/build-all-depths.mjs
# Writes src/data/chessle-openings-{6,8,10,12,14}.json  (gitignored)
#        src/data/chessle-difficulties-{6,8,10,12,14}.json  (gitignored)

# 3. Promote the desired depth to the active game files
cp src/data/chessle-openings-14.json src/data/chessle-openings.json
cp src/data/chessle-difficulties-14.json src/data/chessle-difficulties.json
# chessle-openings.json and chessle-difficulties.json ARE committed.
```

To rebuild a single depth: `node scripts/build-openings-from-tree.mjs --depth=10 --openings-out=src/data/chessle-openings.json --difficulties-out=src/data/chessle-difficulties.json`

## Variant data pipeline (Variantle: KOTH, Three Check, …)

Variants are crawled from the **general Lichess explorer** (`explorer.lichess.ovh/lichess?variant=…`) — there is no masters DB for variants. Token-gated.

```bash
# DFS crawl (resumable; uses curl because this env blocks Node sockets) → raw lines
LICHESS_TOKEN=<token> node scripts/fetch-variant-tree.mjs --variant=koth --min-games=50 --max-ply=14
# Finalize → committed src/data/koth-openings.json + koth-difficulties.json
node scripts/build-variant-dataset.mjs --variant=koth
# repeat with --variant=threecheck --min-games=50
```

**Rating standard — applies to EVERY variant: count only 2000+ rated games** (`--ratings=2000,2200,2500`, the crawler's default). This keeps variant data at masters-level quality, matching standard Chessle's masters DB; the general DB otherwise mixes in all strengths (~81% of games are sub-2000).

**`--min-games` is scaled to stay roughly proportional to standard's search density**, NOT a flat number. Rule: `min-games ≈ 100 × (variant 2000+ root games ÷ standard masters root games)`, where standard = **100 games / 2,879,587** masters-root games. Per variant (2000+ roots):
- **KOTH:** 1,561,863 (0.54× standard) → **`--min-games=50`**
- **Three Check:** 1,461,159 (0.51× standard) → **`--min-games=50`**

So every variant's opening tree sits at the same relative density as standard Chessle (efficiency over breadth). When adding a future variant, fetch its 2000+ root volume and apply the same formula. **All key figures live in `KeyNumbers.md`** (root volumes, thresholds, dataset/opening counts) — keep it updated.

Other params: `--max-ply=14` (the UI depth selector caps at 14; deeper crawls are cache-incremental, never a dead-end). The cache is per-(variant, rating-filter): `scripts/.variant-<key>-r2000-cache.json`. Crawl progress streams to a timestamped `logs` file, tagged `[KOTH]` / `[3+]`.

## Architecture

### App structure

Next.js 14 App Router. All game pages are client components (`"use client"`). Pages live in `src/app/`, shared components in `src/components/`, custom hooks in `src/hooks/`, utilities in `src/lib/`, and static data in `src/data/`.

`src/app/layout.tsx` wraps every page in `<AuthProvider>` and loads three Google fonts: Inter (body), JetBrains Mono (`--font-mono` variable), Space Grotesk (`--font-space` variable). The base background is `#0A0A16`.

### Auth

`src/lib/supabase.ts` exports a single Supabase client instance. `src/contexts/AuthContext.tsx` wraps it in a React context and exposes `useAuth()`, which provides `user`, `loading`, `signIn`, `signUp`, `signOut`, `signInWithGoogle`, and `resetPassword`. The context listens to `onAuthStateChange` so auth state stays in sync across tabs.

### Chessle game

The game's entire state lives in `src/hooks/useChessle.ts`. The page (`src/app/chessle/page.tsx`) holds only UI state (overlay visibility, copy label, load input). The hook holds game state (opening, chess instance, grid, guess/move indices, phase).

**Critical constraint:** `ChessBoard` uses browser-only Chessground APIs and must be loaded with `dynamic(..., { ssr: false })`. Opening selection must happen inside `useEffect` (never at module scope or in initial `useState`) to avoid a hydration mismatch between server and client random picks.

**Undo pattern:** `chess.undo()` mutates in place — the object reference doesn't change, so ChessBoard's `useEffect` never fires. Instead, undo creates a brand-new `Chess` instance by replaying `currentMoves.slice(0, -1)`. The same replay pattern is used by `fillGreen` and `cheatSolve`.

**Variable line length:** `useChessle` accepts `targetDepth` (third param, default `HALF_MOVES_PER_GUESS = 10`). `lineLength = Math.min(opening.moves.length, targetDepth)` is the per-game bound used everywhere — grid size, move bounds, submit guard, fill-green, cheat-solve. `GuessGrid` renders `Math.ceil(lineLength / 2)` white/black tile pairs. `submitGuess` slices guessed moves to `lineLength` before evaluation (grid rows are sized to `opening.moves.length`, so unused tiles must be excluded).

**Difficulty pools:** At module load, `difficultyPools` pre-builds three index arrays from `chessle-difficulties.json`. `pickRandomIndex(difficulty)` picks randomly from the correct pool in O(1). Difficulty is classified by 33/66 percentile of master game count at the terminal position.

**Share codes:** Algorithmic base-62 (`src/lib/chessle-ids.ts`). Alphabet `0–9A–Za–z`, case-sensitive. `encodeOpeningIndex(i)` → short string; `decodeOpeningCode(s)` → index or null. Stable as long as `chessle-openings.json` sort order doesn't change (sorted by PGN ascending).

**Static data files (committed):**
- `chessle-openings.json` — flat `Opening[]`, currently the depth-14 build (6,879 openings). Each entry: `{ eco, name, moves, pgn, games, depth }`. Variable `moves` length (≤ 14).
- `chessle-difficulties.json` — `{ difficulties: { "0": "hard", ... } }` keyed by opening index.

**Gitignored data files (regenerate with scripts):**
- `src/data/chessle-tree.json` — full Masters position tree, ~31 MB.
- `src/data/chessle-openings-{N}.json` / `chessle-difficulties-{N}.json` — per-depth builds.
- `scripts/.opening-tree-cache.json` — resumable crawler cache.

Config constants (`HALF_MOVES_PER_GUESS = 10`, `MAX_GUESSES = 6`) are exported from `useChessle.ts`. Change them only there.

### Deployment

The site deploys to Vercel automatically on every push to `main`. `next.config.js` enables `reactStrictMode`, `swcMinify`, and allows remote images from any HTTPS host.

## Active development

Chessle is being developed on the `Claude-Chessle` branch. Session history is in `CHANGES.md`.
