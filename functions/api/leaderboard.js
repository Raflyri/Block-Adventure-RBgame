/**
 * ============================================================================
 * Cloudflare Pages Function: /api/leaderboard
 * Handles GET (fetching Top 10) and POST (submitting a new highscore)
 * Powered by Cloudflare KV (Binding name: LEADERBOARD_KV)
 * ============================================================================
 */

// Default starter champions for initial leaderboard state or fallback
const DEFAULT_LEADERBOARD = [
  { name: "RB_Master", score: 12500, date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, date: "2026-09-04T16:10:00.000Z" }
];

const KV_KEY = "RBLOCK_TOP_SCORES";

// CORS Headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

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
 * Handle GET requests - Retrieve Top 10 Scores
 */
export async function onRequestGet(context) {
  try {
    const kv = context.env ? context.env.LEADERBOARD_KV : null;
    let scores = null;

    if (kv) {
      const data = await kv.get(KV_KEY, { type: "json" });
      if (Array.isArray(data) && data.length > 0) {
        scores = data;
      }
    }

    // If KV is not yet initialized or has no data, return default starter list
    if (!scores) {
      scores = DEFAULT_LEADERBOARD;
      // Auto-initialize KV if binding is available
      if (kv) {
        await kv.put(KV_KEY, JSON.stringify(scores));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        leaderboard: scores.slice(0, 10),
        source: kv ? "cloudflare_kv" : "mock_starter"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=15, s-maxage=30" // 15s browser cache, 30s CDN cache
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to retrieve leaderboard",
        leaderboard: DEFAULT_LEADERBOARD.slice(0, 10)
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}

/**
 * Handle POST requests - Submit a New Highscore
 */
export async function onRequestPost(context) {
  try {
    const kv = context.env ? context.env.LEADERBOARD_KV : null;
    const body = await context.request.json();

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

    // 2. Fetch existing scores
    let scores = [];
    if (kv) {
      const data = await kv.get(KV_KEY, { type: "json" });
      if (Array.isArray(data)) {
        scores = data;
      }
    }

    if (scores.length === 0) {
      scores = [...DEFAULT_LEADERBOARD];
    }

    // 3. Add new entry
    const newEntry = {
      name,
      score,
      date: new Date().toISOString()
    };

    scores.push(newEntry);

    // 4. Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // 5. Keep top 50
    scores = scores.slice(0, 50);

    // Find rank of newly added score
    const rank = scores.findIndex(
      (s) => s.name === newEntry.name && s.score === newEntry.score && s.date === newEntry.date
    ) + 1;

    // 6. Save back to KV
    if (kv) {
      await kv.put(KV_KEY, JSON.stringify(scores));
    }

    return new Response(
      JSON.stringify({
        success: true,
        rank: rank > 0 ? rank : null,
        entry: newEntry,
        leaderboard: scores.slice(0, 10),
        message: rank <= 10 ? `Luar biasa! Kamu masuk Top 10 (Rank #${rank})!` : `Skor berhasil dicatat!`
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
