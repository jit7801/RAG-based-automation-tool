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
    title: '1. Clean Auto-Publish Benchmark',
    topic: 'Open-weight model inference costs fell sharply this quarter',
    badge: 'EXPECTED: PASS (PUBLISHES)',
    badgeClass: 'chip-pass',
    desc: 'Corroborated by 4 independent publishers, completely safe, and novel compared to catalogue. Publishes unattended.',
    publishers: 4,
    gateType: 'Evidence + Safety + Novelty PASS',
  },
  {
    id: 'trend-port-fire',
    title: '2. Crisis & Sensitivity Gate Refusal',
    topic: 'Industrial fire at Harbour Point terminal, casualties reported',
    badge: 'EXPECTED: SENSITIVITY BLOCK',
    badgeClass: 'chip-block',
    desc: 'Corroborated by 4 publishers, but contains emergency/casualty context. Refuses unprompted brand publication.',
    publishers: 4,
    gateType: 'Sensitivity Filter BLOCK',
  },
  {
    id: 'trend-acquisition-rumour',
    title: '3. Single-Source Unverified Rumour',
    topic: 'Northwind Robotics reportedly in acquisition talks',
    badge: 'EXPECTED: EVIDENCE BLOCK',
    badgeClass: 'chip-block',
    desc: 'Only 1 publisher with 0 corroboration. Blocks unverified claims before they damage brand credibility.',
    publishers: 1,
    gateType: 'Evidence Coverage BLOCK',
  },
  {
    id: 'trend-vector-db-pricing',
    title: '4. Vector DB Semantic Novelty / Duplication',
    topic: 'Vector database vendors converge on usage-based pricing',
    badge: 'EXPECTED: NOVELTY BLOCK',
    badgeClass: 'chip-block',
    desc: 'Semantically identical (>86% cosine similarity) to a post from 6 days ago in back-catalogue. Blocks repetitive content.',
    publishers: 2,
    gateType: 'Novelty RAG BLOCK',
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  isRunning,
  trends,
  onTriggerScenario,
}) => {
  const [customQuery, setCustomQuery] = React.useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isRunning) return;
    onTriggerScenario({ query: customQuery.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Trend Discovery Engine</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Monitor real-time publisher signals or run synthetic benchmark scenarios designed to exercise every safety gate.
          </p>
        </div>
      </div>

      {/* Custom Live Search Bar */}
      <div className="card p-4 bg-surface-raised/40">
        <form onSubmit={handleCustomSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Search live tech trends (e.g. Next-gen humanoid robotics, WebGPU sharding, Quantum LLMs...)"
              disabled={isRunning}
              className="w-full pl-9 pr-4 py-2 bg-surface rounded-md border border-border text-xs text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-brand transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isRunning || !customQuery.trim()}
            className="btn-primary text-xs px-4 py-2 font-medium"
          >
            Discover & Run
          </button>
        </form>
      </div>

      {/* Benchmark Scenarios Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="label">Evaluation Benchmarks (Gatekeeper Stress Tests)</span>
          <span className="text-3xs font-mono text-foreground-faint">4 Pre-Configured Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PRESET_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="card p-4 bg-surface hover:border-brand/40 hover:bg-surface-raised/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-foreground">{sc.title}</h3>
                  <span className={sc.badgeClass}>{sc.badge}</span>
                </div>
                <div className="p-2 rounded bg-surface-raised border border-border-subtle text-xs text-foreground font-medium font-sans">
                  "{sc.topic}"
                </div>
                <p className="text-2xs text-foreground-muted leading-relaxed">
                  {sc.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-3xs font-mono">
                <span className="text-foreground-faint">{sc.publishers} Independent Sources</span>
                <button
                  id={`btn-run-${sc.id}`}
                  onClick={() => onTriggerScenario({ trendId: sc.id })}
                  disabled={isRunning}
                  className="btn-ghost text-2xs px-3 py-1 text-foreground hover:text-brand hover:border-brand font-medium flex items-center gap-1"
                >
                  <span>Trigger Pipeline</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
