/**
 * State Machine & Invariants for Academic-Engine Task Lifecycle
 * Pure domain logic: deterministic state transitions with HITL guardrails.
 * 
 * @spec SPEC-001
 */

export type TaskLifecycleState = 
  | 'initialized'
  | 'spec_review'
  | 'spec_approved'
  | 'task_loop'
  | 'deliverable_review'
  | 'completed';

export interface TaskHistoryEntry {
  cycle: number;
  score: number;
  status: 'passed' | 'rejected';
  timestamp: string;
}

export interface TaskContext {
  slug: string;
  title: string;
  state: TaskLifecycleState;
  currentCycle: number;
  maxCycles: number;
  qualityThreshold: number;
  lastScore: number;
  history: TaskHistoryEntry[];
}

export interface TransitionResult {
  success: boolean;
  context: TaskContext;
  error?: string;
}

export const QUALITY_THRESHOLD = 8.5;
export const MAX_OPTIMIZATION_CYCLES = 5;

/**
 * Creates a clean initial task context
 * @spec REQ-001-1
 */
export function createInitialContext(slug: string, title: string): TaskContext {
  return {
    slug,
    title,
    state: 'initialized',
    currentCycle: 0,
    maxCycles: MAX_OPTIMIZATION_CYCLES,
    qualityThreshold: QUALITY_THRESHOLD,
    lastScore: 0,
    history: []
  };
}

/**
 * Transitions task from initialized to spec_review
 * @spec REQ-001-1
 */
export function startSpecReview(context: TaskContext): TransitionResult {
  if (context.state !== 'initialized' && context.state !== 'spec_review') {
    return {
      success: false,
      context: { ...context },
      error: `Invalid transition: cannot start spec review from state '${context.state}'`
    };
  }

  return {
    success: true,
    context: {
      ...context,
      state: 'spec_review'
    }
  };
}

/**
 * Human approves specification (HITL-1 Guardrail)
 * Required before any task drafting or evaluation can begin.
 * @spec REQ-001-2
 */
export function approveSpec(context: TaskContext): TransitionResult {
  if (context.state !== 'spec_review') {
    return {
      success: false,
      context: { ...context },
      error: `HITL-1 Violation: cannot approve spec when task is in state '${context.state}' (must be 'spec_review')`
    };
  }

  return {
    success: true,
    context: {
      ...context,
      state: 'spec_approved'
    }
  };
}

/**
 * Evaluates draft during the task optimization loop
 * - Enforces HITL-1 (spec must be approved first)
 * - Transitions to deliverable_review if score >= threshold (8.5)
 * - Keeps task in task_loop and tracks history if score < threshold
 * - Halts with error if max optimization cycles (5) are exhausted
 * 
 * @spec REQ-001-3, REQ-001-4
 */
export function evaluateCycle(context: TaskContext, score: number): TransitionResult {
  // 1. Guardrail HITL-1 check: Must have approved spec
  if (context.state !== 'spec_approved' && context.state !== 'task_loop') {
    return {
      success: false,
      context: { ...context },
      error: `HITL-1 Guardrail Active: Draft evaluation blocked. Spec must be in 'spec_approved' state prior to drafting (current state: '${context.state}').`
    };
  }

  // 2. Cycle exhaustion check
  if (context.currentCycle >= context.maxCycles) {
    return {
      success: false,
      context: { ...context },
      error: `Cycle Limit Exceeded: Maximum optimization cycles (${context.maxCycles}) exhausted without reaching threshold (${context.qualityThreshold}). Task requires manual intervention.`
    };
  }

  const nextCycle = context.currentCycle + 1;
  const isPassed = score >= context.qualityThreshold;

  const historyEntry: TaskHistoryEntry = {
    cycle: nextCycle,
    score,
    status: isPassed ? 'passed' : 'rejected',
    timestamp: new Date().toISOString()
  };

  const updatedContext: TaskContext = {
    ...context,
    currentCycle: nextCycle,
    lastScore: score,
    state: isPassed ? 'deliverable_review' : 'task_loop',
    history: [...context.history, historyEntry]
  };

  return {
    success: true,
    context: updatedContext
  };
}

/**
 * Human approves final deliverable (HITL-2 Guardrail)
 * Required before deliverable can be marked completed and committed to vault.
 * @spec REQ-001-5, REQ-001-6
 */
export function approveDeliverable(context: TaskContext): TransitionResult {
  if (context.state !== 'deliverable_review') {
    return {
      success: false,
      context: { ...context },
      error: `HITL-2 Violation: Cannot approve deliverable when task state is '${context.state}'. Task must reach 'deliverable_review' with score >= ${context.qualityThreshold}.`
    };
  }

  return {
    success: true,
    context: {
      ...context,
      state: 'completed'
    }
  };
}
