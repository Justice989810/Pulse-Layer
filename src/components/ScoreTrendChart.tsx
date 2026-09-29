'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Calendar } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ScoreTrendChartProps {
  snapshots: { score: number; timestamp: string }[];
  account: string;
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  snapshots,
  account,
}) => {
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('30D');
  const { theme } = useTheme();

  const isLight = theme === 'light';

  // Format data for Recharts
  const chartData = snapshots.map((s) => {
    const d = new Date(s.timestamp);
    return {
      score: s.score,
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const filteredData = timeframe === '24H' ? chartData.slice(-5) : timeframe === '7D' ? chartData.slice(-10) : chartData;

  const strokeColor = isLight ? '#0284C7' : '#00F0FF';
  const gridColor = isLight ? '#E2E8F0' : '#1E2638';
  const textColor = isLight ? '#64748B' : '#6B7280';

  return (
    <div className="metallic-card rounded-2xl p-6 flex flex-col justify-between min-h-[360px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[var(--text-secondary)]">
            HISTORICAL TRUST TIMELINE
          </span>
          <h3 className="text-sm font-mono-tech text-[var(--text-primary)] font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent-electric)]" />
            Pulse Score Evolution Over Time
          </h3>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-subtle)]">
          {(['24H', '7D', '30D', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-mono-tech rounded transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-[var(--accent-electric)] text-black font-bold shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Curve */}
      <div className="w-full h-64 flex items-center justify-center">
        {filteredData.length === 0 ? (
          <p className="text-sm font-mono-tech text-[var(--text-secondary)]">
            No score history available for this account.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

            <XAxis
              dataKey="date"
              stroke={textColor}
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke={textColor}
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[var(--bg-secondary)] border border-[var(--accent-electric)] p-3 rounded-lg shadow-xl font-mono-tech text-xs">
                      <p className="text-[var(--text-secondary)] mb-1">{data.fullDate}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">Pulse Score:</span>
                        <span className="text-[var(--accent-electric)] font-bold text-sm">{data.score} / 100</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] font-mono-tech text-[var(--text-secondary)]">
        <span>Data Points: {filteredData.length} Snapshots</span>
        <span>Resolution: 24h Aggregation</span>
      </div>
    </div>
  );
};
