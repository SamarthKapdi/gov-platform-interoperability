CREATE TABLE IF NOT EXISTS dept_b_jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  vacancies INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dept_b_applicants (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES dept_b_jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  status TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
