'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Download,
  Shield,
  Clock,
  Activity,
  Coins,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getApiUrl } from '@/lib/config';

interface AccountAnalysisModalProps {
  accountData: any;
  onClose: () => void;
}

export const AccountAnalysisModal: React.FC<AccountAnalysisModalProps> = ({
  accountData,
  onClose,
}) => {
  type CopyState = 'idle' | 'success' | 'error';
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [copyErrorMsg, setCopyErrorMsg] = useState<string>('');
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!accountData) return null;

  const handleCopy = async () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    if (!accountData?.account) {
      setCopyState('error');
      setCopyErrorMsg('No address available');
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
        setCopyErrorMsg('');
      }, 2500);
      return;
    }

    // Modern Clipboard API check
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(accountData.account);
        setCopyState('success');
        setCopyErrorMsg('');
        copyTimeoutRef.current = setTimeout(() => {
          setCopyState('idle');
        }, 2000);
        return;
      } catch (err: unknown) {
        // Fall through to fallback or handle specific permission rejection
        if (
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'SecurityError')
        ) {
          setCopyState('error');
          setCopyErrorMsg('Clipboard permission denied');
          copyTimeoutRef.current = setTimeout(() => {
            setCopyState('idle');
            setCopyErrorMsg('');
          }, 2500);
          return;
        }
      }
    }

    // Fallback for unsupported browsers or insecure contexts
    try {
      if (typeof document !== 'undefined' && document.execCommand) {
        const textArea = document.createElement('textarea');
        textArea.value = accountData.account;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!success) {
          throw new Error('execCommand copy failed');
        }
        setCopyState('success');
        setCopyErrorMsg('');
        copyTimeoutRef.current = setTimeout(() => {
          setCopyState('idle');
        }, 2000);
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      setCopyState('error');
      setCopyErrorMsg('Failed to copy address');
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
        setCopyErrorMsg('');
      }, 2500);
    }
  };

  const handleExportJSON = () => {
    window.open(`${getApiUrl()}/api/export/${accountData.account}`, '_blank');
  };

  const breakdown = accountData.breakdown || {
    consistency: 75,
    lifespan: 80,
    interaction_quality: 70,
    risk_exposure: 85,
  };

  const signals = accountData.signals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="metallic-card-glow w-full max-w-4xl rounded-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono-tech">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-electric)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[var(--accent-electric)] font-bold">
              DEEP INSPECTION AUDIT
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mt-1">
              Account Pulse Signal
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[280px] sm:max-w-[400px]">
                {accountData.account}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer inline-flex items-center justify-center"
                title={
                  copyState === 'success'
                    ? 'Address copied to clipboard'
                    : copyState === 'error'
                    ? copyErrorMsg
                    : 'Copy Address'
                }
                aria-label={
                  copyState === 'success'
                    ? 'Address copied to clipboard'
                    : copyState === 'error'
                    ? `Copy failed: ${copyErrorMsg}`
                    : 'Copy Address'
                }
              >
                {copyState === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                ) : copyState === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-rose)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {copyState === 'success' && (
                <span
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-[10px] text-[var(--accent-emerald)] font-bold"
                >
                  Copied!
                </span>
              )}
              {copyState === 'error' && (
                <span
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                  className="text-[10px] text-[var(--accent-rose)] font-bold"
                >
                  {copyErrorMsg}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[var(--accent-electric)] to-[#0066FF] text-black font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-[#00F0FF]/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Account Audit JSON
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Metadata */}
          <div className="metallic-card rounded-xl p-5 space-y-4">
            <h3 className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold border-b border-[var(--border-subtle)] pb-2">
              On-Chain Metadata
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent-electric)]" /> Trust Score:
                </span>
                <span className="text-[var(--accent-electric)] font-bold text-sm">
                  {accountData.score} / 100
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Lifespan:
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {accountData.lifespan_days} Days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Total Txs:
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {(accountData.tx_count || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[var(--accent-electric)]" /> XLM Balance:
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {(accountData.xlm_balance || 0).toLocaleString()} XLM
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> Asset Trustlines:
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {accountData.trustlines_count || 0}
                </span>
              </div>

              {accountData.funder && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)] block mb-1">Created By (Funder):</span>
                  <span className="text-[11px] text-[var(--accent-electric)] break-all block">
                    {accountData.funder}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Score Breakdown & Signal Audit */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Factors Breakdown Bars */}
            <div className="metallic-card rounded-xl p-5 space-y-4">
              <h3 className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                Deterministic Factor Ratings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Consistency */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">Consistency Factor</span>
                    <span className="text-[var(--text-primary)] font-bold">{breakdown.consistency}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-electric)] transition-all"
                      style={{ width: `${breakdown.consistency}%` }}
                    />
                  </div>
                </div>

                {/* Lifespan */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">Lifespan Maturity</span>
                    <span className="text-[var(--text-primary)] font-bold">{breakdown.lifespan}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-emerald)] transition-all"
                      style={{ width: `${breakdown.lifespan}%` }}
                    />
                  </div>
                </div>

                {/* Interaction Quality */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">Interaction Quality</span>
                    <span className="text-[var(--text-primary)] font-bold">{breakdown.interaction_quality}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-blue)] transition-all"
                      style={{ width: `${breakdown.interaction_quality}%` }}
                    />
                  </div>
                </div>

                {/* Risk Exposure */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">Safety Rating</span>
                    <span className="text-[var(--text-primary)] font-bold">{breakdown.risk_exposure}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-amber)] transition-all"
                      style={{ width: `${breakdown.risk_exposure}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Signal Audit Log */}
            <div className="metallic-card rounded-xl p-5 space-y-3">
              <h3 className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold flex items-center justify-between">
                <span>Signal Audit Log</span>
                <span className="text-[10px] text-[var(--accent-electric)]">{signals.length} Active Signals</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {signals.map((sig: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      {sig.type === 'positive' && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] mt-0.5 shrink-0" />
                      )}
                      {sig.type === 'negative' && (
                        <AlertCircle className="w-4 h-4 text-[var(--accent-rose)] mt-0.5 shrink-0" />
                      )}
                      {sig.type === 'neutral' && (
                        <Clock className="w-4 h-4 text-[var(--text-secondary)] mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{sig.title}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{sig.description}</p>
                      </div>
                    </div>

                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                        sig.delta > 0
                          ? 'bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)]'
                          : sig.delta < 0
                          ? 'bg-[var(--accent-rose)]/20 text-[var(--accent-rose)]'
                          : 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]'
                      }`}
                    >
                      {sig.delta > 0 ? `+${sig.delta}` : sig.delta} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
