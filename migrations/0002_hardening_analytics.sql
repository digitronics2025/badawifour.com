PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  event TEXT NOT NULL,
  locale TEXT NOT NULL,
  path TEXT NOT NULL,
  product TEXT,
  destination TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_created
  ON analytics_events(event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created
  ON analytics_events(created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated
  ON rate_limits(updated_at);

ALTER TABLE registrations ADD COLUMN source_path TEXT;
