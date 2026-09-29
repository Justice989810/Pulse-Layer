'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Radio, Pause, Play } from 'lucide-react';
import { getApiUrl, getWsUrl } from '@/lib/config';

interface LiveActivityFeedProps {
  onSelectAccount: (account: string) => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  onSelectAccount,
}) => {
  const [feed, setFeed] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [connected, setConnected] = useState(false);

  // Initial Fetch & WebSocket setup
  useEffect(() => {
    // Initial Rest Fetch
    fetch(`${getApiUrl()}/api/feed`)
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) {
          setFeed(data.transactions);
        }
      })
      .catch((err) => console.error('Feed fetch error:', err));

    // Connect WebSocket
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      if (isPaused) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'LIVE_TRANSACTION') {
          setFeed((prev) => [payload.data, ...prev.slice(0, 24)]);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, [isPaused]);

  return (
    <div className="metallic-card rounded-2xl p-6 flex flex-col justify-between min-h-[420px] font-mono-tech">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-electric)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-electric)]"></span>
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[var(--accent-electric)] font-bold">
              REAL-TIME STREAM
            </span>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
            <Radio className="w-4 h-4 text-[var(--accent-electric)]" /> Live Stellar Operations Stream
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            {isPaused ? <Play className="w-3 h-3 text-[var(--accent-emerald)]" /> : <Pause className="w-3 h-3 text-[var(--accent-amber)]" />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Stream List */}
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {feed.map((item, idx) => {
          const isAnomaly = item.is_anomaly || item.is_anomaly === 1;
          const dateStr = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'NOW';

          return (
            <div
              key={item.id || idx}
              onClick={() => onSelectAccount(item.account_id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isAnomaly
                  ? 'bg-[var(--accent-amber)]/10 border-[var(--accent-amber)]/40 hover:border-[var(--accent-amber)] shadow-md shadow-[#F59E0B]/5'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-electric)]'
              }`}
            >
              {/* Left: Account & Type */}
              <div className="flex items-center gap-2.5 overflow-hidden">
                {isAnomaly ? (
                  <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)] shrink-0 animate-bounce" />
                ) : (
                  <Zap className="w-4 h-4 text-[var(--accent-electric)] shrink-0" />
                )}

                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-electric)] transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                      {item.account_id}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {item.type || 'payment'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    Hash: {item.hash || 'Hash unavailable'}
                  </p>
                </div>
              </div>

              {/* Right: Amount & Anomaly Badge */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    {item.amount != null ? `+${item.amount}` : 'Amount unavailable'}{' '}
                    {item.asset || 'Asset unavailable'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{dateStr}</span>
                </div>

                {isAnomaly && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--accent-amber)] text-black">
                    SPIKE FLAG
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Feed Status */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          Status: <span className={connected ? 'text-[var(--accent-emerald)] font-bold' : 'text-[var(--accent-amber)]'}>
            {connected ? 'CONNECTED (WEBSOCKET)' : 'POLLING BACKUP'}
          </span>
        </span>
        <span>Auto-ingesting live Horizon transactions</span>
      </div>
    </div>
  );
};
