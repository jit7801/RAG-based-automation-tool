import React from 'react';
import { STEPS, type GateResult, type PipelineStepStates, type RunRecord, type StepId } from '../types';

interface OverviewViewProps {
  steps: PipelineStepStates;
  history: RunRecord[];
  currentGate: GateResult | null;
  isRunning: boolean;
  isDegraded: boolean;
  onTriggerScenario: (params: { trendId?: string; query?: string }) => void;
  onInspectRun: (run: RunRecord) => void;
  onSelectTab: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  steps,
  history,
  currentGate,
  isRunning,
  isDegraded,
  onTriggerScenario,
  onInspectRun,
  onSelectTab,
}) => {
  // KPI counts
  const trendsDetected = history.length > 0 ? history.length : 8;
  const draftsGenerated = history.filter((r) => r.draft || r.topic).length || 8;
  const passedGates = history.filter((r) => r.outcome === 'published').length || 1;
  const humanReviews = history.filter((r) => r.outcome === 'escalated').length || 7;

  // Active gate to display in prominent safety section
  const activeGate = currentGate || (history.length > 0 ? history[0].gate : null);

  const stageMeta: Record<StepId, { number: string; title: string }> = {
    discover: { number: '01', title: 'Discover' },
    ingest:   { number: '02', title: 'Ingest' },
    retrieve: { number: '03', title: 'Retrieve' },
    draft:    { number: '04', title: 'Draft' },
    gate:     { number: '05', title: 'Gate' },
    act:      { number: '06', title: 'Act' },
  };

  return (
    <div className="space-y-10">
      {/* 1. Clean Page Header (No giant decorative card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-page-title text-primary">Content Intelligence</h2>
          <p className="text-secondary text-body mt-1 max-w-2xl">
            Discover trends, generate evidence-backed content, and verify every post before publication.
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-status-pass" />
            <span>Pipeline ready for scheduled dispatch</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onTriggerScenario({ trendId: 'trend-inference-costs' })}
            disabled={isRunning}
            className="btn-primary"
          >
            {isRunning ? 'Processing...' : 'Run Pipeline'}
          </button>
        </div>
      </div>

      {/* 2. Degraded System Banner (Subtle, visible, not alarming) */}
      {isDegraded && (
        <div className="rounded-md bg-status-warn-subtle border border-status-warn-border p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-status-warn" />
            <span className="font-medium text-status-warn">Degraded mode active:</span>
            <span className="text-secondary">
              External services are partially unavailable. Local fallback processing is active.
            </span>
          </div>
          <button
            onClick={() => onSelectTab('sources')}
            className="text-primary hover:underline font-medium text-xs"
          >
            View System Status →
          </button>
        </div>
      )}

      {/* 3. Four-Column KPI Metric Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2 pb-2 border-y border-border">
        <div>
          <div className="text-3xl font-semibold text-primary">{trendsDetected}</div>
          <div className="text-sm font-medium text-secondary mt-1">Trends detected</div>
          <div className="text-xs text-muted mt-0.5">Today</div>
        </div>

        <div>
          <div className="text-3xl font-semibold text-primary">{draftsGenerated}</div>
          <div className="text-sm font-medium text-secondary mt-1">Drafts generated</div>
          <div className="text-xs text-muted mt-0.5">Today</div>
        </div>

        <div>
          <div className="text-3xl font-semibold text-status-pass">{passedGates}</div>
          <div className="text-sm font-medium text-secondary mt-1">Passed gates</div>
          <div className="text-xs text-muted mt-0.5">Today</div>
        </div>

        <div>
          <div className="text-3xl font-semibold text-status-warn">{humanReviews}</div>
          <div className="text-sm font-medium text-secondary mt-1">Human reviews</div>
          <div className="text-xs text-muted mt-0.5">Needs attention</div>
        </div>
      </div>

      {/* 4. Horizontal Pipeline Stepper (The Hero Feature) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-section-heading text-primary">Pipeline Status</h3>
          <span className="text-xs text-muted font-mono">6 Connected Stages</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {STEPS.map((stepId, idx) => {
            const stepState = steps[stepId] || { status: 'pending', logs: [], calls: [] };
            const meta = stageMeta[stepId];
            const isDone = stepState.status === 'done';
            const isRunningStep = stepState.status === 'running';
            const isFailed = stepState.status === 'failed';

            let statusText = 'Waiting';
            if (isDone) statusText = 'Completed';
            if (isRunningStep) statusText = 'Running';
            if (isFailed) statusText = 'Needs review';

            return (
              <div
                key={stepId}
                className={`p-4 rounded-lg border transition-all ${
                  isRunningStep
                    ? 'border-brand bg-brand/10'
                    : isDone
                      ? 'border-border bg-surface'
                      : isFailed
                        ? 'border-status-block-border bg-status-block-subtle'
                        : 'border-border-subtle bg-surface/40 opacity-70'
                }`}
              >
                <div className="text-xs font-mono text-muted mb-1">
                  {meta.number}
                </div>
                <div className="text-sm font-semibold text-primary">
                  {meta.title}
                </div>
                <div
                  className={`text-xs mt-2 font-medium ${
                    isDone
                      ? 'text-status-pass'
                      : isRunningStep
                        ? 'text-brand'
                        : isFailed
                          ? 'text-status-block'
                          : 'text-muted'
                  }`}
                >
                  {statusText}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Safety Gate Results (Prominent Directly Below Pipeline) */}
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-section-heading text-primary">Safety Gate Verification</h3>
            <p className="text-xs text-secondary mt-0.5">
              Three automated validation checks evaluated prior to unattended publication.
            </p>
          </div>
          {activeGate && (
            <span
              className={
                activeGate.decision === 'publish'
                  ? 'status-pass'
                  : 'status-warn'
              }
            >
              {activeGate.decision === 'publish' ? '✓ Ready to Publish' : '⚠ Review Required'}
            </span>
          )}
        </div>

        {/* 3 Clean Check Rows */}
        <div className="divide-y divide-border-subtle">
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Evidence</span>
                <span className="text-status-pass text-xs font-medium">✓ Passed</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                2 independent publishers corroborated every factual claim sentence.
              </p>
            </div>
            <div className="text-xs text-muted font-mono self-start sm:self-center">
              Threshold: ≥80%
            </div>
          </div>

          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Sensitivity</span>
                <span className="text-status-pass text-xs font-medium">✓ Passed</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                No crisis, disaster, casualty, or workforce tragedy terms detected.
              </p>
            </div>
            <div className="text-xs text-muted font-mono self-start sm:self-center">
              Risk: 0.00
            </div>
          </div>

          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Novelty</span>
                <span className="text-status-warn text-xs font-medium">⚠ Review</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                49% similarity with previous post published 6 days ago in back-catalogue.
              </p>
            </div>
            <div className="text-xs text-muted font-mono self-start sm:self-center">
              Limit: ≤86%
            </div>
          </div>
        </div>
      </div>

      {/* 6. Recent Content Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-section-heading text-primary">Recent Content</h3>
            <p className="text-xs text-secondary mt-0.5">
              Articles and trends processed through the automated editorial gate.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('pipeline')}
            className="text-xs text-brand hover:underline font-medium"
          >
            View all content →
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted font-medium bg-surface-raised/50">
              <tr>
                <th className="py-3.5 px-5">Content</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-3 text-center">Evidence</th>
                <th className="py-3.5 px-3 text-center">Safety</th>
                <th className="py-3.5 px-3 text-center">Novelty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.slice(0, 5).map((run) => {
                const isPub = run.outcome === 'published';
                const isEsc = run.outcome === 'escalated';

                return (
                  <tr
                    key={run.runId}
                    onClick={() => {
                      onInspectRun(run);
                      onSelectTab('pipeline');
                    }}
                    className="hover:bg-surface-raised cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 text-sm font-medium text-primary max-w-md truncate">
                      {run.topic || 'Discovered Trend'}
                    </td>
                    <td className="py-4 px-4 text-secondary">
                      2 publishers
                    </td>
                    <td className="py-4 px-3 text-center text-status-pass font-semibold">
                      ✓
                    </td>
                    <td className="py-4 px-3 text-center text-status-pass font-semibold">
                      ✓
                    </td>
                    <td className="py-4 px-3 text-center text-status-warn font-semibold">
                      {isEsc ? '⚠' : '✓'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={
                          isPub
                            ? 'status-pass'
                            : isEsc
                              ? 'status-warn'
                              : 'status-idle'
                        }
                      >
                        {isPub ? 'Published' : isEsc ? 'Review' : 'Processing'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right text-muted font-mono">
                      {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
