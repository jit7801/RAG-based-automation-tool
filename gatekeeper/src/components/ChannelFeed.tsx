import React, { useState } from 'react';

export interface FeedMessage {
  id: string;
  kind: 'published' | 'escalation' | 'decision';
  channel: string;
  text: string;
  runId: string;
  at: string;
  local: boolean;
}

interface ChannelFeedProps {
  feed: FeedMessage[];
}

export const ChannelFeed: React.FC<ChannelFeedProps> = ({ feed }) => {
  const [activeChannel, setActiveChannel] = useState<'#content' | '#content-review'>('#content');

  const filtered = feed.filter((m) => m.channel === activeChannel);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <span className="label">Outbound Publishing Channels</span>
          <h2 className="font-serif text-lg font-bold text-ink">
            Channel Dispatch Feed
          </h2>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex rounded-md border border-rule bg-sunk p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveChannel('#content')}
            className={`rounded px-2.5 py-1 transition-colors ${
              activeChannel === '#content'
                ? 'bg-raised font-bold text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            #content (Public)
          </button>
          <button
            onClick={() => setActiveChannel('#content-review')}
            className={`rounded px-2.5 py-1 transition-colors ${
              activeChannel === '#content-review'
                ? 'bg-raised font-bold text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            #content-review (Escalation)
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-ink-faint text-xs italic rounded border border-dashed border-rule">
            No messages posted to {activeChannel} yet.
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-rule bg-raised p-3.5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      msg.kind === 'published'
                        ? 'bg-pass'
                        : msg.kind === 'escalation'
                          ? 'bg-block'
                          : 'bg-accent'
                    }`}
                  />
                  <span className="font-bold text-xs text-ink font-mono">
                    {msg.kind === 'decision' ? 'Reviewer' : 'Gatekeeper'}
                  </span>
                  <span className="text-2xs text-ink-faint font-mono">
                    {new Date(msg.at).toLocaleTimeString()}
                  </span>
                </div>

                <span
                  className={`font-mono text-2xs uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    msg.kind === 'published'
                      ? 'bg-pass-bg text-pass'
                      : msg.kind === 'escalation'
                        ? 'bg-block-bg text-block'
                        : 'bg-accent-soft text-accent'
                  }`}
                >
                  {msg.kind}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink whitespace-pre-line font-sans">
                {msg.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
