import React from 'react';

interface CatalogueItem {
  id: string;
  topic: string;
  body: string;
  publishedDaysAgo: number;
  cosineDimensions: number;
}

const SEED_CATALOGUE: CatalogueItem[] = [
  {
    id: 'pub-hist-1',
    topic: 'Vector database vendors converge on usage-based pricing',
    body: 'Vector database pricing is moving to consumption billing. Vendors are dropping instance-hour rental in favour of charging for vectors stored and queries served, which suits bursty query patterns and punishes idle always-on deployments. If your retrieval workload is spiky, this is a straightforward win.',
    publishedDaysAgo: 6,
    cosineDimensions: 1536,
  },
  {
    id: 'pub-hist-2',
    topic: 'Retrieval quality depends more on chunking than on model choice',
    body: 'Swapping embedding models produces smaller retrieval gains than fixing your chunk boundaries. Passage-level chunks that respect paragraph structure consistently outperform fixed-width splits, and the effect is larger than the gap between most commodity embedding models.',
    publishedDaysAgo: 13,
    cosineDimensions: 1536,
  },
  {
    id: 'pub-hist-3',
    topic: 'Accelerator lease rates ease as new capacity lands',
    body: 'Datacentre capacity commissioned last year is now online, and lease rates for previous-generation accelerators have fallen three months running. The effect shows up in inference cost per token well before it shows up in training budgets.',
    publishedDaysAgo: 21,
    cosineDimensions: 1536,
  },
];

export const BackCatalogueView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Novelty Back-Catalogue</h2>
            <span className="chip-idle text-3xs font-mono">
              Vector Space RAG
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Past publications indexed in Weaviate. Novelty Gate runs cosine distance checks against this corpus to prevent repetitive posts.
          </p>
        </div>
      </div>

      {/* Catalogue Cards */}
      <div className="space-y-3.5">
        {SEED_CATALOGUE.map((item) => (
          <div
            key={item.id}
            className="card p-5 bg-surface hover:border-border-focus/30 transition-all space-y-3 shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div>
                <span className="label text-3xs">Published {item.publishedDaysAgo} Days Ago</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">
                  {item.topic}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-3xs text-foreground-faint">
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                  {item.cosineDimensions}d Vector
                </span>
                <span className="chip-pass text-3xs">
                  Indexed in Weaviate
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded bg-surface-raised border border-border-subtle text-xs text-foreground-muted leading-relaxed font-sans">
              "{item.body}"
            </div>

            <div className="flex items-center justify-between text-3xs font-mono text-foreground-faint pt-1">
              <span>Vector Key: {item.id}</span>
              <span>Novelty Re-evaluation: Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
