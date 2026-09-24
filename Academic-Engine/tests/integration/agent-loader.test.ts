import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SCRIPT_DIR = import.meta.dirname ?? path.resolve();
const ROOT_DIR = path.resolve(SCRIPT_DIR, '../../..');
const AGENTS_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'agents');

/**
 * Helper to recursively find all YAML files in a directory
 */
function findYamlAgents(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findYamlAgents(fullPath));
    } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Simple zero-dependency YAML field extractor for agent definitions
 */
function parseAgentYaml(content: string) {
  const roleMatch = content.match(/^role:\s*["']?([^"'\n\r]+)["']?/m);
  const descMatch = content.match(/^description:\s*["']?([^"'\n\r]+)["']?/m);
  const nameMatch = content.match(/^name:\s*["']?([^"'\n\r]+)["']?/m);
  const hasTools = content.includes('tools:');
  const hasPrompt = content.includes('system_prompt:');

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    role: roleMatch ? roleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    hasTools,
    hasPrompt,
    rawContent: content
  };
}

describe('Agent Loader & Agnostic Venture Squad (@spec SPEC-002)', () => {

  it('@spec REQ-002-1 should dynamically discover agents without hardcoded name lists', () => {
    // Arrange & Act
    const agentFiles = findYamlAgents(AGENTS_DIR);

    // Assert: Must discover at least 15 valid agent definitions dynamically
    assert.ok(agentFiles.length >= 15, `Found ${agentFiles.length} agents, expected at least 15`);
    
    for (const filePath of agentFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const agent = parseAgentYaml(content);
      const relativeName = path.basename(filePath, path.extname(filePath));

      assert.ok(agent.role.length > 0, `Agent ${relativeName} must define a 'role'`);
      assert.ok(agent.description.length > 0, `Agent ${relativeName} must define a 'description'`);
      assert.strictEqual(agent.hasTools, true, `Agent ${relativeName} must define a 'tools' block`);
      assert.strictEqual(agent.hasPrompt, true, `Agent ${relativeName} must define a 'system_prompt'`);
    }
  });

  it('@spec REQ-002-2 should verify all venture agents are agnostic and decoupled from BRIDS', () => {
    // Arrange
    const ventureAgentSlugs = [
      'business-consultant',
      'market-research-analyst',
      'pitch-deck-architect',
      'compliance-officer',
      'founder-ghostwriter'
    ];

    const agentFiles = findYamlAgents(AGENTS_DIR);
    assert.ok(agentFiles.length > 0, 'Agents directory must not be empty');

    // Act & Assert
    for (const slug of ventureAgentSlugs) {
      const match = agentFiles.find(f => path.basename(f).startsWith(slug));
      assert.ok(match, `Venture agent '${slug}' must exist in agents directory`);

      const content = fs.readFileSync(match, 'utf8');
      const agent = parseAgentYaml(content);

      // Verify role & description are decoupled from "BRIDS"
      assert.doesNotMatch(
        agent.description,
        /\bBRIDS\b/i,
        `Agent '${slug}' description must be agnostic and not mention 'BRIDS'`
      );

      assert.doesNotMatch(
        agent.role,
        /\bBRIDS\b/i,
        `Agent '${slug}' role must be agnostic and not mention 'BRIDS'`
      );

      // Verify the system prompt establishes a universal venture/startup mission
      const promptLower = agent.rawContent.toLowerCase();
      assert.doesNotMatch(
        promptLower,
        /financial architect for brids\.io/i,
        `Agent '${slug}' system_prompt must not claim to be exclusively for 'BRIDS.io'`
      );
    }
  });

  it('@spec REQ-002-3 should verify B2B lead agent is configured for universal B2B sales/pilots', () => {
    // Arrange: Can be named b2b-sales-lead or b2b-sponsor-lead during transition
    const agentFiles = findYamlAgents(AGENTS_DIR);
    const b2bAgentPath = agentFiles.find(f => 
      path.basename(f).includes('b2b-sales-lead') || path.basename(f).includes('b2b-sponsor-lead')
    );

    // Assert
    assert.ok(b2bAgentPath, "A B2B lead generation agent ('b2b-sales-lead' or 'b2b-sponsor-lead') must exist");
    
    const content = fs.readFileSync(b2bAgentPath, 'utf8');
    const agent = parseAgentYaml(content);

    // Must be decoupled from exclusive real estate syndication and BRIDS
    assert.doesNotMatch(
      agent.description,
      /\bBRIDS\b/i,
      "B2B lead agent description must not reference 'BRIDS'"
    );

    assert.doesNotMatch(
      agent.rawContent,
      /\bBRIDS\b/i,
      "B2B lead agent prompt must not reference 'BRIDS'"
    );
  });

});
