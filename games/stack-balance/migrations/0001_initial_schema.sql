-- Stack & Balance Game Data Database Schema
-- This database contains only game-specific data (scores, stats)
-- User authentication is handled by the unified auth database

-- Stack & Balance scores table - individual game results
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  height INTEGER NOT NULL DEFAULT 0,
  combo REAL NOT NULL DEFAULT 1.0,
  blocks_placed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Stack & Balance stats table - aggregated user statistics
CREATE TABLE IF NOT EXISTS stats (
  user_id TEXT PRIMARY KEY,
  best_height INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  best_combo REAL NOT NULL DEFAULT 1.0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

-- Note: user_id references users in the narduk-games-auth database
-- Foreign key constraints cannot be enforced across databases,
-- so user validation should be done at the application level

