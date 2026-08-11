CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  email TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  ip_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_status_created
  ON messages(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_ip_created
  ON messages(ip_hash, created_at DESC);
