/**
 * ============================================================================
 * Cloudflare Pages Function: /api/leaderboard
 * Handles GET (fetching Top 10) and POST (submitting a new highscore)
 * Supports Multi-Mode: 'classic', 'sand', & 'daily'
 * Powered by Cloudflare D1 Database (Binding name: DB or LEADERBOARD_DB)
 * ============================================================================
 */

// Default starter champions for Classic Mode
const DEFAULT_CLASSIC_LEADERBOARD = [
  { name: "RB_Master", score: 12500, mode: "classic", date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, mode: "classic", date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, mode: "classic", date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, mode: "classic", date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, mode: "classic", date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, mode: "classic", date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, mode: "classic", date: "2026-09-04T16:10:00.000Z" }
];

// Default starter champions for Sand Physics Mode
const DEFAULT_SAND_LEADERBOARD = [
  { name: "SandWiz", score: 8900, mode: "sand", date: "2026-09-02T12:00:00.000Z" },
  { name: "DuneRacer", score: 6750, mode: "sand", date: "2026-09-03T15:20:00.000Z" },
  { name: "GrainStorm", score: 5400, mode: "sand", date: "2026-09-04T09:10:00.000Z" },
  { name: "DesertFox", score: 4200, mode: "sand", date: "2026-09-04T16:30:00.000Z" },
  { name: "OasisKing", score: 3100, mode: "sand", date: "2026-09-05T10:15:00.000Z" }
];

// Default starter champions for Daily Challenge
const DEFAULT_DAILY_LEADERBOARD = [
  { name: "DailyHero", score: 4800, mode: "daily", date: new Date().toISOString() },
  { name: "SpeedyBlock", score: 3950, mode: "daily", date: new Date().toISOString() },
  { name: "PuzzleAce", score: 2900, mode: "daily", date: new Date().toISOString() }
];

const VALID_MODES = ["classic", "sand", "daily"];

function normalizeMode(rawMode) {
  const m = (rawMode || "classic").toString().toLowerCase().trim();
  return VALID_MODES.includes(m) ? m : "classic";
}

function getDefaultLeaderboard(mode) {
  if (mode === "sand") return DEFAULT_SAND_LEADERBOARD;
  if (mode === "daily") return DEFAULT_DAILY_LEADERBOARD;
  return DEFAULT_CLASSIC_LEADERBOARD;
}

// CORS Headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

/**
 * Helper: Resolve D1 Database instance from environment
 * Checks 'DB', 'LEADERBOARD_DB', 'D1_DATABASE', or 'd1'
 */
function getDatabase(env) {
  if (!env) return null;
  return env.DB || env.LEADERBOARD_DB || env.D1_DATABASE || env.d1 || null;
}

/**
 * Self-healing: Ensure table and index exist in D1 automatically
 */
