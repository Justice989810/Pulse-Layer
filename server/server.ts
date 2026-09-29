import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from './db';
import { seedAccountsDatabase, startHorizonLiveStream, indexerEvents, DEMO_WELL_KNOWN_ACCOUNTS, getOrFetchStellarAccount } from './indexer';
import { calculateTrustScore, AccountRawData } from './scoring';

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));

// Initialize HTTP server & WebSockets
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Broadcast helper
function broadcastWebSocket(message: any) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Forward indexer events to WebSockets
indexerEvents.on('live_event', (event) => {
  broadcastWebSocket(event);
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket pulse stream');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'PulseLayer Real-Time Engine Active' }));
});

// ---------------- REST ENDPOINTS ----------------

/**
 * GET /api/stats -> Indexer & Horizon System Health
 */
app.get('/api/stats', (req, res) => {
  try {
    const totalAccounts = (db.prepare('SELECT COUNT(*) as c FROM accounts').get() as any).c;
    const avgScore = (db.prepare('SELECT AVG(score) as a FROM accounts').get() as any).a;
    const totalTxs = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;
    const anomaliesCount = (db.prepare('SELECT COUNT(*) as c FROM accounts WHERE anomaly_flag = 1').get() as any).c;
    const ledger = (db.prepare("SELECT value FROM system_stats WHERE key = 'last_ledger'").get() as any)?.value || '57487890';
    const tps = (db.prepare("SELECT value FROM system_stats WHERE key = 'network_tps'").get() as any)?.value || '18.4';

    res.json({
      status: 'ONLINE',
      network: 'Stellar Public Mainnet',
      total_accounts: totalAccounts,
      avg_trust_score: Number((avgScore || 50).toFixed(1)),
      total_transactions: totalTxs,
      anomalies_count: anomaliesCount,
      last_ledger: ledger,
      network_tps: tps,
      last_updated: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/score/:account -> Live pulse score for account
 */
app.get('/api/score/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const row = db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(account) as any;

    if (row) {
      return res.json({
        account: row.account_id,
        score: row.score,
        trend: row.trend,
        confidence: row.confidence,
        anomaly_flag: Boolean(row.anomaly_flag),
        risk_level: row.risk_level,
        lifespan_days: row.lifespan_days,
        tx_count: row.tx_count,
        active_days: row.active_days,
        success_rate: row.success_rate,
        xlm_balance: row.xlm_balance,
        trustlines_count: row.trustlines_count,
        funder: row.funder,
        created_at: row.created_at,
        last_updated: row.last_updated,
        breakdown: JSON.parse(row.breakdown_json),
        signals: JSON.parse(row.signals_json),
      });
    }

    // Live Horizon query or address-specific dynamic metrics
    const rawData = await getOrFetchStellarAccount(account);
    const calculated = calculateTrustScore(rawData);

    // Save into database for indexing & future queries
    db.prepare(`
      INSERT OR REPLACE INTO accounts (
        account_id, score, trend, confidence, anomaly_flag, risk_level,
        lifespan_days, tx_count, active_days, success_rate, xlm_balance,
        trustlines_count, funder, created_at, last_updated, breakdown_json, signals_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      account, calculated.score, calculated.trend, calculated.confidence, calculated.anomaly_flag ? 1 : 0, calculated.risk_level,
      rawData.lifespan_days, rawData.tx_count, rawData.active_days, rawData.success_rate, rawData.xlm_balance,
      rawData.trustlines_count, rawData.funder || 'GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY4RendererFoundation', rawData.created_at, calculated.last_updated,
      JSON.stringify(calculated.breakdown), JSON.stringify(calculated.signals)
    );

    res.json(calculated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/history/:account -> Score snapshots over time
 */
app.get('/api/history/:account', (req, res) => {
  try {
    const { account } = req.params;
    const snapshots = db.prepare('SELECT score, timestamp FROM score_snapshots WHERE account_id = ? ORDER BY timestamp ASC').all(account);

    if (snapshots.length === 0) {
      // Fallback timeline for demonstration
      const now = Date.now();
      const mockSnapshots = Array.from({ length: 15 }, (_, i) => ({
        score: Math.min(100, Math.max(20, Math.round(50 + Math.sin(i / 2) * 15 + i))),
        timestamp: new Date(now - (15 - i) * 86400000).toISOString(),
      }));
      return res.json({ account, snapshots: mockSnapshots });
    }

    res.json({ account, snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/top -> Leaderboard of indexed accounts with filtering & search
 */
app.get('/api/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const risk = req.query.risk as string;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'score_desc';

    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    if (risk && risk !== 'ALL') {
      query += ' AND risk_level = ?';
      params.push(risk);
    }

    if (search) {
      query += ' AND (account_id LIKE ? OR funder LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'score_desc') query += ' ORDER BY score DESC';
    else if (sort === 'score_asc') query += ' ORDER BY score ASC';
    else if (sort === 'tx_desc') query += ' ORDER BY tx_count DESC';
    else if (sort === 'lifespan_desc') query += ' ORDER BY lifespan_days DESC';

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    let countQuery = 'SELECT COUNT(*) as total FROM accounts WHERE 1=1';
    const countParams: any[] = [];
    if (risk && risk !== 'ALL') {
      countQuery += ' AND risk_level = ?';
      countParams.push(risk);
    }
    if (search) {
      countQuery += ' AND (account_id LIKE ? OR funder LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const total = (db.prepare(countQuery).get(...countParams) as any).total;

    const formatted = rows.map((r) => ({
      account: r.account_id,
      score: r.score,
      trend: r.trend,
      confidence: r.confidence,
      anomaly_flag: Boolean(r.anomaly_flag),
      risk_level: r.risk_level,
      lifespan_days: r.lifespan_days,
      tx_count: r.tx_count,
      xlm_balance: r.xlm_balance,
      last_updated: r.last_updated,
    }));

    res.json({
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      accounts: formatted,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/activity/:account -> Detailed transactions & counterparties
 */
app.get('/api/activity/:account', (req, res) => {
  try {
    const { account } = req.params;
    const txs = db.prepare('SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 30').all(account);
    const counterparties = db.prepare('SELECT * FROM counterparties WHERE account_id = ? ORDER BY interaction_count DESC LIMIT 10').all(account);

    res.json({ account, transactions: txs, counterparties });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/feed -> Recent global transaction stream log
 */
app.get('/api/feed', (req, res) => {
  try {
    const txs = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 30').all();
    res.json({ transactions: txs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/export/:account -> Export intelligence JSON
 */
app.get('/api/export/:account', (req, res) => {
  try {
    const { account } = req.params;
    const accountRow = db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(account) as any;
    const snapshots = db.prepare('SELECT score, timestamp FROM score_snapshots WHERE account_id = ? ORDER BY timestamp ASC').all(account);
    const txs = db.prepare('SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 20').all(account);
    const counterparties = db.prepare('SELECT * FROM counterparties WHERE account_id = ? ORDER BY interaction_count DESC').all(account);

    if (!accountRow) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const exportPayload = {
      meta: {
        engine: 'PulseLayer Stellar Trust Signal Engine v1.0',
        exported_at: new Date().toISOString(),
        network: 'Stellar Public Mainnet',
      },
      account: {
        id: accountRow.account_id,
        score: accountRow.score,
        trend: accountRow.trend,
        confidence: accountRow.confidence,
        anomaly_flag: Boolean(accountRow.anomaly_flag),
        risk_level: accountRow.risk_level,
        lifespan_days: accountRow.lifespan_days,
        tx_count: accountRow.tx_count,
        active_days: accountRow.active_days,
        success_rate: accountRow.success_rate,
        xlm_balance: accountRow.xlm_balance,
        trustlines_count: accountRow.trustlines_count,
        funder: accountRow.funder,
        created_at: accountRow.created_at,
        last_updated: accountRow.last_updated,
      },
      score_breakdown: JSON.parse(accountRow.breakdown_json),
      signals_audit: JSON.parse(accountRow.signals_json),
      historical_snapshots: snapshots,
      counterparty_graph: counterparties,
      recent_operations: txs,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=pulselayer_${account.slice(0, 8)}.json`);
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database & start server
async function main() {
  await seedAccountsDatabase(1050);
  startHorizonLiveStream();

  server.listen(PORT, HOST, () => {
    console.log(`⚡ PulseLayer Trust Engine Server running on http://${HOST}:${PORT}`);
    console.log(`⚡ WebSocket Stream available at ws://${HOST}:${PORT}/ws`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
});
