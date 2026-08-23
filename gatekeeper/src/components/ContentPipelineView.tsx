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
  onInspectRun,
  onTriggerScenario,
  isRunning,
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-page-title text-primary">Content Pipeline</h2>
          <p className="text-body text-secondary mt-1">
            Articles currently moving through the editorial safety pipeline.
          </p>
        </div>

        <button
          onClick={() => onTriggerScenario({ trendId: 'trend-inference-costs' })}
          disabled={isRunning}
          className="btn-primary text-xs self-start sm:self-center"
        >
          Run New Trend
        </button>
      </div>

      {/* Clean Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted font-medium bg-surface-raised/50">
              <tr>
                <th className="py-3.5 px-5">Topic</th>
                <th className="py-3.5 px-4">Sources</th>
                <th className="py-3.5 px-3 text-center">Evidence</th>
                <th className="py-3.5 px-3 text-center">Safety</th>
                <th className="py-3.5 px-3 text-center">Novelty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-muted">
                    No active runs logged in this session.
                  </td>
                </tr>
              ) : (
                history.map((run) => {
                  const isPub = run.outcome === 'published';
                  const isEsc = run.outcome === 'escalated';

                  return (
                    <tr
                      key={run.runId}
                      onClick={() => onInspectRun(run)}
                      className="hover:bg-surface-raised cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5 text-sm font-medium text-primary max-w-sm truncate">
                        {run.topic || 'Discovered Trend'}
                      </td>
                      <td className="py-4 px-4 text-secondary">
                        2 publishers
                      </td>
                      <td className="py-4 px-3 text-center text-status-pass font-semibold">
                        ✓
                      </td>
                      <td className="py-4 px-3 text-center text-status-pass font-semibold">
                        ✓
                      </td>
                      <td className="py-4 px-3 text-center font-semibold">
                        {isEsc ? <span className="text-status-warn">⚠</span> : <span className="text-status-pass">✓</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={
                            isPub
                              ? 'status-pass'
                              : isEsc
                                ? 'status-warn'
                                : 'status-idle'
                          }
                        >
                          {isPub ? 'Verified' : isEsc ? 'Review' : 'Processing'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-muted text-xs">
                        {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="text-brand hover:underline font-medium text-xs">
                          Inspect →
                        </span>
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
