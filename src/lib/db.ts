import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = "./data/vault.db";

let db: DatabaseSync | null = null;

export const getDb = (): DatabaseSync => {
  if (db) return db;
  mkdirSync("./data/vault", { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(TABLES_SQL);
  try {
    db.exec(MIGRATE_SQL); // best-effort: column exists on newer DBs
  } catch {
    /* already migrated */
  }
  db.exec(INDEX_SQL);
  return db;
};

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  media_path TEXT,
  thumbnail TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  collection TEXT,
  user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
`;

const INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id, created_at DESC);
`;

/** Full schema (fresh installs get it via getDb; kept for reference). */
export const INIT_SQL = TABLES_SQL + INDEX_SQL;

/** Idempotent migration for databases created before a column/table existed. */
export const MIGRATE_SQL = `
ALTER TABLE items ADD COLUMN user_id TEXT;
`;
