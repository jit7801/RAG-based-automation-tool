import React from 'react';

interface CatalogueItem {
  id: string;
  topic: string;
  body: string;
  publishedDaysAgo: number;
}

const SEED_CATALOGUE: CatalogueItem[] = [
  {
    id: 'pub-hist-1',
    topic: 'Vector database vendors converge on usage-based pricing',
    body: 'Vector database pricing is moving to consumption billing. Vendors are dropping instance-hour rental in favour of charging for vectors stored and queries served, which suits bursty query patterns and punishes idle always-on deployments. If your retrieval workload is spiky, this is a straightforward win.',
    publishedDaysAgo: 6,
  },
  {
    id: 'pub-hist-2',
    topic: 'Retrieval quality depends more on chunking than on model choice',
    body: 'Swapping embedding models produces smaller retrieval gains than fixing your chunk boundaries. Passage-level chunks that respect paragraph structure consistently outperform fixed-width splits, and the effect is larger than the gap between most commodity embedding models.',
    publishedDaysAgo: 13,
  },
  {
    id: 'pub-hist-3',
    topic: 'Accelerator lease rates ease as new capacity lands',
    body: 'Datacentre capacity commissioned last year is now online, and lease rates for previous-generation accelerators have fallen three months running. The effect shows up in inference cost per token well before it shows up in training budgets.',
    publishedDaysAgo: 21,
  },
];

export const BackCatalogueView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-page-title text-primary">Novelty Back-Catalogue</h2>
        <p className="text-body text-secondary mt-1">
          Historical publications stored as vector embeddings in Weaviate. Used by the Novelty Gate to prevent repetitive content.
        </p>
      </div>

      {/* Catalogue Cards */}
      <div className="space-y-4">
        {SEED_CATALOGUE.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-surface p-6 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-primary">
                {item.topic}
              </h3>
              <span className="text-xs text-muted font-mono">
                Published {item.publishedDaysAgo} days ago
              </span>
            </div>

            <p className="text-xs text-secondary leading-relaxed font-sans">
              "{item.body}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
