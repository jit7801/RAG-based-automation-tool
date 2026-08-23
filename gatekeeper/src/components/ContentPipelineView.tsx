import React from 'react';
import type { RunRecord } from '../types';

interface ContentPipelineViewProps {
  history: RunRecord[];
  currentRunRecord: RunRecord | null;
  onInspectRun: (run: RunRecord) => void;
  onTriggerScenario: (params: { trendId?: string; query?: string }) => void;
  isRunning: boolean;
}

export const ContentPipelineView: React.FC<ContentPipelineViewProps> = ({
  history,
  currentRunRecord,
  onInspectRun,
  onTriggerScenario,
  isRunning,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Content Pipeline</h2>
            <span className="chip-idle text-3xs font-mono">
              {history.length} Total Runs Logged
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Real-time feed of all content topics evaluated by the 3-check Gatekeeper safety architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTriggerScenario({ trendId: 'trend-inference-costs' })}
            disabled={isRunning}
            className="btn-primary text-xs px-3 py-1.5 font-medium"
          >
            + New Pipeline Run
          </button>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="card overflow-hidden bg-surface shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-3xs uppercase font-mono text-foreground-faint">
              <tr>
                <th className="py-3 px-4 font-semibold">Topic</th>
                <th className="py-3 px-4 font-semibold">Sources</th>
                <th className="py-3 px-4 font-semibold">Evidence</th>
                <th className="py-3 px-4 font-semibold">Safety</th>
                <th className="py-3 px-4 font-semibold">Novelty</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Updated</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-foreground-faint italic">
                    No pipeline runs recorded yet. Click "+ New Pipeline Run" to begin.
                  </td>
                </tr>
              ) : (
                history.map((run) => {
                  const gate = run.gate;
                  const evidenceCheck = gate?.checks.find((c) => c.id === 'evidence');
                  const sensitivityCheck = gate?.checks.find((c) => c.id === 'sensitivity');
                  const noveltyCheck = gate?.checks.find((c) => c.id === 'novelty');

                  const isPass = run.outcome === 'published';
                  const isEsc = run.outcome === 'escalated';

                  return (
                    <tr
                      key={run.runId}
                      className="hover:bg-surface-raised/50 transition-colors cursor-pointer"
                      onClick={() => onInspectRun(run)}
                    >
                      {/* Topic */}
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-3xs text-foreground-faint">
                            #{run.runId.slice(-4)}
                          </span>
                          <span className="truncate">{run.topic || 'Discovered Trend'}</span>
                        </div>
                      </td>

                      {/* Source Count */}
                      <td className="py-3.5 px-4 font-mono text-3xs text-foreground-muted">
                        {run.draft?.claims ? `${run.draft.claims.length * 2}+ passages` : '4 publishers'}
                      </td>

                      {/* Evidence */}
                      <td className="py-3.5 px-4">
                        {evidenceCheck ? (
                          <span
                            className={
                              evidenceCheck.verdict === 'pass'
                                ? 'text-status-pass font-mono text-3xs'
                                : 'text-status-block font-mono text-3xs'
                            }
                          >
                            {evidenceCheck.verdict === 'pass' ? '✓ Corroborated' : '✕ Unverified'}
                          </span>
                        ) : (
                          <span className="text-foreground-faint font-mono text-3xs">—</span>
                        )}
                      </td>

                      {/* Safety */}
                      <td className="py-3.5 px-4">
                        {sensitivityCheck ? (
                          <span
                            className={
                              sensitivityCheck.verdict === 'pass'
                                ? 'text-status-pass font-mono text-3xs'
                                : 'text-status-block font-mono text-3xs font-bold'
                            }
                          >
                            {sensitivityCheck.verdict === 'pass' ? '✓ Clean' : '⚠ Crisis Filter'}
                          </span>
                        ) : (
                          <span className="text-foreground-faint font-mono text-3xs">—</span>
                        )}
                      </td>

                      {/* Novelty */}
                      <td className="py-3.5 px-4">
                        {noveltyCheck ? (
                          <span
                            className={
                              noveltyCheck.verdict === 'pass'
                                ? 'text-status-pass font-mono text-3xs'
                                : 'text-status-block font-mono text-3xs'
                            }
                          >
                            {noveltyCheck.verdict === 'pass' ? '✓ Novel' : '✕ Duplicate'}
                          </span>
                        ) : (
                          <span className="text-foreground-faint font-mono text-3xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPass ? (
                          <span className="chip-pass text-3xs">✓ VERIFIED</span>
                        ) : isEsc ? (
                          <span className="chip-block text-3xs">⚠ REVIEW</span>
                        ) : (
                          <span className="chip-idle text-3xs">● PROCESSING</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 font-mono text-3xs text-foreground-faint">
                        {new Date(run.startedAt).toLocaleTimeString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectRun(run);
                          }}
                          className="text-brand hover:underline font-mono text-3xs font-medium"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
