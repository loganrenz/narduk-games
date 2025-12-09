-- Wordle Clone Game Data Database Schema
-- This database contains only game-specific data (scores, stats)
-- User authentication is handled by the unified auth database

-- Wordle scores table - individual game results
CREATE TABLE IF NOT EXISTS wordle_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0, -- 0 = lost, 1 = won
  target_word TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Wordle stats table - aggregated user statistics
CREATE TABLE IF NOT EXISTS wordle_stats (
  user_id TEXT PRIMARY KEY,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_played INTEGER, -- Day number of last played game
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wordle_scores_user_id ON wordle_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_wordle_scores_created_at ON wordle_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wordle_scores_won ON wordle_scores(won);

-- Note: user_id references users in the narduk-games-auth database
-- Foreign key constraints cannot be enforced across databases,
-- so user validation should be done at the application level

