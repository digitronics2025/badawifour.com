PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  locale TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  model TEXT NOT NULL,
  serial_number TEXT,
  purchase_date TEXT,
  retailer TEXT,
  invoice_reference TEXT,
  receipt_key TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  privacy_consent INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_registrations_model_created
  ON registrations(model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_phone
  ON registrations(phone);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  model TEXT NOT NULL,
  serial_number TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_key TEXT,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS idx_support_status_created
  ON support_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS professional_leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  locale TEXT NOT NULL,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  country TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  business_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_professional_status_created
  ON professional_leads(status, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_contact_status_created
  ON contact_messages(status, created_at DESC);
