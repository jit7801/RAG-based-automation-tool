import React, { useEffect, useState } from 'react';
import type { AppConfig } from '../types';

interface HeaderProps {
  config: (AppConfig & { nextRunAt?: string; schedulerActive?: boolean }) | null;
  isRunning: boolean;
  activeTabTitle: string;
  activeTabSubtitle: string;
  isDegraded: boolean;
  onTriggerRun: () => void;
  onOpenRepurpose?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isRunning,
  activeTabTitle,
  activeTabSubtitle,
  isDegraded,
  onTriggerRun,
  onOpenRepurpose,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!config?.nextRunAt) return;

    const updateTimer = () => {
      const target = new Date(config.nextRunAt!).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Due now');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config?.nextRunAt]);

  const services = config?.services || {};

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumb & Page Info */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-semibold text-foreground tracking-tight">
              {activeTabTitle}
            </h1>
            <span className="text-foreground-faint text-3xs font-mono">•</span>
            <span className="text-3xs text-foreground-muted hidden sm:inline">
              {activeTabSubtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Actions */}
      <div className="flex items-center gap-3">
        {/* Daily Schedule Badge */}
        <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 py-1 text-3xs font-mono text-foreground-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-pass opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-pass"></span>
          </span>
          <span>Cron: {config?.scheduleLabel || '09:00 daily'}</span>
          {timeLeft && (
            <span className="text-foreground-faint font-mono">({timeLeft})</span>
          )}
        </div>

        {/* System Health Badge */}
        <div className="hidden lg:flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-3xs font-mono">
          <span className="text-foreground-faint mr-1 font-semibold uppercase">Services:</span>
          {['weaviate', 'openai', 'slack'].map((srv) => {
            const status = services[srv] || 'fallback';
            const isLiveSrv = status === 'live';
            return (
              <span
                key={srv}
                title={`${srv}: ${status}`}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 uppercase ${
                  isLiveSrv
                    ? 'bg-status-pass-bg text-status-pass border border-status-pass-border'
                    : 'bg-surface text-foreground-faint border border-border'
                }`}
              >
                <span
                  className={`h-1 w-1 rounded-full ${
                    isLiveSrv ? 'bg-status-pass' : 'bg-foreground-faint'
                  }`}
                />
                {srv}
              </span>
            );
          })}
        </div>

        {/* Repurpose Studio Shortcut */}
        {onOpenRepurpose && (
          <button
            onClick={onOpenRepurpose}
            className="btn-ghost text-xs px-2.5 py-1 text-brand hover:text-white hover:bg-brand flex items-center gap-1.5 font-medium border-brand/30 bg-brand/5"
            title="Multi-Platform Brand Studio"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Repurpose Studio</span>
          </button>
        )}

        {/* Primary Pipeline Action */}
        <button
          id="btn-trigger-run"
          onClick={onTriggerRun}
          disabled={isRunning}
          className="btn-primary text-xs px-3 py-1 flex items-center gap-2 shadow-sm font-medium"
        >
          {isRunning ? (
            <>
              <svg
                className="h-3 w-3 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Execute Pipeline</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
