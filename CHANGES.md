# EduNova Games — Session Change Log

All changes made during Claude Code sessions are documented here chronologically, newest first.

---
## Session 6 - TBD

** Goal: Branch out functionality to other variants and optimize search. Search right now is ineffective because it does BFS for each length. I want DFS that traces each opening tree while considering the number of half-moves it plays is much more effective. Also, I want to eventually migrate to another website that isn't Edunova Games so that I can expand to other variants on a separate platform. 

## Session 5 - Jun 29, 2026

**Play Again move-count fixes (`src/components/chessle/DifficultySelect.tsx`, `src/app/chessle/page.tsx`, `src/hooks/useChessle.ts`)**
Fixed a cluster of bugs where the move count after "Play Again" no longer matched the depth the player selected.

- **Setup overlay forgot the player's settings.** The overlay is conditionally rendered (`{showSetup && <DifficultySelect />}`), so every Play Again unmounted and remounted it, resetting its internal state to the hardcoded defaults — `depth` back to `10`. If the player didn't manually re-tap a depth tile, `handleStart` ran with the stale default and the game silently reverted to 10 half-moves. Fixed by seeding the overlay from the page's current settings via new `initialDifficulty` / `initialDepth` props, so the previously-chosen depth is pre-selected on replay.
- **The overlay still always opens on the difficulty step** (step 1) so the player is prompted for difficulty every game; only the depth is remembered as a default.
- **Short openings could shrink the line below the selected depth.** `pickRandomIndex(difficulty, depth)` now filters candidates to openings with `moves.length >= depth`. An opening shorter than the selected length is never picked, so `lineLength` always equals `targetDepth` for random games. Long openings (e.g. a 14-move line) still qualify at every depth and are simply truncated to the first N moves — so complex lines remain reachable at short depths. Verified every difficulty×depth combo retains hundreds–thousands of candidates (smallest: hard/14 = 542).
- **Depth is now threaded explicitly through `playAgain(index?, newDifficulty?, newDepth?)`.** `handleStart` passes the freshly-selected depth rather than relying on `targetDepth` from the closure, which hasn't flushed yet within the same batch (the same stale-closure class of bug that previously bit the difficulty value).
- **Status bar now reflects the actual line length** — changed from `{targetDepth}` to `{lineLength || targetDepth}`, so it's honest even when a shorter opening is loaded by code.

## Session 4 — May 27–29, 2026

**Lichess Masters opening tree crawler (`scripts/fetch-opening-tree.mjs`)**
Replaced the old 647-opening ECO list with a full crawl of the Lichess Masters database. The crawler walks the position graph breadth-first, fetching one Lichess API request per unique chess position.

How it works:
- Queries `https://explorer.lichess.ovh/masters?play=<uci-csv>` for each position. One request returns the total game count and every legal continuation with game counts.
- Expands a child move only if it appears in ≥ 100 master games, so obscure sidelines are pruned naturally.
- Deduplicates by normalized FEN (first four fields), so transpositions are visited exactly once — each unique board position is expanded only once regardless of how many move orders reach it. Without this, frontier sizes would explode exponentially.
- Marks nodes with `terminal: true` when no continuation clears 100 games, distinguishing genuine dead-ends from transposition cuts (important for the build step).
- Crawls up to 40 ply (safety cap). Resumable: responses are cached to `scripts/.opening-tree-cache.json` (gitignored), flushed every 50 fetches and on Ctrl-C. Rate-limited to 350 ms between network requests, with exponential-backoff retry on 429s and transport errors.
- Result: **48,302 unique positions**, **10,453 terminal lines**, up to 40 ply. Written to `src/data/chessle-tree.json` (31 MB, gitignored — regenerate with the script).

**Parameterized build step (`scripts/build-openings-from-tree.mjs`, `scripts/build-all-depths.mjs`)**
A local script reads the tree JSON and produces the flat openings array the game uses, without any network calls.

