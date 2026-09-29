'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { getApiUrl } from '@/lib/config';

interface TopAccountsTableProps {
  onSelectAccount: (account: string) => void;
  searchQuery: string;
}

export const TopAccountsTable: React.FC<TopAccountsTableProps> = ({
  onSelectAccount,
  searchQuery,
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sort, setSort] = useState('score_desc');
  const [loading, setLoading] = useState(false);

  const fetchAccounts = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      risk: riskFilter,
      sort,
    });
    if (searchQuery) params.set('search', searchQuery);

    fetch(`${getApiUrl()}/api/top?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) {
          setAccounts(data.accounts);
          setTotal(data.total);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch top accounts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, riskFilter, sort, searchQuery]);

  return (
    <div className="metallic-card rounded-2xl p-6 font-mono-tech space-y-4">
      {/* Table Header & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[var(--accent-electric)] font-bold">
            STELLAR NETWORK INDEX (1,000+ ACCOUNTS)
          </span>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Account Trust Score Directory
          </h3>
        </div>

        {/* Risk Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-subtle)] overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'LOW', label: 'Low Risk (80-100)' },
            { id: 'MODERATE', label: 'Moderate' },
            { id: 'HIGH', label: 'High Risk' },
            { id: 'CRITICAL', label: 'Critical' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRiskFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded transition-all whitespace-nowrap cursor-pointer ${
                riskFilter === tab.id
                  ? 'bg-[var(--accent-electric)] text-black font-bold shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <label className="flex items-center gap-2 border-l border-[var(--border-subtle)] pl-3 text-xs text-[var(--text-secondary)]">
            Sort
            <select
              aria-label="Sort accounts"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-electric)]"
            >
              <option value="score_desc">Highest score</option>
              <option value="score_asc">Lowest score</option>
              <option value="tx_desc">Most transactions</option>
              <option value="lifespan_desc">Longest lifespan</option>
            </select>
          </label>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] uppercase">
              <th className="py-3 px-3">Account Address</th>
              <th className="py-3 px-3">Trust Score</th>
              <th className="py-3 px-3">Trend</th>
              <th className="py-3 px-3">Activity Level</th>
              <th className="py-3 px-3">Lifespan</th>
              <th className="py-3 px-3">Risk Status</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                  Loading Stellar Horizon indexed accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                  No matching Stellar accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => {
                let badgeBg = 'bg-[var(--accent-electric)]/15 text-[var(--accent-electric)] border-[var(--accent-electric)]/30';
                if (acc.score < 35) badgeBg = 'bg-[var(--accent-rose)]/15 text-[var(--accent-rose)] border-[var(--accent-rose)]/30';
                else if (acc.score < 55) badgeBg = 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border-[var(--accent-amber)]/30';
                else if (acc.score < 80) badgeBg = 'bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border-[var(--accent-blue)]/30';

                const actLevel = acc.tx_count > 300 ? 'HIGH' : acc.tx_count > 50 ? 'MEDIUM' : 'LOW';

                return (
                  <tr
                    key={acc.account}
                    className="hover:bg-[var(--bg-card-hover)] transition-colors group cursor-pointer"
                    onClick={() => onSelectAccount(acc.account)}
                  >
                    {/* Account */}
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-electric)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[160px] sm:max-w-[240px]">
                          {acc.account}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded border font-extrabold ${badgeBg}`}>
                          {acc.score}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-current"
                            style={{ width: `${acc.score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="py-3 px-3">
                      {acc.trend === 'up' && (
                        <span className="flex items-center gap-1 text-[var(--accent-emerald)] font-bold">
                          <TrendingUp className="w-3.5 h-3.5" /> UP
                        </span>
                      )}
                      {acc.trend === 'down' && (
                        <span className="flex items-center gap-1 text-[var(--accent-rose)] font-bold">
                          <TrendingDown className="w-3.5 h-3.5" /> DOWN
                        </span>
                      )}
                      {acc.trend === 'stable' && (
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Minus className="w-3.5 h-3.5" /> STABLE
                        </span>
                      )}
                    </td>

                    {/* Activity Level */}
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)] font-bold">{actLevel}</span> ({acc.tx_count} Txs)
                    </td>

                    {/* Lifespan */}
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {acc.lifespan_days} Days
                    </td>

                    {/* Risk Status */}
                    <td className="py-3 px-3">
                      {acc.anomaly_flag ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-rose)]/20 text-[var(--accent-rose)] border border-[var(--accent-rose)]/40">
                          <AlertTriangle className="w-3 h-3" /> ANOMALY
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30">
                          {acc.risk_level}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAccount(acc.account);
                        }}
                        className="px-3 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] text-[var(--text-primary)] hover:text-[var(--accent-electric)] transition-all font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-secondary)]">
        <div>
          Showing {accounts.length > 0 ? (page - 1) * 10 + 1 : 0} -{' '}
          {Math.min(total, page * 10)} of {total.toLocaleString()} Indexed Accounts
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] disabled:opacity-40 disabled:hover:border-[var(--border-subtle)] cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>Page {page} of {Math.ceil(total / 10) || 1}</span>
          <button
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] disabled:opacity-40 disabled:hover:border-[var(--border-subtle)] cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
