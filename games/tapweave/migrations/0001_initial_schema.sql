-- TapWeave Initial Schema
-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_login INTEGER
);

-- Games table for async multiplayer
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  player1_id TEXT NOT NULL,
  player2_id TEXT,
  seed_word TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT '[]',
  current_turn TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id)
);

-- Invites table for game invitations
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (inviter_id) REFERENCES users(id)
);

-- Scores table for single-player high scores
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  game_mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  chain_length INTEGER NOT NULL,
  longest_word TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_invites_game ON invites(game_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_mode ON scores(game_mode);
