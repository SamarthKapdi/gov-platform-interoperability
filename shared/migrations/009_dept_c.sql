CREATE TABLE IF NOT EXISTS dept_c_complaints (
  id UUID PRIMARY KEY,
  citizen_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  resolution TEXT,
  filed_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
