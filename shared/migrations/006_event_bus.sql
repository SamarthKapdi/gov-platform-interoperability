CREATE TABLE IF NOT EXISTS event_subscriptions (
  id UUID PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_log (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW()
);
