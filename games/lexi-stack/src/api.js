// API client for Lexi-Stack game data
// User authentication is handled by the shared auth client

import { getOrCreateUser as authGetOrCreateUser } from '../../../shared/auth/client.js';

const API_BASE_URL = 'https://lexi-stack-api.narduk.workers.dev';

// Get or create user (uses unified auth API)
export async function getOrCreateUser(username, userId = null) {
  return await authGetOrCreateUser(username, userId);
}

// Submit score
export async function submitScore(userId, scoreData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        score: scoreData.score,
        combo: scoreData.combo,
        longestWord: scoreData.longestWord,
        level: scoreData.level,
        wordsPlayed: scoreData.wordsPlayed || 0,
      }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}

// Get leaderboard
export async function getLeaderboard(limit = 10, offset = 0) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scores?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    return data.scores || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Track word usage
export async function trackWord(word) {
  try {
    await fetch(`${API_BASE_URL}/api/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
  } catch (error) {
    console.error('Error tracking word:', error);
  }
}

// Get stats
export async function getStats(userId = null) {
  try {
    const url = userId 
      ? `${API_BASE_URL}/api/stats?userId=${userId}`
      : `${API_BASE_URL}/api/stats`;
    const response = await fetch(url);
    const data = await response.json();
    return data.stats || {};
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
}

