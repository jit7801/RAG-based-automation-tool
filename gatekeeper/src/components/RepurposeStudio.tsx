import React, { useEffect, useState } from 'react';
import type {
  BrandProfile,
  RepurposeBundle,
  RepurposedFormatId,
  RepurposedItem,
  ScriptScene,
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

  const apiBase =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'http://localhost:8787'
      : '';

  useEffect(() => {
    if (isOpen) {
      if (initialTopic) setTopic(initialTopic);
      if (initialContent) setContent(initialContent);
    }
  }, [isOpen, initialTopic, initialContent]);

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

  useEffect(() => {
    if (isOpen && content.trim() && !bundle && !loading) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  if (!isOpen) return null;

  const currentItem: RepurposedItem | undefined = bundle?.formats[activeFormat];

  const formats: { id: RepurposedFormatId; label: string; platform: string }[] = [
    { id: 'video_script', label: 'Short Video', platform: 'TikTok / Reels' },
    { id: 'thread', label: 'Thread', platform: 'X / Twitter' },
    { id: 'social_caption', label: 'Social Post', platform: 'LinkedIn' },
    { id: 'blog_snippet', label: 'Newsletter', platform: 'Blog & Email' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-8 animate-fadeIn">
      <div className="bg-surface border border-border w-full max-w-5xl h-[88vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-primary">
        {/* Top Header */}
        <div className="border-b border-border bg-sidebar px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-primary">
              Brand Studio
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Transform verified content across platform formats while preserving brand alignment.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded border border-border hover:bg-surface-raised flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Studio Body: Two Column Balanced Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Configuration & Source (5 Cols) */}
          <div className="lg:col-span-5 border-r border-border p-6 flex flex-col gap-5 overflow-y-auto bg-sidebar/50">
            {/* Persona Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary">
                Brand Persona
              </label>
              <div className="grid grid-cols-1 gap-2">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`text-left p-3 rounded border transition-colors ${
                        isSelected
                          ? 'border-brand bg-brand/10 text-primary font-medium'
                          : 'border-border bg-surface text-secondary hover:text-primary hover:bg-surface-raised'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-muted text-xs font-mono">{p.tone}</span>
                      </div>
                      <p className="text-xs text-secondary mt-1 line-clamp-1">{p.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Content Input */}
            <div className="space-y-2 flex-1 flex flex-col min-h-[220px]">
              <label className="text-xs font-semibold text-primary">
                Verified Core Content
              </label>
              <input
                type="text"
                placeholder="Topic / Title..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-brand"
              />
              <textarea
                placeholder="Enter verified draft text..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                className="w-full flex-1 bg-surface border border-border rounded p-3 text-xs leading-relaxed text-primary placeholder:text-muted focus:outline-none focus:border-brand resize-none"
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="btn-primary w-full text-xs py-2 font-medium"
              >
                {loading ? 'Synthesizing...' : 'Repurpose Across Formats'}
              </button>

              {error && (
                <div className="p-3 rounded bg-status-block-subtle border border-status-block-border text-status-block text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Multi-Format Preview (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Format Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFormat(f.id)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    activeFormat === f.id
                      ? 'bg-surface-raised text-primary font-semibold border border-border'
                      : 'text-secondary hover:text-primary hover:bg-surface-raised/50'
                  }`}
                >
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Content Output */}
            {bundle && currentItem ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Format Header Card */}
                <div className="rounded border border-border bg-surface p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      {currentItem.title}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Platform: {currentItem.platform} • Est. Time: {currentItem.estimatedReadTime}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="status-pass text-xs">
                      {currentItem.brandScore.overallScore}% Brand Fit
                    </span>
                    <button
                      onClick={() => handleCopy(currentItem.content, currentItem.title)}
                      className="btn-ghost text-xs px-3 py-1"
                    >
                      {copiedFormat === currentItem.title ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Main Rendered Content */}
                <div className="rounded border border-border bg-surface p-5 flex-1 overflow-y-auto space-y-4">
                  {activeFormat === 'video_script' && currentItem.metadata?.scenes ? (
                    <div className="space-y-3">
                      {currentItem.metadata.scenes.map((scene: ScriptScene, i: number) => (
                        <div key={i} className="p-3.5 rounded bg-surface-raised border border-border space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-muted">
                            <span className="font-semibold text-brand">SCENE {i + 1}</span>
                            <span>{scene.timestamp}</span>
                          </div>
                          <div className="text-xs text-secondary">
                            <strong className="text-primary">Visual Cue: </strong>
                            {scene.visualCue}
                          </div>
                          <div className="text-xs text-primary leading-relaxed">
                            <strong className="text-primary">Narration: </strong>
                            "{scene.narration}"
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeFormat === 'thread' && currentItem.metadata?.tweets ? (
                    <div className="space-y-3">
                      {currentItem.metadata.tweets.map((t, i) => (
                        <div key={i} className="p-3.5 rounded bg-surface-raised border border-border space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono text-muted">
                            <span>Tweet {t.index}</span>
                            <span>{t.charCount} / 280 chars</span>
                          </div>
                          <p className="text-xs text-primary leading-relaxed font-sans">
                            {t.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-secondary leading-relaxed font-sans whitespace-pre-line">
                      {currentItem.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded border border-border bg-surface p-12 text-center text-muted flex-1 flex flex-col items-center justify-center space-y-2">
                <p className="text-sm font-medium text-primary">Awaiting Synthesis</p>
                <p className="text-xs text-secondary max-w-sm">
                  Click "Repurpose Across Formats" on the left to generate on-brand video scripts, threads, captions, and newsletters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
