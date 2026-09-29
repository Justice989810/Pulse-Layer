'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { PulseGauge } from '@/components/PulseGauge';
import { ScoreTrendChart } from '@/components/ScoreTrendChart';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { TopAccountsTable } from '@/components/TopAccountsTable';
import { AccountAnalysisModal } from '@/components/AccountAnalysisModal';
import {
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

import { getApiUrl } from '@/lib/config';
import { fetchApiJson, isRecord } from '@/lib/api';

const DEMO_ACCOUNT_DEFAULT = 'GAK6E46MRRAG72MNDHNE54F2M43MVTK4Z2X7MHBCEEE4ZJ32FGGXX444';

type StatsResponse = {
  total_accounts: number;
  avg_trust_score: number;
  last_ledger: string;
  network_tps: string;
  anomalies_count: number;
};

type ScoreResponse = Record<string, unknown> & {
  account: string;
  score: number;
  trend: string;
  confidence: number;
  risk_level: string;
};

type HistoryResponse = {
  snapshots: { score: number; timestamp: string }[];
};

const isStatsResponse = (value: unknown): value is StatsResponse =>
  isRecord(value) &&
  typeof value.total_accounts === 'number' &&
  typeof value.avg_trust_score === 'number' &&
  typeof value.last_ledger === 'string' &&
  typeof value.network_tps === 'string' &&
  typeof value.anomalies_count === 'number';

const isScoreResponse = (value: unknown): value is ScoreResponse =>
  isRecord(value) &&
  typeof value.account === 'string' &&
  typeof value.score === 'number' &&
  typeof value.trend === 'string' &&
  typeof value.confidence === 'number' &&
  typeof value.risk_level === 'string';

const isHistoryResponse = (value: unknown): value is HistoryResponse =>
  isRecord(value) &&
  Array.isArray(value.snapshots) &&
  value.snapshots.every((snapshot) =>
    isRecord(snapshot) &&
    typeof snapshot.score === 'number' &&
    typeof snapshot.timestamp === 'string',
  );

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountsPage, setAccountsPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState(DEMO_ACCOUNT_DEFAULT);
  const [scoreData, setScoreData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [modalAccountData, setModalAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const accountRequestController = useRef<AbortController | null>(null);

  // Fetch System Stats
  const fetchStats = () => {
    fetchApiJson(`${getApiUrl()}/api/stats`, isStatsResponse)
      .then((data) => setStats(data))
      .catch((err) => console.error('Stats fetch error:', err));
  };

  // Fetch Account Score Data
  const fetchAccountData = (acc: string) => {
    accountRequestController.current?.abort();
    const controller = new AbortController();
    accountRequestController.current = controller;
    setLoading(true);
    setScoreData(null);
    setHistoryData([]);
    setSelectedAccount(acc);

    const apiUrl = getApiUrl();
    Promise.all([
      fetch(`${apiUrl}/api/score/${acc}`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`${apiUrl}/api/history/${acc}`, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([scoreRes, historyRes]) => {
        if (controller.signal.aborted) return;
        setScoreData(scoreRes);
        if (historyRes.snapshots) setHistoryData(historyRes.snapshots);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load account score data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    fetchAccountData(selectedAccount);
    const interval = setInterval(fetchStats, 10000);
    return () => {
      clearInterval(interval);
      accountRequestController.current?.abort();
    };
  }, []);

  const handleInspectAccount = (acc: string) => {
    fetchApiJson(`${getApiUrl()}/api/score/${acc}`, isScoreResponse)
      .then((data) => setModalAccountData(data))
      .catch((err) => console.error(err));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Fixed Header */}
      <Header
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={(query) => {
          setSearchQuery(query);
          setAccountsPage(1);
        }}
        onSearchSubmit={fetchAccountData}
        onRefresh={() => {
          fetchStats();
          fetchAccountData(selectedAccount);
        }}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Top Hero Overview Banner */}
        <div className="metallic-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-electric)] animate-ping" />
              <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[var(--accent-electric)] font-bold">
                STELLAR ACCOUNT TRUST SIGNALS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              PulseLayer Deterministic Risk & Behavior Control System
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl font-mono-tech">
              Indexing active accounts across ledgers, evaluating lifespan, consistency, velocity spikes, and counterparty exposure in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleInspectAccount(selectedAccount)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-electric)] to-[#0066FF] text-black font-mono-tech font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-[#00F0FF]/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 fill-black" />
              Inspect Full Audit
            </button>
          </div>
        </div>

        {/* Section 1: Main Gauges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Pulse Score Display */}
          <PulseGauge
            score={scoreData?.score ?? null}
            trend={scoreData?.trend ?? null}
            confidence={scoreData?.confidence ?? null}
            anomalyFlag={Boolean(scoreData?.anomaly_flag)}
            riskLevel={scoreData?.risk_level ?? null}
            account={selectedAccount}
            loading={loading}
          />

          {/* Right: Score Trend Curve */}
          <ScoreTrendChart
            snapshots={historyData}
            account={selectedAccount}
          />
        </div>

        {/* Section 2: Live Activity Feed & Selected Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Real-Time Stream */}
          <div className="lg:col-span-2">
            <LiveActivityFeed onSelectAccount={fetchAccountData} />
          </div>

          {/* Right 1 Col: Quick Account Audit Summary */}
          <div className="metallic-card rounded-2xl p-6 flex flex-col justify-between font-mono-tech space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
                <span className="text-[11px] uppercase tracking-widest text-[var(--accent-electric)] font-bold">
                  ACTIVE ACCOUNT METRICS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  TARGET AUDIT
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block uppercase">Address:</span>
                  <span className="text-xs text-[var(--accent-electric)] font-bold break-all block mt-0.5">
                    {selectedAccount}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-secondary)] block">Lifespan:</span>
                    <span className="text-[var(--text-primary)] font-bold">{scoreData?.lifespan_days || 1} Days</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-secondary)] block">Tx Count:</span>
                    <span className="text-[var(--text-primary)] font-bold">{(scoreData?.tx_count || 0).toLocaleString()}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-secondary)] block">XLM Balance:</span>
                    <span className="text-[var(--text-primary)] font-bold">{(scoreData?.xlm_balance || 0).toLocaleString()}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-secondary)] block">Trustlines:</span>
                    <span className="text-[var(--text-primary)] font-bold">{scoreData?.trustlines_count || 0}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] text-[var(--text-secondary)] block uppercase">Active Signals Summary:</span>
                  <p className="text-[11px] text-[var(--text-primary)]">
                    {scoreData?.signals?.[0]?.title || 'Standard activity metrics verified.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleInspectAccount(selectedAccount)}
              className="w-full py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>View Factor Audit</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[var(--accent-electric)]" />
            </button>
          </div>
        </div>

        {/* Section 3: Top Accounts Leaderboard */}
        <TopAccountsTable
          onSelectAccount={fetchAccountData}
          searchQuery={searchQuery}
          page={accountsPage}
          onPageChange={setAccountsPage}
        />
      </main>

      {/* Modal Deep Inspection View */}
      {modalAccountData && (
        <AccountAnalysisModal
          accountData={modalAccountData}
          onClose={() => setModalAccountData(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-6 px-4 text-center font-mono-tech text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 PulseLayer Trust Engine • Connected to Stellar Horizon Mainnet</p>
          <div className="flex items-center gap-4">
            <span className="text-[var(--accent-electric)]">Deterministic Trust Protocol</span>
            <span>•</span>
            <span>On-Chain Analytics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
