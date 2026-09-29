import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dataDir: string;
let database: import('better-sqlite3').Database;

before(async () => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'pulse-layer-db-test-'));
  process.env.DATA_DIR = dataDir;
  database = (await import('../server/db')).db;
});

after(() => {
  database.close();
  rmSync(dataDir, { recursive: true, force: true });
});

test('database rejects transactions and snapshots for unknown accounts', () => {
  assert.equal(database.pragma('foreign_keys', { simple: true }), 1);

  assert.throws(() => {
    database.prepare(`
      INSERT INTO transactions (id, account_id, hash, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('orphan-transaction', 'missing-account', 'hash', 'payment', new Date().toISOString());
  }, /FOREIGN KEY constraint failed/);

  assert.throws(() => {
    database.prepare(`
      INSERT INTO score_snapshots (account_id, score, timestamp)
      VALUES (?, ?, ?)
    `).run('missing-account', 50, new Date().toISOString());
  }, /FOREIGN KEY constraint failed/);
});