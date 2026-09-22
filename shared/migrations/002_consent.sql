CREATE TABLE IF NOT EXISTS consent_requests (
  id UUID PRIMARY KEY,
  citizen_id UUID NOT NULL,
  requestor_dept TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY,
  consent_request_id UUID REFERENCES consent_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
