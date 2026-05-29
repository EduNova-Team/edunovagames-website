# EduNova Games — Session Change Log

All changes made during Claude Code sessions are documented here chronologically, newest first.

---
## Session 4 - May 27, 2026, 5:12 PM ET45

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
