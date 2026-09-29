'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface PulseGaugeProps {
  score: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null;
  anomalyFlag: boolean;
  riskLevel: string | null;
  account: string;
  loading: boolean;
}

export const PulseGauge: React.FC<PulseGaugeProps> = ({
  score,
  trend,
  confidence,
  anomalyFlag,
  riskLevel,
  account,
  loading,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // SVG Radial Gauge Calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // Use 270 degree arc (3/4 of circle)
  const strokeDasharray = `${circumference * 0.75} ${circumference * 0.25}`;
  const strokeDashoffset = circumference * 0.75 * (1 - Math.min(100, Math.max(0, score ?? 0)) / 100);

  // Dynamic Theme Colors
  let colorHex = isLight ? '#0284C7' : '#00F0FF';
  let glowClass = 'pulse-glow-cyan';
  if (score !== null) {
    if (score >= 80) {
      colorHex = isLight ? '#0284C7' : '#00F0FF';
      glowClass = 'pulse-glow-cyan';
    } else if (score >= 55) {
      colorHex = isLight ? '#2563EB' : '#0066FF';
      glowClass = 'pulse-glow-blue';
    } else if (score >= 35) {
      colorHex = isLight ? '#D97706' : '#F59E0B';
      glowClass = 'pulse-glow-amber';
    } else {
      colorHex = isLight ? '#E11D48' : '#F43F5E';
      glowClass = 'pulse-glow-rose';
    }
  }

  return (
    <div className="metallic-card rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[360px]">
      {/* Background Subtle Arc Glow */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none -top-10"
        style={{ backgroundColor: colorHex }}
      />

      {/* Header Label */}
      <div className="w-full flex items-center justify-between z-10">
        <div>
          <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[var(--text-secondary)]">
            ACCOUNT PULSE SIGNAL
          </span>
          <p className="text-xs font-mono-tech text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-[280px]">
            {account}
          </p>
        </div>

        {score === null ? (
          <span className="text-[11px] font-mono-tech px-2.5 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-bold">
            {loading ? 'LOADING ACCOUNT DATA' : 'ACCOUNT DATA UNAVAILABLE'}
          </span>
        ) : anomalyFlag ? (
          <span className="flex items-center gap-1 text-[11px] font-mono-tech px-2.5 py-1 rounded bg-[var(--accent-rose)]/15 text-[var(--accent-rose)] border border-[var(--accent-rose)]/40 font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            ANOMALY DETECTED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-mono-tech px-2.5 py-1 rounded bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            NORMAL BEHAVIOR
          </span>
        )}
      </div>

      {/* Central SVG Radial Gauge */}
      <div className="relative flex items-center justify-center my-4 z-10">
        <svg className="w-64 h-64 -rotate-225 transform" viewBox="0 0 220 220">
          {/* Background Track Circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
            strokeWidth="16"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
          {/* Animated Value Progress Circle */}
          {score !== null && (
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke={colorHex}
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${glowClass}`}
            />
          )}
        </svg>

        {/* Center Text Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span
              className="text-6xl font-extrabold font-mono-tech tracking-tight"
              style={{ color: colorHex }}
            >
              {score ?? (loading ? '...' : 'N/A')}
            </span>
            {score !== null && <span className="text-sm font-mono-tech text-[var(--text-secondary)]">/100</span>}
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="text-xs font-mono-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: `${colorHex}20`, color: colorHex }}
            >
              {riskLevel ? `${riskLevel} RISK` : 'RISK UNAVAILABLE'}
            </span>
          </div>

          <p className="text-[11px] font-mono-tech text-[var(--text-secondary)] mt-2">
            Confidence: {confidence === null ? 'Unavailable' : `${(confidence * 100).toFixed(0)}%`}
          </p>
        </div>
      </div>

      {/* Footer Trend & Meta */}
      <div className="w-full flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs font-mono-tech z-10">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <span>Trend Direction:</span>
          {trend === 'up' && (
            <span className="flex items-center gap-1 text-[var(--accent-emerald)] font-bold">
              <TrendingUp className="w-4 h-4" /> UPWARD
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center gap-1 text-[var(--accent-rose)] font-bold">
              <TrendingDown className="w-4 h-4" /> PENALIZED
            </span>
          )}
          {trend === 'stable' && (
            <span className="flex items-center gap-1 text-[var(--accent-electric)] font-bold">
              <Minus className="w-4 h-4" /> STABLE
            </span>
          )}
          {trend === null && <span className="text-[var(--text-muted)]">UNAVAILABLE</span>}
        </div>

        <div className="text-right">
          <span className="text-[var(--text-secondary)]">Engine: </span>
          <span className="text-[var(--text-primary)] font-bold">DETERMINISTIC</span>
        </div>
      </div>
    </div>
  );
};
