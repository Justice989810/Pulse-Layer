import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { getAccountSortOrder, validateAccountSort } from '../server/account-sort';

test('account sorting validates modes and adds a deterministic tie-breaker', async () => {
  const app = express();
  app.get('/api/top', validateAccountSort, (req, res) => {
    res.json({ order: getAccountSortOrder(req.query.sort) });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    const expectedOrders = {
      score_desc: 'score DESC, account_id ASC',
      score_asc: 'score ASC, account_id ASC',
      tx_desc: 'tx_count DESC, account_id ASC',
      lifespan_desc: 'lifespan_days DESC, account_id ASC',
    };

    for (const [sort, order] of Object.entries(expectedOrders)) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}/api/top?sort=${sort}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { order });
    }

    const defaultResponse = await fetch(`http://127.0.0.1:${address.port}/api/top`);
    assert.deepEqual(await defaultResponse.json(), {
      order: 'score DESC, account_id ASC',
    });

    const invalidResponse = await fetch(`http://127.0.0.1:${address.port}/api/top?sort=unknown`);
    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(await invalidResponse.json(), { error: 'Invalid sort mode' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});