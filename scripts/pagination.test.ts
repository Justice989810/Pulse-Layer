import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { validateTopPagination } from '../server/pagination-validation';

test('top pagination applies defaults, accepts bounds, and rejects invalid values', async () => {
  const app = express();
  app.get('/api/top', validateTopPagination, (_req, res) => {
    res.json(res.locals.pagination);
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    const defaults: Response = await fetch(`http://127.0.0.1:${address.port}/api/top`);
    assert.equal(defaults.status, 200);
    assert.deepEqual(await defaults.json(), { page: 1, limit: 50 });

    const bounds: Response = await fetch(`http://127.0.0.1:${address.port}/api/top?page=10000&limit=100`);
    assert.equal(bounds.status, 200);
    assert.deepEqual(await bounds.json(), { page: 10000, limit: 100 });

    for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=10001', 'limit=0', 'limit=101', 'limit=10&limit=20']) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}/api/top?${query}`);
      assert.equal(response.status, 400, query);
      assert.deepEqual(await response.json(), {
        error: 'Invalid pagination parameters',
        page: '1-10000',
        limit: '1-100',
      });
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});