- `--depth=N` sets the target half-move depth (default 10). Emits one opening per node exactly at depth N, plus any true terminal nodes at depth < N (genuine short lines). Deduplicates by terminal FEN, keeps the lexicographically smaller PGN. Sorts by PGN ascending for deterministic index order (required for stable share codes).
- Writes `chessle-openings.json` (flat `Opening[]`) and `chessle-difficulties.json` (difficulty per index, computed from master game counts at each terminal position using 33/66 percentile splits — no network needed).
- `build-all-depths.mjs` is a convenience wrapper that runs the builder for all five depths (6, 8, 10, 12, 14) in sequence, writing `chessle-openings-{N}.json` and `chessle-difficulties-{N}.json` for each. These per-depth files are gitignored.
- The active game dataset (`chessle-openings.json` / `chessle-difficulties.json`) is built from the depth-14 tree slice: **6,879 openings**, up to 14 half-moves each.

Dataset counts by depth:

| Depth | Openings | Easy | Medium | Hard |
|-------|----------|------|--------|------|
| 6 | 1,368 | 452 | 455 | 461 |
| 8 | 2,561 | 849 | 855 | 857 |
| 10 | 3,967 | 1,312 | 1,310 | 1,345 |
| 12 | 5,503 | 1,822 | 1,823 | 1,858 |
| 14 | 6,879 | 2,274 | 2,308 | 2,297 |

**Variable move-depth game core (`src/hooks/useChessle.ts`, `src/components/chessle/GuessGrid.tsx`, `src/app/chessle/page.tsx`)**
The game core now supports any line length, not just 10 half-moves.

- `useChessle` accepts a third parameter `targetDepth` (default `HALF_MOVES_PER_GUESS = 10`). `lineLength = Math.min(opening.moves.length, targetDepth)` — so a 14-move opening played at depth 6 uses only the first 6 moves.
- `buildEmptyRow` / `buildEmptyGrid` take a length argument. Grid starts as `[]` and is built when an opening is set (fixes a prior hydration issue).
- `GuessGrid` accepts a `lineLength` prop. `FULL_MOVES = Math.ceil(lineLength / 2)` determines how many white/black tile pairs to render. Odd line lengths render a lone white tile in the final pair.
- `submitGuess` slices guessed moves to `lineLength` before evaluation (bug fix: previously all grid tiles — including unused empty ones — were passed to `evaluateGuess`, corrupting the result when depth < the grid row width).
- `cheatSolve` and `fillGreen` also respect `lineLength`.

**Two-step game setup overlay (`src/components/chessle/DifficultySelect.tsx`, `src/app/chessle/page.tsx`)**
The difficulty selector was redesigned into a two-screen welcome flow.

- Screen 1: "Welcome to Chessle!" heading, step indicator dots, then Easy / Medium / Hard buttons. Clicking one advances to screen 2.
- Screen 2: Five depth chips (6 / 8 / 10 / 12 / 14), default 10 pre-selected (gradient highlight). "← Back" returns to screen 1; "Play" locks both settings and starts the game.
- Both difficulty and depth are passed together to `handleStart(difficulty, depth)`. The depth is set once at game start and shown right-aligned in the status bar as `{N} moves` throughout the game.
- "Play Again" brings the full two-screen flow back so the player can change both settings between games.

**Algorithmic base-62 share codes (`src/lib/chessle-ids.ts`)**
Replaced the static 647-entry JSON hashmap with a self-contained base-62 encoder/decoder.

- Alphabet: `0–9A–Za–z` (case-sensitive, 62 characters). `encodeOpeningIndex(i)` converts an integer index to base-62. `decodeOpeningCode(code)` converts back — trims whitespace but does NOT uppercase (case-sensitive). Invalid characters return `null`. No range check in the lib; `getOpeningByIndex` clamps modulo the array length.
- Old share codes (which contained `-` and were case-insensitive) return `null` — a clean break, expected since the dataset was completely regenerated.
- `src/data/chessle-ids.json` deleted.

