-- ============================================================
-- BondsMaster Seed Data
-- Creates the default organization and the first admin user.
-- Password: admin123
--
-- Run AFTER schema.sql:
--   psql $DATABASE_URL -f lib/db/seed.sql
-- ============================================================

-- Default organization
INSERT INTO organizations (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'BondsMaster',
  'bondsmaster'
)
ON CONFLICT (slug) DO NOTHING;

-- Default admin user
-- password_hash is bcrypt of 'admin123' (cost=12)
INSERT INTO users (
  id,
  org_id,
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@bondsmaster.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2S',
  'administrator',
  'Admin',
  'User',
  TRUE
)
ON CONFLICT (email) DO NOTHING;
