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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-up">
      <div className="card w-full max-w-lg p-6 space-y-5 bg-raised shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div>
            <span className="label text-2xs">System Configuration</span>
            <h3 className="font-serif text-lg font-bold text-ink">
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
          <span className="label text-2xs">Editorial Gate Thresholds</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-rule bg-paper p-3 space-y-1">
              <span className="text-ink-soft">Evidence Coverage</span>
              <div className="font-mono text-sm font-bold text-ink">
                {(thresholds.evidenceCoverage * 100).toFixed(0)}%
              </div>
              <p className="text-2xs text-ink-faint">
                Min. corroborated claims required
              </p>
            </div>

            <div className="rounded border border-rule bg-paper p-3 space-y-1">
              <span className="text-ink-soft">Min. Independent Sources</span>
              <div className="font-mono text-sm font-bold text-ink">
                {thresholds.minIndependentSources} Distinct Publishers
              </div>
              <p className="text-2xs text-ink-faint">
                Per claim corroboration standard
              </p>
            </div>

            <div className="rounded border border-rule bg-paper p-3 space-y-1">
              <span className="text-ink-soft">Sensitivity Cutoff</span>
              <div className="font-mono text-sm font-bold text-block">
                ≥ {(thresholds.sensitivityBlock * 100).toFixed(0)}% Risk
              </div>
              <p className="text-2xs text-ink-faint">
                Blocks emergencies & tragedy terms
              </p>
            </div>

            <div className="rounded border border-rule bg-paper p-3 space-y-1">
              <span className="text-ink-soft">Novelty Block Limit</span>
              <div className="font-mono text-sm font-bold text-accent">
                ≥ {(thresholds.noveltyBlock * 100).toFixed(0)}% Similarity
              </div>
              <p className="text-2xs text-ink-faint">
                Catches back-catalogue duplicates
              </p>
            </div>
          </div>
        </div>

        {/* Daily Automation */}
        <div className="space-y-2 border-t border-rule pt-3">
          <span className="label text-2xs">Autonomous Daily Publishing</span>
          <div className="rounded border border-rule bg-paper p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Schedule Pattern:</span>
              <span className="font-mono font-bold text-ink">
                {scheduleCron} ({scheduleLabel})
              </span>
            </div>
            {nextRunAt && (
              <div className="flex items-center justify-between text-2xs text-ink-faint">
                <span>Next automated execution:</span>
                <span className="font-mono">
                  {new Date(nextRunAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Outbound Services Status */}
        <div className="space-y-2 border-t border-rule pt-3">
          <span className="label text-2xs">Outbound Chokepoint Integrations</span>
          <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
            {Object.entries(services).map(([srv, status]) => (
              <div
                key={srv}
                className="flex items-center justify-between rounded border border-rule bg-paper px-2.5 py-1.5"
              >
                <span className="capitalize font-bold">{srv}</span>
                <span
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    status === 'live'
                      ? 'bg-pass-bg text-pass'
                      : 'bg-sunk text-ink-soft'
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
