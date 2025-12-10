-- Daily words table - stores the pre-selected word for each day
-- This allows us to pre-select words for future dates and ensure consistency

CREATE TABLE IF NOT EXISTS daily_words (
  day_number INTEGER PRIMARY KEY,
  word TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for querying by day_number (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_daily_words_day_number ON daily_words(day_number);
