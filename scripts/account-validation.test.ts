import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { requireValidAccountParam } from '../server/validation';

test('export account validation rejects invalid IDs and permits valid public keys', async () => {
  const app = express();
  app.get('/api/export/:account', requireValidAccountParam, (req, res) => {
    res.json({ account: req.params.account });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    const invalidResponse = await fetch(`http://127.0.0.1:${address.port}/api/export/not-a-stellar-key`);
    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(await invalidResponse.json(), { error: 'Invalid Stellar account ID' });

    const account = Keypair.random().publicKey();
    const validResponse = await fetch(`http://127.0.0.1:${address.port}/api/export/${account}`);
    assert.equal(validResponse.status, 200);
    assert.deepEqual(await validResponse.json(), { account });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});