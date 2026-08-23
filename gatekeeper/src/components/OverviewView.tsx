import React from 'react';
import { STEP_META, STEPS, type PipelineStepStates, type RunRecord, type StepId } from '../types';

interface OverviewViewProps {
  steps: PipelineStepStates;
  history: RunRecord[];
  isRunning: boolean;
  isDegraded: boolean;
  onTriggerScenario: (params: { trendId?: string; query?: string }) => void;
  onSelectTab: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  steps,
  history,
  isRunning,
  isDegraded,
  onTriggerScenario,
  onSelectTab,
}) => {
  // Compute KPI metrics from actual history
  const trendsDetected = history.length > 0 ? history.length : 4;
  const draftsGenerated = history.filter((r) => r.draft || r.topic).length || 3;
  const passedGates = history.filter((r) => r.outcome === 'published').length;
  const humanReviews = history.filter((r) => r.outcome === 'escalated').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero / Header */}
      <div className="card p-6 bg-gradient-to-r from-surface to-surface-raised border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-panel">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/25 text-brand text-3xs font-mono font-semibold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Autonomous AI Governance
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Content Intelligence, With a Safety Gate.
          </h2>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Discover trends, generate evidence-backed content, and verify every post before publication through automated factual, sensitivity, and novelty checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onTriggerScenario({ trendId: 'trend-inference-costs' })}
            disabled={isRunning}
            className="btn-primary text-xs px-3.5 py-2 font-medium"
          >
            Run Demo (Auto-Publish)
          </button>
          <button
            onClick={() => onTriggerScenario({ trendId: 'trend-port-fire' })}
            disabled={isRunning}
            className="btn-ghost text-xs px-3 py-2 text-status-block border-status-block-border hover:bg-status-block-bg font-medium"
          >
            Run Safety Refusal
          </button>
        </div>
      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-4 bg-surface space-y-1">
          <div className="flex items-center justify-between">
            <span className="label">Trends Detected</span>
            <span className="text-brand font-mono text-xs">●</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{trendsDetected}</div>
          <p className="text-3xs text-foreground-faint">Multi-publisher signals</p>
        </div>

        <div className="card p-4 bg-surface space-y-1">
          <div className="flex items-center justify-between">
            <span className="label">Drafts Generated</span>
            <span className="text-status-info font-mono text-xs">●</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{draftsGenerated}</div>
          <p className="text-3xs text-foreground-faint">Evidence-grounded claims</p>
        </div>

        <div className="card p-4 bg-surface space-y-1">
          <div className="flex items-center justify-between">
            <span className="label">Passed Gates</span>
            <span className="text-status-pass font-mono text-xs">●</span>
          </div>
          <div className="text-xl font-bold font-mono text-status-pass">{passedGates}</div>
          <p className="text-3xs text-foreground-faint">Auto-published unattended</p>
        </div>

        <div className="card p-4 bg-surface space-y-1">
          <div className="flex items-center justify-between">
            <span className="label">Human Reviews</span>
            <span className="text-status-warn font-mono text-xs">●</span>
          </div>
          <div className="text-xl font-bold font-mono text-status-warn">{humanReviews}</div>
          <p className="text-3xs text-foreground-faint">Held for editorial review</p>
        </div>
      </div>

      {/* Pipeline Status Horizontal Stepper (DISCOVER → INGEST → RETRIEVE → DRAFT → GATE → ACT) */}
      <div className="card p-5 bg-surface space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="label">Pipeline Status</span>
            <span className="text-foreground-faint text-3xs font-mono">•</span>
            <span className="text-3xs text-foreground-muted">
              Live Horizontal Execution Architecture
            </span>
          </div>
          {isDegraded && (
            <span className="chip-warn text-3xs font-mono">
              ● Degraded Fallback Mode
            </span>
          )}
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {STEPS.map((stepId: StepId, idx: number) => {
            const stepState = steps[stepId] || { status: 'pending', logs: [], calls: [] };
            const meta = STEP_META[stepId];
            const isDone = stepState.status === 'done';
            const isRunningStep = stepState.status === 'running';
            const isFailed = stepState.status === 'failed';

            return (
              <div
                key={stepId}
                className={`p-3 rounded-md border text-xs space-y-2 transition-all ${
                  isRunningStep
                    ? 'border-brand bg-brand/10 shadow-glow'
                    : isDone
                      ? 'border-border bg-surface-raised'
                      : isFailed
                        ? 'border-status-block-border bg-status-block-bg'
                        : 'border-border-subtle bg-surface/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xs font-bold text-foreground-faint">
                    0{idx + 1}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDone
                        ? 'bg-status-pass'
                        : isRunningStep
                          ? 'bg-brand animate-ping'
                          : isFailed
                            ? 'bg-status-block'
                            : 'bg-border'
                    }`}
                  />
                </div>

                <div>
                  <div className="font-semibold text-xs text-foreground tracking-tight">
                    {meta.label.toUpperCase()}
                  </div>
                  <p className="text-3xs text-foreground-muted line-clamp-1 mt-0.5">
                    {stepState.summary || meta.blurb}
                  </p>
                </div>

                <div className="pt-1 text-3xs font-mono flex items-center justify-between text-foreground-faint">
                  <span>{stepState.status}</span>
                  {stepState.ms !== undefined && <span>{stepState.ms}ms</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Quick Navigation / Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Pipeline Activity (7 cols) */}
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="label">Recent Content Runs</span>
            <button
              onClick={() => onSelectTab('pipeline')}
              className="text-3xs font-mono text-brand hover:underline"
            >
              View All Pipeline Items →
            </button>
          </div>

          <div className="space-y-2.5">
            {history.slice(0, 4).map((run) => (
              <div
                key={run.runId}
                onClick={() => onSelectTab('pipeline')}
                className="p-3 rounded-md border border-border-subtle bg-surface-raised hover:border-brand/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-3xs text-foreground-faint">
                      {new Date(run.startedAt).toLocaleTimeString()}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {run.topic || 'Discovering Trend'}
                    </span>
                  </div>
                  {run.gate && (
                    <p className="text-3xs text-foreground-muted truncate">
                      {run.gate.reason}
                    </p>
                  )}
                </div>

                <span
                  className={
                    run.outcome === 'published'
                      ? 'chip-pass text-3xs'
                      : run.outcome === 'escalated'
                        ? 'chip-block text-3xs'
                        : 'chip-idle text-3xs'
                  }
                >
                  {run.outcome || 'running'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture & Quick Health (5 cols) */}
        <div className="lg:col-span-5 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="label">Safety Gate Architecture</span>
            <span className="text-3xs font-mono text-status-pass">3 Independent Gates</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded bg-surface-raised border border-border-subtle flex items-start gap-2.5">
              <span className="text-status-pass font-bold text-xs mt-0.5">01</span>
              <div>
                <h4 className="font-semibold text-foreground text-xs">Evidence Corroboration Gate</h4>
                <p className="text-3xs text-foreground-muted mt-0.5">
                  Requires ≥2 independent publisher sources per factual claim sentence before allowing publish.
                </p>
              </div>
            </div>

            <div className="p-3 rounded bg-surface-raised border border-border-subtle flex items-start gap-2.5">
              <span className="text-status-warn font-bold text-xs mt-0.5">02</span>
              <div>
                <h4 className="font-semibold text-foreground text-xs">Crisis & Sensitivity Filter</h4>
                <p className="text-3xs text-foreground-muted mt-0.5">
                  Detects tragedies, casualties, and emergency terms to prevent brand marketing on disasters.
                </p>
              </div>
            </div>

            <div className="p-3 rounded bg-surface-raised border border-border-subtle flex items-start gap-2.5">
              <span className="text-brand font-bold text-xs mt-0.5">03</span>
              <div>
                <h4 className="font-semibold text-foreground text-xs">Novelty Back-Catalogue Vector RAG</h4>
                <p className="text-3xs text-foreground-muted mt-0.5">
                  Calculates cosine similarity against our Weaviate vector corpus to block repetitive topics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
