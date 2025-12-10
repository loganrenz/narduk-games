-- Add day_number column to wordle_scores table
-- This allows tracking which specific day each game was played
-- Day number is calculated as days since Jan 1, 2024

ALTER TABLE wordle_scores ADD COLUMN day_number INTEGER;

-- Add unique constraint to prevent playing the same day twice
-- A user can only have one score per day_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_wordle_scores_user_day 
ON wordle_scores(user_id, day_number);

-- Add index for querying games by day_number
CREATE INDEX IF NOT EXISTS idx_wordle_scores_day_number 
ON wordle_scores(day_number);

