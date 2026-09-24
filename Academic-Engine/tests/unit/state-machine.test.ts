import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialContext,
  startSpecReview,
  approveSpec,
  evaluateCycle,
  approveDeliverable,
  QUALITY_THRESHOLD,
  MAX_OPTIMIZATION_CYCLES
} from '../../core/state-machine.ts';

describe('TaskStateMachine Core Invariants (@spec SPEC-001)', () => {

  it('@spec REQ-001-1 should initialize in spec_review after starting review', () => {
    // Arrange
    const context = createInitialContext('evidence-sql-sena', 'Modelado Relacional y DDL');

    // Act
    const result = startSpecReview(context);

    // Assert
    assert.strictEqual(result.success, true, 'Transition to spec_review should succeed');
    assert.strictEqual(result.context.state, 'spec_review', 'State must be spec_review');
    assert.strictEqual(result.context.currentCycle, 0, 'Initial cycle count must be 0');
  });

  it('@spec REQ-001-2 should block draft evaluation if spec is NOT approved (HITL-1 Guardrail)', () => {
    // Arrange: Task is still in spec_review (human has not approved)
    const initial = createInitialContext('evidence-uml', 'Diagramas de Secuencia');
    const reviewContext = startSpecReview(initial).context;

    // Act: Attempt to prematurely evaluate draft
    const prematureResult = evaluateCycle(reviewContext, 9.0);

    // Assert: Must be strictly blocked by HITL-1
    assert.strictEqual(prematureResult.success, false, 'Premature evaluation must fail');
    assert.match(prematureResult.error || '', /spec_approved/i, 'Error must indicate missing spec approval');
    assert.notStrictEqual(prematureResult.context.state, 'deliverable_review', 'State must not advance to deliverable_review');
  });

  it('@spec REQ-001-2 should allow starting task loop only after human spec approval', () => {
    // Arrange
    const initial = createInitialContext('evidence-api', 'API REST FastAPI');
    const inReview = startSpecReview(initial).context;

    // Act: Human approves spec
    const approvalResult = approveSpec(inReview);

    // Assert
    assert.strictEqual(approvalResult.success, true, 'Human approval must succeed');
    assert.strictEqual(approvalResult.context.state, 'spec_approved', 'State must transition to spec_approved');
  });

  it('@spec REQ-001-3 should advance to deliverable_review when reviewer score meets threshold (>= 8.5)', () => {
    // Arrange: Task has approved spec
    const initial = createInitialContext('evidence-poo', 'Clases y Polimorfismo');
    const inReview = startSpecReview(initial).context;
    const approved = approveSpec(inReview).context;

    // Act: Reviewer issues score of 8.5 (exact boundary)
    const result = evaluateCycle(approved, 8.5);

    // Assert
    assert.strictEqual(result.success, true, 'Evaluation with score >= 8.5 must succeed');
    assert.strictEqual(result.context.state, 'deliverable_review', 'State must advance to deliverable_review (HITL-2 ready)');
    assert.strictEqual(result.context.lastScore, 8.5, 'Context must record last score');
    assert.strictEqual(result.context.currentCycle, 1, 'Current cycle must be incremented to 1');
  });

  it('@spec REQ-001-4 should keep task in loop and increment cycle when score < 8.5', () => {
    // Arrange
    const initial = createInitialContext('evidence-testing', 'Pruebas Unitarias');
    const approved = approveSpec(startSpecReview(initial).context).context;

    // Act: First cycle score is 7.2 (< 8.5)
    const cycle1 = evaluateCycle(approved, 7.2);

    // Assert
    assert.strictEqual(cycle1.success, true, 'Cycle execution succeeds, but registers rejection for rework');
    assert.strictEqual(cycle1.context.state, 'task_loop', 'Task must remain in task_loop for remediation');
    assert.strictEqual(cycle1.context.currentCycle, 1, 'Cycle count must be 1');
    assert.strictEqual(cycle1.context.history.length, 1, 'History must record first cycle');
    assert.strictEqual(cycle1.context.history[0].score, 7.2, 'History must record score 7.2');
  });

  it('@spec REQ-001-4 should halt loop if maximum optimization cycles (5) are exhausted without reaching 8.5', () => {
    // Arrange
    const initial = createInitialContext('evidence-deadlock', 'Complejidad Ciclomática');
    let ctx = approveSpec(startSpecReview(initial).context).context;

    // Act: Exhaust 5 cycles with scores below threshold
    for (let i = 1; i <= MAX_OPTIMIZATION_CYCLES; i++) {
      ctx = evaluateCycle(ctx, 8.0).context;
    }

    // Attempt 6th cycle
    const overflowResult = evaluateCycle(ctx, 8.0);

    // Assert
    assert.strictEqual(overflowResult.success, false, 'Cycle beyond maxCycles must fail');
    assert.match(overflowResult.error || '', /maximum.*cycles|exhausted/i, 'Error must indicate cycle limit reached');
  });

  it('@spec REQ-001-5 should complete task when human approves deliverable (HITL-2 Guardrail)', () => {
    // Arrange: Task reached deliverable_review
    const initial = createInitialContext('evidence-final', 'Sistema de Gestión');
    const approved = approveSpec(startSpecReview(initial).context).context;
    const readyForReview = evaluateCycle(approved, 9.0).context;

    // Act: Human approves deliverable
    const finalResult = approveDeliverable(readyForReview);

    // Assert
    assert.strictEqual(finalResult.success, true, 'HITL-2 approval must succeed');
    assert.strictEqual(finalResult.context.state, 'completed', 'Final state must be completed');
  });

  it('@spec REQ-001-6 should reject deliverable approval if state is NOT deliverable_review', () => {
    // Arrange: Task is still in task_loop
    const initial = createInitialContext('evidence-premature-pub', 'App Móvil');
    const inLoop = approveSpec(startSpecReview(initial).context).context;

    // Act: Premature deliverable approval
    const result = approveDeliverable(inLoop);

    // Assert
    assert.strictEqual(result.success, false, 'Cannot approve deliverable prematurely');
    assert.match(result.error || '', /deliverable_review/i, 'Error must indicate requirement of deliverable_review state');
  });

});
