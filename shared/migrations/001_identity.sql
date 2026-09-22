CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  email TEXT,
  mobile TEXT,
  aadhaar TEXT,
  dob TEXT,
  gender TEXT,
  address TEXT,
  role TEXT,
  department TEXT,
  is_active INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