async function ensureTable(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        mode TEXT NOT NULL DEFAULT 'classic',
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_score ON leaderboard(mode, score DESC)
    `).run();
  } catch (err) {
    console.error("ensureTable warning:", err);
  }
}

/**
 * Seed starter champion scores if table is empty for the requested mode
 */
async function seedStarterScoresIfEmpty(db, mode) {
  if (!db) return;
  try {
    const countCheck = await db
      .prepare("SELECT COUNT(*) as total FROM leaderboard WHERE mode = ?")
      .bind(mode)
      .first();

    if (countCheck && countCheck.total === 0) {
      const starters = getDefaultLeaderboard(mode);
      const statements = starters.map((item) =>
        db
          .prepare("INSERT INTO leaderboard (name, score, mode, date) VALUES (?, ?, ?, ?)")
          .bind(item.name, item.score, mode, item.date || new Date().toISOString())
      );
      await db.batch(statements);
    }
  } catch (err) {
    console.error("seedStarterScoresIfEmpty warning:", err);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Handle GET requests - Retrieve Top 10 Scores from D1 for requested mode
 * ?mode=classic | ?mode=sand | ?mode=daily
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const mode = normalizeMode(url.searchParams.get("mode"));
  const dateQuery = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const defaultList = getDefaultLeaderboard(mode);

  try {
    const db = getDatabase(context.env);
    let scores = null;

    if (db) {
      await ensureTable(db);
      await seedStarterScoresIfEmpty(db, mode);

      let query = "SELECT name, score, mode, date FROM leaderboard WHERE mode = ? ORDER BY score DESC LIMIT 10";
      let params = [mode];

      if (mode === "daily") {
        query = "SELECT name, score, mode, date FROM leaderboard WHERE mode = ? AND date LIKE ? ORDER BY score DESC LIMIT 10";
        params = [mode, `${dateQuery}%`];
      }

      const { results } = await db.prepare(query).bind(...params).all();
      if (Array.isArray(results) && results.length > 0) {
        scores = results;
      }
    }

    if (!scores || scores.length === 0) {
      scores = defaultList;
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        date: mode === "daily" ? dateQuery : null,
        leaderboard: scores.slice(0, 10),
        source: db ? "cloudflare_d1" : "mock_starter"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=15, s-maxage=30"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        mode,
        error: error.message || "Failed to retrieve leaderboard",
        leaderboard: defaultList.slice(0, 10),
        source: "error_fallback"
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}

/**
 * Handle POST requests - Submit a New Highscore to D1 Database
 */
export async function onRequestPost(context) {
  try {
    const db = getDatabase(context.env);
    const body = await context.request.json();

    const mode = normalizeMode(body.mode);
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    // 1. Validation & sanitization
    let name = (body.name || "").toString().trim();
    const score = parseInt(body.score, 10);

    // Filter illegal chars, restrict to alphanumeric + space + underscore + hyphen
    name = name.replace(/[^a-zA-Z0-9_\-\s]/g, "").slice(0, 12);
    if (!name || name.length < 2) {
      name = "Player";
    }

    if (isNaN(score) || score <= 0 || score > 9999999) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid score" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const newEntry = {
      name,
      score,
      mode,
      date: nowIso
    };

    let rank = null;
    let top10 = [];

    if (db) {
      await ensureTable(db);
      await seedStarterScoresIfEmpty(db, mode);

      // Insert record
      await db
        .prepare("INSERT INTO leaderboard (name, score, mode, date) VALUES (?, ?, ?, ?)")
        .bind(name, score, mode, nowIso)
        .run();

      // Calculate rank: count of records with higher score + 1
      let countQuery = "SELECT COUNT(*) as higherCount FROM leaderboard WHERE mode = ? AND score > ?";
      let countParams = [mode, score];
      if (mode === "daily") {
        countQuery = "SELECT COUNT(*) as higherCount FROM leaderboard WHERE mode = ? AND date LIKE ? AND score > ?";
        countParams = [mode, `${todayStr}%`, score];
      }

      const rankRow = await db.prepare(countQuery).bind(...countParams).first();
      rank = (rankRow && typeof rankRow.higherCount === "number" ? rankRow.higherCount : 0) + 1;

      // Fetch updated top 10
      let topQuery = "SELECT name, score, mode, date FROM leaderboard WHERE mode = ? ORDER BY score DESC LIMIT 10";
      let topParams = [mode];
      if (mode === "daily") {
        topQuery = "SELECT name, score, mode, date FROM leaderboard WHERE mode = ? AND date LIKE ? ORDER BY score DESC LIMIT 10";
        topParams = [mode, `${todayStr}%`];
      }

      const { results } = await db.prepare(topQuery).bind(...topParams).all();
      top10 = results || [];
    } else {
      // Fallback if D1 is not bound
      const defaultList = getDefaultLeaderboard(mode);
      const combined = [newEntry, ...defaultList];
      combined.sort((a, b) => b.score - a.score);
      top10 = combined.slice(0, 10);
      rank = top10.findIndex((s) => s.name === newEntry.name && s.score === newEntry.score) + 1;
    }

    const modeLabel = mode === "daily" ? "Harian" : mode === "sand" ? "Sand Physics" : "Dunia";

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        rank: rank > 0 ? rank : null,
        entry: newEntry,
        leaderboard: top10,
        source: db ? "cloudflare_d1" : "mock_starter",
        message:
          rank && rank <= 10
            ? `Luar biasa! Kamu masuk Top 10 ${modeLabel} (Rank #${rank})!`
            : `Skor ${modeLabel} berhasil dicatat!`
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to submit score" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
