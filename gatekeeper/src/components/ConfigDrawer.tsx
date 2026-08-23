import React from 'react';
import type { AppConfig } from '../types';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: (AppConfig & { nextRunAt?: string; schedulerActive?: boolean }) | null;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen || !config) return null;

  const { thresholds, services, scheduleCron, scheduleLabel, nextRunAt } = config;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="card w-full max-w-lg p-6 space-y-5 bg-surface border border-border shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="label text-3xs">System Configuration</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5">
              Gate Rules & Scheduler Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost px-2.5 py-1 text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Gate Thresholds */}
        <div className="space-y-3">
          <span className="label text-3xs">Editorial Gate Thresholds</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-border bg-surface-raised p-3 space-y-1">
              <span className="text-foreground-muted">Evidence Coverage</span>
              <div className="font-mono text-sm font-bold text-foreground">
                {(thresholds.evidenceCoverage * 100).toFixed(0)}%
              </div>
              <p className="text-3xs text-foreground-faint">
                Min. corroborated claims required
              </p>
            </div>

            <div className="rounded border border-border bg-surface-raised p-3 space-y-1">
              <span className="text-foreground-muted">Min. Independent Sources</span>
              <div className="font-mono text-sm font-bold text-foreground">
                {thresholds.minIndependentSources} Distinct Publishers
              </div>
              <p className="text-3xs text-foreground-faint">
                Per claim corroboration standard
              </p>
            </div>

            <div className="rounded border border-border bg-surface-raised p-3 space-y-1">
              <span className="text-foreground-muted">Sensitivity Cutoff</span>
              <div className="font-mono text-sm font-bold text-status-block">
                ≥ {(thresholds.sensitivityBlock * 100).toFixed(0)}% Risk
              </div>
              <p className="text-3xs text-foreground-faint">
                Blocks emergencies & tragedy terms
              </p>
            </div>

            <div className="rounded border border-border bg-surface-raised p-3 space-y-1">
              <span className="text-foreground-muted">Novelty Block Limit</span>
              <div className="font-mono text-sm font-bold text-brand">
                ≥ {(thresholds.noveltyBlock * 100).toFixed(0)}% Similarity
              </div>
              <p className="text-3xs text-foreground-faint">
                Catches back-catalogue duplicates
              </p>
            </div>
          </div>
        </div>

        {/* Daily Automation */}
        <div className="space-y-2 border-t border-border pt-3">
          <span className="label text-3xs">Autonomous Daily Publishing</span>
          <div className="rounded border border-border bg-surface-raised p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Schedule Pattern:</span>
              <span className="font-mono font-bold text-foreground">
                {scheduleCron} ({scheduleLabel})
              </span>
            </div>
            {nextRunAt && (
              <div className="flex items-center justify-between text-3xs text-foreground-faint">
                <span>Next automated execution:</span>
                <span className="font-mono">
                  {new Date(nextRunAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Outbound Services Status */}
        <div className="space-y-2 border-t border-border pt-3">
          <span className="label text-3xs">Outbound Chokepoint Integrations</span>
          <div className="grid grid-cols-2 gap-2 text-3xs font-mono">
            {Object.entries(services).map(([srv, status]) => (
              <div
                key={srv}
                className="flex items-center justify-between rounded border border-border bg-surface-raised px-2.5 py-1.5"
              >
                <span className="capitalize font-bold text-foreground">{srv}</span>
                <span
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    status === 'live'
                      ? 'bg-status-pass-bg text-status-pass border border-status-pass-border'
                      : 'bg-surface text-foreground-faint border border-border'
                  }`}
                >
                  {String(status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
