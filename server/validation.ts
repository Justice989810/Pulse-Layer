import { StrKey } from '@stellar/stellar-sdk';
import type { RequestHandler } from 'express';

export const requireValidAccountParam: RequestHandler<{ account: string }> = (req, res, next) => {
  if (!StrKey.isValidEd25519PublicKey(req.params.account)) {
    res.status(400).json({ error: 'Invalid Stellar account ID' });
    return;
  }

  next();
};