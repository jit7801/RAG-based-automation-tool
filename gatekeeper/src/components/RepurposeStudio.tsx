import React, { useEffect, useState } from 'react';
import type {
  BrandProfile,
  RepurposeBundle,
  RepurposedFormatId,
  RepurposedItem,
  ScriptScene,
  TweetItem,
} from '../types';

interface RepurposeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialContent?: string;
}

export const RepurposeStudio: React.FC<RepurposeStudioProps> = ({
  isOpen,
  onClose,
  initialTopic = '',
  initialContent = '',
}) => {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('tech-analyst');
  const [topic, setTopic] = useState<string>(initialTopic);
  const [content, setContent] = useState<string>(initialContent);
  const [bundle, setBundle] = useState<RepurposeBundle | null>(null);
  const [activeFormat, setActiveFormat] = useState<RepurposedFormatId>('video_script');
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Teleprompter Simulation State for Video Script
  const [teleprompterActive, setTeleprompterActive] = useState<boolean>(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [teleprompterTimer, setTeleprompterTimer] = useState<number>(35);

  const apiBase =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'http://localhost:8787'
      : '';

  // Update local content state when props change
  useEffect(() => {
    if (isOpen) {
      if (initialTopic) setTopic(initialTopic);
      if (initialContent) setContent(initialContent);
    }
  }, [isOpen, initialTopic, initialContent]);

  // Fetch available brand profiles
  useEffect(() => {
    async function loadProfiles() {
      try {
        const res = await fetch(`${apiBase}/api/brand-profiles`);
        if (res.ok) {
          const data = await res.json();
          setProfiles(data);
          if (data.length > 0 && !selectedProfileId) {
            setSelectedProfileId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load brand profiles:', err);
      }
    }
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen, apiBase]);

  // Teleprompter interval timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (teleprompterActive && teleprompterTimer > 0) {
      interval = setInterval(() => {
        setTeleprompterTimer((prev) => {
          if (prev <= 1) {
            setTeleprompterActive(false);
            return 35;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [teleprompterActive, teleprompterTimer]);

  // Trigger repurpose generation
  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please provide source content to repurpose.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/repurpose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          content: content.trim(),
          brandProfileId: selectedProfileId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Repurposing failed');
      }

      const data = await res.json();
      setBundle(data.bundle);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first open if content is provided and no bundle exists
  useEffect(() => {
    if (isOpen && content.trim() && !bundle && !loading) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleExportAll = (type: 'json' | 'md' = 'json') => {
    if (!bundle) return;

    if (type === 'json') {
      const exportData = {
        title: bundle.originalTopic,
        source: bundle.originalBody,
        brandProfile: bundle.brandProfile.name,
        generatedAt: bundle.createdAt,
        formats: bundle.formats,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repurposed-bundle-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let mdText = `# ${bundle.originalTopic}\n\n`;
      mdText += `**Brand Voice**: ${bundle.brandProfile.name} • *Generated ${new Date(bundle.createdAt).toLocaleString()}*\n\n`;
      mdText += `> **Source Content**: ${bundle.originalBody}\n\n---\n\n`;

      Object.values(bundle.formats).forEach((item) => {
        mdText += `## ${item.title} (${item.platform})\n`;
        mdText += `*Brand Score: ${item.brandScore.overallScore}% • Est. Read Time: ${item.estimatedReadTime}*\n\n`;
        mdText += `${item.content}\n\n---\n\n`;
      });

      const blob = new Blob([mdText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repurposed-bundle-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const currentItem: RepurposedItem | undefined = bundle?.formats[activeFormat];

  // Helper for profile persona icons
  const getProfileIcon = (id: string) => {
    switch (id) {
      case 'tech-analyst':
        return '📊';
      case 'bold-founder':
        return '🚀';
      case 'executive-digest':
        return '👔';
      default:
        return '⚡';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-fadeIn">
      <div className="bg-paper border border-rule w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ink">
        {/* Top Studio Header */}
        <div className="border-b border-rule bg-raised/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent text-white flex items-center justify-center font-serif font-bold text-base shadow-sm ring-2 ring-accent/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold tracking-tight text-ink">
                  On-Brand Multi-Platform Studio
                </h2>
                <span className="font-mono text-2xs uppercase tracking-wider bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent font-semibold">
                  Cross-Format Synthesis
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Transform 1 verified core piece into 4 platform-native formats while enforcing brand voice governance.
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-rule bg-paper p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('focus')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'focus'
                    ? 'bg-ink text-white shadow-2xs'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                🔍 Focus Studio
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-ink text-white shadow-2xs'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                ⊞ 4-Platform Grid
              </button>
            </div>

            {bundle && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExportAll('md')}
                  className="px-2.5 py-1.5 text-xs font-medium border border-rule bg-paper hover:bg-raised rounded-lg text-ink transition-colors flex items-center gap-1 shadow-2xs"
                  title="Export Markdown File"
                >
                  <span>📄</span> .MD
                </button>
                <button
                  onClick={() => handleExportAll('json')}
                  className="px-2.5 py-1.5 text-xs font-medium border border-rule bg-paper hover:bg-raised rounded-lg text-ink transition-colors flex items-center gap-1 shadow-2xs"
                  title="Export JSON Package"
                >
                  <span>📦</span> .JSON
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-rule hover:bg-raised flex items-center justify-center text-ink-soft hover:text-ink transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel: Source Material & Brand Voice Control (4 Cols) */}
          <div className="lg:col-span-4 border-r border-rule bg-raised/20 p-5 flex flex-col gap-4 overflow-y-auto">
            {/* Brand Voice Persona Selection Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-mono">
                  Brand Voice Profile
                </label>
                <span className="text-2xs font-mono font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  ✓ Active Guardrail
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-accent bg-paper shadow-sm ring-1 ring-accent/30'
                          : 'border-rule/80 bg-paper/60 hover:bg-paper text-ink-soft hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getProfileIcon(p.id)}</span>
                          <span className="font-serif font-bold text-xs text-ink">{p.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-2xs font-mono bg-accent text-white px-1.5 py-0.5 rounded font-semibold">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-ink-soft mt-1 leading-snug">{p.tagline}</p>
                    </button>
                  );
                })}
              </div>

              {/* Selected Profile Detailed Guardrail Specs */}
              {currentProfile && (
                <div className="bg-paper border border-rule rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-rule pb-1.5">
                    <span className="text-2xs font-mono uppercase font-semibold text-ink-faint">
                      Tone & Style Target
                    </span>
                    <span className="text-2xs font-mono text-ink-soft">{currentProfile.tone}</span>
                  </div>

                  <div>
                    <span className="text-2xs font-mono uppercase font-semibold text-ink-faint block mb-1">
                      🚫 Forbidden Buzzwords (Zero Tolerance)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.forbiddenWords.map((w) => (
                        <span
                          key={w}
                          className="bg-red-50/80 text-red-700 border border-red-200 text-2xs px-1.5 py-0.5 rounded-md font-mono"
                        >
                          ✕ {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentProfile.signatureSignoff && (
                    <div className="bg-raised/60 p-2 rounded-lg text-2xs font-mono text-ink-soft">
                      <span className="font-semibold text-ink">Signature Sign-off:</span> "
                      {currentProfile.signatureSignoff}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Source Content Input / Editor */}
            <div className="space-y-2 flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-mono">
                  Source Content (Verified Core Post)
                </label>
                <span className="text-2xs font-mono text-ink-faint">
                  {content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <input
                type="text"
                placeholder="Topic / Headline..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-paper border border-rule rounded-lg px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />

              <textarea
                placeholder="Paste verified draft or source text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full flex-1 bg-paper border border-rule rounded-xl p-3 text-xs leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-accent resize-none font-serif shadow-inner"
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl font-medium text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Synthesizing & Auditing Brand Alignment...</span>
                  </>
                ) : (
                  <>
                    <span className="group-hover:scale-110 transition-transform">⚡</span>
                    <span className="font-semibold">Repurpose Into All 4 Formats</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Multi-Format Production Studio (8 Cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col gap-4 overflow-y-auto bg-raised/5">
            {/* View Mode 1: Focus Studio Mode */}
            {viewMode === 'focus' ? (
              <>
                {/* Format Selector Tab Pills */}
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <div className="flex gap-2 overflow-x-auto">
                    {[
                      { id: 'video_script', label: '🎬 Short-Form Video', badge: '35s Script' },
                      { id: 'thread', label: '🧵 X / Twitter Thread', badge: '4 Tweets' },
                      { id: 'social_caption', label: '💼 LinkedIn / Social', badge: 'Whitespace' },
                      { id: 'blog_snippet', label: '📰 Blog / Newsletter', badge: 'Markdown TL;DR' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFormat(tab.id as RepurposedFormatId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          activeFormat === tab.id
                            ? 'bg-paper text-accent font-semibold border border-rule shadow-sm ring-1 ring-accent/20'
                            : 'text-ink-soft hover:text-ink bg-paper/40 border border-transparent'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-2xs font-mono text-ink-faint bg-raised border border-rule px-1 py-0.2 rounded">
                          {tab.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content Stage */}
                {bundle && currentItem ? (
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Format Header Bar with Brand Score Gauge */}
                    <div className="bg-paper border border-rule rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-raised border border-rule flex items-center justify-center text-lg">
                          {activeFormat === 'video_script'
                            ? '🎬'
                            : activeFormat === 'thread'
                            ? '🧵'
                            : activeFormat === 'social_caption'
                            ? '💼'
                            : '📰'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-sm text-ink">
                              {currentItem.title}
                            </h3>
                            <span className="text-2xs font-mono bg-raised border border-rule px-2 py-0.5 rounded text-ink-soft">
                              {currentItem.platform}
                            </span>
                          </div>
                          <span className="text-2xs text-ink-faint">
                            Est. Consumption: {currentItem.estimatedReadTime}
                          </span>
                        </div>
                      </div>

                      {/* Brand Alignment Gauge & Copy Button */}
                      <div className="flex items-center gap-3">
                        {/* Circular Score Pill */}
                        <div className="flex items-center gap-2 bg-raised/80 border border-rule px-3 py-1.5 rounded-xl">
                          <div className="text-right">
                            <span className="text-2xs font-mono text-ink-faint block uppercase leading-none">
                              Brand Fit
                            </span>
                            <span
                              className={`font-mono text-xs font-bold ${
                                currentItem.brandScore.passed ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {currentItem.brandScore.overallScore}% MATCH
                            </span>
                          </div>
                          <div
                            className={`h-3 w-3 rounded-full ${
                              currentItem.brandScore.passed
                                ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                                : 'bg-amber-500 ring-2 ring-amber-200'
                            }`}
                          />
                        </div>

                        {/* Copy Format Button */}
                        <button
                          onClick={() => handleCopy(currentItem.content, currentItem.title)}
                          className="px-3.5 py-1.5 bg-ink text-white hover:bg-ink/90 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          {copiedFormat === currentItem.title ? (
                            <>
                              <span className="text-emerald-400">✓</span> Copied to Clipboard!
                            </>
                          ) : (
                            <>
                              <span>📋</span> Copy Format
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Brand 3-Pillar Breakdown Bar */}
                    <div className="bg-paper border border-rule rounded-xl p-3 grid grid-cols-3 gap-3 text-xs font-mono text-center">
                      <div className="p-2 rounded-lg bg-raised/40 border border-rule/50">
                        <span className="text-2xs text-ink-faint block">VOCABULARY PURITY</span>
                        <span className="font-bold text-ink text-sm">
                          {currentItem.brandScore.vocabularyScore}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-raised/40 border border-rule/50">
                        <span className="text-2xs text-ink-faint block">TONE ADHERENCE</span>
                        <span className="font-bold text-ink text-sm">
                          {currentItem.brandScore.toneScore}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-raised/40 border border-rule/50">
                        <span className="text-2xs text-ink-faint block">FACT PRESERVATION</span>
                        <span className="font-bold text-ink text-sm">
                          {currentItem.brandScore.claimFidelityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Warnings & Suggestions */}
                    {currentItem.brandScore.warnings.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl space-y-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>⚠️</span> Brand Voice Feedback:
                        </span>
                        <ul className="list-disc pl-5 text-2xs space-y-0.5 text-amber-800 font-mono">
                          {currentItem.brandScore.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Format-Specific Views */}
                    <div className="flex-1 bg-paper border border-rule rounded-2xl p-6 overflow-y-auto shadow-inner">
                      {/* Format 1: Video Script with Teleprompter Simulator */}
                      {activeFormat === 'video_script' && currentItem.metadata?.scenes ? (
                        <div className="space-y-4">
                          {/* Teleprompter Playback Toolbar */}
                          <div className="bg-raised border border-rule rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setTeleprompterActive(!teleprompterActive)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                  teleprompterActive
                                    ? 'bg-amber-500 text-white animate-pulse'
                                    : 'bg-accent text-white'
                                }`}
                              >
                                {teleprompterActive ? '⏸ Pause Pacer' : '▶ Simulate Video Pace'}
                              </button>
                              <span className="text-2xs font-mono text-ink-soft">
                                {teleprompterActive
                                  ? `⏱️ Running pace: ${teleprompterTimer}s left`
                                  : '🎬 35-second pacing budget'}
                              </span>
                            </div>

                            <span className="text-2xs font-mono bg-paper border border-rule px-2 py-0.5 rounded text-ink-soft">
                              {currentItem.metadata.scenes.length} Production Scenes
                            </span>
                          </div>

                          {/* Scenes List */}
                          <div className="space-y-3">
                            {currentItem.metadata.scenes.map(
                              (scene: ScriptScene, index: number) => {
                                const isCurrentScene =
                                  teleprompterActive && activeSceneIndex === index;
                                return (
                                  <div
                                    key={index}
                                    onClick={() => setActiveSceneIndex(index)}
                                    className={`border rounded-xl overflow-hidden transition-all ${
                                      isCurrentScene
                                        ? 'border-accent bg-accent/5 ring-2 ring-accent/30 shadow-md'
                                        : 'border-rule bg-raised/20 hover:bg-raised/40'
                                    }`}
                                  >
                                    <div className="bg-raised/90 border-b border-rule px-4 py-2 text-2xs font-mono text-ink-soft flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-accent">
                                          SCENE {index + 1}
                                        </span>
                                        <span className="text-ink-faint">|</span>
                                        <span>⏱️ {scene.timestamp}</span>
                                      </div>
                                      <span className="text-ink-faint uppercase">
                                        {index === 0
                                          ? '🎣 The Hook'
                                          : index === currentItem.metadata!.scenes!.length - 1
                                          ? '📢 Call to Action'
                                          : '📊 Core Breakdown'}
                                      </span>
                                    </div>

                                    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                                      {/* Left Sub-Column: Visual & OST */}
                                      <div className="md:col-span-5 space-y-2.5 border-b md:border-b-0 md:border-r border-rule/60 pb-3 md:pb-0 md:pr-4">
                                        <div>
                                          <span className="text-2xs font-mono font-semibold text-ink-faint uppercase block">
                                            📹 Camera & Visual Direction
                                          </span>
                                          <p className="text-ink text-xs mt-1 leading-relaxed">
                                            {scene.visualCue}
                                          </p>
                                        </div>

                                        {scene.onScreenText && (
                                          <div className="bg-paper border border-rule p-2 rounded-lg text-2xs font-mono text-ink font-semibold">
                                            <span className="text-ink-faint block text-3xs uppercase">
                                              On-Screen Text Overlay
                                            </span>
                                            "{scene.onScreenText}"
                                          </div>
                                        )}
                                      </div>

                                      {/* Right Sub-Column: Voiceover */}
                                      <div className="md:col-span-7 space-y-1.5 flex flex-col justify-center">
                                        <span className="text-2xs font-mono font-semibold text-accent uppercase block">
                                          🎙️ Spoken Voiceover Narration
                                        </span>
                                        <p className="font-serif text-sm text-ink leading-relaxed font-medium">
                                          "{scene.narration}"
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ) : activeFormat === 'thread' && currentItem.metadata?.tweets ? (
                        /* Format 2: Realistic X / Twitter Thread Cards */
                        <div className="space-y-4 max-w-xl mx-auto">
                          {currentItem.metadata.tweets.map((tweet: TweetItem, index: number) => {
                            const isOverLimit = tweet.charCount > 280;
                            return (
                              <div
                                key={index}
                                className="bg-paper border border-rule rounded-2xl p-5 shadow-sm space-y-3 transition-all hover:border-accent/40"
                              >
                                {/* Tweet Author Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                                      P
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs text-ink">
                                          Proofly Editorial
                                        </span>
                                        <span className="text-accent text-xs">✓</span>
                                      </div>
                                      <span className="text-2xs font-mono text-ink-faint">
                                        @proofly_ai • Tweet {tweet.index} of{' '}
                                        {currentItem.metadata?.tweets?.length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Character Progress Ring Counter */}
                                  <div className="flex items-center gap-1.5 font-mono text-2xs">
                                    <span
                                      className={`${
                                        isOverLimit ? 'text-red-500 font-bold' : 'text-ink-soft'
                                      }`}
                                    >
                                      {tweet.charCount} / 280
                                    </span>
                                  </div>
                                </div>

                                {/* Tweet Body */}
                                <p className="text-xs font-sans text-ink leading-relaxed whitespace-pre-wrap">
                                  {tweet.text}
                                </p>

                                {/* Mock Twitter Action Bar */}
                                <div className="flex items-center justify-between text-ink-faint text-2xs border-t border-rule/50 pt-2.5 px-1 font-mono">
                                  <span className="hover:text-accent cursor-pointer">💬 12</span>
                                  <span className="hover:text-emerald-600 cursor-pointer">
                                    🔁 84
                                  </span>
                                  <span className="hover:text-red-500 cursor-pointer">❤️ 412</span>
                                  <button
                                    onClick={() => handleCopy(tweet.text, `Tweet ${tweet.index}`)}
                                    className="text-accent hover:underline"
                                  >
                                    Copy Tweet
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : activeFormat === 'social_caption' ? (
                        /* Format 3: Realistic LinkedIn / Social Feed Post */
                        <div className="max-w-xl mx-auto bg-paper border border-rule rounded-2xl p-6 shadow-sm space-y-4">
                          {/* LinkedIn Mock Author Header */}
                          <div className="flex items-center justify-between border-b border-rule pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm">
                                G
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-ink">
                                    Gatekeeper Engineering & Editorial
                                  </span>
                                  <span className="text-2xs bg-sunk px-1.5 py-0.2 rounded text-ink-soft border border-rule">
                                    1st
                                  </span>
                                </div>
                                <p className="text-2xs text-ink-faint">
                                  Autonomous Publication & Research • 12,400 followers
                                </p>
                              </div>
                            </div>
                            <span className="text-2xs font-mono text-ink-faint">Just now • 🌐</span>
                          </div>

                          {/* LinkedIn Formatted Body */}
                          <div className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                            {currentItem.content}
                          </div>

                          {/* Hashtag Pills */}
                          {currentItem.metadata?.hashtags && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-rule/60">
                              {currentItem.metadata.hashtags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-2xs font-mono text-accent bg-accent/5 hover:bg-accent/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Format 4: Elegant Markdown Blog / Newsletter Reader */
                        <div className="max-w-2xl mx-auto bg-paper p-6 rounded-xl border border-rule space-y-4 font-serif">
                          <div className="border-b border-rule pb-3 font-sans flex items-center justify-between text-2xs text-ink-faint">
                            <span>NEWSLETTER DIGEST PREVIEW</span>
                            <span>{currentItem.metadata?.wordCount || 240} words • Markdown</span>
                          </div>
                          <div className="prose prose-sm text-ink leading-relaxed whitespace-pre-wrap">
                            {currentItem.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-rule rounded-2xl p-10 text-center bg-raised/10">
                    <div className="h-14 w-14 rounded-2xl bg-raised border border-rule flex items-center justify-center text-2xl mb-3 shadow-inner">
                      ⚡
                    </div>
                    <h3 className="font-serif text-base font-bold text-ink">
                      Repurposing Engine Ready
                    </h3>
                    <p className="text-xs text-ink-soft max-w-md mt-1.5 leading-relaxed">
                      Choose a Brand Voice Persona on the left and click{' '}
                      <strong className="text-ink">"Repurpose Into All 4 Formats"</strong> to generate
                      platform-native scripts, threads, captions, and articles in real-time.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* View Mode 2: 4-Platform Grid Comparison */
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Cross-Platform Alignment Matrix (All 4 Formats)
                  </h3>
                  <span className="text-2xs font-mono text-ink-soft">
                    Brand Voice: {currentProfile?.name}
                  </span>
                </div>

                {bundle ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                    {Object.values(bundle.formats).map((fmt) => (
                      <div
                        key={fmt.formatId}
                        className="bg-paper border border-rule rounded-xl p-4 shadow-sm flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-rule pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-xs text-ink">{fmt.title}</span>
                            <span className="text-2xs font-mono text-ink-soft bg-raised px-1.5 py-0.5 rounded">
                              {fmt.platform}
                            </span>
                          </div>

                          <span className="text-2xs font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {fmt.brandScore.overallScore}% Fit
                          </span>
                        </div>

                        <div className="flex-1 text-2xs text-ink leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-56 bg-raised/20 p-2.5 rounded-lg border border-rule/50">
                          {fmt.content}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-2xs">
                          <span className="text-ink-faint font-mono">{fmt.estimatedReadTime}</span>
                          <button
                            onClick={() => handleCopy(fmt.content, fmt.title)}
                            className="px-2.5 py-1 bg-ink text-white hover:bg-ink/90 rounded text-2xs font-medium"
                          >
                            {copiedFormat === fmt.title ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-ink-soft">
                    No bundle generated yet. Click "Repurpose" on the left to populate the grid.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
