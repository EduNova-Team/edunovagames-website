/**
 * Convenience wrapper: calls build-openings-from-tree.mjs for multiple
 * target half-move depths in sequence, producing separate output files
 * per depth.
 *
 * Usage:
 *   node scripts/build-all-depths.mjs [--tree=path] [--depths=6,8,10,12,14]
 *
 * Options:
 *   --tree=<path>           Path to the tree JSON (default: src/data/chessle-tree.json).
 *                           Relative paths are resolved from cwd.
 *   --depths=<n,n,...>      Comma-separated list of half-move depths to build
 *                           (default: 6,8,10,12,14).
 *
 * Outputs per depth N:
 *   src/data/chessle-openings-{N}.json
 *   src/data/chessle-difficulties-{N}.json
 *
 * Note: data files are not committed to the repo — run this script after the
 * tree JSON is ready (see scripts/fetch-opening-tree.mjs).
 *
 * The child builds run one at a time (synchronous). Each child's stdout/stderr
 * streams through directly (stdio: "inherit").
 */

import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const DEFAULT_DEPTHS = [6, 8, 10, 12, 14];
const DEFAULT_TREE = join(__dirname, "../src/data/chessle-tree.json");

function parseArgs() {
  const cfg = {
    depths: DEFAULT_DEPTHS,
    tree: DEFAULT_TREE,
  };

  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k === "depths") {
      cfg.depths = v
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (cfg.depths.length === 0) {
        console.error("--depths must be a non-empty comma-separated list of positive integers.");
        process.exit(1);
      }
    } else if (k === "tree") {
      cfg.tree = v.startsWith("/") ? v : resolve(process.cwd(), v);
    } else {
      console.warn(`Unknown argument: --${k}=${v} (ignored)`);
    }
  }

  return cfg;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cfg = parseArgs();

  const childScript = join(__dirname, "build-openings-from-tree.mjs");
  const dataDir = join(__dirname, "../src/data");

  console.log("=== build-all-depths: starting ===");
  console.log(`Depths   : ${cfg.depths.join(", ")}`);
  console.log(`Tree     : ${cfg.tree}`);
  console.log(`Output   : ${dataDir}`);
  console.log("");

  const summary = []; // { depth, count, openingsOut }

  for (const depth of cfg.depths) {
    const openingsOut = join(dataDir, `chessle-openings-${depth}.json`);
    const difficultiesOut = join(dataDir, `chessle-difficulties-${depth}.json`);

    console.log(`\n${"─".repeat(60)}`);
    console.log(`>>> depth=${depth}`);
    console.log(`    openings   -> ${openingsOut}`);
    console.log(`    difficulties -> ${difficultiesOut}`);
    console.log(`${"─".repeat(60)}\n`);

    const result = spawnSync(
      process.execPath, // node binary
      [
        childScript,
        `--depth=${depth}`,
        `--tree=${cfg.tree}`,
        `--openings-out=${openingsOut}`,
        `--difficulties-out=${difficultiesOut}`,
      ],
      { stdio: "inherit" }
    );

    if (result.error) {
      console.error(`\nFailed to spawn child for depth=${depth}: ${result.error.message}`);
      process.exit(1);
    }

    if (result.status !== 0) {
      console.error(`\nChild exited with code ${result.status} for depth=${depth}. Aborting.`);
      process.exit(result.status ?? 1);
    }

    // Count openings from output file
    let count = "?";
    try {
      const data = JSON.parse(readFileSync(openingsOut, "utf8"));
      count = Array.isArray(data) ? data.length : "?";
    } catch {
      count = "error reading output";
    }

    summary.push({ depth, count, openingsOut });
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log("=== build-all-depths: SUMMARY ===");
  console.log(`${"=".repeat(60)}`);
  const colW = 8;
  console.log(`${"Depth".padEnd(colW)} ${"Openings".padStart(10)}   Output file`);
  console.log(`${"─".repeat(colW)} ${"─".repeat(10)}   ${"─".repeat(40)}`);
  for (const { depth, count, openingsOut } of summary) {
    const countStr = typeof count === "number" ? count.toLocaleString() : count;
    console.log(
      `${String(depth).padEnd(colW)} ${countStr.padStart(10)}   ${openingsOut}`
    );
  }
  console.log(`\nAll depths complete.`);
}

main();
