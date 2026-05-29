# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (runs before Vercel deploys)
npm run lint       # ESLint via Next.js
```

No test suite exists. Install Shadcn components with `npm install shadcn` — the old `npx shadcn-ui@latest` package name no longer works.

One-time data script (re-runs only if the openings list changes):
```bash
LICHESS_TOKEN=<token> node scripts/fetch-opening-difficulties.mjs
```
This queries the Lichess Opening Explorer for all 647 openings and writes `src/data/chessle-difficulties.json`. Revoke the token after use.

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

**Difficulty pools:** At module load, `difficultyPools` pre-builds three index arrays from `chessle-difficulties.json`. `pickRandomIndex(difficulty)` picks randomly from the correct pool in O(1).

**Static data files:**
- `chessle-openings.json` — 647 openings, each with `eco`, `name`, `moves` (10-element SAN array), `pgn`
- `chessle-ids.json` — `{ indexToCode, codeToIndex }` hashmap; encode/decode via `src/lib/chessle-ids.ts`
- `chessle-difficulties.json` — `{ difficulties: { "0": "hard", ... }, counts: [...] }`

Config constants (`HALF_MOVES_PER_GUESS = 10`, `MAX_GUESSES = 6`) are exported from `useChessle.ts` and consumed by both the hook and the page. Change them only there.

### Deployment

The site deploys to Vercel automatically on every push to `main`. `next.config.js` enables `reactStrictMode`, `swcMinify`, and allows remote images from any HTTPS host.

## Active development

Chessle is being developed on the `Claude-Chessle` branch. Session history is in `CHANGES.md`. Planned features are tracked in `chessle_spec.json` (TODO_1 through TODO_5; TODO_4 is complete).
