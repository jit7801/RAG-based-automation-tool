import React from 'react';
import type { FeedMessage } from './ChannelFeed';

interface PublishedViewProps {
  feed: FeedMessage[];
  onOpenRepurpose?: (topic: string, content: string) => void;
}

export const PublishedView: React.FC<PublishedViewProps> = ({ feed, onOpenRepurpose }) => {
  const published = feed.filter((m) => m.channel === '#content');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-page-title text-primary">Published Posts</h2>
        <p className="text-body text-secondary mt-1">
          Safety-verified content automatically dispatched to outbound broadcast channels.
        </p>
      </div>

      {published.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-muted space-y-2">
          <p className="text-sm font-medium text-primary">No published content yet</p>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Run the clean auto-publish benchmark (Scenario 1) to watch Proofly publish a verified post.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {published.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-border bg-surface p-6 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-pass" />
                  <span className="font-semibold text-primary text-sm">#content</span>
                  <span className="text-muted text-xs font-mono">
                    {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="status-pass text-xs">
                    Published
                  </span>
                  {onOpenRepurpose && (
                    <button
                      onClick={() => onOpenRepurpose('', msg.text)}
                      className="btn-ghost text-xs px-2.5 py-1"
                    >
                      ⚡ Repurpose
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-secondary leading-relaxed font-sans whitespace-pre-line">
                {msg.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
