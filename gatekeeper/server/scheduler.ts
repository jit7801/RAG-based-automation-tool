// ---------------------------------------------------------------------------
// Scheduler: Autonomous daily publication automation using node-cron
//
// Triggers the pipeline at a fixed time each day (default 09:00 daily).
// ---------------------------------------------------------------------------

import cron from 'node-cron';
import { isRunning, runPipeline } from './pipeline.ts';

// Read lazily — see the note in swytchcode.ts. A top-level read here would
// capture the default cron before server/env.ts has loaded .env.
const cronExpression = (): string => process.env.PUBLISH_CRON || '0 9 * * *';
const cronLabel = (): string => process.env.PUBLISH_LABEL || '09:00 daily';

let scheduledTask: cron.ScheduledTask | null = null;
let isActive = false;
/** The expression actually handed to node-cron, which may differ from env. */
let effectiveCron = '0 9 * * *';

export function startScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const configured = cronExpression();
  if (!cron.validate(configured)) {
    console.warn(`[scheduler] Invalid cron expression: "${configured}". Defaulting to "0 9 * * *"`);
  }

  effectiveCron = cron.validate(configured) ? configured : '0 9 * * *';

  scheduledTask = cron.schedule(effectiveCron, async () => {
    // If the operator is mid-demo with a manual run, skip this tick rather than
    // queue it. A cron run interleaving with a manual one on the same SSE stream
    // is worse than a missed daily post.
    if (isRunning()) {
      console.warn('[scheduler] Skipped scheduled run: a run is already in progress.');
      return;
    }

    console.log(`[scheduler] Triggering scheduled daily publish (${new Date().toISOString()})...`);
    try {
      await runPipeline({ trigger: 'cron' });
    } catch (err) {
      console.error('[scheduler] Scheduled daily publish run failed:', err);
    }
  });

  isActive = true;
  console.log(`[scheduler] Daily publisher scheduled: "${effectiveCron}" (${cronLabel()})`);
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    isActive = false;
    console.log('[scheduler] Daily publisher paused.');
  }
}

/** Compute next scheduled time estimate for daily cron (e.g. 0 9 * * *) */
export function getNextRunEstimate(): string {
  const now = new Date();
  const parts = effectiveCron.trim().split(/\s+/);

  if (parts.length >= 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
    const targetMinute = Number(parts[0]);
    const targetHour = Number(parts[1]);

    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);

    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString();
  }

  // Fallback: 24 hours from now
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export function getSchedulerInfo() {
  return {
    // Report the expression in force, not the one requested — if env held an
    // invalid expression the UI must not claim it is scheduled.
    cron: effectiveCron,
    label: cronLabel(),
    active: isActive,
    nextRunAt: getNextRunEstimate(),
  };
}
