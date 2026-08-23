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
    <div className="rounded-lg border-2 border-block bg-block-bg/30 p-5 shadow-lift space-y-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="chip-block font-bold">Action Required</span>
            <span className="label text-2xs">Human-in-the-Loop Escalation</span>
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">
            Editorial Intervention: Draft Held for Review
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed max-w-2xl">
            The gate identified safety, corroboration, or novelty risks. Review the reason below and decide whether to override the gate and publish, or reject this post.
          </p>
        </div>
      </div>

      {/* Rationale highlight */}
      <div className="rounded border border-block/30 bg-raised p-3 text-xs text-block font-medium">
        {gate.reason}
      </div>

      {/* Decision Status or Action Buttons */}
      {humanDecision ? (
        <div className="rounded bg-raised p-3 border border-rule flex items-center justify-between">
          <span className="text-xs text-ink-soft">
            Reviewer Decision:{' '}
            <strong className="uppercase font-mono text-ink">
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
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            id="btn-reject-draft"
            onClick={() => handleAction('rejected')}
            disabled={submitting}
            className="btn-block text-xs px-4 py-2"
          >
            {submitting ? 'Submitting...' : '✕ Reject Draft (Do Not Publish)'}
          </button>
          <button
            id="btn-approve-draft"
            onClick={() => handleAction('approved')}
            disabled={submitting}
            className="btn-pass text-xs px-4 py-2"
          >
            {submitting ? 'Submitting...' : '✓ Override & Publish to #content'}
          </button>
        </div>
      )}
    </div>
  );
};
