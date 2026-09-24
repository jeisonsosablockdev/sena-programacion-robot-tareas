import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanCliches } from '../../evaluators/anti-cliche-filter.ts';
import { evaluateDeliverable, SDD_THRESHOLD } from '../../evaluators/sdd-4d-rubric.ts';

describe('Evaluator Engine & Anti-Cliché Filters (@spec SPEC-001)', () => {

  it('@spec REQ-001-F should detect banned LLM clichés and calculate penalty', () => {
    // Arrange: Text infected with common AI robotic phrases
    const roboticText = 
      'En resumen, esta solución juega un papel crucial en el vertiginoso mundo de la tecnología. ' +
      'Para concluir, cabe destacar que nos sumergimos en un cambio de paradigma sin duda alguna.';

    // Act
    const result = scanCliches(roboticText);

    // Assert
    assert.strictEqual(result.hasCliches, true, 'Must detect presence of clichés');
    assert.ok(result.detected.length >= 4, `Expected at least 4 clichés, found ${result.detected.length}`);
    assert.ok(result.totalPenalty >= 1.5, `Total penalty should be >= 1.5, got ${result.totalPenalty}`);
    assert.ok(result.cleanScore < 1.0, `Clean score must be heavily penalized, got ${result.cleanScore}`);
  });

  it('@spec REQ-001-G should award full score (2.0) to authentic, clean technical prose', () => {
    // Arrange: High-conviction, direct technical description
    const cleanText = 
      'La clase TaskStateMachine implementa una máquina de estados finitos determinista. ' +
      'El método evaluateCycle valida que la precondición spec_approved sea verdadera antes de procesar.';

    // Act
    const result = scanCliches(cleanText);

    // Assert
    assert.strictEqual(result.hasCliches, false, 'Clean text must have no clichés');
    assert.strictEqual(result.detected.length, 0, 'No phrases should be flagged');
    assert.strictEqual(result.totalPenalty, 0, 'Penalty must be 0');
    assert.strictEqual(result.cleanScore, 2.0, 'Full originality score (2.0) must be awarded');
  });

  it('@spec REQ-001-H should mark deliverable as passed when score >= 8.5/9.0', () => {
    // Arrange
    const dimensions = {
      pertinence: 2.4,        // / 2.5
      scientificRigor: 2.4,   // / 2.5
      clarityStructure: 1.9,  // / 2.0
      originalityLexicon: 1.9 // / 2.0
    };
    const penalty = 0.1; // 2.4 + 2.4 + 1.9 + 1.9 - 0.1 = 8.5

    // Act
    const report = evaluateDeliverable(dimensions, penalty, ['Excelente rigor técnico']);

    // Assert
    assert.strictEqual(report.score, 8.5, 'Final score must accurately reflect sum minus penalty');
    assert.strictEqual(report.passed, true, 'Score >= 8.5 must pass the quality gate');
    assert.strictEqual(report.threshold, SDD_THRESHOLD);
  });

  it('@spec REQ-001-H should reject deliverable when score < 8.5/9.0', () => {
    // Arrange
    const dimensions = {
      pertinence: 2.1,
      scientificRigor: 2.0,
      clarityStructure: 1.6,
      originalityLexicon: 1.5
    }; // Total: 7.2

    // Act
    const report = evaluateDeliverable(dimensions, 0, ['Requiere mayor profundidad en pruebas']);

    // Assert
    assert.strictEqual(report.score, 7.2);
    assert.strictEqual(report.passed, false, 'Score < 8.5 must be rejected');
  });

});
