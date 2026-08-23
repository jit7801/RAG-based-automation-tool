import React from 'react';
import type { CheckResult, GateResult } from '../types';

interface GateBreakdownProps {
  gate: GateResult | null;
}

export const GateBreakdown: React.FC<GateBreakdownProps> = ({ gate }) => {
  if (!gate) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center text-center text-ink-faint min-h-[220px]">
        <svg
          className="h-8 w-8 mb-2 stroke-current opacity-40"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <p className="text-sm font-medium">Gate Awaiting Draft</p>
        <p className="text-xs max-w-xs mt-1">
          The 3 independent checks (Evidence, Sensitivity, Novelty) will evaluate the draft when synthesized.
        </p>
      </div>
    );
  }

  const isPublish = gate.decision === 'publish';
  const checks = gate.checks || [];

  return (
    <div className="card p-5 space-y-4">
      {/* Master Gate Decision Banner */}
      <div
        className={`rounded-lg p-4 border transition-all ${
          isPublish
            ? 'border-pass/40 bg-pass-bg text-pass'
            : 'border-block/40 bg-block-bg text-block'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isPublish ? '✓' : '⚠️'}</span>
            <div>
              <span className="label text-2xs uppercase tracking-wider font-bold">
                Master Editorial Verdict
              </span>
              <h3 className="font-serif text-base font-bold">
                {isPublish
                  ? 'CLEARED FOR UNATTENDED PUBLISH'
                  : 'HELD FOR EDITORIAL REVIEW'}
              </h3>
            </div>
          </div>
          <span
            className={`font-mono text-xs font-bold uppercase rounded px-2.5 py-1 ${
              isPublish ? 'bg-pass text-white' : 'bg-block text-white'
            }`}
          >
            {gate.decision}
          </span>
        </div>
        <p className="text-xs mt-2 leading-relaxed opacity-90 font-sans">
          {gate.reason}
        </p>
      </div>

      {/* 3 Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {checks.map((check: CheckResult) => {
          const isPass = check.verdict === 'pass';
          const isWarn = check.verdict === 'warn';
          const isBlock = check.verdict === 'block';

          let icon = '✓';
          let chipClass = 'chip-pass';
          let borderClass = 'border-rule';
          let bgClass = 'bg-raised';

          if (isBlock) {
            icon = '✕';
            chipClass = 'chip-block';
            borderClass = 'border-block/40';
            bgClass = 'bg-block-bg/20';
          } else if (isWarn) {
            icon = '!';
            chipClass = 'chip-warn';
            borderClass = 'border-warn/40';
            bgClass = 'bg-warn-bg/20';
          }

          return (
            <div
              key={check.id}
              className={`rounded-lg border ${borderClass} ${bgClass} p-3.5 flex flex-col justify-between space-y-3 shadow-2xs`}
            >
              {/* Check Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="label text-2xs">{check.label} Check</span>
                  <span className={chipClass}>
                    {icon} {check.verdict}
                  </span>
                </div>

                {/* Score / Meter */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-2xs font-mono">
                    <span className="text-ink-soft">
                      Score: {(check.score * 100).toFixed(0)}%
                    </span>
                    <span className="text-ink-faint">
                      Threshold: {(check.threshold * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="h-1.5 w-full rounded-full bg-sunk overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBlock ? 'bg-block' : isWarn ? 'bg-warn' : 'bg-pass'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, check.score * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rationale text */}
              <p className="text-xs text-ink-soft leading-relaxed">
                {check.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
