---
name: node-dev
description: "Node.js engineering skill for developing server-side applications, harness orchestration scripts, child process automation, and stream pipelines. Use when creating Node.js backends, CLI tools, child process runners, file system operations, or async event workflows. For TypeScript typing, see typescript-dev. For software architecture, see software-engineering."
metadata:
  version: 1.0.0
---

# Node.js Development Skill

> [!NOTE] Purpose
> Runtime architecture standards, asynchronous orchestration patterns, child process management, and robust CLI scripting for the Academic-Engine harness and SENA backend applications.

---

## 1. Node.js Runtime Best Practices (Node 20+ / 22+ / 26+)

1. **Native ECMAScript Modules (ESM) & `node:` Specifier**:
   - Always import built-in modules with the explicit `node:` prefix (e.g., `import fs from 'node:fs';`, `const path = require('node:path');`).
   - Use `"type": "module"` in `package.json` for new submodules or modern projects.
2. **Safe Child Process Execution**:
   - Always use array arguments with `execFile` or `spawn` rather than passing raw unescaped command strings to `exec` to prevent command injection vulnerabilities.
   - For synchronous harness scripts, configure timeouts and handle `maxBuffer` appropriately.
3. **Atomic & Non-Destructive File Operations**:
   - Write files using atomic rename patterns (write to temporary file, then `fs.rename`) to prevent file corruption during crashes or interruptions.
4. **Graceful Signal Handling**:
   - Capture `SIGINT` and `SIGTERM` in CLI and service daemons to close file descriptors and clean temporary directories.

---

## 2. Harness Script Architecture Template

Follow this standardized pattern when creating or enhancing scripts in `Academic-Engine/scripts/*.js`:

```javascript
#!/usr/bin/env node

/**
 * Academic-Engine Automation Utility
 * Standards-compliant, zero-dependency Node.js CLI tool.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const SCRIPT_DIR = __dirname;
const ROOT_DIR = path.resolve(SCRIPT_DIR, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');

function parseArgs(args) {
  const options = {
    help: false,
    verbose: false,
    target: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
    else if (!arg.startsWith('-') && !options.target) options.target = arg;
  }

  return options;
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    console.log(`
Usage: node script.js [options] [target]

Options:
  -h, --help     Show this help message
  -v, --verbose  Enable verbose logging
    `);
    process.exit(0);
  }

  try {
    if (!fs.existsSync(VAULT_DIR)) {
      throw new Error(`Vault not found at: ${VAULT_DIR}`);
    }

    if (options.verbose) {
      console.log(`✅ Academic Vault verified at: ${VAULT_DIR}`);
    }

    // Business logic goes here
    console.log('✨ Operation completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs };
```

---

## 3. High-Performance Streams & Pipelines

For reading large files (e.g. large PDFs, datasets, logs) without memory exhaustion:

```javascript
const { pipeline } = require('node:stream/promises');
const fs = require('node:fs');
const readline = require('node:readline');

async function processLineByLine(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.startsWith('## ')) {
      // Process heading
    }
  }
}
```

---

## 4. Built-in Testing with `node:test` and `node:assert/strict`

Node.js provides a native test runner requiring zero external dependencies:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('./my-utility.js');

test('parseArgs parses target and flags correctly', (t) => {
  const parsed = parseArgs(['--verbose', 'my-target-slug']);
  assert.equal(parsed.verbose, true);
  assert.equal(parsed.target, 'my-target-slug');
  assert.equal(parsed.help, false);
});
```

Execute tests natively:
```bash
node --test tests/**/*.test.js
```

---

## 5. Development Checklist

- [ ] All built-ins use `node:` prefix imports.
- [ ] Child processes validate inputs and do not pass unchecked strings to shells.
- [ ] File manipulations check for file existence and use `path.join()` or `path.resolve()`.
- [ ] Error messages output to `stderr` with actionable remediation context.
- [ ] Returns exit code 0 on success and exit code > 0 on failure.
- [ ] Clean AAA unit tests verify core business and parsing logic.
