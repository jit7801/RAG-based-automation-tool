import React, { useState } from 'react';
import { STEP_META, STEPS, type PipelineStepStates, type StepId, type StepState } from '../types';

interface PipelineViewProps {
  steps: PipelineStepStates;
  isDegraded: boolean;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ steps, isDegraded }) => {
  const [expandedStep, setExpandedStep] = useState<StepId | null>(null);

  const toggleExpand = (step: StepId) => {
    setExpandedStep((prev: StepId | null) => (prev === step ? null : step));
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
        <div>
          <span className="label">Execution Workflow</span>
          <h2 className="font-serif text-lg font-bold text-ink">
            6-Stage Grounding & Verification Pipeline
          </h2>
        </div>
        {isDegraded && (
          <span
            className="chip border-warn bg-warn-bg text-warn font-medium"
            title="External services were unreachable; seeded fallback data was used."
          >
            ⚠️ Degraded Mode (Fallback Data Used)
          </span>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {STEPS.map((stepId: StepId, index: number) => {
          const stepState: StepState = steps[stepId] || {
            status: 'pending',
            logs: [],
            calls: [],
          };
          const meta = STEP_META[stepId];
          const isExpanded = expandedStep === stepId;

          return (
            <div
              key={stepId}
              className={`rounded-lg border transition-all duration-200 ${
                stepState.status === 'running'
                  ? 'border-accent bg-accent-soft/30 shadow-sm'
                  : stepState.status === 'done'
                    ? 'border-rule bg-raised hover:border-ink-faint/50'
                    : stepState.status === 'failed'
                      ? 'border-block bg-block-bg/30'
                      : 'border-rule/60 bg-paper/60 opacity-65'
              }`}
            >
              <div
                onClick={() => toggleExpand(stepId)}
                className="flex cursor-pointer items-center justify-between p-3.5 select-none"
              >
                <div className="flex items-center gap-3">
                  {/* Step Number Badge */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-medium ${
                      stepState.status === 'done'
                        ? 'bg-pass-bg text-pass border border-pass/30'
                        : stepState.status === 'running'
                          ? 'bg-accent text-white animate-pulse'
                          : stepState.status === 'failed'
                            ? 'bg-block-bg text-block border border-block/30'
                            : 'bg-sunk text-ink-faint border border-rule'
                    }`}
                  >
                    {stepState.status === 'done' ? (
                      '✓'
                    ) : stepState.status === 'running' ? (
                      <span className="inline-block animate-spin text-2xs">●</span>
                    ) : stepState.status === 'failed' ? (
                      '✕'
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Title & Blurb */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">
                        {meta.label}
                      </h3>
                      {stepState.ms !== undefined && (
                        <span className="font-mono text-2xs text-ink-faint">
                          ({stepState.ms}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft line-clamp-1">
                      {stepState.summary || meta.blurb}
                    </p>
                  </div>
                </div>

                {/* Right side: Status and Call count */}
                <div className="flex items-center gap-2.5">
                  {stepState.calls.length > 0 && (
                    <span className="hidden md:inline-flex items-center gap-1 rounded bg-sunk px-2 py-0.5 font-mono text-2xs text-ink-soft">
                      {stepState.calls.length} outbound{' '}
                      {stepState.calls.length === 1 ? 'call' : 'calls'}
                    </span>
                  )}

                  {/* Status chip */}
                  {stepState.status === 'running' && (
                    <span className="chip border-accent bg-accent-soft text-accent animate-pulse font-medium">
                      Running
                    </span>
                  )}
                  {stepState.status === 'done' && (
                    <span className="chip-pass font-medium">Done</span>
                  )}
                  {stepState.status === 'failed' && (
                    <span className="chip-block font-medium">Failed</span>
                  )}
                  {stepState.status === 'pending' && (
                    <span className="chip-idle">Queued</span>
                  )}

                  <svg
                    className={`h-4 w-4 text-ink-faint transition-transform duration-150 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded details: logs & swytchcode execution calls */}
              {isExpanded && (
                <div className="border-t border-rule bg-sunk/60 p-3.5 space-y-3">
                  {/* Swytchcode Calls */}
                  {stepState.calls.length > 0 && (
                    <div>
                      <span className="label text-2xs">External Execution Calls</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {stepState.calls.map((c, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded border border-rule bg-raised px-2.5 py-1 text-2xs font-mono"
                          >
                            <span className="font-semibold text-accent">
                              {c.service}
                            </span>
                            <span className="text-ink-soft">.{c.operation}</span>
                            <span className="text-ink-faint">({c.ms}ms)</span>
                            {c.fallback ? (
                              <span className="rounded bg-warn-bg px-1 text-2xs text-warn">
                                local fallback
                              </span>
                            ) : (
                              <span className="text-pass">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Log stream */}
                  <div>
                    <span className="label text-2xs">Execution Trace</span>
                    <div className="mt-1 rounded bg-paper p-2 font-mono text-2xs text-ink-soft space-y-1 max-h-36 overflow-y-auto border border-rule">
                      {stepState.logs.length === 0 ? (
                        <div className="text-ink-faint italic">No log entries yet.</div>
                      ) : (
                        stepState.logs.map((log, i) => (
                          <div key={i} className="leading-relaxed">
                            <span className="text-ink-faint mr-1.5">›</span>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
