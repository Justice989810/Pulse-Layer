import type { RequestHandler } from 'express';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_PAGE = 10_000;
const MAX_LIMIT = 100;

function parseBoundedPositiveInteger(value: unknown, fallback: number, maximum: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

export const validateTopPagination: RequestHandler = (req, res, next) => {
  const page = parseBoundedPositiveInteger(req.query.page, DEFAULT_PAGE, MAX_PAGE);
  const limit = parseBoundedPositiveInteger(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);

  if (page === null || limit === null) {
    res.status(400).json({
      error: 'Invalid pagination parameters',
      page: `1-${MAX_PAGE}`,
      limit: `1-${MAX_LIMIT}`,
    });
    return;
  }

  res.locals.pagination = { page, limit };
  next();
};