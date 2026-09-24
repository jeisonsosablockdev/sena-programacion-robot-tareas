#!/usr/bin/env node
/**
 * vault-search.test.js - Unit tests for lean vault search engine
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execSync } = require('node:child_process');

const SCRIPT_DIR = path.resolve(__dirname, '../scripts');
const SCRIPT_PATH = path.join(SCRIPT_DIR, 'vault-search.ts');

test('vault-search CLI parses arguments and executes successfully', () => {
  const output = execSync(`node --experimental-strip-types "${SCRIPT_PATH}" "SOLID" --limit 2 --json`, {
    encoding: 'utf8'
  });
  
  const results = JSON.parse(output);
  assert.equal(Array.isArray(results), true);
  assert(results.length <= 2);
  assert(results.length > 0);
  assert(results[0].heading);
  assert(results[0].score > 0);
});

test('vault-search returns 0 results for non-existent gibberish query', () => {
  const output = execSync(`node --experimental-strip-types "${SCRIPT_PATH}" "xyzzygibberishnonexistentterm" --json`, {
    encoding: 'utf8'
  });
  
  const results = JSON.parse(output);
  assert.equal(Array.isArray(results), true);
  assert.equal(results.length, 0);
});

test('vault-search wrapper .sh runs with clean exit code 0', () => {
  const shPath = path.join(SCRIPT_DIR, 'vault-search.sh');
  const out = execSync(`bash "${shPath}" "Clean Code" --limit 1 --json`, { encoding: 'utf8' });
  const results = JSON.parse(out);
  assert.equal(results.length, 1);
  assert(results[0].heading.includes('Clean Code') || results[0].snippet.includes('Clean'));
});
