/**
 * SDD Task Orchestrator: High-Level Application Coordinator
 * Integrates TaskStateMachine, VaultGateway, and SDD 4D Evaluators.
 * 
 * @spec SPEC-001
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  createInitialContext,
  startSpecReview,
  approveSpec as smApproveSpec,
  evaluateCycle as smEvaluateCycle,
  approveDeliverable as smApproveDeliverable,
  QUALITY_THRESHOLD,
  MAX_OPTIMIZATION_CYCLES
} from './state-machine.ts';
import type { TaskContext, TransitionResult } from './state-machine.ts';
import { VaultGateway } from './vault-gateway.ts';
import type { TaskSpecData } from './vault-gateway.ts';
import { evaluateDeliverable } from '../evaluators/sdd-4d-rubric.ts';
import type { RubricDimensions, EvaluationReport } from '../evaluators/sdd-4d-rubric.ts';
import { scanCliches } from '../evaluators/anti-cliche-filter.ts';

export class TaskOrchestrator {
  private vault: VaultGateway;

  constructor(vault?: VaultGateway) {
    this.vault = vault || new VaultGateway();
  }

  getVault(): VaultGateway {
    return this.vault;
  }

  private buildContextFromSpec(data: TaskSpecData): TaskContext {
    return {
      slug: data.slug,
      title: data.title,
      state: (data.status as any) || 'initialized',
      currentCycle: data.iteration || 0,
      maxCycles: MAX_OPTIMIZATION_CYCLES,
      qualityThreshold: QUALITY_THRESHOLD,
      lastScore: 0,
      history: []
    };
  }

  /**
   * Initializes a new deliverable spec in state 'spec_review'
   * @spec REQ-001-1
   */
  initSpec(
    slug: string,
    title: string,
    targetFolder: string = 'Drafts',
    subagents: string[] = ['cs-tutor', 'code-reviewer'],
    icp: string = 'General Audience',
    goal: string = ''
  ): TaskContext {
    const cleanSlug = this.vault.sanitizeSlug(slug);
    const initialCtx = createInitialContext(cleanSlug, title);
    const reviewResult = startSpecReview(initialCtx);

    const specData: TaskSpecData = {
      slug: cleanSlug,
      title,
      target_folder: targetFolder,
      subagents,
      icp,
      goal,
      status: reviewResult.context.state,
      iteration: 0,
      evaluations: []
    };

    const specMarkdown = 
      `# Spec: ${title}\n\n` +
      `- **Slug:** ${cleanSlug}\n` +
      `- **Objetivo:** ${goal}\n` +
      `- **Público Objetivo (ICP):** ${icp}\n` +
      `- **Subagentes Asignados:** ${subagents.join(', ')}\n` +
      `- **Estado:** ${reviewResult.context.state}\n\n` +
      `## Criterios de Aceptación\n` +
      `1. Cobertura completa de requisitos solicitados.\n` +
      `2. Rigor técnico y cumplimiento de estándares CS.\n` +
      `3. Cero clichés de LLM y estilo directo.\n`;

    this.vault.saveSpec(cleanSlug, specData, specMarkdown);
    return reviewResult.context;
  }

  /**
   * Human approves specification (HITL-1 Guardrail)
   * @spec REQ-001-2
   */
  approveSpec(slug: string): TransitionResult {
    const loaded = this.vault.loadSpec(slug);
    const ctx = this.buildContextFromSpec(loaded.data);
    const res = smApproveSpec(ctx);

    if (!res.success) {
      return res;
    }

    // Persist updated state
    loaded.data.status = res.context.state;
    this.vault.saveSpec(slug, loaded.data);

    // Save snapshot of approved spec in work directory
    const paths = loaded.paths;
    if (!fs.existsSync(paths.workDir)) {
      fs.mkdirSync(paths.workDir, { recursive: true });
    }
    const currentMd = fs.existsSync(paths.specMdPath)
      ? fs.readFileSync(paths.specMdPath, 'utf8')
      : '';
    fs.writeFileSync(paths.approvedSpecPath, currentMd, 'utf8');

    return res;
  }

  /**
   * Evaluates draft in the autonomous optimization loop
   * @spec REQ-001-3, REQ-001-4
   */
  evaluateDraft(
    slug: string,
    draftContent: string,
    dimensions: RubricDimensions,
    observations: string[] = []
  ): { transition: TransitionResult; report: EvaluationReport } {
    const loaded = this.vault.loadSpec(slug);
    const ctx = this.buildContextFromSpec(loaded.data);

    // 1. Scan for AI clichés
    const clicheScan = scanCliches(draftContent);

    // 2. Score via 4D rubric
    const report = evaluateDeliverable(dimensions, clicheScan.totalPenalty, observations);

    // 3. Attempt state machine transition
    const transition = smEvaluateCycle(ctx, report.score);

    if (transition.success) {
      // Update spec data
      loaded.data.status = transition.context.state;
      loaded.data.iteration = transition.context.currentCycle;
      loaded.data.evaluations = loaded.data.evaluations || [];
      loaded.data.evaluations.push(report);

      // Save draft iteration in workDir
      const paths = loaded.paths;
      if (!fs.existsSync(paths.workDir)) {
        fs.mkdirSync(paths.workDir, { recursive: true });
      }
      const cycleDraftPath = path.join(paths.workDir, `draft_cycle_${transition.context.currentCycle}.md`);
      fs.writeFileSync(cycleDraftPath, draftContent, 'utf8');

      // If passed (score >= 8.5), mark as approved draft ready for HITL-2
      if (report.passed) {
        fs.writeFileSync(paths.approvedDraftPath, draftContent, 'utf8');
      }

      this.vault.saveSpec(slug, loaded.data);
    }

    return { transition, report };
  }

  /**
   * Human approves deliverable (HITL-2 Guardrail) and commits to vault
   * @spec REQ-001-5
   */
  approveDeliverable(slug: string): { success: boolean; deliverablePath?: string; error?: string } {
    const loaded = this.vault.loadSpec(slug);
    const ctx = this.buildContextFromSpec(loaded.data);
    const res = smApproveDeliverable(ctx);

    if (!res.success) {
      return { success: false, error: res.error };
    }

    const paths = loaded.paths;
    if (!fs.existsSync(paths.approvedDraftPath)) {
      return {
        success: false,
        error: `No approved draft found in ${paths.approvedDraftPath}. Draft must achieve score >= ${QUALITY_THRESHOLD} first.`
      };
    }

    const approvedText = fs.readFileSync(paths.approvedDraftPath, 'utf8');
    const targetFolder = loaded.data.target_folder || 'Drafts';
    const finalDeliverablePath = this.vault.commitDeliverable(slug, approvedText, targetFolder);

    // Update spec status to completed
    loaded.data.status = res.context.state;
    this.vault.saveSpec(slug, loaded.data);

    return {
      success: true,
      deliverablePath: finalDeliverablePath
    };
  }
}
