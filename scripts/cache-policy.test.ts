import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { apiCachePolicy } from '../server/cache-policy';

test('public account data is briefly cacheable while live API responses are not', async () => {
  const app = express();
  app.use(apiCachePolicy);
  app.get('/api/score/:account', (_req, res) => res.json({ score: 50 }));
  app.get('/api/history/:account', (_req, res) => res.json({ snapshots: [] }));
  app.get('/api/stats', (_req, res) => res.json({ status: 'ONLINE' }));
  app.get('/api/feed', (_req, res) => res.json({ transactions: [] }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    for (const path of ['/api/score/GACCOUNT', '/api/history/GACCOUNT']) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      assert.equal(response.headers.get('cache-control'), 'public, max-age=30, stale-while-revalidate=60');
    }

    for (const path of ['/api/stats', '/api/feed']) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});