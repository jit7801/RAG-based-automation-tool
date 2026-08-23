import React, { useState } from 'react';
import type { Draft, GateResult, HumanDecision } from '../types';

interface EscalationActionProps {
  runId: string | null;
  draft: Draft | null;
  gate: GateResult | null;
  humanDecision: HumanDecision | null;
  onDecision: (decision: HumanDecision) => Promise<void>;
}

export const EscalationAction: React.FC<EscalationActionProps> = ({
  runId,
  draft,
  gate,
  humanDecision,
  onDecision,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!runId || !gate || gate.decision !== 'escalate') {
    return null;
  }

  const handleAction = async (decision: HumanDecision) => {
    setSubmitting(true);
    try {
      await onDecision(decision);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-status-block-border bg-status-block-bg/60 p-4 shadow-panel space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="chip-block font-bold text-3xs">Action Required</span>
            <span className="label text-3xs">Human-in-the-Loop Escalation</span>
          </div>
          <h3 className="text-sm font-bold text-foreground">
            Editorial Intervention: Draft Held for Human Review
          </h3>
          <p className="text-xs text-foreground-muted leading-relaxed max-w-2xl">
            The safety gate identified corroboration, sensitivity, or repetition risks. Review the reason and decide whether to override or reject.
          </p>
        </div>
      </div>

      {/* Rationale highlight */}
      <div className="rounded border border-status-block-border bg-surface p-3 text-xs text-status-block font-medium">
        {gate.reason}
      </div>

      {/* Decision Status or Action Buttons */}
      {humanDecision ? (
        <div className="rounded bg-surface p-3 border border-border flex items-center justify-between">
          <span className="text-xs text-foreground-muted">
            Reviewer Decision:{' '}
            <strong className="uppercase font-mono text-foreground">
              {humanDecision}
            </strong>
          </span>
          <span
            className={
              humanDecision === 'approved' ? 'chip-pass' : 'chip-block'
            }
          >
            {humanDecision === 'approved'
              ? '✓ Approved & Published to #content'
              : '✕ Rejected & Discarded'}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            id="btn-reject-draft"
            onClick={() => handleAction('rejected')}
            disabled={submitting}
            className="btn-block text-xs px-3.5 py-1.5 font-medium"
          >
            {submitting ? 'Submitting...' : '✕ Reject Draft (Do Not Publish)'}
          </button>
          <button
            id="btn-approve-draft"
            onClick={() => handleAction('approved')}
            disabled={submitting}
            className="btn-pass text-xs px-3.5 py-1.5 font-medium"
          >
            {submitting ? 'Submitting...' : '✓ Override & Publish to #content'}
          </button>
        </div>
      )}
    </div>
  );
};
