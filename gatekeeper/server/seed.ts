// ---------------------------------------------------------------------------
// Seeded corpus.
//
// Two jobs. First, it is the fallback when discovery is unreachable, so the
// product is always demonstrable — a run on seeded data is fully real, it just
// reads from here instead of the live web, and the UI marks it DEGRADED.
// Second, it gives the demo four deliberately chosen scenarios that exercise
// each gate outcome, so nothing has to be faked on stage.
//
// Publishers and companies here are fictional. Using invented names avoids
// putting unverified claims about real organisations into a committed repo.
// ---------------------------------------------------------------------------

export interface SeedDoc {
  publisher: string;
  title: string;
  url: string;
  passages: string[];
}

export interface SeedTrend {
  id: string;
  topic: string;
  summary: string;
  docs: SeedDoc[];
  /** Which gate outcome this scenario is here to demonstrate. */
  demoNote: string;
}

export const SEED_TRENDS: SeedTrend[] = [
  // ---- 1. Clean path: corroborated, unremarkable, novel -> AUTO-PUBLISHES --
  {
    id: 'trend-inference-costs',
    topic: 'Open-weight model inference costs fell sharply this quarter',
    summary:
      'Multiple independent outlets report a steep drop in the cost of serving open-weight models, attributed to better quantisation and cheaper accelerator supply.',
    demoNote: 'Passes all three checks. Publishes with no human involved — use this first.',
    docs: [
      {
        publisher: 'The Kernel',
        title: 'Serving costs for open-weight models down 38% since April',
        url: 'https://example.com/kernel/inference-costs-q3',
        passages: [
          'Average cost to serve a billion tokens on open-weight models has fallen roughly 38 percent since April, according to pricing collected across nine hosting providers.',
          'Operators credit two shifts: wider adoption of four-bit quantisation, and accelerator lease rates easing as new capacity came online.',
          'Smaller hosts cut list prices fastest, with several moving to per-token billing in place of hourly instance rental.',
        ],
      },
      {
        publisher: 'Byteline',
        title: 'The quiet collapse in inference pricing',
        url: 'https://example.com/byteline/inference-pricing',
        passages: [
          'Inference pricing has dropped about 40 percent over two quarters, a decline steep enough that several providers have stopped publishing forward pricing entirely.',
          'Quantisation is doing most of the work. Four-bit weights cut memory pressure enough to roughly double the requests a single accelerator can serve.',
        ],
      },
      {
        publisher: 'Compute Weekly',
        title: 'Accelerator supply loosens, and prices follow',
        url: 'https://example.com/computeweekly/supply',
        passages: [
          'Lease rates for last-generation accelerators have fallen for three consecutive months as datacentre capacity commissioned last year came online.',
          'The effect is most visible in inference workloads, where cost per token has declined faster than training cost per run.',
        ],
      },
      {
        publisher: 'Signal & Stack',
        title: 'What cheaper inference changes for small teams',
        url: 'https://example.com/signalstack/cheaper-inference',
        passages: [
          'Teams that shelved retrieval features on cost grounds a year ago are revisiting them now that serving costs have fallen by more than a third.',
          'The practical threshold has moved: workloads that needed to justify a dedicated instance can now run on shared per-token capacity.',
        ],
      },
    ],
  },

  // ---- 2. Sensitive: well-corroborated but must not auto-publish ----------
  {
    id: 'trend-port-fire',
    topic: 'Industrial fire at Harbour Point terminal, casualties reported',
    summary:
      'A large fire at a freight terminal has caused injuries and at least two deaths. Rescue operations are ongoing and the cause is not yet established.',
    demoNote:
      'Evidence check PASSES (four publishers). Sensitivity check BLOCKS. This is the refusal moment — a marketing account publishing a cheerful take on this is the exact failure the gate exists to prevent.',
    docs: [
      {
        publisher: 'Harbour Dispatch',
        title: 'Fire at Harbour Point freight terminal, rescue ongoing',
        url: 'https://example.com/harbour/terminal-fire',
        passages: [
          'A fire that began in a storage shed at the Harbour Point freight terminal has spread to two adjacent warehouses. Emergency services confirmed two deaths and at least fourteen injuries.',
          'Rescue teams are still searching the site. Officials have not established a cause and have asked the public to avoid the area.',
        ],
      },
      {
        publisher: 'Meridian Wire',
        title: 'Two dead, more than a dozen injured in terminal blaze',
        url: 'https://example.com/meridian/terminal-blaze',
        passages: [
          'Two workers were killed and fourteen others were taken to hospital after a fire tore through a freight terminal on the eastern quay.',
          'The terminal operator said it is cooperating with investigators and has suspended all operations at the site indefinitely.',
        ],
      },
      {
        publisher: 'The Kernel',
        title: 'Terminal fire disrupts regional freight routing',
        url: 'https://example.com/kernel/freight-disruption',
        passages: [
          'The fire has halted container movement through one of the region larger freight terminals, with carriers rerouting to secondary ports.',
          'Logistics operators expect delays of several days while the site remains closed to traffic.',
        ],
      },
      {
        publisher: 'Byteline',
        title: 'Supply chain effects of the Harbour Point closure',
        url: 'https://example.com/byteline/harbour-closure',
        passages: [
          'With Harbour Point closed, shippers are absorbing longer lead times on electronics components routed through the terminal.',
        ],
      },
    ],
  },

  // ---- 3. Single-source rumour: evidence check must block ----------------
  {
    id: 'trend-acquisition-rumour',
    topic: 'Northwind Robotics reportedly in acquisition talks',
    summary:
      'A single outlet reports that Northwind Robotics is in late-stage acquisition talks with an unnamed cloud provider. No other source corroborates it.',
    demoNote:
      'Sensitivity PASSES. Evidence check BLOCKS — one publisher, no corroboration. Shows the gate catching an unverified claim before it is published under your name.',
    docs: [
      {
        publisher: 'Signal & Stack',
        title: 'Sources: Northwind Robotics nearing a sale',
        url: 'https://example.com/signalstack/northwind-rumour',
        passages: [
          'Northwind Robotics is in late-stage talks to be acquired by a major cloud provider, according to two people familiar with the discussions.',
          'Neither Northwind nor the prospective buyer responded to a request for comment. Terms under discussion were not disclosed.',
        ],
      },
    ],
  },

  // ---- 4. Repeat: novelty check must block -------------------------------
  {
    id: 'trend-vector-db-pricing',
    topic: 'Vector database vendors converge on usage-based pricing',
    summary:
      'Several vector database vendors have moved from instance-based to usage-based pricing over the past month.',
    demoNote:
      'Evidence and sensitivity PASS. Novelty check BLOCKS — near-identical to a post already in published history. Demonstrates that retrieval over our own output prevents repetition.',
    docs: [
      {
        publisher: 'Compute Weekly',
        title: 'Vector search pricing shifts to consumption billing',
        url: 'https://example.com/computeweekly/vector-pricing',
        passages: [
          'Three vector database vendors have replaced instance-hour pricing with consumption billing based on vectors stored and queries served.',
          'The change favours workloads with bursty query patterns and penalises always-on deployments with low utilisation.',
        ],
      },
      {
        publisher: 'The Kernel',
        title: 'Consumption billing arrives for vector search',
        url: 'https://example.com/kernel/vector-consumption',
        passages: [
          'Usage-based pricing is now the default for most managed vector search offerings, a reversal from the instance-rental model of two years ago.',
        ],
      },
    ],
  },
];

