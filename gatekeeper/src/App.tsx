import React, { useCallback, useEffect, useState } from 'react';
import { ChannelFeed, type FeedMessage } from './components/ChannelFeed';
import { ConfigDrawer } from './components/ConfigDrawer';
import { EscalationAction } from './components/EscalationModal';
import { EvidencePanel } from './components/EvidencePanel';
import { GateBreakdown } from './components/GateBreakdown';
import { Header } from './components/Header';
import { PipelineView } from './components/PipelineView';
import { RunHistory } from './components/RunHistory';
import { ScenarioSelector } from './components/ScenarioSelector';
import { useEventStream } from './hooks/useEventStream';
import type { AppConfig, HumanDecision, RunRecord } from './types';

export const App: React.FC = () => {
  const [config, setConfig] = useState<(AppConfig & { nextRunAt?: string; schedulerActive?: boolean }) | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [feed, setFeed] = useState<FeedMessage[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const fetchAppData = useCallback(async () => {
    try {
      const [cfgRes, histRes, feedRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/history'),
        fetch('/api/feed'),
      ]);

      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (feedRes.ok) setFeed(await feedRes.json());
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  const {
    currentRunId,
    steps,
    selectedTrend,
    passages,
    draft,
    gate,
    humanDecision,
    isDegraded,
    isRunning,
  } = useEventStream(fetchAppData);

  const handleTriggerRun = async (params: { trendId?: string; query?: string } = {}) => {
    try {
      await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      fetchAppData();
    } catch (err) {
      console.error('Failed to trigger run:', err);
    }
  };

  const handleDecision = async (decision: HumanDecision) => {
    if (!currentRunId) return;
    try {
      await fetch(`/api/runs/${currentRunId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      fetchAppData();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans">
      <Header
        config={config}
        isRunning={isRunning}
        onTriggerRun={() => handleTriggerRun()}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Editorial Subtitle / Intro Banner */}
        <div className="flex flex-wrap items-center justify-between border-b border-rule pb-3 text-xs text-ink-soft">
          <div>
            <span className="font-semibold text-ink">Autonomous Daily Publication Engine</span> — Retrieves multi-source trends, grounds factual claims, evaluates brand safety & novelty, and publishes automatically at a scheduled time.
          </div>
          <div className="font-mono text-2xs text-ink-faint">
            Fixed Schedule: {config?.scheduleLabel || '09:00 daily'}
          </div>
        </div>

        {/* Human Review Escalation Banner (if triggered) */}
        <EscalationAction
          runId={currentRunId}
          draft={draft}
          gate={gate}
          humanDecision={humanDecision}
          onDecision={handleDecision}
        />

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Stage (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gate Breakdown */}
            <GateBreakdown gate={gate} />

            {/* Evidence & Grounding Panel */}
            <EvidencePanel
              draft={draft}
              trend={selectedTrend}
              passages={passages}
            />

            {/* 6-Step Pipeline Execution View */}
            <PipelineView steps={steps} isDegraded={isDegraded} />
          </div>

          {/* Sidebar / Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Test Benchmark Scenarios */}
            <ScenarioSelector
              isRunning={isRunning}
              onSelectScenario={handleTriggerRun}
            />

            {/* Outbound Channel Message Feed */}
            <ChannelFeed feed={feed} />

            {/* Run History Audit Log */}
            <RunHistory history={history} />
          </div>
        </div>
      </main>

      {/* Configuration & Thresholds Drawer Modal */}
      <ConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
      />
    </div>
  );
};
