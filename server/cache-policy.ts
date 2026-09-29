import type { RequestHandler } from 'express';

const SHORT_PUBLIC_CACHE = 'public, max-age=30, stale-while-revalidate=60';

export const apiCachePolicy: RequestHandler = (req, res, next) => {
  const isAccountData =
    req.method === 'GET' && /^\/api\/(score|history)\/[^/]+$/.test(req.path);

  res.setHeader('Cache-Control', isAccountData ? SHORT_PUBLIC_CACHE : 'no-store');
  next();
};