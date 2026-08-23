import React from 'react';
import type { Draft, GateResult, HumanDecision, Passage, Trend } from '../types';

interface InspectionViewProps {
  draft: Draft | null;
  trend: Trend | null;
  passages: Passage[];
  gate: GateResult | null;
  humanDecision: HumanDecision | null;
  onOpenRepurpose?: (topic: string, content: string) => void;
  onDecision?: (decision: HumanDecision) => Promise<void>;
}

export const InspectionView: React.FC<InspectionViewProps> = ({
  draft,
  trend,
  passages,
  gate,
  humanDecision,
  onOpenRepurpose,
  onDecision,
}) => {
  const [selectedClaimId, setSelectedClaimId] = React.useState<string | null>(null);

  if (!draft && !trend) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted space-y-3">
        <p className="text-sm font-medium text-primary">No Active Draft Selected</p>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Select an item from the pipeline or run a trend to inspect claim provenance and safety verification.
        </p>
      </div>
    );
  }

  const claims = draft?.claims || [];
  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0] || null;
  const supportingPassages = selectedClaim
    ? passages.filter((p) => selectedClaim.passageIds.includes(p.id))
    : passages;

  const isPublish = gate?.decision === 'publish';
  const checks = gate?.checks || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-section-heading text-primary">
            {trend?.topic || draft?.topic || 'Topic Inspection'}
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Click individual sentences in the draft to inspect source provenance passages.
          </p>
        </div>

        {draft && onOpenRepurpose && (
          <button
            onClick={() => onOpenRepurpose(draft.topic, draft.body)}
            className="btn-ghost text-xs self-start sm:self-center"
          >
            ⚡ Repurpose Across Platforms
          </button>
        )}
      </div>

      {/* Two-Column Editorial Workspace (Claim -> Evidence -> Safety Decision) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Generated Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-primary">Generated Draft</h3>
              <span className="text-xs text-muted font-mono">
                {claims.length} claims verified
              </span>
            </div>

            {draft ? (
              <div className="text-sm leading-relaxed text-primary font-sans space-y-2">
                {claims.map((claim) => {
                  const isSelected = selectedClaim?.id === claim.id;
                  const isWeak = claim.independentSources < 2;

                  return (
                    <span
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      title={`Click to inspect ${claim.independentSources} source(s)`}
                      className={`claim ${isSelected ? 'claim-active' : ''} ${isWeak ? 'claim-weak' : ''}`}
                    >
                      {claim.text}{' '}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted">
                Synthesizing draft...
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Evidence & Gate Results */}
        <div className="lg:col-span-5 space-y-6">
          {/* Supporting Evidence Card */}
          <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-primary">Supporting Evidence</h3>
              {selectedClaim && (
                <span className="text-xs font-mono text-secondary">
                  {selectedClaim.independentSources} publishers
                </span>
              )}
            </div>

            {selectedClaim ? (
              <div className="space-y-4">
                <div className="p-3 rounded bg-surface-raised border-l-2 border-brand text-xs text-secondary italic">
                  "{selectedClaim.text}"
                </div>

                <div className="space-y-3">
                  {supportingPassages.length === 0 ? (
                    <p className="text-xs text-muted">No individual passage matches recorded.</p>
                  ) : (
                    supportingPassages.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-3.5 rounded bg-surface-raised border border-border space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-primary">
                          <span>Source {idx + 1}</span>
                          {p.score !== undefined && (
                            <span className="text-xs text-muted font-mono">
                              {(p.score * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                          "{p.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">Select a sentence to view grounding citations.</p>
            )}
          </div>

          {/* Gate Verification Summary */}
          {gate && (
            <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-primary">Verification Status</h3>
                <span className={isPublish ? 'status-pass' : 'status-warn'}>
                  {isPublish ? '✓ Ready to Publish' : '⚠ Review Required'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {checks.map((check) => (
                  <div
                    key={check.id}
                    className="p-3 rounded bg-surface-raised flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-primary">{check.label}</div>
                      <div className="text-secondary text-xs mt-0.5">{check.reason}</div>
                    </div>
                    <span
                      className={
                        check.verdict === 'pass'
                          ? 'text-status-pass font-semibold text-sm'
                          : 'text-status-warn font-semibold text-sm'
                      }
                    >
                      {check.verdict === 'pass' ? '✓' : '⚠'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons if escalated */}
              {!isPublish && onDecision && (
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  {humanDecision ? (
                    <span className="text-xs text-secondary">
                      Decision: <strong className="text-primary uppercase">{humanDecision}</strong>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => onDecision('rejected')}
                        className="btn-ghost text-xs px-3 py-1.5 text-secondary hover:text-status-block"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onDecision('approved')}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Approve & Publish
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
