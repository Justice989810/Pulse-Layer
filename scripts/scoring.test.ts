import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateTrustScore, type AccountRawData } from '../server/scoring';

function accountData(overrides: Partial<AccountRawData> = {}): AccountRawData {
  return {
    account_id: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    created_at: '2025-01-01T00:00:00.000Z',
    lifespan_days: 1,
    tx_count: 0,
    active_days: 0,
    success_rate: 1,
    xlm_balance: 0,
    trustlines_count: 0,
    ...overrides,
  };
}

test('risk levels change at exact score boundaries', () => {
  const cases = [
    { expectedScore: 34, expectedRisk: 'CRITICAL', input: { tx_per_day_max: 16, low_score_counterparty_ratio: 0.21 } },
    { expectedScore: 35, expectedRisk: 'HIGH', input: { tx_per_day_max: 31 } },
    { expectedScore: 54, expectedRisk: 'HIGH', input: { trustlines_count: 2 } },
    { expectedScore: 55, expectedRisk: 'MODERATE', input: { lifespan_days: 24, trustlines_count: 2 } },
    { expectedScore: 74, expectedRisk: 'MODERATE', input: { lifespan_days: 365, active_days: 365, tx_count: 5, success_rate: 0.76 } },
    { expectedScore: 75, expectedRisk: 'LOW', input: { lifespan_days: 365, active_days: 365, tx_count: 5, success_rate: 0.79 } },
  ];

  for (const { expectedScore, expectedRisk, input } of cases) {
    const result = calculateTrustScore(accountData(input));
    assert.equal(result.score, expectedScore);
    assert.equal(result.risk_level, expectedRisk);
  }
});

test('simultaneous penalties retain their deltas and clamp the final score', () => {
  const result = calculateTrustScore(accountData({
    tx_count: 5,
    success_rate: 0.5,
    tx_per_day_max: 31,
    dormant_burst_detected: true,
    low_score_counterparty_ratio: 0.41,
  }));

  assert.equal(result.score, 0);
  assert.deepEqual(result.signals.map(({ id, delta }) => [id, delta]), [
    ['new_account', 0],
    ['velocity_spike', -15],
    ['dormant_burst', -20],
    ['low_score_exposure', -15],
    ['failed_tx_ratio', -10],
  ]);
  assert.equal(result.breakdown.risk_exposure, 0);
});

test('scoring factors and signals are deterministic for identical input', () => {
  const input = accountData({
    lifespan_days: 365,
    active_days: 180,
    tx_count: 520,
    success_rate: 0.99,
    xlm_balance: 1500,
    trustlines_count: 5,
    counterparty_scores: [90, 85, 95],
    recent_scores: [48, 52],
  });
  const first = calculateTrustScore(input);
  const second = calculateTrustScore(input);

  assert.deepEqual(
    {
      score: first.score,
      trend: first.trend,
      confidence: first.confidence,
      anomaly_flag: first.anomaly_flag,
      risk_level: first.risk_level,
      breakdown: first.breakdown,
      signals: first.signals,
    },
    {
      score: second.score,
      trend: second.trend,
      confidence: second.confidence,
      anomaly_flag: second.anomaly_flag,
      risk_level: second.risk_level,
      breakdown: second.breakdown,
      signals: second.signals,
    },
  );
});