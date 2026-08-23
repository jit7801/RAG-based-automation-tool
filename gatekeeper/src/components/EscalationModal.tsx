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

  const failedCheck = gate.checks.find((c) => c.verdict === 'block' || c.verdict === 'warn');

  return (
    <div className="rounded-lg border-l-4 border-l-status-block border border-border bg-surface p-5 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-status-block font-semibold text-xs">● Editorial Review Required</span>
          </div>
          <h3 className="text-sm font-semibold text-primary">
            {failedCheck ? `${failedCheck.label} check failed` : 'Draft held for human review'}
          </h3>
          <p className="text-xs text-secondary leading-relaxed max-w-3xl">
            {gate.reason}
          </p>
        </div>

        {/* Action Buttons */}
        {humanDecision ? (
          <div className="text-xs text-secondary self-center font-medium">
            Decision:{' '}
            <strong className="text-primary uppercase">
              {humanDecision === 'approved' ? '✓ Overridden & Published' : '✕ Rejected'}
            </strong>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
            <button
              onClick={() => handleAction('rejected')}
              disabled={submitting}
              className="btn-ghost text-xs px-3 py-1.5 text-secondary hover:text-status-block hover:border-status-block-border font-medium"
            >
              Reject Draft
            </button>
            <button
              onClick={() => handleAction('approved')}
              disabled={submitting}
              className="btn-primary text-xs px-3 py-1.5 font-medium"
            >
              Review & Publish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
