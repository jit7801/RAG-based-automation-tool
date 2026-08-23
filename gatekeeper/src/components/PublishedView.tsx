import React from 'react';
import type { FeedMessage } from './ChannelFeed';

interface PublishedViewProps {
  feed: FeedMessage[];
  onOpenRepurpose?: (topic: string, content: string) => void;
}

export const PublishedView: React.FC<PublishedViewProps> = ({ feed, onOpenRepurpose }) => {
  const published = feed.filter((m) => m.channel === '#content');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Published Outbound Content</h2>
            <span className="chip-pass text-3xs font-mono">
              {published.length} Posts Live
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Verified, safety-gated posts successfully dispatched to public channels (#content, Slack, X, LinkedIn).
          </p>
        </div>
      </div>

      {/* Published Feed */}
      {published.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center text-foreground-faint space-y-3">
          <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-foreground-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No Published Content Yet</p>
          <p className="text-xs text-foreground-muted max-w-sm">
            Trigger Scenario 1 to watch Gatekeeper verify and automatically publish a live tech post.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {published.map((msg) => (
            <div
              key={msg.id}
              className="card p-5 bg-surface hover:border-border-focus/30 transition-all space-y-3 shadow-panel"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-pass" />
                  <span className="font-mono text-xs font-semibold text-foreground">
                    #content • Public Broadcast
                  </span>
                  <span className="text-foreground-faint text-3xs font-mono">
                    {new Date(msg.at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip-pass text-3xs">✓ PUBLISHED</span>
                  {onOpenRepurpose && (
                    <button
                      onClick={() => onOpenRepurpose('', msg.text)}
                      className="btn-ghost text-3xs px-2.5 py-1 text-brand hover:text-white hover:bg-brand border-brand/20"
                    >
                      ⚡ Repurpose
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded bg-surface-raised border border-border-subtle text-xs text-foreground font-sans leading-relaxed whitespace-pre-line">
                {msg.text}
              </div>

              <div className="flex items-center justify-between text-3xs font-mono text-foreground-faint pt-1">
                <span>Run: {msg.runId}</span>
                <span>Destination: Slack #content • Outbound API</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
