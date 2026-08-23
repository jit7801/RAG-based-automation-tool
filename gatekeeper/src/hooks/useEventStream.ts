import { useEffect, useRef, useState } from 'react';
import type {
  Draft,
  GateResult,
  HumanDecision,
  Passage,
  PipelineStepStates,
  RunEvent,
  RunOutcome,
  StepId,
  SwytchcodeCall,
  Trend,
} from '../types';

const INITIAL_STEPS: PipelineStepStates = {
  discover: { status: 'pending', logs: [], calls: [] },
  ingest:   { status: 'pending', logs: [], calls: [] },
  retrieve: { status: 'pending', logs: [], calls: [] },
  draft:    { status: 'pending', logs: [], calls: [] },
  gate:     { status: 'pending', logs: [], calls: [] },
  act:      { status: 'pending', logs: [], calls: [] },
};

export function useEventStream(onRunFinished?: () => void) {
  const [connected, setConnected] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStepStates>(INITIAL_STEPS);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [gate, setGate] = useState<GateResult | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [humanDecision, setHumanDecision] = useState<HumanDecision | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [allCalls, setAllCalls] = useState<SwytchcodeCall[]>([]);

  const currentStepRef = useRef<StepId | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/stream');

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
    };

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as RunEvent;
        handleEvent(event);
      } catch (err) {
        // Ignore ping or malformed event
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const resetRunState = (runId: string) => {
    setCurrentRunId(runId);
    setSteps({
      discover: { status: 'pending', logs: [], calls: [] },
      ingest:   { status: 'pending', logs: [], calls: [] },
      retrieve: { status: 'pending', logs: [], calls: [] },
      draft:    { status: 'pending', logs: [], calls: [] },
      gate:     { status: 'pending', logs: [], calls: [] },
      act:      { status: 'pending', logs: [], calls: [] },
    });
    setSelectedTrend(null);
    setPassages([]);
    setDraft(null);
    setGate(null);
    setOutcome(null);
    setHumanDecision(null);
    setIsDegraded(false);
    setIsRunning(true);
    setAllCalls([]);
    currentStepRef.current = null;
  };

  const handleEvent = (event: RunEvent) => {
    switch (event.type) {
      case 'run:start':
        resetRunState(event.runId);
        break;

      case 'step:start':
        currentStepRef.current = event.step;
        setSteps((prev) => ({
          ...prev,
          [event.step]: {
            ...(prev[event.step] || { logs: [], calls: [] }),
            status: 'running',
          },
        }));
        break;

      case 'step:log':
        setSteps((prev) => {
          const s = prev[event.step] || { status: 'running', logs: [], calls: [] };
          return {
            ...prev,
            [event.step]: {
              ...s,
              logs: [...s.logs, event.message],
            },
          };
        });
        break;

      case 'step:done':
        setSteps((prev) => ({
          ...prev,
          [event.step]: {
            ...(prev[event.step] || { logs: [], calls: [] }),
            status: 'done',
            summary: event.summary,
            ms: event.ms,
          },
        }));
        break;

      case 'step:failed':
        setSteps((prev) => ({
          ...prev,
          [event.step]: {
            ...(prev[event.step] || { logs: [], calls: [] }),
            status: 'failed',
            summary: event.error,
          },
        }));
        break;

      case 'trend:selected':
        setSelectedTrend(event.trend);
        break;

      case 'passages':
        setPassages(event.passages);
        break;

      case 'draft':
        setDraft(event.draft);
        break;

      case 'gate':
        setGate(event.gate);
        break;

      case 'decision':
        setHumanDecision(event.decision);
        if (event.decision === 'approved') {
          setOutcome('published');
        } else {
          setOutcome('failed');
        }
        break;

      case 'swytchcode:call': {
        const callObj: SwytchcodeCall = {
          service: event.service,
          operation: event.operation,
          ms: event.ms,
          ok: event.ok,
          fallback: event.fallback,
          at: event.at,
        };
        setAllCalls((prev) => [callObj, ...prev]);

        const curStep = currentStepRef.current;
        if (curStep) {
          setSteps((prev) => {
            const s = prev[curStep];
            return {
              ...prev,
              [curStep]: {
                ...s,
                calls: [...(s?.calls || []), callObj],
              },
            };
          });
        }
        break;
      }

      case 'run:end':
        setIsRunning(false);
        setOutcome(event.outcome);
        setIsDegraded(event.degraded);
        onRunFinished?.();
        break;
    }
  };

  return {
    connected,
    currentRunId,
    steps,
    selectedTrend,
    passages,
    draft,
    gate,
    outcome,
    humanDecision,
    isDegraded,
    isRunning,
    allCalls,
  };
}
