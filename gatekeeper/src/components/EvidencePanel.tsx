import React, { useState } from 'react';
import type { Claim, Draft, Passage, Trend } from '../types';

interface EvidencePanelProps {
  draft: Draft | null;
  trend: Trend | null;
  passages: Passage[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  draft,
  trend,
  passages,
}) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  if (!trend && !draft) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center text-ink-faint min-h-[300px]">
        <svg
          className="h-10 w-10 mb-2 stroke-current opacity-40"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm font-medium">Awaiting Pipeline Execution</p>
        <p className="text-xs max-w-sm mt-1">
          Trigger a run to see the trend grounded in multi-source evidence and inspected for attribution.
        </p>
      </div>
    );
  }

  const claims: Claim[] = draft?.claims || [];
  const selectedClaim: Claim | null =
    claims.find((c: Claim) => c.id === selectedClaimId) || claims[0] || null;

  // Supporting passages for the active claim
  const supportingPassages = selectedClaim
    ? passages.filter((p) => selectedClaim.passageIds.includes(p.id))
    : passages;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <span className="label">Grounding & Provenance</span>
          <h2 className="font-serif text-lg font-bold text-ink">
            {draft ? 'Generated Draft & Claim Verification' : 'Discovered Topic'}
          </h2>
        </div>
        {draft && (
          <span className="label font-mono text-2xs bg-sunk px-2 py-0.5 rounded border border-rule">
            {claims.length} Verifiable {claims.length === 1 ? 'Claim' : 'Claims'}
          </span>
        )}
      </div>

      {/* Topic Title */}
      <div className="rounded-md bg-paper p-3 border border-rule">
        <span className="label text-2xs">Active Topic</span>
        <h3 className="font-serif text-base font-semibold text-ink mt-0.5">
          {trend?.topic || draft?.topic}
        </h3>
        {trend?.summary && (
          <p className="text-xs text-ink-soft mt-1">{trend.summary}</p>
        )}
      </div>

      {/* Draft Body with Clickable Claims */}
      {draft ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="label text-2xs">Attributed Draft Body</span>
            <span className="text-2xs text-ink-faint italic">
              Click any sentence to inspect supporting evidence
            </span>
          </div>

          <div className="rounded-lg border border-rule bg-raised p-4 font-serif text-sm leading-relaxed text-ink shadow-sm">
            {claims.map((claim: Claim) => {
              const isSelected = selectedClaim?.id === claim.id;
              const isWeak = claim.independentSources < 2;

              return (
                <span
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  title={`Click to inspect ${claim.independentSources} independent source(s)`}
                  className={`claim ${
                    isSelected ? 'claim-active bg-cite/70' : ''
                  } ${isWeak ? 'claim-weak' : ''}`}
                >
                  {claim.text}{' '}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded border border-dashed border-rule text-center text-xs text-ink-soft">
          Retrieving passages and generating draft...
        </div>
      )}

      {/* Provenance Inspector for Selected Claim */}
      {selectedClaim && (
        <div className="well p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div className="flex items-center gap-2">
              <span className="label text-2xs">Claim Evidence Inspector</span>
              <span className="font-mono text-2xs text-ink-faint">
                [{selectedClaim.id}]
              </span>
            </div>

            {/* Independent Sources Indicator */}
            <div className="flex items-center gap-1.5">
              {selectedClaim.independentSources >= 2 ? (
                <span className="chip-pass text-2xs font-medium">
                  ✓ {selectedClaim.independentSources} Independent Publishers
                </span>
              ) : (
                <span className="chip-block text-2xs font-medium">
                  ⚠️ {selectedClaim.independentSources} Source (Uncorroborated)
                </span>
              )}
            </div>
          </div>

          {/* Selected Sentence Quote */}
          <blockquote className="border-l-2 border-accent pl-3 text-xs italic text-ink-soft">
            "{selectedClaim.text}"
          </blockquote>

          {/* Supporting Passages List */}
          <div className="space-y-2">
            <span className="label text-2xs">
              Supporting Grounding Passages ({supportingPassages.length})
            </span>

            {supportingPassages.length === 0 ? (
              <p className="text-xs text-ink-faint italic">
                No specific passage matches recorded for this sentence.
              </p>
            ) : (
              supportingPassages.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="rounded border border-rule bg-raised p-2.5 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-2xs font-mono text-ink-faint">
                    <span className="font-semibold text-accent">
                      Passage #{idx + 1}
                    </span>
                    {p.score !== undefined && (
                      <span className="text-ink-soft">
                        Relevance: {(p.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink leading-normal font-sans">
                    {p.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
