import React from 'react';

interface SourceItem {
  name: string;
  domain: string;
  reliability: string;
  indexedArticles: number;
  status: string;
}

const SOURCES: SourceItem[] = [
  { name: 'The Kernel', domain: 'thekernel.tech', reliability: 'Tier 1 Verified', indexedArticles: 342, status: 'Active' },
  { name: 'Byteline', domain: 'byteline.press', reliability: 'Tier 1 Verified', indexedArticles: 218, status: 'Active' },
  { name: 'Compute Weekly', domain: 'computeweekly.com', reliability: 'Tier 1 Verified', indexedArticles: 186, status: 'Active' },
  { name: 'Signal & Stack', domain: 'signalstack.dev', reliability: 'Tier 2 Signal', indexedArticles: 124, status: 'Active' },
  { name: 'Harbour Dispatch', domain: 'harbourdispatch.net', reliability: 'Regional News Wire', indexedArticles: 94, status: 'Active' },
  { name: 'Meridian Wire', domain: 'meridianwire.org', reliability: 'News Wire', indexedArticles: 140, status: 'Active' },
];

export const SourcesView: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* 1. Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-page-title text-primary">Sources & System Status</h2>
        <p className="text-body text-secondary mt-1">
          Source feeds indexed in the vector knowledge store and outbound execution telemetry.
        </p>
      </div>

      {/* 2. System Status & Swytchcode Architecture Panel */}
      <div className="rounded-lg border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-section-heading text-primary">System Health & Execution Layer</h3>
            <p className="text-xs text-secondary mt-0.5">
              Auditable external API gateways and local fallback systems.
            </p>
          </div>
          <span className="status-pass text-xs">
            Operational
          </span>
        </div>

        {/* 5 Service Nodes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded bg-surface-raised border border-border space-y-1">
            <div className="text-muted">RAG Engine</div>
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
              Operational
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-raised border border-border space-y-1">
            <div className="text-muted">Vector Database</div>
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
              Weaviate Live
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-raised border border-border space-y-1">
            <div className="text-muted">LLM Synthesis</div>
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
              Operational
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-raised border border-border space-y-1">
            <div className="text-muted">Slack Channels</div>
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
              Operational
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-raised border border-border space-y-1">
            <div className="text-muted">Execution Mode</div>
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
              NORMAL / FALLBACK
            </div>
          </div>
        </div>

        {/* Architecture Note */}
        <div className="p-4 rounded bg-surface-raised border border-border-subtle text-xs text-secondary leading-relaxed">
          <span className="font-semibold text-primary">Fail-Safe Architecture: </span>
          Proofly funnels every external API call through a single execution gateway. When network services or upstream APIs become unreachable, Proofly automatically falls back to the deterministic local knowledge corpus so evaluation never breaks.
        </div>
      </div>

      {/* 3. Verified Publisher Sources Table */}
      <div className="space-y-4">
        <h3 className="text-section-heading text-primary">Indexed Publishers</h3>

        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted font-medium bg-surface-raised/50">
              <tr>
                <th className="py-3.5 px-5">Publisher</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Reliability Tier</th>
                <th className="py-3.5 px-4 text-right">Indexed Passages</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {SOURCES.map((s) => (
                <tr key={s.name} className="hover:bg-surface-raised transition-colors">
                  <td className="py-4 px-5 font-semibold text-primary">
                    {s.name}
                  </td>
                  <td className="py-4 px-4 font-mono text-muted text-xs">
                    {s.domain}
                  </td>
                  <td className="py-4 px-4 text-secondary">
                    {s.reliability}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-primary font-medium">
                    {s.indexedArticles}
                  </td>
                  <td className="py-4 px-5 text-right text-status-pass font-medium">
                    ● {s.status}
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
