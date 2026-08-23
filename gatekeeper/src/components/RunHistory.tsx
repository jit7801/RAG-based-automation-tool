import React from 'react';
import type { RunRecord } from '../types';

interface RunHistoryProps {
  history: RunRecord[];
}

export const RunHistory: React.FC<RunHistoryProps> = ({ history }) => {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <span className="label">Audit Log</span>
          <h2 className="font-serif text-lg font-bold text-ink">
            Publishing Run History
          </h2>
        </div>
        <span className="font-mono text-2xs text-ink-faint">
          {history.length} Total Runs
        </span>
      </div>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="p-8 text-center text-ink-faint text-xs italic rounded border border-dashed border-rule">
            No pipeline runs recorded yet.
          </div>
        ) : (
          history.map((run) => {
            const isPub = run.outcome === 'published';
            const isEsc = run.outcome === 'escalated';

            return (
              <div
                key={run.runId}
                className="rounded-lg border border-rule bg-raised p-3 text-xs space-y-1.5 shadow-2xs hover:border-ink-faint/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs font-bold text-ink">
                      {run.trigger === 'cron' ? '⏰ Daily Cron' : '⚡ Manual'}
                    </span>
                    <span className="font-mono text-2xs text-ink-faint">
                      {new Date(run.startedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {run.degraded && (
                      <span className="chip-warn text-2xs py-0.5 px-1.5">
                        Fallback
                      </span>
                    )}
                    <span
                      className={`chip text-2xs py-0.5 px-2 ${
                        isPub
                          ? 'chip-pass'
                          : isEsc
                            ? 'chip-block'
                            : 'chip-idle'
                      }`}
                    >
                      {run.outcome || 'running'}
                    </span>
                  </div>
                </div>

                <div className="font-serif font-medium text-ink line-clamp-1">
                  {run.topic || 'Discovering trend...'}
                </div>

                {run.gate && (
                  <p className="text-2xs text-ink-soft line-clamp-1 italic">
                    Gate: {run.gate.reason}
                  </p>
                )}

                {run.humanDecision && (
                  <div className="text-2xs font-mono text-ink-soft">
                    Reviewer:{' '}
                    <span className="uppercase font-bold">
                      {run.humanDecision}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
