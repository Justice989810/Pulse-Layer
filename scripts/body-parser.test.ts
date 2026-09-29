import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { jsonBodyErrorHandler, jsonBodyParser } from '../server/http';

test('oversized JSON requests receive a 413 response', async () => {
  const app = express();
  app.use(jsonBodyParser);
  app.post('/', (_req, res) => res.sendStatus(204));
  app.use(jsonBodyErrorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: 'x'.repeat(128 * 1024) }),
    });

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: 'Request body too large' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});