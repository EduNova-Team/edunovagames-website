# EduNova Games — Project Documentation

> **Session change log:** see [CHANGES.md](./CHANGES.md)

The website is live and deployed automatically to **Vercel** (a cloud hosting service) every time new code is pushed.


## Technology Stack (Plain English)

| Tool | What It Does |
|---|---|
| **Next.js 14** | The main framework that powers the website — handles pages, routing, and server logic |
| **React** | The system that builds every visual element on the page from small reusable pieces called "components" |
| **TypeScript** | A stricter version of JavaScript that catches mistakes before the code runs |
| **Tailwind CSS** | A styling system — instead of writing separate style files, you apply style directly in the code using short class names |
| **Supabase** | A cloud database and login service — handles user accounts, sign-in, and data storage |
| **Vercel** | The hosting platform — the site deploys here automatically whenever code is merged |
| **Shadcn UI** | A library of pre-built, good-looking interface components (buttons, dropdowns, inputs, etc.) |
| **Framer Motion** | Adds smooth animations to page elements |
| **chess.js** | A chess logic library — understands the rules of chess, validates moves |
| **Lichess Chessground** | Renders an interactive, clickable chessboard in the browser |

---

## Pages & Sections

### Home Page (`/`)
The main landing page. It contains:
- **Header** — navigation bar at the top
- **Hero** — the big opening banner introducing EduNova
- **Solutions** — four interactive cards showing who EduNova serves: K-12 schools, Higher Education, Corporate Training, and Educational Research. Clicking a card shows more detail.
- **Blog** — a blog/news section
- **Contact Form** — a form visitors can use to reach the EduNova team
- **Footer** — bottom of the page with links and info

Several sections (Research, AI Section, Services) exist in the codebase but are currently commented out — meaning they are written but intentionally hidden from visitors for now.

### Mini-Games Page (`/mini-games`)
A showcase of playable educational games. Currently lists three games:

1. **Marketing Quick Race** — A quiz game where players race against an AI answering marketing questions. Useful for DECA competition prep. Difficulty levels: Easy, Medium, Hard. Has power-ups like Time Freeze and Double Score.

2. **Buzzword Blitz** — A word-unscrambling game where players learn business and career terminology across five career fields: Business, Marketing, Entrepreneurship, Hospitality & Tourism, and Finance. Has 500+ industry terms.

3. **Puzzle Quest** — Multi-type puzzle game (cable connections, path finding, parking challenges) that teaches financial literacy. Currently marked "Coming Soon."

### Chessle Page (`/chessle`)
The newest feature, currently being developed on the `Claude-Chessle` branch. Full description in the section below.

### FBLA Page (`/fbla`)
A quiz game for FBLA (Future Business Leaders of America) exam preparation. Allows students to upload PDFs and generates quiz questions from them using an AI processing endpoint.

### Auth Pages (`/auth`, `/auth/callback`, `/profile`)
Login, signup, Google sign-in, and password reset. All powered by Supabase. User accounts persist across sessions.

---

## Chessle — The New Game (Active Development)

### What It Is
Chessle is a chess-themed version of Wordle (the popular word-guessing game). Instead of guessing a word, the player guesses a sequence of chess moves that matches a famous chess opening.

Original game created by Jack Li at jackli.gg/chessle. This is a recreation built as an academic school project running in **unlimited mode** (play as many times as you want, not once a day).

### How the Game Works (for a non-chess player)
1. Before the game starts, the player selects a difficulty (Easy / Medium / Hard) and a move depth (6, 8, 10, 12, or 14 half-moves).
2. The game secretly picks a chess opening from a database of real master-game lines.
3. The player sees an interactive chessboard and enters the chosen number of moves.
4. After submitting, each move gets colored feedback:
   - **Green** = correct move in the correct position
   - **Yellow** = that move appears somewhere in the opening, but not in that spot
   - **Gray** = that move is not in the opening at all
5. The player gets 6 guesses total to match the opening exactly.
6. Win or lose, the end screen shows the correct opening name and a link to study it on Lichess. Then they can play again.

### Current Configuration
- **Move depth: 6, 8, 10, 12, or 14 half-moves** — chosen by the player at the start of each game (default 10)
- **6 guesses maximum**
- Both defaults are stored as single variables (`HALF_MOVES_PER_GUESS = 10`, `MAX_GUESSES = 6`) in `useChessle.ts`.

