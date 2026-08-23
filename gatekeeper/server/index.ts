// ---------------------------------------------------------------------------
// Gatekeeper API Server & Orchestrator Host
//
// Hosts the HTTP surface, SSE real-time event pipeline, daily cron scheduler,
// and in-memory knowledge store initialization.
// ---------------------------------------------------------------------------

// FIRST IMPORT, DELIBERATELY. ESM evaluates imports in declaration order, so
// this puts .env into process.env before any module below can read credentials.
import { envResult } from './env.ts';

import cors from 'cors';
import express from 'express';
// Type-only import, deliberately separated. `import express, { Request } from
// 'express'` asks Node for a runtime named export that a CommonJS module cannot
// provide, and the server dies at boot with "Named export 'Request' not found".
// `import type` is erased before Node ever sees it.
import type { Request, Response } from 'express';
import { emit, getReplay, now, subscribe } from './bus.ts';
import { embedLocal } from './embed.ts';
import { thresholdsFromEnv } from './gate.ts';
import { isRunning, runPipeline, seedHistory } from './pipeline.ts';
import { getSchedulerInfo, startScheduler } from './scheduler.ts';
import { SEED_TRENDS } from './seed.ts';
import {
  addPublished,
  allDocs,
  allPassages,
  allPublished,
  allRuns,
  getRun,
  updateRun,
} from './store.ts';
import {
  channelFeed,
  embed,
  embedBackend,
  isLive,
  publishPost,
  recordDecision,
  serviceStatus,
} from './swytchcode.ts';
import type { AppConfig, HumanDecision, TrendOption } from '../shared/contract.ts';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Startup: Seed back-catalogue into store & vector index for novelty detection
//
// Delegated to pipeline.seedHistory() so it routes through the same embed()
// chokepoint as everything else. Embedding the history separately here would
// duplicate the fallback logic that execute() already owns, and the two copies
// would drift.
// ---------------------------------------------------------------------------
async function initCorpus() {
  console.log('[server] Initializing historical published corpus into vector store...');
  const count = await seedHistory();
  console.log(`[server] Seeded ${count} historical posts into novelty back-catalogue.`);
}

// ---------------------------------------------------------------------------
// 1. SSE Real-Time Event Stream
// ---------------------------------------------------------------------------
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send historical replay for current run so client hydrates instantly
  const replayEvents = getReplay();
  for (const event of replayEvents) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // Subscribe to live events
  const unsubscribe = subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Heartbeat ping every 15s to keep connection alive through proxies
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    unsubscribe();
    res.end();
  });
});

// ---------------------------------------------------------------------------
// 2. Trigger Pipeline Run
//
// Returns as soon as the run is accepted rather than waiting for it to finish.
// The UI is a pure function of the SSE event stream, so it does not need the
// final record in this response — and a live run takes long enough that holding
// the request open would look like a hang at exactly the wrong moment.
// ---------------------------------------------------------------------------
app.post('/api/run', (req: Request, res: Response) => {
  if (isRunning()) {
    return res.status(409).json({
      error: 'A run is already in progress. Watch the event stream for it to finish.',
    });
  }

  const { trendId, query } = req.body || {};

  // Fire and forget: failures are reported as step:failed / run:end events on
  // the stream, which is where the UI is already looking.
  runPipeline({ trigger: 'manual', trendId, query }).catch((err) => {
    console.error('[server] pipeline run failed:', err);
  });

  res.status(202).json({ ok: true, accepted: true });
});

