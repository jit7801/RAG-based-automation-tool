import React from 'react';
import type { HumanDecision, RunRecord } from '../types';

interface ReviewQueueViewProps {
  history: RunRecord[];
  onDecision: (runId: string, decision: HumanDecision) => Promise<void>;
  onInspectRun: (run: RunRecord) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  history,
  onDecision,
  onInspectRun,
}) => {
  // Filter runs that resulted in escalation
  const escalatedRuns = history.filter((r) => r.outcome === 'escalated' || r.gate?.decision === 'escalate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Human Review Queue</h2>
            <span className="chip-warn text-3xs font-mono">
              {escalatedRuns.filter((r) => !r.humanDecision).length} Pending Action
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Content held by safety, corroboration, or novelty checks requiring editorial judgment before publication.
          </p>
        </div>
      </div>

      {/* Review Items List */}
      {escalatedRuns.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center text-foreground-faint space-y-3">
          <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-status-pass">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">Review Queue is Clear</p>
          <p className="text-xs text-foreground-muted max-w-sm">
            All recent trends passed automated safety thresholds or were cleared unattended. Trigger Scenario 2 or 3 to test safety escalation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalatedRuns.map((run) => {
            const isDecided = !!run.humanDecision;
            const gate = run.gate;
            const failedChecks = gate?.checks.filter((c) => c.verdict === 'block' || c.verdict === 'warn') || [];

            return (
              <div
                key={run.runId}
                className="card p-5 bg-surface hover:border-border-focus/40 transition-all space-y-4 shadow-panel"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-3xs text-foreground-faint">
                        RUN #{run.runId.slice(-6)}
                      </span>
                      <span className="text-foreground-faint">•</span>
                      <span className="text-3xs font-mono text-foreground-faint">
                        {new Date(run.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-0.5">
                      {run.topic || 'Discovered Trend'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {run.degraded && (
                      <span className="chip-warn text-3xs">Fallback</span>
                    )}
                    {isDecided ? (
                      <span
                        className={
                          run.humanDecision === 'approved'
                            ? 'chip-pass text-3xs'
                            : 'chip-block text-3xs'
                        }
                      >
                        {run.humanDecision === 'approved'
                          ? '✓ Overridden & Published'
                          : '✕ Rejected & Discarded'}
                      </span>
                    ) : (
                      <span className="chip-block text-3xs font-bold animate-pulse">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Flag Reason */}
                <div className="p-3 rounded-md bg-status-block-bg border border-status-block-border text-xs text-status-block space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-3xs font-mono">
                    <span>⚠️ Safety Reason:</span>
                  </div>
                  <p>{gate?.reason || 'Draft held for human verification.'}</p>
                </div>

                {/* Failed Gates Badges */}
                <div className="flex flex-wrap gap-2">
                  {failedChecks.map((fc) => (
                    <span
                      key={fc.id}
                      className="px-2 py-1 rounded bg-surface-raised border border-border text-3xs font-mono text-foreground-muted"
                    >
                      <strong className="text-status-block">{fc.label}:</strong> {fc.reason}
                    </span>
                  ))}
                </div>

                {/* Draft Preview */}
                {run.draft && (
                  <div className="p-3.5 rounded bg-surface-raised border border-border-subtle text-xs text-foreground font-sans leading-relaxed">
                    <p className="line-clamp-3 italic text-foreground-muted">
                      "{run.draft.body}"
                    </p>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => onInspectRun(run)}
                    className="btn-ghost text-xs px-3 py-1.5 text-brand hover:border-brand font-mono text-3xs"
                  >
                    Inspect Full Evidence →
                  </button>

                  {!isDecided ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDecision(run.runId, 'rejected')}
                        className="btn-block text-xs px-4 py-1.5"
                      >
                        ✕ Reject Post
                      </button>
                      <button
                        onClick={() => onDecision(run.runId, 'approved')}
                        className="btn-pass text-xs px-4 py-1.5"
                      >
                        ✓ Override & Publish to #content
                      </button>
                    </div>
                  ) : (
                    <div className="text-3xs font-mono text-foreground-faint">
                      Editorial decision finalized at {run.finishedAt ? new Date(run.finishedAt).toLocaleTimeString() : 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
