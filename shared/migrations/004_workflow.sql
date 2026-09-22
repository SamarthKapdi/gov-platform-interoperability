CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
