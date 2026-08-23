import React, { useCallback, useEffect, useState } from 'react';
import { BackCatalogueView } from './components/BackCatalogueView';
import { ConfigDrawer } from './components/ConfigDrawer';
import { ContentPipelineView } from './components/ContentPipelineView';
import { DiscoverView } from './components/DiscoverView';
import { EscalationAction } from './components/EscalationModal';
import { Header } from './components/Header';
import { InspectionView } from './components/InspectionView';
import { OverviewView } from './components/OverviewView';
import { PublishedView } from './components/PublishedView';
import { RepurposeStudio } from './components/RepurposeStudio';
import { ReviewQueueView } from './components/ReviewQueueView';
import { Sidebar, type NavTabId } from './components/Sidebar';
import { SourcesView } from './components/SourcesView';
import { useEventStream } from './hooks/useEventStream';
import type { AppConfig, HumanDecision, RunRecord, TrendOption } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [config, setConfig] = useState<(AppConfig & { nextRunAt?: string; schedulerActive?: boolean }) | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [trends, setTrends] = useState<TrendOption[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRepurposeOpen, setIsRepurposeOpen] = useState(false);
  const [repurposeTopic, setRepurposeTopic] = useState('');
  const [repurposeContent, setRepurposeContent] = useState('');

  const apiBase = window.location.hostname !== 'localhost' ? 'http://localhost:8787' : '';

  const fetchAppData = useCallback(async () => {
    try {
      const [cfgRes, histRes, feedRes, trendsRes] = await Promise.all([
        fetch(`${apiBase}/api/config`),
        fetch(`${apiBase}/api/history`),
        fetch(`${apiBase}/api/feed`),
        fetch(`${apiBase}/api/trends`),
      ]);

      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (feedRes.ok) setFeed(await feedRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    }
  }, [apiBase]);

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
      await fetch(`${apiBase}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      // Switch tab to inspection or overview if running
      setActiveTab('pipeline');
      fetchAppData();
    } catch (err) {
      console.error('Failed to trigger run:', err);
    }
  };

  const handleDecision = async (runId: string, decision: HumanDecision) => {
    const targetRunId = runId || currentRunId;
    if (!targetRunId) return;
    try {
      await fetch(`${apiBase}/api/runs/${targetRunId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      fetchAppData();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    }
  };

  const handleOpenRepurpose = (topic?: string, body?: string) => {
    setRepurposeTopic(topic || selectedTrend?.topic || draft?.topic || '');
    setRepurposeContent(body || draft?.body || '');
    setIsRepurposeOpen(true);
  };

  const handleInspectRun = (run: RunRecord) => {
    setActiveTab('pipeline');
  };

  // Tab metadata for top header
  const tabMetadata: Record<NavTabId, { title: string; subtitle: string }> = {
    overview: {
      title: 'System Overview',
      subtitle: 'Real-time Autonomous AI Publishing & Safety Gate Status',
    },
    discover: {
      title: 'Trend Discovery & Benchmarks',
      subtitle: 'Monitor publisher signals and exercise safety gates',
    },
    pipeline: {
      title: 'Content Pipeline & Inspection',
      subtitle: 'Inspect generated drafts, sentence claim attribution & safety verification',
    },
    review: {
      title: 'Human Review Queue',
      subtitle: 'Escalated posts requiring human-in-the-loop editorial decision',
    },
    published: {
      title: 'Published Broadcasts',
      subtitle: 'Safety-verified outbound messages live on channels',
    },
    sources: {
      title: 'Publisher Knowledge Base',
      subtitle: 'Indexed journalistic and technical outlets in Weaviate',
    },
    catalogue: {
      title: 'Novelty Back-Catalogue',
      subtitle: 'Vector space embeddings used for cosine repetition checks',
    },
  };

  const currentMeta = tabMetadata[activeTab] || tabMetadata.overview;
  const pendingReviewsCount = history.filter((r) => r.outcome === 'escalated' && !r.humanDecision).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans antialiased">
      {/* Persistent Left SaaS Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingReviewsCount={pendingReviewsCount}
        isDegraded={isDegraded}
        onOpenSettings={() => setIsConfigOpen(true)}
        onOpenRepurpose={() => handleOpenRepurpose()}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <Header
          config={config}
          isRunning={isRunning}
          activeTabTitle={currentMeta.title}
          activeTabSubtitle={currentMeta.subtitle}
          isDegraded={isDegraded}
          onTriggerRun={() => handleTriggerRun()}
          onOpenRepurpose={() => handleOpenRepurpose()}
        />

        {/* Global Escalation Banner if current live run is held */}
        <div className="px-6 pt-4">
          <EscalationAction
            runId={currentRunId}
            draft={draft}
            gate={gate}
            humanDecision={humanDecision}
            onDecision={(dec) => handleDecision(currentRunId || '', dec)}
          />
        </div>

        {/* Dynamic View Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              steps={steps}
              history={history}
              isRunning={isRunning}
              isDegraded={isDegraded}
              onTriggerScenario={handleTriggerRun}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverView
              isRunning={isRunning}
              trends={trends}
              onTriggerScenario={handleTriggerRun}
            />
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-8">
              {/* Detailed Content Inspection & Attribution Panel */}
              <InspectionView
                draft={draft}
                trend={selectedTrend}
                passages={passages}
                gate={gate}
                humanDecision={humanDecision}
                onOpenRepurpose={handleOpenRepurpose}
                onDecision={(dec) => handleDecision(currentRunId || '', dec)}
              />

              {/* Pipeline List */}
              <ContentPipelineView
                history={history}
                currentRunRecord={null}
                onInspectRun={handleInspectRun}
                onTriggerScenario={handleTriggerRun}
                isRunning={isRunning}
              />
            </div>
          )}

          {activeTab === 'review' && (
            <ReviewQueueView
              history={history}
              onDecision={handleDecision}
              onInspectRun={handleInspectRun}
            />
          )}

          {activeTab === 'published' && (
            <PublishedView
              feed={feed}
              onOpenRepurpose={handleOpenRepurpose}
            />
          )}

          {activeTab === 'sources' && <SourcesView />}

          {activeTab === 'catalogue' && <BackCatalogueView />}
        </main>
      </div>

      {/* Settings / Config Modal Drawer */}
      <ConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
      />

      {/* Multi-Platform Brand Repurposing Studio */}
      <RepurposeStudio
        isOpen={isRepurposeOpen}
        onClose={() => setIsRepurposeOpen(false)}
        initialTopic={repurposeTopic}
        initialContent={repurposeContent}
      />
    </div>
  );
};


