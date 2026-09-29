import type { RequestHandler } from 'express';

const SORT_ORDERS = {
  score_desc: 'score DESC',
  score_asc: 'score ASC',
  tx_desc: 'tx_count DESC',
  lifespan_desc: 'lifespan_days DESC',
} as const;

function isSupportedSort(sort: unknown): sort is keyof typeof SORT_ORDERS {
  return typeof sort === 'string' && Object.prototype.hasOwnProperty.call(SORT_ORDERS, sort);
}

export function getAccountSortOrder(sort: unknown): string {
  const order = isSupportedSort(sort) ? SORT_ORDERS[sort] : SORT_ORDERS.score_desc;
  return `${order}, account_id ASC`;
}

export const validateAccountSort: RequestHandler = (req, res, next) => {
  if (req.query.sort !== undefined && !isSupportedSort(req.query.sort)) {
    res.status(400).json({ error: 'Invalid sort mode' });
    return;
  }

  next();
};