**EndOfGame truncation (`src/components/chessle/EndOfGame.tsx`)**
The end-of-game screen now receives `lineLength` and uses it to:
- Display only the moves actually played (`opening.moves.slice(0, lineLength)`), not the full opening.
- Rebuild a truncated PGN from those moves and use it in the Lichess URL, so the "Study this opening on Lichess" link opens at the exact position the player guessed — not partway through a longer line.

**ESLint config fix (`.eslintrc.json`)**
Removed `"next/typescript"` from the extends list. That config only exists in Next.js 15+; this project uses Next.js 14.2.23 which ships only `next/core-web-vitals`. The broken reference caused lint to fail entirely, hiding all real lint errors.

---

## Session 3 — May 25, 2026, 8:37 PM ET

**Easy / Medium / Hard difficulty modes (`src/hooks/useChessle.ts`, `src/components/chessle/DifficultySelect.tsx`, `src/app/chessle/page.tsx`, `src/data/chessle-difficulties.json`, `scripts/fetch-opening-difficulties.mjs`)**
Openings are now classified into three difficulty tiers based on how commonly each opening appears in real Lichess games.

How classification works:
- A one-time script (`scripts/fetch-opening-difficulties.mjs`) queries the Lichess Opening Explorer API for each of the 647 openings, fetching the total number of games played after that exact sequence of moves.
- Openings are ranked by game count and split into three equal thirds: top 33% → Easy (well-known openings), middle 33% → Medium, bottom 33% → Hard (rare or obscure).
- The result is stored in `src/data/chessle-difficulties.json` (214 easy, 214 medium, 219 hard). This file ships with the site — the API is never called at runtime.

At game start, the player sees a difficulty selector popup. The hook then uses pre-built index pools (one array per difficulty, populated at module load) to pick a random opening from the correct tier in O(1) time.

**Difficulty selector overlay (`src/components/chessle/DifficultySelect.tsx`, `src/app/chessle/page.tsx`)**
A modal overlay with three buttons (Easy in green, Medium in amber, Hard in red) appears before the first game. The overlay uses `fixed` positioning with a blurred backdrop so it floats on top of the game board rather than replacing it. The difficulty value is remembered for the rest of the session — pressing "Play Again" brings the selector back without clearing the previous choice.

**Play Again button on main screen (`src/app/chessle/page.tsx`)**
A "Play Again" button was added below the Share / Load row. It is greyed out and disabled while a game is in progress, so it can only be clicked after the game ends. Clicking it shows the difficulty selector, identical to the "Play Again" button inside the EndOfGame popup.

**EndOfGame "Play Again" now dismisses the overlay (`src/app/chessle/page.tsx`)**
Previously, clicking "Play Again" from the EndOfGame popup caused the difficulty selector to appear behind the still-visible EndOfGame screen. Fixed by dismissing the EndOfGame overlay at the same moment the difficulty selector is shown, so the player only ever sees one overlay at a time.

**Fixed stale closure bug in Play Again flow (`src/app/chessle/page.tsx`)**
An earlier implementation reset the `difficulty` state to `undefined` when Play Again was pressed. This caused `playAgain()` inside the hook to capture the stale undefined value due to closure timing, resulting in a difficulty-less random pick instead of the correct tier. Fixed by introducing a separate `showDifficultySelector` boolean to control overlay visibility — the `difficulty` value is now never cleared, only the selector visibility toggles.

---

## Session 2 — May 24, 2026, 2:09 PM ET

**Share and Load buttons (`src/app/chessle/page.tsx`, `src/lib/chessle-ids.ts`, `src/data/chessle-ids.json`)**
A second row of buttons sits below Undo / Fill Green / Submit, each taking up half the width.

