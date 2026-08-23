import React, { useEffect, useState } from 'react';
import type { AppConfig } from '../types';

interface HeaderProps {
  config: (AppConfig & { nextRunAt?: string; schedulerActive?: boolean }) | null;
  isRunning: boolean;
  onTriggerRun: () => void;
  onOpenConfig: () => void;
  onOpenRepurpose?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isRunning,
  onTriggerRun,
  onOpenConfig,
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
        `${hours.toString().padStart(2, '0')}h ${minutes
          .toString()
          .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config?.nextRunAt]);

  const services = config?.services || {};

  return (
    <header className="border-b border-rule bg-raised px-6 py-3.5 shadow-xs sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white font-serif font-bold text-base shadow-sm">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold tracking-tight text-ink">
                GATEKEEPER
              </h1>
              <span className="label rounded border border-rule/70 px-1.5 py-0.5 text-2xs bg-sunk text-ink-soft font-mono">
                v1.0 • RAG Automator
              </span>
            </div>
            <p className="text-xs text-ink-soft hidden sm:block">
              Autonomous trend-grounded publisher with an editorial gate
            </p>
          </div>
        </div>

        {/* Schedule & Services info */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Daily Schedule Badge */}
          <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pass opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pass"></span>
            </span>
            <div className="text-xs">
              <span className="font-semibold text-ink font-mono text-2xs">
                {config?.scheduleLabel || '09:00 daily'}
              </span>
              {timeLeft && (
                <span className="ml-1.5 font-mono text-2xs text-ink-faint">
                  ({timeLeft})
                </span>
              )}
            </div>
          </div>

          {/* Service health indicators */}
          <div className="hidden lg:flex items-center gap-1 rounded-md border border-rule bg-sunk px-2 py-1 text-2xs font-mono text-ink-faint">
            <span className="text-2xs uppercase tracking-wider text-ink-faint mr-1 font-semibold">Services:</span>
            {['jina', 'weaviate', 'openai', 'slack'].map((srv) => {
              const status = services[srv] || 'fallback';
              const isLiveSrv = status === 'live';
              return (
                <span
                  key={srv}
                  title={`${srv}: ${status}`}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase ${
                    isLiveSrv
                      ? 'bg-pass-bg text-pass font-medium border border-pass/20'
                      : 'bg-paper text-ink-soft border border-rule'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLiveSrv ? 'bg-pass' : 'bg-ink-faint'
                    }`}
                  />
                  {srv}
                </span>
              );
            })}
          </div>

          {/* Action buttons */}
          {onOpenRepurpose && (
            <button
              onClick={onOpenRepurpose}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 text-accent font-semibold border-accent/30 bg-accent/5 hover:bg-accent hover:text-white transition-all shadow-2xs"
              title="Multi-Platform Repurposing Studio"
            >
              <span>⚡</span>
              <span>Brand Studio</span>
            </button>
          )}

          <button
            id="btn-settings"
            onClick={onOpenConfig}
            className="btn-ghost text-xs px-3 py-1.5"
            title="Thresholds & Settings"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Gate Rules
          </button>

          <button
            id="btn-trigger-run"
            onClick={onTriggerRun}
            disabled={isRunning}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-2 shadow-sm font-medium"
          >
            {isRunning ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-white"
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
                Running...
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
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
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
