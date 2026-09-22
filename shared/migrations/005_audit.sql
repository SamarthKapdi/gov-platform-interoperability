CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  department TEXT,
  before_state TEXT,
  after_state TEXT,
  metadata TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exceptions (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
