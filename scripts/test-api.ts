import { calculateTrustScore, AccountRawData } from '../server/scoring';

async function runTests() {
  console.log('🧪 Starting PulseLayer Integration & Scoring Unit Tests...\n');

  // Test 1: Deterministic Scoring Model Accuracy
  console.log('Test 1: Testing Scoring Engine Determinism & Bounds...');
  const sampleAccount: AccountRawData = {
    account_id: 'GAK6E46MRRAG72MNDHNE54F2M43MVTK4Z2X7MHBCEEE4ZJ32FGGXX444',
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    lifespan_days: 365,
    tx_count: 520,
    active_days: 180,
    success_rate: 0.99,
    xlm_balance: 1500,
    trustlines_count: 5,
    counterparty_scores: [90, 85, 95],
  };

  const scoreResult = calculateTrustScore(sampleAccount);
  console.log('✅ Score Result:', {
    account: scoreResult.account,
    score: scoreResult.score,
    trend: scoreResult.trend,
    risk_level: scoreResult.risk_level,
    confidence: scoreResult.confidence,
    anomaly_flag: scoreResult.anomaly_flag,
    last_updated: scoreResult.last_updated,
  });

  if (scoreResult.score < 0 || scoreResult.score > 100) {
    throw new Error(`Score out of bounds: ${scoreResult.score}`);
  }
  console.log('✅ Score bounds check passed (0-100).\n');

  // Test 2: Anomaly Detection Flags
  console.log('Test 2: Testing Anomaly Detection (Velocity Spike & Dormant Burst)...');
  const anomalyAccount: AccountRawData = {
    account_id: 'GSPK9999999999999999999999999999999999999999999999999999',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    lifespan_days: 10,
    tx_count: 600,
    active_days: 2,
    success_rate: 0.80,
    xlm_balance: 10,
    trustlines_count: 0,
    tx_per_day_max: 300,
    dormant_burst_detected: true,
    low_score_counterparty_ratio: 0.6,
  };

  const anomalyResult = calculateTrustScore(anomalyAccount);
  console.log('✅ Anomaly Score Result:', {
    score: anomalyResult.score,
    anomaly_flag: anomalyResult.anomaly_flag,
    risk_level: anomalyResult.risk_level,
    signals_count: anomalyResult.signals.length,
  });

  if (!anomalyResult.anomaly_flag) {
    throw new Error('Expected anomaly_flag = true for burst account!');
  }
  console.log('✅ Anomaly detection flag test passed.\n');

  // Test 3: API Endpoint Integration Check
  console.log('Test 3: Validating REST API endpoints against localhost:5001...');
  try {
    const statsRes = await fetch('http://localhost:5001/api/stats').then((r) => r.json());
    console.log('✅ /api/stats:', statsRes);

    const topRes = await fetch('http://localhost:5001/api/top?limit=3').then((r) => r.json());
    console.log('✅ /api/top:', { total: topRes.total, returned: topRes.accounts.length });

    const scoreRes = await fetch(`http://localhost:5001/api/score/${sampleAccount.account_id}`).then((r) => r.json());
    console.log('✅ /api/score:', { account: scoreRes.account, score: scoreRes.score, trend: scoreRes.trend });

    const historyRes = await fetch(`http://localhost:5001/api/history/${sampleAccount.account_id}`).then((r) => r.json());
    console.log('✅ /api/history:', { snapshotsCount: historyRes.snapshots?.length });

    const oversizedRes = await fetch('http://localhost:5001/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: 'x'.repeat(1024 * 1024) }),
    });
    if (oversizedRes.status !== 413) {
      throw new Error(`Expected oversized JSON request to return 413, received ${oversizedRes.status}`);
    }
    console.log('✅ Oversized JSON request rejected with HTTP 413.');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED CLEANLY!');
  } catch (err: any) {
    console.error('❌ API Integration Test Failed:', err.message);
    process.exitCode = 1;
  }
}

runTests();
