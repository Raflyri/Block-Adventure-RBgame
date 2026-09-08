-- ============================================================================
-- Cloudflare D1 Database Schema: RBlock Adventure Leaderboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'classic',
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance ranking queries by game mode and score
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_score ON leaderboard(mode, score DESC);
