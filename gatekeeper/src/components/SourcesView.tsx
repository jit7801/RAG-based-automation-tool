import React from 'react';

interface SourceItem {
  name: string;
  domain: string;
  reliability: string;
  reliabilityScore: number;
  indexedArticles: number;
  health: 'healthy' | 'degraded';
  category: string;
}

const SOURCES: SourceItem[] = [
  {
    name: 'The Kernel',
    domain: 'thekernel.tech',
    reliability: 'Tier 1 Verified',
    reliabilityScore: 98,
    indexedArticles: 342,
    health: 'healthy',
    category: 'Hardware & Quantisation',
  },
  {
    name: 'Byteline',
    domain: 'byteline.press',
    reliability: 'Tier 1 Verified',
    reliabilityScore: 95,
    indexedArticles: 218,
    health: 'healthy',
    category: 'Model Serving & Inference',
  },
  {
    name: 'Compute Weekly',
    domain: 'computeweekly.com',
    reliability: 'Tier 1 Verified',
    reliabilityScore: 96,
    indexedArticles: 186,
    health: 'healthy',
    category: 'Cloud Infrastructure',
  },
  {
    name: 'Signal & Stack',
    domain: 'signalstack.dev',
    reliability: 'Tier 2 Industry Signal',
    reliabilityScore: 88,
    indexedArticles: 124,
    health: 'healthy',
    category: 'Developer Ecosystem',
  },
  {
    name: 'Harbour Dispatch',
    domain: 'harbourdispatch.net',
    reliability: 'Regional Wire',
    reliabilityScore: 92,
    indexedArticles: 94,
    health: 'healthy',
    category: 'Logistics & Supply Chain',
  },
  {
    name: 'Meridian Wire',
    domain: 'meridianwire.org',
    reliability: 'General News Wire',
    reliabilityScore: 91,
    indexedArticles: 140,
    health: 'healthy',
    category: 'Macro & Incident Feeds',
  },
];

export const SourcesView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Verified Publisher Sources</h2>
            <span className="chip-pass text-3xs font-mono">
              {SOURCES.length} Active Feeds
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Independent journalistic and technical outlets indexed in the Weaviate vector knowledge base.
          </p>
        </div>
      </div>

      {/* Sources Table */}
      <div className="card overflow-hidden bg-surface shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-3xs uppercase font-mono text-foreground-faint">
              <tr>
                <th className="py-3 px-4 font-semibold">Publisher</th>
                <th className="py-3 px-4 font-semibold">Domain</th>
                <th className="py-3 px-4 font-semibold">Reliability Tier</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Passages Indexed</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {SOURCES.map((s) => (
                <tr key={s.name} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-surface-raised border border-border flex items-center justify-center font-serif text-3xs text-brand font-bold">
                      {s.name[0]}
                    </span>
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-3xs text-foreground-muted">
                    {s.domain}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-3xs font-mono text-foreground-muted">
                      <span className="text-status-pass">●</span>
                      {s.reliability} ({s.reliabilityScore}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-3xs text-foreground-muted">
                    {s.category}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-3xs font-semibold text-foreground">
                    {s.indexedArticles}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="chip-pass text-3xs">
                      Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
