import React from 'react';
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
  isRunning,
  activeTabTitle,
  activeTabSubtitle,
  isDegraded,
  onTriggerRun,
}) => {
  return (
    <header className="h-16 border-b border-border bg-sidebar px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Clean Page Title & Subtitle */}
      <div>
        <h1 className="text-sm font-semibold text-primary">
          {activeTabTitle}
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          {activeTabSubtitle}
        </p>
      </div>

      {/* Right: Operational Status & Primary Trigger */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isDegraded ? 'bg-status-warn' : 'bg-status-pass'
            }`}
          />
          <span className="text-secondary font-medium">
            {isDegraded ? 'Degraded fallback active' : 'All systems operational'}
          </span>
        </div>

        <button
          id="btn-trigger-run"
          onClick={onTriggerRun}
          disabled={isRunning}
          className="btn-primary text-xs px-3.5 py-1.5 font-medium"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            'Run Pipeline'
          )}
        </button>
      </div>
    </header>
  );
};
