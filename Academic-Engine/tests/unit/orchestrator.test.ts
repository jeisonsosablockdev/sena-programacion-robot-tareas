import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TaskOrchestrator } from '../../core/orchestrator.ts';
import { VaultGateway } from '../../core/vault-gateway.ts';

const SCRIPT_DIR = import.meta.dirname ?? path.resolve();
const FIXTURES_DIR = path.join(SCRIPT_DIR, 'fixtures', 'orch-test');

describe('TaskOrchestrator End-to-End Coordination (@spec SPEC-001)', () => {
  let orchestrator: TaskOrchestrator;
  let vault: VaultGateway;

  before(() => {
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Inbox', 'Specs'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Inbox', 'Archive'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Drafts'), { recursive: true });

    vault = new VaultGateway(FIXTURES_DIR);
    orchestrator = new TaskOrchestrator(vault);
  });

  after(() => {
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it('@spec REQ-001-LOOP should execute full lifecycle with dual HITL guardrails', () => {
    const slug = 'test-e2e-evidence';
    const title = 'Patrones de Diseño en TypeScript';

    // 1. Init Spec
    const initialCtx = orchestrator.initSpec(
      slug,
      title,
      'Drafts',
      ['cs-tutor', 'code-reviewer'],
      'Aprendices SENA ADSO',
      'Dominar patrón Factory y Singleton'
    );
    assert.strictEqual(initialCtx.state, 'spec_review', '1. Spec must be initialized in spec_review');
    assert.strictEqual(vault.specExists(slug), true, 'Spec file must exist on disk');

    // 2. HITL-1 Enforcement: Premature evaluation must fail
    const prematureDraft = 'Borrador prematuro sin aprobación de spec.';
    const prematureEval = orchestrator.evaluateDraft(slug, prematureDraft, {
      pertinence: 2.5,
      scientificRigor: 2.5,
      clarityStructure: 2.0,
      originalityLexicon: 2.0
    });
    assert.strictEqual(prematureEval.transition.success, false, '2. Must block evaluation before HITL-1');
    assert.match(prematureEval.transition.error || '', /spec_approved/i);

    // 3. HITL-1 Approval: Human approves specification
    const specApprovedResult = orchestrator.approveSpec(slug);
    assert.strictEqual(specApprovedResult.success, true, '3. Human spec approval must succeed');
    assert.strictEqual(specApprovedResult.context.state, 'spec_approved');

    // 4. Task Loop Cycle 1: Reviewer scores 7.0 (< 8.5) -> Rejected for rework
    const draftCycle1 = 'Borrador con explicaciones básicas pero sin diagramas.';
    const cycle1Result = orchestrator.evaluateDraft(slug, draftCycle1, {
      pertinence: 2.0,
      scientificRigor: 2.0,
      clarityStructure: 1.5,
      originalityLexicon: 1.5
    });
    assert.strictEqual(cycle1Result.transition.success, true);
    assert.strictEqual(cycle1Result.report.passed, false, 'Score 7.0 must be rejected');
    assert.strictEqual(cycle1Result.transition.context.state, 'task_loop', 'Task remains in loop');
    assert.strictEqual(cycle1Result.transition.context.currentCycle, 1);

    // 5. Task Loop Cycle 2: Editor refines, Reviewer scores 8.8 (>= 8.5) -> Converges!
    const draftCycle2 = 
      '# Patrones de Diseño en TypeScript\n\n' +
      'Implementación del patrón Factory con tipado genérico estricto y cero clichés.';
    const cycle2Result = orchestrator.evaluateDraft(slug, draftCycle2, {
      pertinence: 2.5,
      scientificRigor: 2.4,
      clarityStructure: 1.9,
      originalityLexicon: 2.0
    });
    assert.strictEqual(cycle2Result.report.passed, true, 'Score 8.8 meets threshold >= 8.5');
    assert.strictEqual(cycle2Result.transition.context.state, 'deliverable_review', 'Ready for HITL-2 human review');

    // 6. HITL-2 Approval: Human approves deliverable -> Committed to Drafts/
    const deliverableApproval = orchestrator.approveDeliverable(slug);
    assert.strictEqual(deliverableApproval.success, true, '6. HITL-2 approval must succeed');
    assert.ok(deliverableApproval.deliverablePath, 'Deliverable path must be provided');
    assert.strictEqual(fs.existsSync(deliverableApproval.deliverablePath!), true, 'Committed file must exist in Drafts');

    // Final state check on disk
    const finalSpec = vault.loadSpec(slug);
    assert.strictEqual(finalSpec.data.status, 'completed', 'Final spec status on disk must be completed');
  });

});
