import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { VaultGateway } from '../../core/vault-gateway.ts';
import type { TaskSpecData } from '../../core/vault-gateway.ts';

const SCRIPT_DIR = import.meta.dirname ?? path.resolve();
const FIXTURES_DIR = path.join(SCRIPT_DIR, 'fixtures', 'vault-test');

describe('VaultGateway Academic Vault Abstraction (@spec SPEC-001)', () => {
  let gateway: VaultGateway;

  before(() => {
    // Setup isolated test vault fixture
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Inbox', 'Specs'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Inbox', 'Archive'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'Drafts'), { recursive: true });

    gateway = new VaultGateway(FIXTURES_DIR);
  });

  after(() => {
    // Cleanup fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it('@spec REQ-001-A should generate deterministic spec paths from slug', () => {
    // Arrange
    const rawSlug = '  Evidencia-BD-MySQL #1  ';

    // Act
    const paths = gateway.getSpecPaths(rawSlug);

    // Assert
    assert.strictEqual(paths.slug, 'evidencia-bd-mysql-1', 'Slug must be lowercased and sanitized');
    assert.strictEqual(paths.specId, 'SPEC-EVIDENCIA-BD-MYSQL-1');
    assert.ok(paths.specJsonPath.endsWith('evidencia-bd-mysql-1.spec.json'));
    assert.ok(paths.specMdPath.endsWith('evidencia-bd-mysql-1.spec.md'));
  });

  it('@spec REQ-001-B should save and reload spec data and markdown cleanly', () => {
    // Arrange
    const testSlug = 'test-sql-ddl';
    const specData: TaskSpecData = {
      slug: testSlug,
      title: 'Creación de Base de Datos y Tablas',
      target_folder: 'Drafts',
      subagents: ['cs-tutor', 'code-reviewer'],
      icp: 'Aprendices SENA',
      goal: 'Aprender sintaxis SQL DDL',
      status: 'spec_review',
      iteration: 1
    };
    const markdownContent = '# Spec: Creación de Base de Datos\n\nContenido de especificación.';

    // Act
    gateway.saveSpec(testSlug, specData, markdownContent);
    const exists = gateway.specExists(testSlug);
    const loaded = gateway.loadSpec(testSlug);

    // Assert
    assert.strictEqual(exists, true, 'Spec must exist after saving');
    assert.strictEqual(loaded.data.title, specData.title, 'Loaded title must match saved title');
    assert.strictEqual(loaded.data.status, 'spec_review', 'Status must match saved status');
    
    // Markdown check
    const mdContentOnDisk = fs.readFileSync(loaded.paths.specMdPath, 'utf8');
    assert.strictEqual(mdContentOnDisk, markdownContent, 'Markdown on disk must match saved content');
  });

  it('@spec REQ-001-C should create safety backup before modifying existing document (Non-Destructive)', () => {
    // Arrange: Create an existing document
    const docPath = path.join(FIXTURES_DIR, 'Drafts', 'existing-guide.md');
    fs.writeFileSync(docPath, '# Versión Original v1.0\nContenido valioso a preservar.', 'utf8');

    // Act: Request safety backup before modification
    const backupPath = gateway.createSafetyBackup(docPath);

    // Assert
    assert.ok(backupPath, 'Safety backup path must be returned');
    assert.strictEqual(fs.existsSync(backupPath!), true, 'Backup file must exist on disk');
    assert.ok(backupPath!.includes('Inbox/Archive') || backupPath!.includes('Archive'), 'Backup must live in Archive directory');

    const backupContent = fs.readFileSync(backupPath!, 'utf8');
    assert.strictEqual(backupContent, '# Versión Original v1.0\nContenido valioso a preservar.');
  });

  it('@spec REQ-001-D should commit deliverable to target folder with safety verification', () => {
    // Arrange
    const slug = 'entregable-final-poo';
    const content = '# Entregable: Programación Orientada a Objetos\n\nCódigo limpio y principios SOLID.';

    // Act
    const finalPath = gateway.commitDeliverable(slug, content, 'Drafts');

    // Assert
    assert.strictEqual(fs.existsSync(finalPath), true, 'Committed deliverable must exist in target folder');
    assert.ok(finalPath.endsWith(path.join('Drafts', `${slug}.md`)));
    const savedText = fs.readFileSync(finalPath, 'utf8');
    assert.strictEqual(savedText, content);
  });

  it('@spec REQ-001-E should list all active specs in Inbox/Specs', () => {
    // Act
    const specs = gateway.listSpecs();

    // Assert: We previously saved 'test-sql-ddl'
    assert.ok(specs.length >= 1, 'Should find at least 1 spec');
    const found = specs.find(s => s.slug === 'test-sql-ddl');
    assert.ok(found, "Must find 'test-sql-ddl' in the list");
    assert.strictEqual(found?.status, 'spec_review');
  });

});
