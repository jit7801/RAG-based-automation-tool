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
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'http://localhost:8787'
    : '';

  // Update local content state if props change when opening
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

  const handleExportAll = () => {
    if (!bundle) return;
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
    a.download = `repurposed-content-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const currentItem: RepurposedItem | undefined = bundle?.formats[activeFormat];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 animate-fadeIn">
      <div className="bg-paper border border-rule w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-rule bg-raised px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-ink">Multi-Platform Brand Studio</h2>
                <span className="font-mono text-2xs uppercase tracking-wider bg-paper border border-rule px-2 py-0.5 rounded text-ink-soft">
                  Cross-Format Engine
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Transform 1 verified core piece into 4 platform-native formats while enforcing brand voice guardrails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {bundle && (
              <button
                onClick={handleExportAll}
                className="px-3 py-1.5 text-xs font-medium border border-rule rounded-lg hover:bg-paper text-ink transition-colors flex items-center gap-1.5"
              >
                <span>📦</span> Export Bundle (.json)
              </button>
            )}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-rule hover:bg-paper flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Studio Workspace (2-Column) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Source Input & Brand Voice Controls (4 Cols) */}
          <div className="lg:col-span-4 border-r border-rule bg-raised/30 p-5 flex flex-col gap-5 overflow-y-auto">
            {/* Brand Voice Profile Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-mono">
                  Brand Voice Profile
                </label>
                <span className="text-2xs text-accent font-medium font-mono">Guardrails Active</span>
              </div>

              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full bg-paper border border-rule rounded-lg px-3 py-2 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tagline})
                  </option>
                ))}
              </select>

              {currentProfile && (
                <div className="bg-paper border border-rule rounded-lg p-3 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-ink">Tone:</span>{' '}
                    <span className="text-ink-soft">{currentProfile.tone}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-ink">Audience:</span>{' '}
                    <span className="text-ink-soft">{currentProfile.targetAudience}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-ink">Forbidden Terms:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentProfile.forbiddenWords.slice(0, 5).map((w) => (
                        <span
                          key={w}
                          className="bg-red-50 text-red-700 border border-red-200 text-2xs px-1.5 py-0.5 rounded font-mono"
                        >
                          ✕ {w}
                        </span>
                      ))}
                      {currentProfile.forbiddenWords.length > 5 && (
                        <span className="text-2xs text-ink-faint">
                          +{currentProfile.forbiddenWords.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Source Content Input */}
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-mono">
                Source Content / Topic
              </label>

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
                rows={7}
                className="w-full flex-1 bg-paper border border-rule rounded-lg p-3 text-xs leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-accent resize-none font-serif"
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Synthesizing & Brand Auditing...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Repurpose Into 4 Formats</span>
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

          {/* Right Column: Multi-Format Studio Stage (8 Cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Format Selector Tabs */}
            <div className="flex border-b border-rule gap-2 overflow-x-auto pb-1">
              {[
                { id: 'video_script', label: '🎬 Short-Form Video', badge: 'TikTok/Reels/Shorts' },
                { id: 'thread', label: '🧵 X / Twitter Thread', badge: '1/4 Numbered' },
                { id: 'social_caption', label: '💼 LinkedIn / Social', badge: 'Whitespace + Tags' },
                { id: 'blog_snippet', label: '📰 Blog / Newsletter', badge: 'Markdown Digest' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormat(tab.id as RepurposedFormatId)}
                  className={`px-3.5 py-2 rounded-t-lg text-xs font-medium transition-all flex items-center gap-2 border-b-2 ${
                    activeFormat === tab.id
                      ? 'border-accent text-accent font-semibold bg-paper shadow-sm'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-2xs font-mono text-ink-faint bg-raised border border-rule px-1.5 py-0.2 rounded">
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Main Stage Content Display */}
            {bundle && currentItem ? (
              <div className="flex-1 flex flex-col gap-4">
                {/* Format Meta & Brand Score Bar */}
                <div className="bg-raised/60 border border-rule rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-sm text-ink">{currentItem.title}</span>
                    <span className="text-2xs font-mono bg-paper border border-rule px-2 py-0.5 rounded text-ink-soft">
                      {currentItem.estimatedReadTime}
                    </span>
                  </div>

                  {/* Brand Score Card */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-ink-soft">Brand Alignment:</span>
                      <div className="flex items-center gap-1.5 bg-paper border border-rule px-2.5 py-1 rounded-full shadow-2xs">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            currentItem.brandScore.passed ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-ink">
                          {currentItem.brandScore.overallScore}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(currentItem.content, currentItem.title)}
                      className="px-3 py-1.5 bg-ink text-paper hover:bg-ink/90 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {copiedFormat === currentItem.title ? (
                        <>
                          <span className="text-emerald-400">✓</span> Copied!
                        </>
                      ) : (
                        <>
                          <span>📋</span> Copy Format
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Brand Score Breakdown Card */}
                <div className="bg-paper border border-rule rounded-lg p-3 text-xs grid grid-cols-3 gap-3 font-mono">
                  <div className="flex flex-col">
                    <span className="text-2xs text-ink-faint">VOCABULARY PURITY</span>
                    <span className="font-bold text-ink text-sm">
                      {currentItem.brandScore.vocabularyScore}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xs text-ink-faint">TONE ADHERENCE</span>
                    <span className="font-bold text-ink text-sm">
                      {currentItem.brandScore.toneScore}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xs text-ink-faint">FACT PRESERVATION</span>
                    <span className="font-bold text-ink text-sm">
                      {currentItem.brandScore.claimFidelityScore}%
                    </span>
                  </div>
                </div>

                {currentItem.brandScore.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded-lg space-y-1">
                    <span className="font-semibold">⚠️ Brand Guidance Notes:</span>
                    <ul className="list-disc pl-4 text-2xs space-y-0.5">
                      {currentItem.brandScore.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Format-Specific Renderers */}
                <div className="flex-1 bg-paper border border-rule rounded-xl p-5 overflow-y-auto">
                  {/* Format 1: Video Script Scenes */}
                  {activeFormat === 'video_script' && currentItem.metadata?.scenes ? (
                    <div className="space-y-4">
                      {currentItem.metadata.scenes.map((scene: ScriptScene, index: number) => (
                        <div
                          key={index}
                          className="border border-rule rounded-lg overflow-hidden bg-raised/20"
                        >
                          <div className="bg-raised border-b border-rule px-3 py-1.5 text-2xs font-mono text-ink-soft flex items-center justify-between">
                            <span className="font-bold text-accent">SCENE {index + 1}</span>
                            <span>⏱️ {scene.timestamp}</span>
                          </div>
                          <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                            <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-rule/60 pb-2 md:pb-0 md:pr-3">
                              <div>
                                <span className="text-2xs font-mono font-semibold text-ink-faint uppercase block">
                                  📹 Visual Action
                                </span>
                                <p className="text-ink text-xs mt-0.5">{scene.visualCue}</p>
                              </div>
                              {scene.onScreenText && (
                                <div className="bg-paper border border-rule p-2 rounded text-2xs font-mono text-ink font-semibold">
                                  OST: "{scene.onScreenText}"
                                </div>
                              )}
                            </div>
                            <div className="md:col-span-7 space-y-1">
                              <span className="text-2xs font-mono font-semibold text-accent uppercase block">
                                🎙️ Spoken Voiceover
                              </span>
                              <p className="font-serif text-sm text-ink leading-relaxed font-medium">
                                "{scene.narration}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeFormat === 'thread' && currentItem.metadata?.tweets ? (
                    /* Format 2: Twitter Thread Cards */
                    <div className="space-y-3 max-w-xl mx-auto">
                      {currentItem.metadata.tweets.map((tweet: TweetItem, index: number) => (
                        <div
                          key={index}
                          className="bg-paper border border-rule rounded-xl p-4 shadow-sm space-y-2.5 relative"
                        >
                          <div className="flex items-center justify-between text-2xs font-mono text-ink-faint">
                            <span className="font-bold text-accent">Tweet {tweet.index} of {currentItem.metadata?.tweets?.length}</span>
                            <span className={`${tweet.charCount > 280 ? 'text-red-500 font-bold' : ''}`}>
                              {tweet.charCount} / 280 chars
                            </span>
                          </div>
                          <p className="text-xs font-sans text-ink leading-relaxed whitespace-pre-wrap">
                            {tweet.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : activeFormat === 'social_caption' ? (
                    /* Format 3: LinkedIn / Social Caption */
                    <div className="max-w-xl mx-auto bg-raised/30 border border-rule rounded-xl p-5 space-y-4">
                      <div className="text-2xs font-mono text-ink-faint border-b border-rule pb-2">
                        POST PREVIEW (LinkedIn / Social Feed)
                      </div>
                      <div className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                        {currentItem.content}
                      </div>
                    </div>
                  ) : (
                    /* Format 4: Blog / Markdown Digest */
                    <div className="max-w-2xl mx-auto prose prose-sm text-ink font-serif leading-relaxed whitespace-pre-wrap bg-raised/10 p-4 rounded-lg border border-rule">
                      {currentItem.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-rule rounded-xl p-8 text-center bg-raised/10">
                <div className="h-12 w-12 rounded-full bg-raised flex items-center justify-center text-xl mb-3">
                  ⚡
                </div>
                <h3 className="font-serif text-base font-bold text-ink">Repurposing Engine Ready</h3>
                <p className="text-xs text-ink-soft max-w-sm mt-1">
                  Select a Brand Voice Persona on the left and click "Repurpose" to generate all 4 platform-ready formats simultaneously.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
