import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'pulselayer.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    score INTEGER NOT NULL DEFAULT 50,
    trend TEXT NOT NULL DEFAULT 'stable',
    confidence REAL NOT NULL DEFAULT 0.85,
    anomaly_flag INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'MODERATE',
    lifespan_days INTEGER NOT NULL DEFAULT 1,
    tx_count INTEGER NOT NULL DEFAULT 0,
    active_days INTEGER NOT NULL DEFAULT 1,
    success_rate REAL NOT NULL DEFAULT 1.0,
    xlm_balance REAL NOT NULL DEFAULT 0.0,
    trustlines_count INTEGER NOT NULL DEFAULT 0,
    funder TEXT,
    created_at TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    breakdown_json TEXT NOT NULL,
    signals_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    hash TEXT NOT NULL,
    type TEXT NOT NULL,
    amount TEXT,
    asset TEXT,
    counterparty TEXT,
    successful INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    is_anomaly INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS score_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS counterparties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    counterparty_id TEXT NOT NULL,
    interaction_count INTEGER NOT NULL DEFAULT 1,
    counterparty_score INTEGER DEFAULT 50,
    FOREIGN KEY(account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS system_stats (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_score ON accounts(score DESC);
  CREATE INDEX IF NOT EXISTS idx_accounts_risk ON accounts(risk_level);
  CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_snapshots_account ON score_snapshots(account_id, timestamp ASC);
`);

console.log('Database initialized successfully at', dbPath);
