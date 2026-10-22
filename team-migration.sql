-- Team management: ONE new table. No existing table or data is touched.
-- Idempotent - safe to run more than once. Run in the Supabase SQL editor.
-- No seed rows: the About page has no team list today.

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  badge TEXT,
  avatar TEXT NOT NULL DEFAULT '🙂',
  photo_url TEXT,
  gradient TEXT NOT NULL DEFAULT 'purple',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members (sort_order, created_at);

-- Row-level security ON with NO policies: only the server (service role)
-- can read or write, so the public key can never list or edit members.
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
