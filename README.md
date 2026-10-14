# RBlock Adventure 🎮

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5%20Canvas-e34f26?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Express](https://img.shields.io/badge/Backend-Express%20API-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

**RBlock Adventure** is a joyful, colorful, and fully responsive block arcade adventure built with **React, TypeScript, Vite, HTML5 Canvas, and Express**. Featuring dynamic Candy Bombs, touch swipe gestures, themes, daily challenges, and celebratory particles!

---

## ✨ Core Features

- 🎮 **Three Game Modes**:
  - **Classic Arcade**: Infinite endurance arcade mode with level progression, combo streaks, and 1×1 Candy Bomb drops.
  - **Daily Challenge**: Worldwide daily puzzle seeded with today's date (`YYYY-MM-DD`). Every player solves the exact same layout. Includes daily streak tracking.
  - **Puzzle Mode (10 Stages)**: 10 handcrafted tactical stages with pre-set obstacle grids and limited piece queues.

- 🎨 **4 Themes & Block Skins**:
  - 🍬 **Candy Jelly**: Glossy candy blocks with shine spots and bright jelly palette.
  - ⚡ **Cyber Neon**: Synthwave glowing neon outlines and high-contrast dark theme.
  - 🍃 **Kawaii Pastel**: Gentle, soothing pastel tones with rounded pill highlights.
  - 🕹️ **Retro 8-Bit**: Authentic GameBoy monochrome arcade styling with pixel bevels.

- 💣 **Tactical 1×1 Candy Bomb**:
  - 1×1 bomb with a pulsing fuse timer that scales with level speed.
  - Clear a 3×3 grid with an explosion, screen shake, and debris collapse.
  - Awards blast bonus points and clears floating blocks.

- 🏆 **Global & Local Leaderboard**:
  - Global Hall of Fame with tabs for Classic and Daily records.
  - API backend route `/api/leaderboard` with local storage fallback.

- 👆 **Ergonomic Controls**:
  - Direct canvas touch swipe: drag to move, drag down for soft drop, quick flick down for super drop, quick tap to spin.
  - On-screen touch D-pad & action buttons (Pocket, Spin, Super Drop).
  - Full keyboard shortcuts & gamepad API support.

- 🔊 **Punchy Web Audio Synthesizer**:
  - Procedural sound effects using Web Audio API (moves, rotations, soft/hard drops, line clear chords, bomb explosion with sub-bass noise, urgent fuse ticks, victory fanfares).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, HTML5 Canvas, Vite
- **Backend API**: Node.js & Express (`/api/leaderboard`)
- **PWA**: Web App Manifest and Service Worker support

## 🚀 Development & Build

```bash
# Start dev server with Vite middleware on port 3000
npm run dev

# Build production assets
npm run build
```
