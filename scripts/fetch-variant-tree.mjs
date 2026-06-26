/**
 * Crawls a Lichess VARIANT opening tree depth-first and emits a flat list of
 * playable opening lines to src/data/<variant>-openings.raw.json.
 *
 * Unlike the standard masters crawler (scripts/fetch-opening-tree.mjs, which is
 * BFS-by-ply + a separate per-depth build step), this is a single-pass DFS that
 * records each finished line tagged with its half-move depth. A global visited
 * set (keyed by a variant-aware FEN) keeps it a spanning-tree DFS of the
 * position graph, so each unique position is fetched at most once — DFS without
 * this would re-expand transpositions and explode the fetch count.
 *
 * Usage:
 *   LICHESS_TOKEN=<token> node scripts/fetch-variant-tree.mjs --variant=koth [options]
 *
 * Options:
 *   --variant=koth|threecheck   (required)
 *   --min-games=30              Min games for a child move to be expanded
 *   --max-ply=14                Cap on line length (half-moves)
 *   --speeds=...                Optional Lichess speeds filter (comma list)
 *   --ratings=...               Optional Lichess ratings filter (comma list)
 *   --probe                     Calibration mode: shallow crawl, print the
 *                               game-count distribution, write nothing
 *   --out=src/data/<variant>-openings.raw.json
 *
 * Resumable: caches Lichess responses to scripts/.variant-<variant>-cache.json.
 * Ctrl-C is safe — the cache is flushed on SIGINT and re-used on re-run.
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { execFile } from "child_process";
import { Chess } from "chess.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------
const VARIANT_CONFIG = {
  // `tag` labels each line in the shared `logs` file so KOTH and 3+ runs are
  // unambiguous even when interleaved.
  koth: { slug: "kingOfTheHill", threeCheck: false, tag: "KOTH" },
  threecheck: { slug: "threeCheck", threeCheck: true, tag: "3+" },
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const cfg = {
    variant: null,
    minGames: 30,
    maxPly: 14,
    speeds: "",
    ratings: "",
    probe: false,
    out: null,
    // "curl" shells out to curl (default — robust in environments where Node's
    // undici fetch can't open sockets); "fetch" uses Node's global fetch.
    http: "curl",
    // Shared progress log (timestamped, per-variant tagged). Both variants append
    // here so it can be tailed overnight to see how far each crawl has gotten.
    log: "logs",
  };
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k === "variant") cfg.variant = v;
    else if (k === "min-games") cfg.minGames = parseInt(v, 10);
    else if (k === "max-ply") cfg.maxPly = parseInt(v, 10);
    else if (k === "speeds") cfg.speeds = v;
    else if (k === "ratings") cfg.ratings = v;
    else if (k === "probe") cfg.probe = true;
    else if (k === "http") cfg.http = v;
    else if (k === "log") cfg.log = v;
    else if (k === "out") cfg.out = v.startsWith("/") ? v : join(process.cwd(), v);
  }
  return cfg;
}

const CONFIG = parseArgs();

if (!CONFIG.variant || !VARIANT_CONFIG[CONFIG.variant]) {
  console.error(
    `Unknown or missing --variant. Use one of: ${Object.keys(VARIANT_CONFIG).join(", ")}`
  );
  process.exit(1);
}

const VARIANT = VARIANT_CONFIG[CONFIG.variant];
const LICHESS_TOKEN = process.env.LICHESS_TOKEN ?? "";
if (!LICHESS_TOKEN) {
  console.error(
    "LICHESS_TOKEN is required (the variant explorer returns 401 without it).\n" +
      "Run: LICHESS_TOKEN=<token> node scripts/fetch-variant-tree.mjs --variant=" +
      CONFIG.variant
  );
  process.exit(1);
}

// Probe defaults: shallow and broad so we can see the distribution.
if (CONFIG.probe) {
  if (process.argv.every((a) => !a.startsWith("--max-ply"))) CONFIG.maxPly = 8;
  if (process.argv.every((a) => !a.startsWith("--min-games"))) CONFIG.minGames = 50;
}

const ENDPOINT = "https://explorer.lichess.ovh/lichess";
const CACHE_PATH = join(__dirname, `.variant-${CONFIG.variant}-cache.json`);
const OUT_PATH =
  CONFIG.out ?? join(__dirname, `../src/data/${CONFIG.variant}-openings.raw.json`);
const LOG_PATH = CONFIG.log.startsWith("/") ? CONFIG.log : join(process.cwd(), CONFIG.log);
const CHECKPOINT_INTERVAL = 50;

/** Append one timestamped, variant-tagged line to the shared progress log AND echo
 *  it to stdout. Both KOTH and 3+ write to the same file; the [tag] disambiguates. */
