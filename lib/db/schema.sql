-- ============================================================
-- BondsMaster Database Schema
-- Version: 1.0
-- Run against Neon PostgreSQL:
--   psql $DATABASE_URL -f lib/db/schema.sql
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'administrator',
    'manager',
    'agent',
    'receptionist',
    'collector',
    'read_only'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_action AS ENUM (
    'login',
    'logout',
    'invite_sent',
    'invite_accepted',
    'password_reset_requested',
    'password_reset_completed',
    'user_created',
    'user_updated',
    'user_deactivated',
    'role_changed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Organizations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT,                          -- NULL until invite is accepted
  role                user_role NOT NULL DEFAULT 'agent',
  first_name          TEXT NOT NULL DEFAULT '',
  last_name           TEXT NOT NULL DEFAULT '',
  avatar_url          TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,

  -- Invite flow
  invite_token_hash   TEXT,                          -- hashed invite JWT
  invite_expires_at   TIMESTAMPTZ,
  invited_by          UUID REFERENCES users(id),

  -- MFA (ready — not yet enforced)
  mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret          TEXT,                          -- encrypted TOTP secret when enabled

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id  ON users(org_id);

-- ─── Sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,                 -- SHA-256 of JWT jti claim
  expires_at   TIMESTAMPTZ NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- ─── Password Reset Tokens ───────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,                  -- SHA-256 of signed JWT
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,                           -- NULL = unused
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);

-- ─── Activity Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action       activity_action NOT NULL,
  entity_type  TEXT,                                 -- e.g. 'user', 'bond', 'defendant'
  entity_id    UUID,
  metadata     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id  ON activity_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action  ON activity_logs(action);

-- ─── Auto-update updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