// ---------------------------------------------------------------------------
// 3. Human Escalation Review Decision (Approve / Reject)
// ---------------------------------------------------------------------------
app.post('/api/runs/:runId/decide', async (req: Request, res: Response) => {
  const { runId } = req.params;
  const { decision } = req.body as { decision: HumanDecision };

  if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
    return res.status(400).json({ error: 'Valid decision ("approved" | "rejected") is required.' });
  }

  const run = getRun(runId);
  if (!run) {
    return res.status(404).json({ error: `Run with id ${runId} not found.` });
  }

  if (run.outcome !== 'escalated') {
    return res.status(400).json({ error: `Run is in outcome "${run.outcome}", not "escalated".` });
  }

  const ctx = { runId };

  if (decision === 'approved') {
    if (run.draft) {
      // Publish to channel
      await publishPost(ctx, run.draft.body);

      // Add to vector store for novelty checks
      const [vector] = await embed(ctx, [run.draft.body]);
      addPublished({
        id: `pub-${Date.now()}`,
        topic: run.draft.topic,
        body: run.draft.body,
        vector: vector ?? embedLocal(run.draft.body),
        publishedAt: now(),
        approvedBy: 'human',
      });
    }

    recordDecision(runId, `Human Reviewer APPROVED escalated post on "${run.topic}". Published to #content.`);
    updateRun(runId, { outcome: 'published', humanDecision: 'approved' });
  } else {
    recordDecision(runId, `Human Reviewer REJECTED escalated post on "${run.topic}". Post discarded.`);
    // Outcome stays 'escalated'. A reviewer rejecting a draft is the system
    // working as designed, not a failure — 'failed' is reserved for the pipeline
    // erroring out, and conflating the two would misreport the gate's hit rate
    // in the history view.
    updateRun(runId, { humanDecision: 'rejected' });
  }

  emit({
    type: 'decision',
    runId,
    decision,
    at: now(),
  });

  const updated = getRun(runId);
  res.json({ ok: true, run: updated });
});

// ---------------------------------------------------------------------------
// 4. Run History
// ---------------------------------------------------------------------------
app.get('/api/history', (_req: Request, res: Response) => {
  res.json(allRuns());
});

// ---------------------------------------------------------------------------
// 5. Config & System Status
// ---------------------------------------------------------------------------
app.get('/api/config', (_req: Request, res: Response) => {
  const scheduler = getSchedulerInfo();
  // Thresholds must be reported for the embedding space actually in use.
  // Reporting the learned-embedding novelty threshold while running on the
  // local fallback would put a number on screen that the gate is not using.
  const backend = embedBackend('config');
  const config: AppConfig & {
    nextRunAt: string;
    schedulerActive: boolean;
    embedBackend: string;
    envFileLoaded: boolean;
  } = {
    scheduleCron: scheduler.cron,
    scheduleLabel: scheduler.label,
    thresholds: thresholdsFromEnv(backend),
    services: serviceStatus(),
    fallbackMode: !isLive(),
    nextRunAt: scheduler.nextRunAt,
    schedulerActive: scheduler.active,
    embedBackend: backend,
    envFileLoaded: envResult.loaded,
  };
  res.json(config);
});

// ---------------------------------------------------------------------------
// 6. Available Scenarios & Trends
// ---------------------------------------------------------------------------
app.get('/api/trends', (_req: Request, res: Response) => {
  const options: TrendOption[] = SEED_TRENDS.map((t) => ({
    id: t.id,
    topic: t.topic,
    publishers: new Set(t.docs.map((d) => d.publisher)).size,
    demoNote: t.demoNote,
  }));
  res.json(options);
});

// ---------------------------------------------------------------------------
// 7. Channel Feed (Both /api/channel and /api/feed supported)
// ---------------------------------------------------------------------------
app.get('/api/channel', (_req: Request, res: Response) => {
  res.json(channelFeed());
});

app.get('/api/feed', (_req: Request, res: Response) => {
  res.json(channelFeed());
});

// ---------------------------------------------------------------------------
// 8. Knowledge Store Stats
// ---------------------------------------------------------------------------
app.get('/api/store/stats', (_req: Request, res: Response) => {
  res.json({
    docsCount: allDocs().length,
    passagesCount: allPassages().length,
    publishedCount: allPublished().length,
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
async function start() {
  await initCorpus();
  startScheduler();

  app.listen(PORT, () => {
    console.log(`[gatekeeper] Orchestrator running on http://localhost:${PORT}`);
    // State the mode plainly at boot. Someone evaluating the repo should never
    // have to guess whether what they are looking at came off the network.
    if (isLive()) {
      console.log('[gatekeeper] Swytchcode credentials present — attempting live execution.');
    } else {
      console.log(
        `[gatekeeper] No Swytchcode credentials${envResult.loaded ? ' in .env' : ' (.env not found)'}.`,
      );
      console.log(
        '[gatekeeper] Running on the seeded corpus with local fallbacks. Every run will be labelled DEGRADED.',
      );
    }
  });
}

start().catch((err) => {
  console.error('[gatekeeper] Server startup error:', err);
});
