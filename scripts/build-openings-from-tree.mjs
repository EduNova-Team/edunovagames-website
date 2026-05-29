/**
 * Builds playable-line datasets from src/data/chessle-tree.json.
 *
 * Usage:
 *   node scripts/build-openings-from-tree.mjs [options]
 *
 * Options (all optional):
 *   --depth=10         Target depth in half-moves (default 10)
 *   --tree=src/data/chessle-tree.json
 *   --openings-out=src/data/chessle-openings.json
 *   --difficulties-out=src/data/chessle-difficulties.json
 *
 * A "playable line" is:
 *   - Any node at depth == N, OR
 *   - Any TRUE terminal node (crawler-marked dead-end) at depth < N.
 * Internal nodes at depth < N are recursed into; their continuations live in the
 * spanning tree, which the crawler already deduped by position (transpositions).
 *
 * Output openings are sorted by pgn ascending (deterministic index order).
 * Duplicate terminal positions (transpositions) are deduplicated by
 * normalized FEN, keeping the lexicographically smaller pgn.
 */

import { readFileSync, writeFileSync } from "fs";
import { Chess } from "chess.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const cfg = {
    depth: 10,
    treeIn: join(__dirname, "../src/data/chessle-tree.json"),
    openingsOut: join(__dirname, "../src/data/chessle-openings.json"),
    difficultiesOut: join(__dirname, "../src/data/chessle-difficulties.json"),
  };
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k === "depth") cfg.depth = parseInt(v, 10);
    else if (k === "tree") cfg.treeIn = v.startsWith("/") ? v : join(process.cwd(), v);
    else if (k === "openings-out")
      cfg.openingsOut = v.startsWith("/") ? v : join(process.cwd(), v);
    else if (k === "difficulties-out")
      cfg.difficultiesOut = v.startsWith("/") ? v : join(process.cwd(), v);
  }
  return cfg;
}

