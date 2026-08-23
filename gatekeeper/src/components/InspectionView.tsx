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
      <div className="card p-12 text-center flex flex-col items-center justify-center text-foreground-faint space-y-3 min-h-[400px]">
        <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-foreground-muted">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">No Active Draft in Inspection Buffer</p>
        <p className="text-xs text-foreground-muted max-w-sm">
          Run a scenario from Discover or Overview to inspect factual attribution, RAG provenance passages, and safety checks.
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
    <div className="space-y-6">
      {/* Top Banner: Topic & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">Content Inspection</span>
            <span className="text-foreground-faint text-3xs font-mono">•</span>
            <span className="text-3xs font-mono text-foreground-faint">
              {claims.length} Verifiable Claims
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground mt-0.5">
            {trend?.topic || draft?.topic}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {draft && onOpenRepurpose && (
            <button
              onClick={() => onOpenRepurpose(draft.topic, draft.body)}
              className="btn-ghost text-xs px-3 py-1.5 text-brand hover:text-white bg-brand/10 hover:bg-brand border-brand/30 flex items-center gap-1.5 font-medium shadow-xs"
            >
              <span>⚡</span>
              <span>Repurpose Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Editorial Post (Left) vs Verification Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Stage (7 cols): Draft Body & Interactive Sentences */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="label">Attributed Editorial Post</span>
              <span className="text-3xs text-foreground-faint font-mono italic">
                Click any sentence to inspect supporting citations
              </span>
            </div>

            {/* Generated Content Body */}
            {draft ? (
              <div className="p-4 rounded-md bg-surface-raised border border-border text-sm leading-relaxed font-sans text-foreground">
                {claims.map((claim) => {
                  const isSelected = selectedClaim?.id === claim.id;
                  const isWeak = claim.independentSources < 2;

                  return (
                    <span
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      title={`Click to inspect ${claim.independentSources} independent source(s)`}
                      className={`claim ${
                        isSelected ? 'claim-active' : ''
                      } ${isWeak ? 'claim-weak' : ''}`}
                    >
                      {claim.text}{' '}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-foreground-faint border border-dashed border-border rounded">
                Drafting content...
              </div>
            )}
          </div>

          {/* Supporting Evidence Card */}
          {selectedClaim && (
            <div className="card p-5 space-y-3 bg-surface">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="label">Supporting Evidence</span>
                  <span className="text-3xs font-mono text-foreground-faint">
                    [{selectedClaim.id}]
                  </span>
                </div>
                <div>
                  {selectedClaim.independentSources >= 2 ? (
                    <span className="chip-pass text-3xs">
                      ✓ {selectedClaim.independentSources} Independent Publishers Verified
                    </span>
                  ) : (
                    <span className="chip-block text-3xs">
                      ⚠ {selectedClaim.independentSources} Source (Uncorroborated)
                    </span>
                  )}
                </div>
              </div>

              {/* Active sentence preview */}
              <div className="p-2.5 rounded bg-surface-raised border-l-2 border-brand text-xs italic text-foreground-muted">
                "{selectedClaim.text}"
              </div>

              {/* Retrieved Passages */}
              <div className="space-y-2 pt-1">
                <span className="label text-3xs">
                  Grounding Passages ({supportingPassages.length})
                </span>

                {supportingPassages.length === 0 ? (
                  <p className="text-xs text-foreground-faint italic">
                    No individual passage matches recorded for this claim.
                  </p>
                ) : (
                  supportingPassages.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 rounded-md bg-surface-raised border border-border text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-3xs font-mono text-foreground-faint">
                        <span className="font-semibold text-brand">Passage #{idx + 1}</span>
                        {p.score !== undefined && (
                          <span className="text-foreground-muted">
                            Cosine Relevance: {(p.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-foreground text-xs leading-relaxed font-sans">
                        "{p.text}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Stage (5 cols): 3-Check Editorial Gate Safety Verification */}
        <div className="lg:col-span-5 space-y-4">
          {gate ? (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="label">Verification Verdict</span>
                  <h3 className="text-sm font-bold text-foreground mt-0.5">
                    {isPublish ? 'READY TO PUBLISH' : 'EDITORIAL REVIEW REQUIRED'}
                  </h3>
                </div>
                <span
                  className={
                    isPublish
                      ? 'chip-pass text-2xs px-2.5 py-1'
                      : 'chip-block text-2xs px-2.5 py-1'
                  }
                >
                  {gate.decision}
                </span>
              </div>

              <div
                className={`p-3 rounded-md border text-xs leading-relaxed ${
                  isPublish
                    ? 'border-status-pass-border bg-status-pass-bg text-status-pass'
                    : 'border-status-block-border bg-status-block-bg text-status-block'
                }`}
              >
                {gate.reason}
              </div>

              {/* 3 Checks Stack */}
              <div className="space-y-3 pt-1">
                {checks.map((check) => {
                  const isPass = check.verdict === 'pass';
                  const isWarn = check.verdict === 'warn';
                  const isBlock = check.verdict === 'block';

                  return (
                    <div
                      key={check.id}
                      className="p-3.5 rounded-md border border-border bg-surface-raised space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {check.label} Check
                          </span>
                        </div>
                        <span
                          className={
                            isPass
                              ? 'chip-pass'
                              : isWarn
                                ? 'chip-warn'
                                : 'chip-block'
                          }
                        >
                          {isPass ? '✓ Passed' : isWarn ? '! Warn' : '✕ Blocked'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-3xs font-mono text-foreground-faint">
                          <span>Score: {(check.score * 100).toFixed(0)}%</span>
                          <span>Threshold: {(check.threshold * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isBlock
                                ? 'bg-status-block'
                                : isWarn
                                  ? 'bg-status-warn'
                                  : 'bg-status-pass'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, check.score * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-3xs text-foreground-muted leading-normal">
                        {check.reason}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons if Escalated */}
              {!isPublish && onDecision && (
                <div className="pt-3 border-t border-border space-y-2">
                  <span className="label text-3xs">Human Intervention</span>
                  {humanDecision ? (
                    <div className="p-2.5 rounded bg-surface-raised border border-border text-xs flex items-center justify-between">
                      <span className="text-foreground-muted">Decision:</span>
                      <span className={humanDecision === 'approved' ? 'chip-pass' : 'chip-block'}>
                        {humanDecision === 'approved' ? '✓ Overridden & Published' : '✕ Rejected'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDecision('rejected')}
                        className="btn-block flex-1 text-xs py-2"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => onDecision('approved')}
                        className="btn-pass flex-1 text-xs py-2"
                      >
                        ✓ Override & Publish
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 text-center text-foreground-faint space-y-2">
              <p className="text-xs font-medium">Gate Awaiting Synthesis</p>
              <p className="text-3xs">The 3 safety gates will evaluate once the draft is created.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
