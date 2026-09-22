CREATE TABLE IF NOT EXISTS master_data (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  golden_record JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deduplication_links (
  id UUID PRIMARY KEY,
  master_id UUID REFERENCES master_data(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  source_id TEXT NOT NULL,
  confidence_score NUMERIC(5,2),
  linked_at TIMESTAMPTZ DEFAULT NOW()
);