const CONFIG = parseArgs();

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Build normalized FEN key (first 4 fields) from a SAN path. */
function fenKeyFromPath(sanPath) {
  const chess = new Chess();
  for (const san of sanPath) {
    const result = chess.move(san);
    if (!result) throw new Error(`Illegal move in path: ${san}`);
  }
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

/**
 * Build a PGN string from a SAN move array.
 * Format: "1. e4 e5 2. Nf3 Nc6 3. Bb5" (same style as existing data — move text only, no headers).
 * Manually builds numbered move text from the SAN array to match the compact style.
 */
function buildPGN(sanPath) {
  // Verify the moves are legal (replaySAN throws on illegal moves)
  const chess = new Chess();
  for (const san of sanPath) {
    const result = chess.move(san);
    if (!result) throw new Error(`Illegal move building PGN: ${san}`);
  }

  // Build "1. e4 e5 2. Nf3 Nc6 ..." style manually
  const parts = [];
  for (let i = 0; i < sanPath.length; i++) {
    if (i % 2 === 0) {
      // White move — add move number
      parts.push(`${Math.floor(i / 2) + 1}. ${sanPath[i]}`);
    } else {
      // Black move — append to same token
      parts.push(sanPath[i]);
    }
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Tree walker
// ---------------------------------------------------------------------------

/**
 * Walk the tree recursively. Emit lines for:
 *   - Nodes at depth === targetDepth (regardless of whether they have children)
 *   - Leaf nodes (no children) at depth < targetDepth
 */
function collectLines(node, targetDepth, sanPath = [], depth = 0) {
  const lines = [];

  if (depth === targetDepth) {
    // Emit this node regardless of whether it continues deeper
    lines.push({ node, sanPath: [...sanPath] });
    return lines;
  }

  // A TRUE dead-end (crawler-marked) before target depth is a genuine short line.
  // A node that is merely childless here because its continuations transpose
  // elsewhere is NOT terminal, so it is skipped (those lines appear via the
  // canonical path the position was first reached by).
  if (node.terminal) {
    if (depth > 0) lines.push({ node, sanPath: [...sanPath] });
    return lines;
  }

  // Internal node — recurse into spanning-tree children
  if (node.children) {
    for (const child of node.children) {
      lines.push(...collectLines(child, targetDepth, [...sanPath, child.san], depth + 1));
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Difficulty classification (matches fetch-opening-difficulties.mjs logic)
// ---------------------------------------------------------------------------
function classifyDifficulties(openings) {
  // Build counts array with index references
  const counts = openings.map((op, i) => ({
    index: i,
    eco: op.eco,
    name: op.name,
    games: op.games,
  }));

  const sorted = [...counts].sort((a, b) => b.games - a.games);
  const easyThreshold = sorted[Math.floor(sorted.length * 0.33)].games;
  const mediumThreshold = sorted[Math.floor(sorted.length * 0.66)].games;

  const difficulties = {};
  for (const { index, games } of counts) {
    difficulties[index] =
      games >= easyThreshold ? "easy" : games >= mediumThreshold ? "medium" : "hard";
  }

  return { difficulties, counts };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log("=== Build Openings from Tree ===");
  console.log(`Config: ${JSON.stringify(CONFIG)}`);

  // Load tree
  let tree;
  try {
    tree = JSON.parse(readFileSync(CONFIG.treeIn, "utf8"));
  } catch (e) {
    console.error(`Could not read tree file at ${CONFIG.treeIn}: ${e.message}`);
    process.exit(1);
  }

  console.log(`Tree root games: ${tree.games?.toLocaleString() ?? "unknown"}`);
  console.log(`Target depth: ${CONFIG.depth}`);

  // Collect all lines
  const rawLines = collectLines(tree, CONFIG.depth);
  console.log(`Raw lines collected: ${rawLines.length}`);

  // Build Opening objects
  const dedupMap = new Map(); // fenKey → Opening

  let built = 0;
  let deduped = 0;

  for (const { node, sanPath } of rawLines) {
    if (sanPath.length === 0) continue; // skip root (shouldn't happen normally)

    let pgn;
    try {
      pgn = buildPGN(sanPath);
    } catch (e) {
      console.warn(`  Skipping invalid path [${sanPath.join(", ")}]: ${e.message}`);
      continue;
    }

    const opening = {
      eco: node.eco ?? "",
      name: node.name ?? "",
      moves: sanPath,
      pgn,
      games: node.games ?? 0,
      depth: sanPath.length,
    };

    // Deduplicate by terminal normalized FEN
    let key;
    try {
      key = fenKeyFromPath(sanPath);
    } catch (e) {
      console.warn(`  FEN key failed for [${sanPath.join(", ")}]: ${e.message}`);
      continue;
    }

    if (dedupMap.has(key)) {
      const existing = dedupMap.get(key);
      // Keep lexicographically smaller pgn
      if (pgn < existing.pgn) {
        dedupMap.set(key, opening);
        deduped++;
      } else {
        deduped++;
      }
    } else {
      dedupMap.set(key, opening);
    }

    built++;
  }

  console.log(`Openings built: ${built}, after dedup: ${dedupMap.size} (${deduped} dupes removed)`);

  // Sort by pgn ascending (deterministic index order)
  const openings = Array.from(dedupMap.values()).sort((a, b) =>
    a.pgn < b.pgn ? -1 : a.pgn > b.pgn ? 1 : 0
  );

  console.log(`Final opening count: ${openings.length}`);

  // Write openings
  writeFileSync(CONFIG.openingsOut, JSON.stringify(openings, null, 2));
  console.log(`Wrote openings to ${CONFIG.openingsOut}`);

  // Build and write difficulties
  const { difficulties } = classifyDifficulties(openings);

  const tally = { easy: 0, medium: 0, hard: 0 };
  Object.values(difficulties).forEach((d) => tally[d]++);
  console.log(`Difficulty tally: ${JSON.stringify(tally)}`);

  writeFileSync(CONFIG.difficultiesOut, JSON.stringify({ difficulties }, null, 2));
  console.log(`Wrote difficulties to ${CONFIG.difficultiesOut}`);

  console.log("\nDone.");
}

main();
