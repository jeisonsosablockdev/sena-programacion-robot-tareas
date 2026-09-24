import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';

const SCRIPT_DIR = import.meta.dirname ?? path.resolve();
const ROOT_DIR = path.resolve(SCRIPT_DIR, '../../..');
const CLI_PATH = path.join(ROOT_DIR, 'Academic-Engine', 'bin', 'engine.ts');

describe('Unified CLI Runner (@spec SPEC-005)', () => {

  it('@spec REQ-005-1 should print help and command overview', () => {
    // Act
    const output = execSync(`node --experimental-strip-types "${CLI_PATH}" help`, {
      encoding: 'utf8'
    });

    // Assert
    assert.match(output, /ACADEMIC-ENGINE CLI RUNNER/i, 'Help output must display banner');
    assert.match(output, /task init/i, 'Must document task init command');
    assert.match(output, /task approve-spec/i, 'Must document HITL-1 approve-spec command');
    assert.match(output, /task evaluate/i, 'Must document task evaluate command');
    assert.match(output, /task approve-deliverable/i, 'Must document HITL-2 approve-deliverable command');
  });

  it('@spec REQ-005-2 should list specs cleanly without errors', () => {
    // Act
    const output = execSync(`node --experimental-strip-types "${CLI_PATH}" task list`, {
      encoding: 'utf8'
    });

    // Assert
    assert.match(output, /Especificaciones Activas en Academic Vault/i);
  });

});
