/**
 * Finalizes a variant dataset from the crawler's raw line list (network-free).
 *
 * Reads src/data/<variant>-openings.raw.json (flat lines emitted by
 * fetch-variant-tree.mjs), deduplicates by line-end FEN key (keeping the
 * lexicographically smaller PGN), sorts by PGN ascending (deterministic indices
 * for stable share codes), classifies difficulty by global 33/66 percentile of
 * game count, and writes the committed game files:
 *   src/data/<variant>-openings.json       flat Opening[]
 *   src/data/<variant>-difficulties.json    { difficulties: { idx: "easy|medium|hard" } }
 *
 * Usage:
 *   node scripts/build-variant-dataset.mjs --variant=koth|threecheck [--in=...] [--openings-out=...] [--difficulties-out=...]
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VARIANTS = new Set(["koth", "threecheck"]);

function parseArgs() {
  const cfg = { variant: null, in: null, openingsOut: null, difficultiesOut: null };
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, "").split("=");
    const abs = (p) => (p.startsWith("/") ? p : join(process.cwd(), p));
    if (k === "variant") cfg.variant = v;
    else if (k === "in") cfg.in = abs(v);
    else if (k === "openings-out") cfg.openingsOut = abs(v);
    else if (k === "difficulties-out") cfg.difficultiesOut = abs(v);
  }
  return cfg;
}

const CONFIG = parseArgs();

if (!CONFIG.variant || !VARIANTS.has(CONFIG.variant)) {
  console.error(`Unknown or missing --variant. Use one of: ${[...VARIANTS].join(", ")}`);
  process.exit(1);
}

const IN_PATH = CONFIG.in ?? join(__dirname, `../src/data/${CONFIG.variant}-openings.raw.json`);
const OPENINGS_OUT =
  CONFIG.openingsOut ?? join(__dirname, `../src/data/${CONFIG.variant}-openings.json`);
const DIFFICULTIES_OUT =
  CONFIG.difficultiesOut ?? join(__dirname, `../src/data/${CONFIG.variant}-difficulties.json`);

// ---------------------------------------------------------------------------
function classifyDifficulties(openings) {
  const sorted = openings.map((op) => op.games).sort((a, b) => b - a);
  const easyThreshold = sorted[Math.floor(sorted.length * 0.33)];
  const mediumThreshold = sorted[Math.floor(sorted.length * 0.66)];
  const difficulties = {};
  openings.forEach((op, i) => {
    difficulties[i] =
      op.games >= easyThreshold ? "easy" : op.games >= mediumThreshold ? "medium" : "hard";
  });
  return difficulties;
}

function main() {
  console.log(`=== Build Variant Dataset (${CONFIG.variant}) ===`);

  let raw;
  try {
    raw = JSON.parse(readFileSync(IN_PATH, "utf8"));
  } catch (e) {
    console.error(`Could not read raw lines at ${IN_PATH}: ${e.message}`);
    process.exit(1);
  }
  console.log(`Raw lines: ${raw.length.toLocaleString()}`);

  // Dedup by line-end FEN key (the crawler already deduped positions during the
  // crawl, but a position can be emitted via different paths in edge cases; keep
  // the lexicographically smaller PGN for determinism).
  const dedup = new Map();
  let dupes = 0;
  for (const line of raw) {
    const key = line.fenKey ?? line.fen ?? line.pgn;
    const existing = dedup.get(key);
    if (existing) {
      dupes++;
      if (line.pgn < existing.pgn) dedup.set(key, line);
    } else {
      dedup.set(key, line);
    }
  }
  console.log(`After dedup: ${dedup.size.toLocaleString()} (${dupes} dupes removed)`);

  // Strip internal fields, sort by PGN ascending.
  const openings = [...dedup.values()]
    .map((l) => ({
      eco: l.eco ?? "",
      name: l.name ?? "",
      moves: l.moves,
      pgn: l.pgn,
      games: l.games ?? 0,
      depth: l.depth ?? l.moves.length,
    }))
    .sort((a, b) => (a.pgn < b.pgn ? -1 : a.pgn > b.pgn ? 1 : 0));

  const difficulties = classifyDifficulties(openings);

  writeFileSync(OPENINGS_OUT, JSON.stringify(openings, null, 2));
  writeFileSync(DIFFICULTIES_OUT, JSON.stringify({ difficulties }, null, 2));

  // Summary
  const tally = { easy: 0, medium: 0, hard: 0 };
  Object.values(difficulties).forEach((d) => tally[d]++);
  const hist = {};
  for (const op of openings) hist[op.moves.length] = (hist[op.moves.length] ?? 0) + 1;

  console.log(`Final openings: ${openings.length.toLocaleString()}`);
  console.log(`Difficulty tally: ${JSON.stringify(tally)}`);
  console.log(`Length histogram: ${JSON.stringify(hist)}`);
  console.log(`Wrote ${OPENINGS_OUT}`);
  console.log(`Wrote ${DIFFICULTIES_OUT}`);
}

main();
