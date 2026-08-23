import React, { useState } from 'react';

interface ScenarioSelectorProps {
  isRunning: boolean;
  onSelectScenario: (params: { trendId?: string; query?: string }) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'trend-inference-costs',
    title: '1. Clean Auto-Publish Path',
    topic: 'Open-weight model inference costs fell sharply',
    badge: 'Expected: PASS (Publishes)',
    badgeClass: 'chip-pass',
    desc: 'Corroborated by 4 independent publishers, completely safe, and novel compared to history. Publishes unattended.',
  },
  {
    id: 'trend-port-fire',
    title: '2. Crisis / Sensitivity Filter',
    topic: 'Industrial fire at freight terminal, casualties reported',
    badge: 'Expected: SENSITIVITY BLOCK',
    badgeClass: 'chip-block',
    desc: 'Corroborated by 4 publishers, but contains emergency/casualty context. Refuses unprompted brand publication.',
  },
  {
    id: 'trend-acquisition-rumour',
    title: '3. Single-Source Gossip / Rumour',
    topic: 'Northwind Robotics reportedly in acquisition talks',
    badge: 'Expected: EVIDENCE BLOCK',
    badgeClass: 'chip-block',
    desc: 'Only 1 publisher, 0 corroboration. Blocks unverified claims before they are published under your name.',
  },
  {
    id: 'trend-vector-db-pricing',
    title: '4. Vector DB Novelty / Repetition',
    topic: 'Vector database vendors converge on usage-based pricing',
    badge: 'Expected: NOVELTY BLOCK',
    badgeClass: 'chip-block',
    desc: 'Semantically identical (>86% cosine similarity) to a post from 6 days ago. Demonstrates back-catalogue RAG.',
  },
];

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  isRunning,
  onSelectScenario,
}) => {
  const [customQuery, setCustomQuery] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isRunning) return;
    onSelectScenario({ query: customQuery.trim() });
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="border-b border-rule pb-3">
        <span className="label">Evaluation Benchmarks</span>
        <h2 className="font-serif text-lg font-bold text-ink">
          Test Scenarios & Scenarios Selector
        </h2>
        <p className="text-xs text-ink-soft mt-1">
          Execute individual test cases designed to exercise each gate check and verify autonomous vs. escalated behavior.
        </p>
      </div>

      {/* Preset Scenario Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        {PRESET_SCENARIOS.map((sc) => (
          <div
            key={sc.id}
            className="rounded-lg border border-rule bg-raised p-3 hover:border-accent/40 transition-all shadow-2xs flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-ink">{sc.title}</h4>
                <span className={sc.badgeClass}>{sc.badge}</span>
              </div>
              <p className="text-xs font-serif font-medium text-ink-soft mt-0.5">
                "{sc.topic}"
              </p>
              <p className="text-2xs text-ink-faint mt-1 leading-normal">
                {sc.desc}
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                id={`btn-run-${sc.id}`}
                onClick={() => onSelectScenario({ trendId: sc.id })}
                disabled={isRunning}
                className="btn-ghost text-2xs px-3 py-1 font-mono hover:border-accent hover:text-accent"
              >
                Run Scenario →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Query Search */}
      <div className="pt-2 border-t border-rule space-y-2">
        <span className="label text-2xs">Custom Live Trend Search</span>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            id="input-custom-query"
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="e.g. Next-gen humanoid robotics, WebGPU..."
            disabled={isRunning}
            className="flex-1 rounded-md border border-rule bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            id="btn-run-custom"
            type="submit"
            disabled={isRunning || !customQuery.trim()}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Search & Run
          </button>
        </form>
      </div>
    </div>
  );
};
