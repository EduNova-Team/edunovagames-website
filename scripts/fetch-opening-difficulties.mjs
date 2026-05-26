/**
 * One-time script: queries the Lichess opening explorer for each opening in
 * chessle-openings.json, records the total game count, then classifies every
 * opening as "easy", "medium", or "hard" by percentile:
 *   top    33% by game count → easy   (common, well-known openings)
 *   middle 33%               → medium
 *   bottom 33%               → hard   (rare, obscure openings)
 *
 * Output: src/data/chessle-difficulties.json
 * Run once with:  node scripts/fetch-opening-difficulties.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { Chess } from "chess.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const openings = JSON.parse(
  readFileSync(join(__dirname, "../src/data/chessle-openings.json"), "utf8")
);

/** Convert an array of SAN moves to a comma-separated UCI string (e.g. "e2e4,e7e5") */
function toUCI(sanMoves) {
  const chess = new Chess();
  const uci = [];
  for (const san of sanMoves) {
    const result = chess.move(san);
    if (!result) throw new Error(`Illegal move: ${san}`);
    uci.push(result.from + result.to + (result.promotion ?? ""));
  }
  return uci.join(",");
}

// Paste your Lichess personal API token here (lichess.org → Settings → API access tokens)
const LICHESS_TOKEN = process.env.LICHESS_TOKEN ?? "";

/** Fetch total games for a UCI move sequence from the Lichess explorer */
async function fetchGameCount(uciMoves) {
  const url = `https://explorer.lichess.ovh/lichess?play=${uciMoves}&speeds=blitz,rapid,classical&ratings=1600,1800,2000,2200,2500`;
  const headers = { "Accept": "application/json" };
  if (LICHESS_TOKEN) headers["Authorization"] = `Bearer ${LICHESS_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${uciMoves}`);
  const data = await res.json();
  return (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0);
}

/** Sleep to avoid hammering the API */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Fetching game counts for ${openings.length} openings…`);
  const counts = [];

  for (let i = 0; i < openings.length; i++) {
    const opening = openings[i];
    try {
      const uci = toUCI(opening.moves);
      const count = await fetchGameCount(uci);
      counts.push({ index: i, eco: opening.eco, name: opening.name, games: count });
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${openings.length} done`);
    } catch (err) {
      console.warn(`  [${i}] ${opening.eco} failed: ${err.message} — defaulting to 0`);
      counts.push({ index: i, eco: opening.eco, name: opening.name, games: 0 });
    }
    // ~3 requests/sec to stay well under rate limits
    await sleep(350);
  }

  // Classify by percentile
  const sorted = [...counts].sort((a, b) => b.games - a.games);
  const easyThreshold  = sorted[Math.floor(sorted.length * 0.33)].games;
  const mediumThreshold = sorted[Math.floor(sorted.length * 0.66)].games;

  const difficulties = {};
  for (const { index, games } of counts) {
    difficulties[index] =
      games >= easyThreshold  ? "easy"   :
      games >= mediumThreshold ? "medium" : "hard";
  }

  // Summary
  const tally = { easy: 0, medium: 0, hard: 0 };
  Object.values(difficulties).forEach((d) => tally[d]++);
  console.log(`\nClassification: ${JSON.stringify(tally)}`);
  console.log(`Game count range: ${sorted.at(-1).games} – ${sorted[0].games}`);

  writeFileSync(
    join(__dirname, "../src/data/chessle-difficulties.json"),
    JSON.stringify({ difficulties, counts }, null, 2)
  );
  console.log("\nWrote src/data/chessle-difficulties.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
