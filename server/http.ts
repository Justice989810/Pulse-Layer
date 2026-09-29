import express, { type ErrorRequestHandler } from 'express';

export const JSON_BODY_LIMIT = '100kb';
export const jsonBodyParser = express.json({ limit: JSON_BODY_LIMIT });

export const jsonBodyErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if ((error as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }

  next(error);
};