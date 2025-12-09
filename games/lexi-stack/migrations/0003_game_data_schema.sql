-- Lexi-Stack Game Data Database Schema
-- This database contains only game-specific data (scores, words)
-- User authentication is handled by the unified auth database

-- Scores table - game scores linked to users (user_id references users in auth DB)
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  combo REAL NOT NULL,
  longest_word TEXT,
  level INTEGER NOT NULL,
  words_played INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Words table (for tracking word usage/validation)
CREATE TABLE IF NOT EXISTS words (
  word TEXT PRIMARY KEY,
  times_used INTEGER NOT NULL DEFAULT 1,
  last_used_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_words_last_used ON words(last_used_at DESC);

-- Note: user_id references users in the narduk-games-auth database
-- Foreign key constraints cannot be enforced across databases,
-- so user validation should be done at the application level

