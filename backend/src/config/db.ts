import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export async function initDb(){
  await pool.query(`CREATE TABLE IF NOT EXISTS users(
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS emails(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL,
    sequence_no INTEGER NOT NULL DEFAULT 0,
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','sending','sent','failed','cancelled')),
    delay_ms INTEGER NOT NULL DEFAULT 0,
    hourly_limit INTEGER NOT NULL DEFAULT 200,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    preview_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, sequence_no)
  );
  CREATE INDEX IF NOT EXISTS idx_emails_user_status ON emails(user_id,status);
  CREATE INDEX IF NOT EXISTS idx_emails_scheduled ON emails(status,scheduled_at);
  `);
}
