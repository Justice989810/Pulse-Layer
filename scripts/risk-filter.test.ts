import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { validateRiskFilter } from '../server/query-validation';

test('risk filter accepts supported levels and rejects invalid values', async () => {
  const app = express();
  app.get('/api/top', validateRiskFilter, (req, res) => {
    res.json({ risk: req.query.risk ?? 'ALL' });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    for (const risk of ['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}/api/top?risk=${risk}`);
      assert.equal(response.status, 200);
    }

    const invalidResponse = await fetch(`http://127.0.0.1:${address.port}/api/top?risk=UNKNOWN`);
    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(await invalidResponse.json(), { error: 'Invalid risk filter' });

    const repeatedResponse = await fetch(`http://127.0.0.1:${address.port}/api/top?risk=LOW&risk=HIGH`);
    assert.equal(repeatedResponse.status, 400);
    assert.deepEqual(await repeatedResponse.json(), { error: 'Invalid risk filter' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});