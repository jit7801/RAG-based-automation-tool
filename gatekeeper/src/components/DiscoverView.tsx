import React from 'react';
import type { TrendOption } from '../types';

interface DiscoverViewProps {
  isRunning: boolean;
  trends: TrendOption[];
  onTriggerScenario: (params: { trendId?: string; query?: string }) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'trend-inference-costs',
    title: 'Clean Auto-Publish Benchmark',
    topic: 'Open-weight model inference costs fell sharply this quarter',
    badge: 'Pass (Publishes)',
    badgeClass: 'status-pass',
    desc: 'Corroborated by 4 independent publishers, safe, and novel compared to catalogue. Publishes unattended.',
    publishers: 4,
  },
  {
    id: 'trend-port-fire',
    title: 'Crisis & Sensitivity Gate Refusal',
    topic: 'Industrial fire at Harbour Point terminal, casualties reported',
    badge: 'Sensitivity Block',
    badgeClass: 'status-block',
    desc: 'Corroborated by 4 publishers, but contains emergency/casualty context. Refuses unprompted brand publication.',
    publishers: 4,
  },
  {
    id: 'trend-acquisition-rumour',
    title: 'Single-Source Unverified Rumour',
    topic: 'Northwind Robotics reportedly in acquisition talks',
    badge: 'Evidence Block',
    badgeClass: 'status-block',
    desc: 'Only 1 publisher with 0 corroboration. Blocks unverified claims before publication.',
    publishers: 1,
  },
  {
    id: 'trend-vector-db-pricing',
    title: 'Vector DB Semantic Duplication',
    topic: 'Vector database vendors converge on usage-based pricing',
    badge: 'Novelty Block',
    badgeClass: 'status-warn',
    desc: 'Semantically identical (>86% cosine similarity) to a post from 6 days ago in back-catalogue. Blocks repetition.',
    publishers: 2,
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  isRunning,
  onTriggerScenario,
}) => {
  const [customQuery, setCustomQuery] = React.useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isRunning) return;
    onTriggerScenario({ query: customQuery.trim() });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-page-title text-primary">Discover Trends</h2>
        <p className="text-body text-secondary mt-1">
          Search live publisher signals or run pre-configured benchmark scenarios to test safety gates.
        </p>
      </div>

      {/* Live Search */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <form onSubmit={handleCustomSubmit} className="flex gap-3">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Search live tech trends (e.g. humanoid robotics, WebGPU inference, quantum algorithms...)"
            disabled={isRunning}
            className="flex-1 bg-surface-raised px-3.5 py-2 rounded text-sm text-primary placeholder:text-muted border border-border focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={isRunning || !customQuery.trim()}
            className="btn-primary text-xs px-4 py-2 font-medium"
          >
            Search & Run
          </button>
        </form>
      </div>

      {/* Benchmarks Grid */}
      <div className="space-y-4">
        <h3 className="text-section-heading text-primary">Evaluation Benchmarks</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="rounded-lg border border-border bg-surface p-5 space-y-3 hover:border-brand/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-primary">{sc.title}</h4>
                  <span className={sc.badgeClass}>{sc.badge}</span>
                </div>
                <div className="text-xs text-primary font-medium">
                  "{sc.topic}"
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  {sc.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted">
                <span>{sc.publishers} publishers</span>
                <button
                  onClick={() => onTriggerScenario({ trendId: sc.id })}
                  disabled={isRunning}
                  className="btn-ghost text-xs px-3 py-1 font-medium text-primary hover:text-brand"
                >
                  Run Scenario →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
