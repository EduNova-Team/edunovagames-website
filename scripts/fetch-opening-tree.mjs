/**
 * Crawls the Lichess Masters opening tree depth-first (BFS by ply) and writes
 * the result to src/data/chessle-tree.json.
 *
 * Usage:
 *   LICHESS_TOKEN=<token> node scripts/fetch-opening-tree.mjs [options]
 *
 * Options (all optional):
 *   --min-games=100   Minimum master games for a child move to be expanded
 *   --max-ply=40      Safety cap on tree depth (in half-moves)
 *   --variant=standard
 *   --out=src/data/chessle-tree.json
 *
 * Resumable: caches Lichess responses to scripts/.opening-tree-cache.json.
 * Ctrl-C is safe — the cache is flushed on SIGINT and re-used on re-run.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { Chess } from "chess.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Config — edit defaults here or override with CLI args / env
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const cfg = {
    minGames: 100,
    maxPly: 40,
    variant: "standard",
    out: join(__dirname, "../src/data/chessle-tree.json"),
  };
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k === "min-games") cfg.minGames = parseInt(v, 10);
    else if (k === "max-ply") cfg.maxPly = parseInt(v, 10);
    else if (k === "variant") cfg.variant = v;
    else if (k === "out") cfg.out = v.startsWith("/") ? v : join(process.cwd(), v);
  }
  return cfg;
}

const CONFIG = parseArgs();

const VARIANT_CONFIG = {
  standard: { endpoint: "https://explorer.lichess.ovh/masters" },
};

if (!VARIANT_CONFIG[CONFIG.variant]) {
  console.error(`Unknown variant: ${CONFIG.variant}`);
  process.exit(1);
}

const ENDPOINT = VARIANT_CONFIG[CONFIG.variant].endpoint;
const LICHESS_TOKEN = process.env.LICHESS_TOKEN ?? "";
const CACHE_PATH = join(__dirname, ".opening-tree-cache.json");
const CHECKPOINT_INTERVAL = 50; // flush cache every N new network fetches

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Build normalized FEN key from a Chess instance (first 4 space-separated fields). */
function fenKey(chess) {
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

/** Convert an array of SAN moves to a comma-separated UCI string. */
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

/** Replay SAN path and return a Chess instance at that position. */
function replaySAN(sanPath) {
  const chess = new Chess();
  for (const san of sanPath) {
    const result = chess.move(san);
    if (!result) throw new Error(`Illegal move in path: ${san}`);
  }
  return chess;
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------
let cache = new Map(); // fenKey → Lichess response object
let newFetchCount = 0;  // fetches since last checkpoint

function loadCache() {
  if (existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
      cache = new Map(Object.entries(raw));
      console.log(`Loaded ${cache.size} cached positions from ${CACHE_PATH}`);
    } catch (e) {
      console.warn(`Could not parse cache file, starting fresh: ${e.message}`);
      cache = new Map();
    }
  }
}

function saveCache() {
  const obj = Object.fromEntries(cache);
  writeFileSync(CACHE_PATH, JSON.stringify(obj));
}

function maybeSaveCache(force = false) {
  if (force || newFetchCount >= CHECKPOINT_INTERVAL) {
    saveCache();
    newFetchCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Network fetch with retry
// ---------------------------------------------------------------------------
async function fetchPosition(uciMoves) {
  const url = `${ENDPOINT}?play=${uciMoves}`;
  const headers = { Accept: "application/json" };
  if (LICHESS_TOKEN) headers["Authorization"] = `Bearer ${LICHESS_TOKEN}`;

  const MAX_RETRIES = 6; // transient (transport / 5xx) retries before giving up
  let backoff = 2000;
  let retries = 0;
  while (true) {
    let res;
    try {
      res = await fetch(url, { headers });
    } catch (err) {
      // Transport-level failure: "fetch failed", ECONNRESET, DNS, timeout, etc.
      if (retries >= MAX_RETRIES) throw err;
      retries++;
      console.warn(
        `  [net] ${err.message} — retry ${retries}/${MAX_RETRIES} in ${backoff / 1000}s (play=${uciMoves})`
      );
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 32000);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      // Rate-limited or server error — back off and retry
      if (res.status !== 429 && retries >= MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} for play=${uciMoves}`);
      }
      if (res.status !== 429) retries++;
      console.warn(`  [${res.status}] retrying in ${backoff / 1000}s (play=${uciMoves})`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 32000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for play=${uciMoves}`);
    return res.json();
  }
}

/** Fetch (or return cached) position data. */
async function getPosition(sanPath) {
  const chess = replaySAN(sanPath);
  const key = fenKey(chess);

  if (cache.has(key)) {
    return { data: cache.get(key), fromCache: true };
  }

  // Need a network request — throttle first
  await sleep(350);
  const uciMoves = sanPath.length > 0 ? toUCI(sanPath) : "";
  const url_param = uciMoves === "" ? "" : uciMoves;
  const data = await fetchPosition(url_param);

  cache.set(key, data);
  newFetchCount++;
  maybeSaveCache();

  return { data, fromCache: false };
}

// ---------------------------------------------------------------------------
// Tree node builder
// ---------------------------------------------------------------------------
function makeNode(san, data) {
  const totalGames = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0);
  return {
    san,
    games: totalGames,
    eco: data.opening?.eco ?? "",
    name: data.opening?.name ?? "",
    // children added later if this node is expanded
  };
}

// ---------------------------------------------------------------------------
// BFS crawler
// ---------------------------------------------------------------------------
async function crawl() {
  loadCache();

  // Each frontier item: { sanPath: string[], parentNode: object }
  // Root
  const rootData = (await getPosition([])).data;
  const root = makeNode("", rootData);

  // Dedupe the crawl by POSITION (normalized FEN) so transpositions don't
  // explode the tree: each unique position is expanded exactly once, attached
  // under the first (shallowest) path that reaches it. The result is a bounded
  // spanning tree of the position graph (~unique positions, not move-orders).
  const visited = new Set([fenKey(replaySAN([]))]);
  const keyOf = (path) => fenKey(replaySAN(path));

  // frontier items: { sanPath, node }
  let frontier = [];

  // Seed frontier with depth-1 children of root
  for (const move of rootData.moves ?? []) {
    const childGames = (move.white ?? 0) + (move.draws ?? 0) + (move.black ?? 0);
    if (childGames < CONFIG.minGames) continue;
    const childKey = keyOf([move.san]);
    if (visited.has(childKey)) continue;
    visited.add(childKey);
    frontier.push({ sanPath: [move.san], parentNode: root });
  }

  console.log(`Root games: ${root.games.toLocaleString()}`);
  console.log(`Depth-1 qualifying moves: ${frontier.length}`);

  let depth = 1;
  let totalNodes = 0; // cumulative positions added to the tree
  let totalLeaves = 0; // cumulative terminal lines (= playable openings in the full tree)

  while (frontier.length > 0) {
    const nextFrontier = [];
    let networkFetches = 0;
    let cacheHits = 0;
    let expanded = 0;

    console.log(`\n--- Depth ${depth} — processing ${frontier.length} nodes ---`);

    // Group frontier items by their parent node to build the parent-child structure
    // We process each frontier item, fetch/cache its position data, build its node,
    // attach it to the parent, and possibly enqueue its children.
    //
    // We need to attach children to parents. We'll do it by assigning node objects
    // when we process parents' responses. The frontier carries both the sanPath
    // and a reference to the parent node so we can attach.

    // But we need to build the node for each frontier item and attach it.
    // Process all frontier items at this depth.
    const nodesAtDepth = [];

    for (const item of frontier) {
      const { sanPath, parentNode } = item;

      let data, fromCache;
      try {
        ({ data, fromCache } = await getPosition(sanPath));
      } catch (err) {
        console.warn(`  Failed to fetch ${sanPath.join(",")}: ${err.message} — skipping`);
        continue;
      }

      if (fromCache) cacheHits++;
      else networkFetches++;

      const moveSan = sanPath[sanPath.length - 1];
      const node = makeNode(moveSan, data);

      // Attach to parent
      if (!parentNode.children) parentNode.children = [];
      parentNode.children.push(node);

      expanded++;
      totalNodes++;
      nodesAtDepth.push({ sanPath, node, data });

      // Heartbeat: periodic in-depth progress so a long crawl shows live movement
      if (!fromCache && networkFetches % 50 === 0) {
        console.log(
          `    …depth ${depth}: ${expanded}/${frontier.length} nodes processed` +
            `  |  running total: ${totalNodes.toLocaleString()} positions, ` +
            `${totalLeaves.toLocaleString()} terminal lines`
        );
      }
    }

    console.log(
      `  Depth ${depth}: expanded ${expanded}  |  network ${networkFetches}, cache ${cacheHits}` +
        `  |  cumulative ${totalNodes.toLocaleString()} positions, ${totalLeaves.toLocaleString()} terminal lines`
    );

    // If we're at max ply, don't enqueue further — every node here is terminal
    if (depth >= CONFIG.maxPly) {
      for (const { node } of nodesAtDepth) node.terminal = true;
      totalLeaves += expanded;
      console.log(`  Reached MAX_PLY=${CONFIG.maxPly}, stopping expansion.`);
      break;
    }

    // Enqueue qualifying children, deduped by position. `terminal` marks a TRUE
    // dead-end (no continuation has >= minGames), distinct from a node that is
    // childless here only because its continuations were reached via another path
    // (transposition). The build relies on `terminal` for genuine short lines.
    for (const { sanPath, node, data } of nodesAtDepth) {
      let qualifyingChildren = 0;
      for (const move of data.moves ?? []) {
        const childGames = (move.white ?? 0) + (move.draws ?? 0) + (move.black ?? 0);
        if (childGames < CONFIG.minGames) continue;
        qualifyingChildren++;
        const childKey = keyOf([...sanPath, move.san]);
        if (visited.has(childKey)) continue; // transposition — already in the tree
        visited.add(childKey);
        nextFrontier.push({ sanPath: [...sanPath, move.san], parentNode: node });
      }
      node.terminal = qualifyingChildren === 0;
      if (node.terminal) totalLeaves++;
    }

    console.log(`  Next frontier size: ${nextFrontier.length}`);
    frontier = nextFrontier;
    depth++;
  }

  console.log(
    `\nCrawl complete. ${totalNodes.toLocaleString()} positions, ` +
      `${totalLeaves.toLocaleString()} terminal lines, max depth ${depth} ply.`
  );

  // Final cache save
  maybeSaveCache(true);

  return root;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Lichess Masters Opening Tree Crawler ===");
  console.log(`Config: ${JSON.stringify(CONFIG)}`);
  console.log(`Output: ${CONFIG.out}`);

  // Handle Ctrl-C gracefully
  process.on("SIGINT", () => {
    console.log("\nSIGINT received — saving cache and exiting…");
    maybeSaveCache(true);
    process.exit(0);
  });

  const tree = await crawl();

  writeFileSync(CONFIG.out, JSON.stringify(tree, null, 2));
  console.log(`\nWrote tree to ${CONFIG.out}`);
}

main().catch((e) => {
  console.error(e);
  maybeSaveCache(true);
  process.exit(1);
});
