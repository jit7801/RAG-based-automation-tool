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

  const formats: { id: RepurposedFormatId; label: string }[] = [
    { id: 'video_script', label: 'Short Video' },
    { id: 'thread', label: 'Thread' },
    { id: 'social_caption', label: 'Social Post' },
    { id: 'blog_snippet', label: 'Newsletter' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface border border-border w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-primary">
        {/* Clean Minimal Header */}
        <div className="border-b border-border px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-section-heading text-primary">Brand Studio</h2>
            <p className="text-secondary text-xs mt-0.5">
              Transform verified content across platform formats while preserving brand alignment.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary text-sm px-2.5 py-1 rounded hover:bg-surface-raised transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Studio Body: Two Column Clean Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Configuration & Source (5 Cols) */}
          <div className="lg:col-span-5 border-r border-border p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              {/* Brand Persona (Simple Dropdown / Pill Selector) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary block">
                  Brand Persona
                </label>
                <div className="space-y-2">
                  {profiles.map((p) => {
                    const isSelected = p.id === selectedProfileId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-brand bg-brand/10 text-primary'
                            : 'border-border bg-surface-raised/40 text-secondary hover:border-border-strong hover:text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">{p.name}</span>
                          <span className="text-xs text-muted font-sans">{p.tone}</span>
                        </div>
                        <p className="text-xs text-secondary mt-1 leading-relaxed">{p.tagline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Content Inputs */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-primary block">
                  Source Content
                </label>
                <input
                  type="text"
                  placeholder="Topic / Title..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-md px-3.5 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-brand font-medium"
                />
                <textarea
                  placeholder="Enter verified core text..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full bg-surface-raised border border-border rounded-md p-3.5 text-xs leading-relaxed text-primary placeholder:text-muted focus:outline-none focus:border-brand resize-none font-sans"
                />
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="btn-primary w-full text-xs py-2.5 font-medium shadow-sm"
              >
                {loading ? 'Synthesizing Formats...' : 'Repurpose Across Formats'}
              </button>

              {error && (
                <div className="mt-2 p-3 rounded bg-status-block-subtle border border-status-block-border text-status-block text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clean Format Preview (7 Cols) */}
          <div className="lg:col-span-7 p-8 flex flex-col overflow-y-auto space-y-6">
            {/* Horizontal Format Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFormat(f.id)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeFormat === f.id
                        ? 'bg-surface-raised text-primary border border-border'
                        : 'text-secondary hover:text-primary hover:bg-surface-raised/40'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {currentItem && (
                <div className="flex items-center gap-3">
                  <span className="status-pass text-xs">
                    {currentItem.brandScore.overallScore}% Brand Fit
                  </span>
                  <button
                    onClick={() => handleCopy(currentItem.content, currentItem.title)}
                    className="btn-ghost text-xs px-3 py-1 font-medium"
                  >
                    {copiedFormat === currentItem.title ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* Generated Content Body */}
            {bundle && currentItem ? (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Meta details */}
                <div className="text-xs text-muted">
                  Platform: <span className="text-secondary font-medium">{currentItem.platform}</span> • Read Time: <span className="text-secondary font-medium">{currentItem.estimatedReadTime}</span>
                </div>

                {/* Content Renderers */}
                <div className="flex-1 rounded-lg border border-border bg-surface-raised/40 p-6 overflow-y-auto">
                  {activeFormat === 'video_script' && currentItem.metadata?.scenes ? (
                    <div className="space-y-4">
                      {currentItem.metadata.scenes.map((scene: ScriptScene, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-surface border border-border space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-muted border-b border-border/50 pb-2">
                            <span className="font-semibold text-primary">SCENE 0{i + 1}</span>
                            <span>{scene.timestamp}</span>
                          </div>
                          <div className="text-xs text-secondary pt-1">
                            <strong className="text-primary font-medium">Visual: </strong>
                            {scene.visualCue}
                          </div>
                          <div className="text-sm text-primary leading-relaxed font-sans pt-1">
                            <strong className="text-primary font-medium">Narration: </strong>
                            "{scene.narration}"
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeFormat === 'thread' && currentItem.metadata?.tweets ? (
                    <div className="space-y-3">
                      {currentItem.metadata.tweets.map((t, i) => (
                        <div key={i} className="p-4 rounded-lg bg-surface border border-border space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted font-mono">
                            <span className="font-medium text-primary">Tweet {t.index} / {currentItem.metadata?.tweets?.length}</span>
                            <span>{t.charCount} / 280</span>
                          </div>
                          <p className="text-sm text-primary leading-relaxed font-sans">
                            {t.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-primary leading-relaxed font-sans whitespace-pre-line">
                      {currentItem.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface-raised/20 p-12 text-center text-muted flex-1 flex flex-col items-center justify-center space-y-2">
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
