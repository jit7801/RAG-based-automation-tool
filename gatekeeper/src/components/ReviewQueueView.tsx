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
  const escalatedRuns = history.filter((r) => r.outcome === 'escalated' || r.gate?.decision === 'escalate');
  const pendingCount = escalatedRuns.filter((r) => !r.humanDecision).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-page-title text-primary">Review Queue</h2>
        <p className="text-body text-secondary mt-1">
          {pendingCount} drafts require human attention before publication.
        </p>
      </div>

      {/* List of items */}
      {escalatedRuns.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted space-y-2">
          <p className="text-sm font-medium text-primary">Review queue is empty</p>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            All content has passed automated checks or been resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalatedRuns.map((run) => {
            const isDecided = !!run.humanDecision;
            const gate = run.gate;
            const failedCheck = gate?.checks.find((c) => c.verdict === 'block' || c.verdict === 'warn');

            return (
              <div
                key={run.runId}
                className="rounded-lg border border-border bg-surface p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary">
                      {run.topic || 'Discovered Trend'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-secondary">
                      <span>Held by {failedCheck?.label || 'Safety'} Gate</span>
                      <span>•</span>
                      <span className="font-mono text-muted">
                        {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isDecided ? (
                      <span
                        className={
                          run.humanDecision === 'approved'
                            ? 'status-pass'
                            : 'status-block'
                        }
                      >
                        {run.humanDecision === 'approved' ? '✓ Approved' : '✕ Rejected'}
                      </span>
                    ) : (
                      <span className="status-warn">
                        Needs Attention
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="p-3 rounded bg-surface-raised border border-border text-xs text-secondary">
                  <span className="font-semibold text-primary">Reason: </span>
                  {gate?.reason || 'Draft held for human verification.'}
                </div>

                {/* Draft Preview */}
                {run.draft && (
                  <p className="text-xs text-secondary leading-relaxed line-clamp-2 italic">
                    "{run.draft.body}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button
                    onClick={() => onInspectRun(run)}
                    className="text-xs text-brand hover:underline font-medium"
                  >
                    Inspect evidence →
                  </button>

                  {!isDecided ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDecision(run.runId, 'rejected')}
                        className="btn-ghost text-xs px-3 py-1.5 text-secondary hover:text-status-block"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onDecision(run.runId, 'approved')}
                        className="btn-primary text-xs px-3.5 py-1.5"
                      >
                        Approve & Publish
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">
                      Decision recorded
                    </span>
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