### Opening Database
Openings come from a crawl of the **Lichess Masters database** — real games played by titled players (IM, GM, etc.). The crawler walks the position tree breadth-first and includes any continuation played in ≥ 100 master games, up to 40 half-moves deep. This produced 48,302 unique positions. The active game dataset is built from the depth-14 slice: **6,879 openings**.

Difficulty is determined by how popular each opening is among master players: top third = Easy (well-known openings), middle third = Medium, bottom third = Hard (rare lines).

### Key Technical Decision
The opening is chosen randomly **only on the user's browser** (client side), never on the server. This prevents a crash that would occur if the server and the browser independently picked different random openings — a mismatch that would break the page load.

### Planned Future Features
1. **Customizable guess count** — let the player choose how many guesses (currently locked at 6)
2. **Shareable emoji result grid** — after the game, generate a grid of colored squares (like Wordle) that can be copied and pasted to share results
3. **Arrow key move navigation** — use left/right arrow keys to step backward and forward through moves already entered in the current row

### Files Involved in Chessle
| File | What It Does |
|---|---|
| `src/app/chessle/page.tsx` | The full page layout for the Chessle game |
| `src/hooks/useChessle.ts` | All game logic: tracking guesses, evaluating colors, handling undo/submit/play-again |
| `src/components/chessle/ChessBoard.tsx` | The visual, interactive chessboard |
| `src/components/chessle/GuessGrid.tsx` | The grid of colored tiles showing past guesses |
| `src/components/chessle/EndOfGame.tsx` | The win/loss message shown when the game ends |
| `src/components/chessle/DifficultySelect.tsx` | Two-step setup overlay: difficulty → move depth → Play |
| `src/data/chessle-openings.json` | 6,879 openings from the Lichess Masters tree (depth-14 build) |
| `src/data/chessle-difficulties.json` | Difficulty classification per opening index |
| `src/lib/chessle-ids.ts` | Algorithmic base-62 `encodeOpeningIndex` / `decodeOpeningCode` |
| `scripts/fetch-opening-tree.mjs` | One-time crawler: builds `chessle-tree.json` from the Lichess Masters API |
| `scripts/build-openings-from-tree.mjs` | Derives a flat openings dataset at a chosen depth from the tree |
| `scripts/build-all-depths.mjs` | Runs the build for all five depths (6, 8, 10, 12, 14) in one shot |

---

## Authentication System

Users can create accounts and log in using:
- **Email + Password**
- **Google sign-in**
- **Password reset** via email link

All of this is handled by **Supabase**, a third-party service. The website never stores passwords itself — Supabase does that securely.

The login state is made available to all pages through an "AuthContext" — a shared system that any page can check to see if a user is logged in or not.

---

## Repository & Branch Structure

- **Main branch:** `main` — the stable, production-ready code
- **Active branch:** `Claude-Chessle` — where Chessle development is happening
- The team uses GitHub for code collaboration and pull requests

### Recent Commits (newest first)
1. Getting rid of unnecessary upper text
2. Fix: hydration error, undo board sync, guess grid pairing
3. Implement Chessle game
4. Finished adding Chessle
5. Merge from jimmy-restoration branch

---

## Scripts Folder

The `scripts/` directory contains one-time data conversion tools used to load quiz questions into the database. These are not part of the live website — they are run manually by developers when new question sets need to be added.

Scripts cover: personal finance, accounting, advertising, business management, and cybersecurity question banks.

---

## How to Run the Site Locally

```
npm run dev
```

This starts the site at `http://localhost:3000`. Changes to code appear live without needing to restart.

```
npm run build
```

Builds the production version (what gets deployed to Vercel).

---

## Important Notes for Future Work

- **Shadcn UI** components are installed with `npm install shadcn` (not `npx shadcn-ui@latest` — that package name changed).
- Several page sections (Research, AI Section, Services) are **commented out** in `src/app/page.tsx` — they exist and can be re-enabled, but are hidden from visitors right now.
- The Chessboard component uses browser-only APIs and must be loaded **client-side only** (`dynamic` import with `ssr: false`). Loading it server-side will crash the page.

Acknowledgements: 
Contributors: Jimmy Chen and Manuel Vargas