export * from '../shared/contract';

export interface SchedulerInfo {
  cron: string;
  label: string;
  active: boolean;
  nextRunAt: string;
}

export interface SwytchcodeCall {
  service: string;
  operation: string;
  ms: number;
  ok: boolean;
  fallback: boolean;
  at: string;
}

export interface StepState {
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  summary?: string;
  ms?: number;
  logs: string[];
  calls: SwytchcodeCall[];
}

export type PipelineStepStates = Record<string, StepState>;
