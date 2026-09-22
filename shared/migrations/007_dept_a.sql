CREATE TABLE IF NOT EXISTS dept_a_applications (
  id UUID PRIMARY KEY,
  applicant_id UUID NOT NULL,
  scheme_name TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
