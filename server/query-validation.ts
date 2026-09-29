import type { RequestHandler } from 'express';

const RISK_LEVELS = ['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const validateRiskFilter: RequestHandler = (req, res, next) => {
  const risk = req.query.risk;
  if (risk !== undefined && (typeof risk !== 'string' || !RISK_LEVELS.includes(risk))) {
    res.status(400).json({ error: 'Invalid risk filter' });
    return;
  }

  next();
};