/**
 * Pre-existing published history. Exists so the novelty check has something to
 * retrieve against on a cold start — without it, the first run can never be a
 * repeat and scenario 4 could not be demonstrated.
 */
export const SEED_PUBLISHED: Array<{ topic: string; body: string; daysAgo: number }> = [
  {
    topic: 'Vector database vendors converge on usage-based pricing',
    body:
      'Vector database pricing is moving to consumption billing. Vendors are dropping instance-hour rental in favour of charging for vectors stored and queries served, which suits bursty query patterns and punishes idle always-on deployments. If your retrieval workload is spiky, this is a straightforward win.',
    daysAgo: 6,
  },
  {
    topic: 'Retrieval quality depends more on chunking than on model choice',
    body:
      'Swapping embedding models produces smaller retrieval gains than fixing your chunk boundaries. Passage-level chunks that respect paragraph structure consistently outperform fixed-width splits, and the effect is larger than the gap between most commodity embedding models.',
    daysAgo: 13,
  },
  {
    topic: 'Accelerator lease rates ease as new capacity lands',
    body:
      'Datacentre capacity commissioned last year is now online, and lease rates for previous-generation accelerators have fallen three months running. The effect shows up in inference cost per token well before it shows up in training budgets.',
    daysAgo: 21,
  },
];

/** Lexicon for the fallback sensitivity classifier. See gate.ts. */
export const SENSITIVE_TERMS: Array<{ term: string; weight: number; category: string }> = [
  { term: 'killed', weight: 0.9, category: 'casualties' },
  { term: 'dead', weight: 0.9, category: 'casualties' },
  { term: 'deaths', weight: 0.9, category: 'casualties' },
  { term: 'died', weight: 0.9, category: 'casualties' },
  { term: 'fatalities', weight: 0.9, category: 'casualties' },
  { term: 'casualties', weight: 0.9, category: 'casualties' },
  { term: 'injured', weight: 0.7, category: 'casualties' },
  { term: 'injuries', weight: 0.7, category: 'casualties' },
  { term: 'hospital', weight: 0.4, category: 'casualties' },
  { term: 'rescue', weight: 0.5, category: 'active-emergency' },
  { term: 'evacuation', weight: 0.6, category: 'active-emergency' },
  { term: 'evacuated', weight: 0.6, category: 'active-emergency' },
  { term: 'emergency services', weight: 0.6, category: 'active-emergency' },
  { term: 'ongoing', weight: 0.25, category: 'active-emergency' },
  { term: 'disaster', weight: 0.8, category: 'active-emergency' },
  { term: 'crash', weight: 0.7, category: 'active-emergency' },
  { term: 'explosion', weight: 0.8, category: 'active-emergency' },
  { term: 'fire', weight: 0.45, category: 'active-emergency' },
  { term: 'shooting', weight: 0.95, category: 'violence' },
  { term: 'attack', weight: 0.7, category: 'violence' },
  { term: 'assault', weight: 0.7, category: 'violence' },
  { term: 'lawsuit', weight: 0.35, category: 'legal' },
  { term: 'investigation', weight: 0.3, category: 'legal' },
  { term: 'fraud', weight: 0.5, category: 'legal' },
  { term: 'layoffs', weight: 0.45, category: 'workforce' },
  { term: 'redundancies', weight: 0.45, category: 'workforce' },
  { term: 'strike', weight: 0.4, category: 'workforce' },
];