- **Share**: encodes the current game's opening index into a short 6-character code (e.g. `VXEONG`) and copies it to the clipboard. The button label briefly reads "Copied!" then resets.
- **Load**: reveals an inline text input. The player pastes a code, presses Enter or "Go," and the game immediately resets to that specific opening. Invalid codes show a small error message. Pressing Escape or the ✕ button closes the input without doing anything.

The encoding uses a pre-generated hashmap stored in `src/data/chessle-ids.json`. Every one of the 647 openings has a unique randomly-generated code, and the file stores both directions (index → code and code → index) so lookups in either direction are instant. Decoding is case-insensitive and ignores leading/trailing spaces. The encode/decode logic lives in `src/lib/chessle-ids.ts`.

**Secret cheat code (`src/app/chessle/page.tsx`, `src/hooks/useChessle.ts`)**
Typing `Jimmy**` into the Load input and pressing Go/Enter instantly fills in the correct answer and marks the game as won. It is intercepted before the normal decode logic runs, so it never needs to match a real game code. Intended for testing only.

An earlier approach used live keyboard detection (tracking a rolling buffer of typed characters and firing on match), but it was scrapped because modifier keys like Shift fired their own keydown events and corrupted the buffer — for example, typing capital `J` would append both `"Shift"` and `"J"` to the buffer, preventing it from ever matching.

**`playAgain` now accepts an optional opening index (`src/hooks/useChessle.ts`)**
Calling `playAgain()` with no argument picks a new random opening as before. Calling `playAgain(42)` loads opening #42 specifically. The Load button uses this to jump to a decoded opening without a page reload.

**"Fill Green" button (`src/hooks/useChessle.ts`, `src/app/chessle/page.tsx`)**
A new green-colored button sits between the Undo and Submit buttons. When pressed, it looks at the player's most recently submitted guess and automatically plays the next consecutive run of correct (green) moves onto the board, stopping as soon as it hits a move that wasn't correct.

How the flow works step by step:
- Say the player's last guess had green on moves 1, 2, 3 — then yellow on move 4 — then green on moves 5, 6.
- Pressing "Fill Green" at the start of the new row auto-plays moves 1, 2, 3 and stops. The board is now waiting at position 4.
- The player manually makes a new move at position 4.
- Pressing "Fill Green" again auto-plays moves 5, 6 (the next green run).
- The button is disabled whenever the move at the current board position wasn't green in the previous guess, or on the very first guess when there's no previous row to reference.

**X button to dismiss the game over screen (`src/components/chessle/EndOfGame.tsx`, `src/app/chessle/page.tsx`)**
The game over overlay now has an X in the top-right corner. Clicking it closes the overlay so the player can look at the final board state. The overlay automatically comes back if the player starts a new game via Play Again.

**Removed the vertical separator bar next to "Guess 1/6" (`src/app/chessle/page.tsx`)**
The faint `|` character that sat between the guess counter and the status text was removed.

**Fixed the Lichess link to go to the actual opening (`src/components/chessle/EndOfGame.tsx`)**
The "Study this opening on Lichess" link previously always opened the blank starting-position analysis board, ignoring the actual opening entirely. It now encodes the opening's move sequence into the URL so Lichess loads the board with all the moves already played through and the opening explorer panel open on the right.

---

## Session 1 — May 24, 2026, 3:39 AM ET

**Progressive row rendering (`src/components/chessle/GuessGrid.tsx`)**
Previously, all 6 guess rows were always visible on screen, even when most were empty. Now only the rows the player has actually used are shown:
- On the first guess, only row 1 is visible (the one being filled in).
- After submitting a guess, that completed row stays visible and the next empty row appears below it.
- Future rows stay hidden until the player reaches them.

One line of logic handles this: any row with an index higher than the current guess number is simply not rendered.

**Left arrow key to undo (`src/app/chessle/page.tsx`)**
The Undo button already existed. Now pressing the left arrow key on the keyboard does the same thing. The key listener is active only during gameplay and only when there is at least one move to undo — the same conditions that enable the Undo button.