function logLine(msg) {
  const line = `[${new Date().toISOString()}] [${VARIANT.tag}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_PATH, line + "\n");
  } catch {
    /* logging must never crash the crawl */
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function gamesOf(m) {
  return (m.white ?? 0) + (m.draws ?? 0) + (m.black ?? 0);
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

/**
 * Replay a SAN path and return { chess, key, fen }.
 * The dedup `key` is the first 4 FEN fields (board, side, castling, en-passant).
 * For Three Check we append `+<whiteChecks>+<blackChecks>` (each capped at 3),
 * because chess.js's FEN does NOT encode the running check counters — two boards
 * with different check tallies are genuinely different states with different
 * explorer continuations, so they must not dedup together.
 */
function replay(sanPath) {
  const chess = new Chess();
  let whiteChecks = 0;
  let blackChecks = 0;
  for (const san of sanPath) {
    const mover = chess.turn(); // 'w' | 'b' before the move
    const result = chess.move(san);
    if (!result) throw new Error(`Illegal move in path: ${san}`);
    if (/[+#]$/.test(result.san)) {
      if (mover === "w") whiteChecks = Math.min(3, whiteChecks + 1);
      else blackChecks = Math.min(3, blackChecks + 1);
    }
  }
  const fen = chess.fen();
  let key = fen.split(" ").slice(0, 4).join(" ");
  if (VARIANT.threeCheck) key += ` +${whiteChecks}+${blackChecks}`;
  return { chess, key, fen };
}

/** Build "1. e4 e5 2. Nf3 ..." move text from a SAN array. */
function buildPGN(sanPath) {
  const parts = [];
  for (let i = 0; i < sanPath.length; i++) {
    if (i % 2 === 0) parts.push(`${Math.floor(i / 2) + 1}. ${sanPath[i]}`);
    else parts.push(sanPath[i]);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
let cache = new Map(); // key → Lichess response
let newFetchCount = 0;

function loadCache() {
  if (existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
      cache = new Map(Object.entries(raw));
      console.log(`Loaded ${cache.size} cached positions from ${CACHE_PATH}`);
    } catch (e) {
      console.warn(`Could not parse cache, starting fresh: ${e.message}`);
      cache = new Map();
    }
  }
}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(Object.fromEntries(cache)));
}

function maybeSaveCache(force = false) {
  if (force || newFetchCount >= CHECKPOINT_INTERVAL) {
    saveCache();
    newFetchCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------
function buildURL(uciMoves) {
  const params = [`variant=${VARIANT.slug}`];
  if (CONFIG.speeds) params.push(`speeds=${CONFIG.speeds}`);
  if (CONFIG.ratings) params.push(`ratings=${CONFIG.ratings}`);
  params.push(`play=${uciMoves}`);
  return `${ENDPOINT}?${params.join("&")}`;
}

const HEADERS = { Accept: "application/json", Authorization: `Bearer ${LICHESS_TOKEN}` };

/** GET via curl. Returns { status, text }. curl uses Node-independent sockets,
 *  which works in sandboxes where undici fetch cannot connect. */
function curlGet(url) {
  return new Promise((resolve, reject) => {
    const args = ["-s", "-S", "--compressed", "--max-time", "60"];
    for (const [k, v] of Object.entries(HEADERS)) args.push("-H", `${k}: ${v}`);
    args.push("-w", "\n__HTTP_STATUS__:%{http_code}", url);
    execFile("curl", args, { maxBuffer: 128 * 1024 * 1024 }, (err, stdout) => {
      const marker = "\n__HTTP_STATUS__:";
      const i = stdout ? stdout.lastIndexOf(marker) : -1;
      if (i === -1) return reject(new Error(err ? err.message : "curl: no status marker"));
      resolve({ status: parseInt(stdout.slice(i + marker.length).trim(), 10), text: stdout.slice(0, i) });
    });
  });
}

/** GET via Node's global fetch (--http=fetch). */
async function fetchGet(url) {
  const res = await fetch(url, { headers: HEADERS });
  return { status: res.status, text: await res.text() };
}

const httpGet = (url) => (CONFIG.http === "fetch" ? fetchGet(url) : curlGet(url));

async function fetchPosition(uciMoves) {
  const url = buildURL(uciMoves);

  const MAX_RETRIES = 6;
  let backoff = 2000;
  let retries = 0;
  while (true) {
    let status, text;
    try {
      ({ status, text } = await httpGet(url));
    } catch (err) {
      if (retries >= MAX_RETRIES) throw err;
      retries++;
      console.warn(`  [net] ${err.message} — retry ${retries}/${MAX_RETRIES} in ${backoff / 1000}s`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 32000);
      continue;
    }
    if (status === 429 || status >= 500) {
      if (status !== 429 && retries >= MAX_RETRIES) {
        throw new Error(`HTTP ${status} for play=${uciMoves}`);
      }
      if (status !== 429) retries++;
      console.warn(`  [${status}] retrying in ${backoff / 1000}s (play=${uciMoves})`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 32000);
      continue;
    }
    if (status === 401) throw new Error("HTTP 401 — LICHESS_TOKEN missing or invalid.");
    if (status < 200 || status >= 300) throw new Error(`HTTP ${status} for play=${uciMoves}`);
    return JSON.parse(text);
  }
}

/** Fetch (or return cached) position data for a SAN path. */
async function getPosition(sanPath, key) {
  if (cache.has(key)) return { data: cache.get(key), fromCache: true };
  await sleep(350); // throttle network only
  const data = await fetchPosition(sanPath.length > 0 ? toUCI(sanPath) : "");
  cache.set(key, data);
  newFetchCount++;
  maybeSaveCache();
  return { data, fromCache: false };
}

// ---------------------------------------------------------------------------
// DFS crawl
// ---------------------------------------------------------------------------
async function crawl() {
  loadCache();

  const visited = new Set();
  const lines = []; // emitted opening records
  const stats = {
    fetches: 0,
    cacheHits: 0,
    positions: 0,
    maxDepth: 0,
    perDepthPositions: {}, // depth → count
    perDepthChildGames: {}, // depth → number[] of child game counts (probe)
  };

  // Seed visited with the root position so it's never re-expanded.
  visited.add(replay([]).key);

  async function dfs(sanPath, depth) {
    let key, fen;
    try {
      ({ key, fen } = replay(sanPath));
    } catch (e) {
      console.warn(`  skip illegal path [${sanPath.join(",")}]: ${e.message}`);
      return;
    }

    let data, fromCache;
    try {
      ({ data, fromCache } = await getPosition(sanPath, key));
    } catch (e) {
      console.warn(`  failed [${sanPath.join(",")}]: ${e.message} — skipping`);
      return;
    }
    if (fromCache) stats.cacheHits++;
    else stats.fetches++;
    stats.positions++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    stats.perDepthPositions[depth] = (stats.perDepthPositions[depth] ?? 0) + 1;

    if (CONFIG.probe) {
      const bucket = (stats.perDepthChildGames[depth] ??= []);
      for (const m of data.moves ?? []) bucket.push(gamesOf(m));
    }

    if (stats.positions % 50 === 0) {
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      logLine(
        `searching… ${stats.positions.toLocaleString()} positions visited ` +
          `(net ${stats.fetches}, cache ${stats.cacheHits}), ` +
          `${lines.length.toLocaleString()} lines emitted, at depth ${depth}, ${secs}s elapsed`
      );
    }

    const qualifying = (data.moves ?? []).filter((m) => gamesOf(m) >= CONFIG.minGames);
    const atMax = depth >= CONFIG.maxPly;

    // A line is emitted when it's a genuine dead-end (no qualifying child — a
    // natural variant ending or just too-rare continuations) or hits max ply.
    if (qualifying.length === 0 || atMax) {
      if (sanPath.length > 0 && !CONFIG.probe) {
        lines.push({
          eco: data.opening?.eco ?? "",
          name: data.opening?.name ?? "",
          moves: [...sanPath],
          pgn: buildPGN(sanPath),
          games: gamesOf(data),
          depth: sanPath.length,
          fenKey: key,
          fen,
        });
      }
      return;
    }

    for (const m of qualifying) {
      const childPath = [...sanPath, m.san];
      let childKey;
      try {
        childKey = replay(childPath).key;
      } catch {
        continue;
      }
      if (visited.has(childKey)) continue; // transposition — already represented
      visited.add(childKey);
      await dfs(childPath, depth + 1);
    }
  }

  const t0 = Date.now();
  await dfs([], 0);
  maybeSaveCache(true);

  return { lines, stats, elapsedMs: Date.now() - t0 };
}

// ---------------------------------------------------------------------------
// Probe reporting
// ---------------------------------------------------------------------------
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.floor((p / 100) * sortedArr.length));
  return sortedArr[idx];
}

function printProbeReport(stats) {
  console.log(`\n=== CALIBRATION PROBE (${CONFIG.variant}) ===`);
  console.log(
    `Descended children with >= ${CONFIG.minGames} games, capped at ${CONFIG.maxPly} ply.`
  );
  console.log(
    `Positions visited: ${stats.positions.toLocaleString()} | network ${stats.fetches}, cache ${stats.cacheHits}\n`
  );
  const thresholds = [10, 20, 30, 50, 100, 300, 1000];
  const depths = Object.keys(stats.perDepthChildGames)
    .map(Number)
    .sort((a, b) => a - b);
  console.log("Child-move game-count distribution by depth (depth = ply of the PARENT):");
  console.log(
    "depth  positions  children   min    p25    p50    p75    p90     max   |  " +
      thresholds.map((t) => `>=${t}`).join("  ")
  );
  for (const d of depths) {
    const arr = stats.perDepthChildGames[d].slice().sort((a, b) => a - b);
    const pos = stats.perDepthPositions[d] ?? 0;
    const counts = thresholds.map((t) => arr.filter((g) => g >= t).length);
    console.log(
      `${String(d).padStart(5)}  ${String(pos).padStart(9)}  ${String(arr.length).padStart(8)}  ` +
        [
          arr[0] ?? 0,
          percentile(arr, 25),
          percentile(arr, 50),
          percentile(arr, 75),
          percentile(arr, 90),
          arr[arr.length - 1] ?? 0,
        ]
          .map((n) => String(n).padStart(6))
          .join(" ") +
        "   |  " +
        counts.map((c) => String(c).padStart(`>=${thresholds[0]}`.length)).join("  ")
    );
  }
  console.log(
    "\nPick --min-games so the tree stays usefully broad but prunes rare junk." +
      "\nThen run the full crawl, e.g.:" +
      `\n  LICHESS_TOKEN=… node scripts/fetch-variant-tree.mjs --variant=${CONFIG.variant} --min-games=<N> --max-ply=14`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`=== Lichess Variant Crawler (${CONFIG.variant} / ${VARIANT.slug}) ===`);
  console.log(`Config: ${JSON.stringify({ ...CONFIG, out: OUT_PATH })}`);
  logLine(
    `CRAWL STARTED${CONFIG.probe ? " (PROBE)" : ""} — slug=${VARIANT.slug}, ` +
      `min-games=${CONFIG.minGames}, max-ply=${CONFIG.maxPly}, http=${CONFIG.http}`
  );

  process.on("SIGINT", () => {
    logLine("INTERRUPTED (SIGINT) — saving cache and exiting.");
    maybeSaveCache(true);
    process.exit(0);
  });

  const { lines, stats, elapsedMs } = await crawl();

  logLine(
    `CRAWL COMPLETE in ${(elapsedMs / 1000).toFixed(1)}s — ` +
      `${stats.positions.toLocaleString()} positions (net ${stats.fetches}, cache ${stats.cacheHits}), ` +
      `${lines.length.toLocaleString()} lines emitted, max depth ${stats.maxDepth} ply.`
  );

  if (CONFIG.probe) {
    printProbeReport(stats);
    return;
  }

  // Quick line-length histogram
  const hist = {};
  for (const l of lines) hist[l.depth] = (hist[l.depth] ?? 0) + 1;
  console.log(`Emitted ${lines.length.toLocaleString()} lines. Length histogram:`);
  console.log("  " + JSON.stringify(hist));

  writeFileSync(OUT_PATH, JSON.stringify(lines, null, 2));
  console.log(`Wrote raw lines to ${OUT_PATH}`);
  console.log(`Next: node scripts/build-variant-dataset.mjs --variant=${CONFIG.variant}`);
}

main().catch((e) => {
  console.error(e);
  maybeSaveCache(true);
  process.exit(1);
});
