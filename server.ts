import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

interface LeaderboardEntry {
  name: string;
  score: number;
  mode: string;
  date: string;
}

// Default starter champions for Classic Mode
const classicScores: LeaderboardEntry[] = [
  { name: "RB_Master", score: 12500, mode: "classic", date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, mode: "classic", date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, mode: "classic", date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, mode: "classic", date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, mode: "classic", date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, mode: "classic", date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, mode: "classic", date: "2026-09-04T16:10:00.000Z" }
];

// Default starter champions for Daily Challenge
const dailyScores: LeaderboardEntry[] = [
  { name: "DailyHero", score: 4800, mode: "daily", date: new Date().toISOString() },
  { name: "SpeedyBlock", score: 3950, mode: "daily", date: new Date().toISOString() },
  { name: "PuzzleAce", score: 2900, mode: "daily", date: new Date().toISOString() }
];

// Default starter champions for Sand Physics Mode
const sandScores: LeaderboardEntry[] = [
  { name: "SandWiz", score: 8900, mode: "sand", date: "2026-09-02T12:00:00.000Z" },
  { name: "DuneRacer", score: 6750, mode: "sand", date: "2026-09-03T15:20:00.000Z" },
  { name: "GrainStorm", score: 5400, mode: "sand", date: "2026-09-04T09:10:00.000Z" },
  { name: "DesertFox", score: 4200, mode: "sand", date: "2026-09-04T16:30:00.000Z" }
];

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode === 'daily' ? 'daily' : req.query.mode === 'sand' ? 'sand' : 'classic';
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateQuery = (req.query.date as string) || todayStr;

  let pool = mode === 'daily' ? dailyScores : mode === 'sand' ? sandScores : classicScores;
  let filtered = pool;

  if (mode === 'daily') {
    filtered = pool.filter(entry => entry.date.startsWith(dateQuery));
    if (filtered.length === 0) {
      filtered = pool;
    }
  }

  const sorted = [...filtered].sort((a, b) => b.score - a.score).slice(0, 10);

  res.json({
    success: true,
    mode,
    date: mode === 'daily' ? dateQuery : null,
    leaderboard: sorted,
    source: 'backend_api'
  });
});

// POST /api/leaderboard
app.post('/api/leaderboard', (req, res) => {
  try {
    const { name: rawName, score: rawScore, mode: rawMode } = req.body;
    const mode = rawMode === 'daily' ? 'daily' : rawMode === 'sand' ? 'sand' : 'classic';
    const score = parseInt(rawScore, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    let name = (rawName || '').toString().trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 12);
    if (!name || name.length < 2) {
      name = 'Player';
    }

    if (isNaN(score) || score <= 0 || score > 9999999) {
      return res.status(400).json({ success: false, error: 'Invalid score' });
    }

    const newEntry: LeaderboardEntry = {
      name,
      score,
      mode,
      date: nowIso
    };

    if (mode === 'daily') {
      dailyScores.push(newEntry);
    } else if (mode === 'sand') {
      sandScores.push(newEntry);
    } else {
      classicScores.push(newEntry);
    }

    const pool = mode === 'daily' ? dailyScores : mode === 'sand' ? sandScores : classicScores;
    let relevant = pool;
    if (mode === 'daily') {
      relevant = pool.filter(e => e.date.startsWith(todayStr));
      if (relevant.length === 0) relevant = pool;
    }

    const sorted = [...relevant].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(e => e.name === newEntry.name && e.score === newEntry.score && e.date === newEntry.date) + 1;
    const top10 = sorted.slice(0, 10);

    return res.json({
      success: true,
      mode,
      rank: rank > 0 ? rank : null,
      entry: newEntry,
      leaderboard: top10,
      source: 'backend_api',
      message: rank && rank <= 10
        ? `Luar biasa! Kamu masuk Top 10 ${mode === 'daily' ? 'Harian' : 'Dunia'} (Rank #${rank})!`
        : `Skor berhasil dicatat!`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to submit score' });
  }
});

// POST /api/shoutcaster (Local Dev Proxy to Gemini 2.5 Flash)
app.post('/api/shoutcaster', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ success: false, source: 'no_server_key', comment: null });
    }

    const prompt = (req.body?.prompt || '').toString().trim().slice(0, 600);
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Missing prompt' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'Kamu adalah komentator game e-sports yang ceria, kocak, dan menyemangati. Berikan komentar 1 kalimat singkat dalam bahasa Indonesia berdasarkan status papan game saat ini.'
              }
            ]
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 80
          }
        })
      }
    );

    if (!response.ok) {
      return res.json({ success: false, source: 'gemini_http_error', comment: null });
    }

    const data: any = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    return res.json({
      success: Boolean(rawText),
      source: 'gemini_api',
      comment: rawText ? rawText.replace(/^["']|["']$/g, '') : null
    });
  } catch (err: any) {
    return res.json({ success: false, error: err?.message, comment: null });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
