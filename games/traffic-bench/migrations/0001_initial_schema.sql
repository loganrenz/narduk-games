-- 0001_initial_schema.sql
-- Placeholder schema for Traffic Bench.

CREATE TABLE IF NOT EXISTS bench_views (
  id TEXT PRIMARY KEY,
  folder TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
