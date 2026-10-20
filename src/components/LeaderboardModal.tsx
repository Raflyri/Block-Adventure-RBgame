import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { LeaderboardService } from '../services/leaderboard';
import { getTodayDateString } from '../services/prng';
import { haptics } from '../services/haptics';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'classic' | 'daily' | 'sand'>('classic');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<string>('backend_api');

  const loadScores = async (mode: 'classic' | 'daily' | 'sand') => {
    setIsLoading(true);
    const result = await LeaderboardService.fetchScores(mode);
    setScores(result.scores);
    setSource(result.source);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadScores(activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const isOnline = source === 'cloudflare_d1' || source === 'backend_api' || source === 'cloudflare_kv';

  return (
    <div id="leaderboard-overlay" className="overlay">
      <div className="overlay-content candy-modal bounce-in leaderboard-modal-box">
        <div className="mascot-face">🏆</div>
        <div className="modal-badge">GLOBAL HALL OF FAME</div>
        <h2 className="overlay-title">Star Champions</h2>
        <p className="overlay-desc">Rekor skor tertinggi pemain RBlock di seluruh dunia!</p>

        {/* Leaderboard Mode Filter Tabs */}
        <div className="leaderboard-tabs-row">
          <button
            className={`lb-tab-btn ${activeTab === 'classic' ? 'active' : ''}`}
            data-lb-mode="classic"
            id="lb-tab-classic"
            onClick={() => {
              haptics.menuTap();
              setActiveTab('classic');
            }}
          >
            🧱 Rekor Klasik
          </button>
          <button
            className={`lb-tab-btn ${activeTab === 'sand' ? 'active' : ''}`}
            data-lb-mode="sand"
            id="lb-tab-sand"
            onClick={() => {
              haptics.menuTap();
              setActiveTab('sand');
            }}
          >
            ⏳ Sand Physics
          </button>
          <button
            className={`lb-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            data-lb-mode="daily"
            id="lb-tab-daily"
            onClick={() => {
              haptics.menuTap();
              setActiveTab('daily');
            }}
          >
            📅 Juara Harian
          </button>
        </div>

        {/* Connection & Status Pill */}
        <div className="lb-status-bar">
          <span
            id="lb-status-pill"
            className={`status-pill ${isOnline ? 'online' : 'offline'}`}
          >
            {isOnline ? '🟢 Online Leaderboard' : '🟡 Rekor Lokal'}
          </span>
          <span id="lb-date-pill" className="status-pill info">
            {activeTab === 'daily' ? `Hari Ini (${getTodayDateString()})` : 'Global All-Time'}
          </span>
        </div>

        <div className="leaderboard-table-container">
          {isLoading && (
            <div id="leaderboard-loading" className="leaderboard-loading">
              <span className="spinner">💫</span> Memuat rekor dunia...
            </div>
          )}

          {!isLoading && (
            <ul id="leaderboard-list" className="leaderboard-list">
              {scores.map((entry, index) => {
                const rank = index + 1;
                let rankBadge = `#${rank}`;
                if (rank === 1) rankBadge = '🥇';
                else if (rank === 2) rankBadge = '🥈';
                else if (rank === 3) rankBadge = '🥉';

                let dateStr = 'Top Rekor';
                if (entry.date) {
                  try {
                    const d = new Date(entry.date);
                    dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  } catch (e) {}
                }

                return (
                  <li
                    key={`${entry.name}-${entry.score}-${index}`}
                    className={`leaderboard-item rank-${rank <= 3 ? rank : 'rest'}`}
                  >
                    <div className="item-left">
                      <span className="rank-badge">{rankBadge}</span>
                      <div className="player-details">
                        <span className="player-name-text">{entry.name || 'Hero Player'}</span>
                        <span className="player-date-text">{dateStr}</span>
                      </div>
                    </div>
                    <div className="item-right">
                      <span className="player-score-text">
                        {Number(entry.score || 0).toLocaleString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="modal-actions leaderboard-actions">
          <button
            id="refresh-leaderboard-btn"
            className="candy-btn-secondary"
            onClick={() => {
              haptics.menuTap();
              loadScores(activeTab);
            }}
          >
            🔄 Refresh
          </button>
          <button
            id="close-leaderboard-btn"
            className="play-big-btn"
            onClick={() => {
              haptics.menuTap();
              onClose();
            }}
          >
            Tutup ✨
          </button>
        </div>
      </div>
    </div>
  );
};
