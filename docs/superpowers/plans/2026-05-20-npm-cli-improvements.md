# npm CLI + Token Measurement + Framework Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `claude-token-optimizer` from a curl-piped shell script into a proper npm package with `init` and `measure` CLI commands, real token counting, four new framework examples, and opt-in session hooks.

**Architecture:** Node.js CLI using `commander` for subcommands. `measure` scans the project and uses `@anthropic-ai/tokenizer` to count real tokens, showing before/after savings. `init` ports the existing `init.sh` logic and gains a `--framework` flag for framework-aware `.claudeignore` generation.

**Tech Stack:** Node.js >=18, commander@12, @anthropic-ai/tokenizer@0.0.4, glob@11, chalk@5, node:test (built-in)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | npm package config, bin entry, deps |
| `bin/cto.js` | Create | Executable entry point |
| `src/cli.js` | Create | commander setup, registers subcommands |
| `src/commands/init.js` | Create | Interactive setup — ports init.sh logic |
| `src/commands/measure.js` | Create | Token scan + before/after report |
| `src/lib/tokenizer.js` | Create | Wraps @anthropic-ai/tokenizer |
| `src/lib/scanner.js` | Create | Finds files Claude auto-loads |
| `src/lib/frameworks.js` | Create | Framework-specific .claudeignore patterns |
| `tests/tokenizer.test.js` | Create | Unit tests for tokenizer.js |
| `tests/scanner.test.js` | Create | Unit tests for scanner.js |
| `tests/measure.test.js` | Create | Integration test for measure command |
| `tests/init.test.js` | Create | Integration test for init command |
| `examples/fastapi.md` | Create | FastAPI/Flask framework example |
| `examples/go.md` | Create | Go (Gin/chi) framework example |
| `examples/spring-boot.md` | Create | Spring Boot framework example |
| `examples/svelte.md` | Create | Svelte/SvelteKit framework example |
| `templates/hooks/session-end-token-report.sh` | Create | Opt-in session end hook |
| `README.md` | Modify | Add npx instructions at top |

---

## Task 1: Package scaffolding

**Files:**
- Create: `package.json`
- Create: `bin/cto.js`
- Create: `src/cli.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "claude-token-optimizer",
  "version": "2.0.0",
  "description": "Cut Claude Code token usage by 90% — real token counts, optimized project setup",
  "bin": {
    "cto": "bin/cto.js"
  },
  "main": "src/cli.js",
  "type": "module",
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "test:watch": "node --test --watch tests/**/*.test.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["claude", "claude-code", "token", "optimizer", "ai", "context"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/nadimtuhin/claude-token-optimizer"
  },
  "dependencies": {
    "@anthropic-ai/tokenizer": "0.0.4",
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "glob": "^11.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 3: Create bin/cto.js**

```javascript
#!/usr/bin/env node
import { run } from '../src/cli.js';
run();
```

- [ ] **Step 4: Make bin/cto.js executable**

Run: `chmod +x bin/cto.js`

- [ ] **Step 5: Create src/cli.js**

```javascript
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { measureCommand } from './commands/measure.js';

export function run() {
  const program = new Command();

  program
    .name('cto')
    .description('Claude Token Optimizer — cut Claude Code context usage by 90%')
    .version('2.0.0');

  program
    .command('init')
    .description('Set up optimized documentation structure in your project')
    .option('--framework <name>', 'skip prompts, use known framework patterns (express, nextjs, django, rails, vue, nuxtjs, angular, nestjs, laravel, fastapi, go, spring-boot, svelte)')
    .option('--yes', 'non-interactive with defaults')
    .action(initCommand);

  program
    .command('measure')
    .description('Show token cost of current project vs. post-optimization estimate')
    .action(measureCommand);

  program.parse();
}
```

- [ ] **Step 6: Verify CLI entry point works**

Run: `node bin/cto.js --help`

Expected output:
```
Usage: cto [options] [command]

Claude Token Optimizer — cut Claude Code context usage by 90%

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init [options]  Set up optimized documentation structure in your project
  measure         Show token cost of current project vs. post-optimization estimate
  help [command]  display help for command
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json bin/cto.js src/cli.js
git commit -m "feat: scaffold npm package with commander CLI entry point"
```

---

## Task 2: Tokenizer library

**Files:**
- Create: `src/lib/tokenizer.js`
- Create: `tests/tokenizer.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/tokenizer.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { countTokens } from '../src/lib/tokenizer.js';

describe('countTokens', () => {
  it('returns a number for empty string', () => {
    const result = countTokens('');
    assert.equal(typeof result, 'number');
  });

  it('returns more tokens for longer text', () => {
    const short = countTokens('hello');
    const long = countTokens('hello world this is a longer sentence with many words');
    assert.ok(long > short, `expected ${long} > ${short}`);
  });

  it('counts a known string within expected range', () => {
    // "Hello, world!" tokenizes to roughly 4 tokens in Claude's tokenizer
    const result = countTokens('Hello, world!');
    assert.ok(result >= 3 && result <= 6, `expected 3-6 tokens, got ${result}`);
  });

  it('handles multiline text', () => {
    const result = countTokens('line one\nline two\nline three');
    assert.equal(typeof result, 'number');
    assert.ok(result > 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/tokenizer.test.js`

Expected: error `Cannot find module '../src/lib/tokenizer.js'`

- [ ] **Step 3: Implement tokenizer.js**

Create `src/lib/tokenizer.js`:

```javascript
import Anthropic from '@anthropic-ai/tokenizer';

export function countTokens(text) {
  if (!text) return 0;
  return Anthropic.countTokens(text);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/tokenizer.test.js`

Expected: all 4 tests pass. If `Anthropic.countTokens` API differs, check with:

```bash
node -e "import('@anthropic-ai/tokenizer').then(m => console.log(Object.keys(m)))"
```

Adjust the import/call in `tokenizer.js` to match the actual exported API.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenizer.js tests/tokenizer.test.js
git commit -m "feat: add tokenizer wrapper using @anthropic-ai/tokenizer"
```

---

## Task 3: Scanner library

**Files:**
- Create: `src/lib/scanner.js`
- Create: `tests/scanner.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/scanner.test.js`:

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanAutoLoadFiles } from '../src/lib/scanner.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('scanAutoLoadFiles', () => {
  it('returns empty array for empty directory', async () => {
    const files = await scanAutoLoadFiles(tmpDir);
    assert.deepEqual(files, []);
  });

  it('picks up root-level .md files', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Claude');
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Readme');
    const files = await scanAutoLoadFiles(tmpDir);
    const names = files.map(f => path.basename(f.path));
    assert.ok(names.includes('CLAUDE.md'), 'should include CLAUDE.md');
    assert.ok(names.includes('README.md'), 'should include README.md');
  });

  it('picks up .claude/*.md files', async () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    fs.writeFileSync(path.join(tmpDir, '.claude', 'COMMON_MISTAKES.md'), '# Mistakes');
    const files = await scanAutoLoadFiles(tmpDir);
    const names = files.map(f => path.basename(f.path));
    assert.ok(names.includes('COMMON_MISTAKES.md'));
  });

  it('picks up docs/**/*.md files', async () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs', 'guide.md'), '# Guide');
    const files = await scanAutoLoadFiles(tmpDir);
    const names = files.map(f => path.basename(f.path));
    assert.ok(names.includes('guide.md'));
  });

  it('returns objects with path and content fields', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Claude');
    const files = await scanAutoLoadFiles(tmpDir);
    assert.ok(files.length > 0);
    assert.ok('path' in files[0]);
    assert.ok('content' in files[0]);
  });

  it('respects .claudeignore patterns', async () => {
    fs.mkdirSync(path.join(tmpDir, '.claude', 'sessions'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.claude', 'sessions', 'old.md'), '# Old session');
    fs.writeFileSync(path.join(tmpDir, '.claudeignore'), '.claude/sessions/**');
    const files = await scanAutoLoadFiles(tmpDir);
    const paths = files.map(f => f.path);
    assert.ok(!paths.some(p => p.includes('sessions')), 'should exclude sessions dir');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/scanner.test.js`

Expected: error `Cannot find module '../src/lib/scanner.js'`

- [ ] **Step 3: Implement scanner.js**

Create `src/lib/scanner.js`:

```javascript
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

const AUTO_LOAD_PATTERNS = [
  '*.md',
  '.claude/*.md',
  'docs/**/*.md',
];

function readIgnorePatterns(dir) {
  const ignorePath = path.join(dir, '.claudeignore');
  if (!fs.existsSync(ignorePath)) return [];
  return fs.readFileSync(ignorePath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

export async function scanAutoLoadFiles(dir) {
  const ignorePatterns = readIgnorePatterns(dir);

  const files = await glob(AUTO_LOAD_PATTERNS, {
    cwd: dir,
    absolute: true,
    ignore: ignorePatterns,
    dot: true,
  });

  return files.map(filePath => ({
    path: filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/scanner.test.js`

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scanner.js tests/scanner.test.js
git commit -m "feat: add file scanner that finds Claude auto-load candidates"
```

---

## Task 4: Framework patterns library

**Files:**
- Create: `src/lib/frameworks.js`

No dedicated unit test — this is pure data. Covered by init integration test in Task 6.

- [ ] **Step 1: Create src/lib/frameworks.js**

```javascript
export const SUPPORTED_FRAMEWORKS = [
  'express', 'nextjs', 'vue', 'nuxtjs', 'angular',
  'django', 'rails', 'nestjs', 'laravel',
  'fastapi', 'go', 'spring-boot', 'svelte',
];

const BASE_IGNORE = `# Task completion documents
.claude/completions/**

# Session files
.claude/sessions/**

# Archived documentation
docs/archive/**

# Git
.git/**

# Environment
.env
.env.*
!.env.example

# Logs
*.log
logs/**

# OS
.DS_Store
`;

const FRAMEWORK_EXTRA = {
  express: `# Node
node_modules/**
dist/**
build/**
coverage/**`,

  nextjs: `# Node / Next.js
node_modules/**
.next/**
out/**
dist/**
coverage/**`,

  vue: `# Node / Vue
node_modules/**
dist/**
coverage/**`,

  nuxtjs: `# Node / Nuxt
node_modules/**
.nuxt/**
.output/**
dist/**
coverage/**`,

  angular: `# Node / Angular
node_modules/**
dist/**
.angular/**
coverage/**`,

  django: `# Python / Django
__pycache__/**
*.pyc
.venv/**
venv/**
staticfiles/**
media/**`,

  rails: `# Ruby / Rails
vendor/**
tmp/**
log/**
public/assets/**
.bundle/**`,

  nestjs: `# Node / NestJS
node_modules/**
dist/**
coverage/**`,

  laravel: `# PHP / Laravel
vendor/**
node_modules/**
storage/logs/**
bootstrap/cache/**`,

  fastapi: `# Python / FastAPI
__pycache__/**
*.pyc
.venv/**
venv/**
.pytest_cache/**
htmlcov/**`,

  go: `# Go
vendor/**
bin/**
*.test
*.out`,

  'spring-boot': `# Java / Spring Boot
target/**
.mvn/**
*.class
*.jar
*.war`,

  svelte: `# Node / Svelte
node_modules/**
.svelte-kit/**
build/**
dist/**
coverage/**`,
};

export function getClaudeIgnore(framework) {
  const extra = FRAMEWORK_EXTRA[framework] ?? '';
  return extra ? `${BASE_IGNORE}\n${extra}\n` : `${BASE_IGNORE}\n`;
}

export function isKnownFramework(name) {
  return SUPPORTED_FRAMEWORKS.includes(name?.toLowerCase());
}
```

- [ ] **Step 2: Verify module loads without error**

Run:
```bash
node -e "import('./src/lib/frameworks.js').then(m => console.log(m.SUPPORTED_FRAMEWORKS.length + ' frameworks loaded'))"
```

Expected: `13 frameworks loaded`

- [ ] **Step 3: Commit**

```bash
git add src/lib/frameworks.js
git commit -m "feat: add framework-specific .claudeignore pattern library"
```

---

## Task 5: measure command

**Files:**
- Create: `src/commands/measure.js`
- Create: `tests/measure.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/measure.test.js`:

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildReport } from '../src/commands/measure.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('buildReport', () => {
  it('returns before and after token counts', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Hello world\n\nThis is a test project with some documentation.');
    const report = await buildReport(tmpDir);
    assert.ok(typeof report.before === 'number', 'before should be a number');
    assert.ok(typeof report.after === 'number', 'after should be a number');
  });

  it('before is 0 for empty directory', async () => {
    const report = await buildReport(tmpDir);
    assert.equal(report.before, 0);
  });

  it('after is the optimized baseline (~1050 tokens)', async () => {
    const report = await buildReport(tmpDir);
    // Post-init estimate is always the 4 essential files baseline
    assert.ok(report.after >= 800 && report.after <= 1300, `expected ~1050, got ${report.after}`);
  });

  it('savings is before minus after', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Big doc\n' + 'word '.repeat(500));
    const report = await buildReport(tmpDir);
    assert.equal(report.savings, report.before - report.after);
  });

  it('includes file breakdown', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Claude');
    const report = await buildReport(tmpDir);
    assert.ok(Array.isArray(report.files));
    assert.ok(report.files.length > 0);
    assert.ok('label' in report.files[0]);
    assert.ok('tokens' in report.files[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/measure.test.js`

Expected: error `Cannot find module '../src/commands/measure.js'`

- [ ] **Step 3: Implement measure.js**

Create `src/commands/measure.js`:

```javascript
import chalk from 'chalk';
import path from 'node:path';
import { scanAutoLoadFiles } from '../lib/scanner.js';
import { countTokens } from '../lib/tokenizer.js';

// Baseline token cost of the optimized 4-file setup
const OPTIMIZED_BASELINE = 1050;

export async function buildReport(dir) {
  const files = await scanAutoLoadFiles(dir);

  const fileBreakdown = files.map(f => ({
    label: path.relative(dir, f.path),
    tokens: countTokens(f.content),
  }));

  const before = fileBreakdown.reduce((sum, f) => sum + f.tokens, 0);
  const after = OPTIMIZED_BASELINE;
  const savings = before - after;

  return { before, after, savings, files: fileBreakdown };
}

export async function measureCommand() {
  const dir = process.cwd();

  console.log('');
  console.log(chalk.bold('📊 Token Audit — ' + path.basename(dir) + '/'));
  console.log('');

  const report = await buildReport(dir);

  console.log(chalk.dim('  BEFORE (current state)'));
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  for (const f of report.files) {
    const label = f.label.padEnd(35);
    const tokens = f.tokens.toLocaleString().padStart(8);
    console.log(`  ${label} ${tokens} tokens`);
  }
  if (report.files.length === 0) {
    console.log(chalk.dim('  (no auto-loadable files found)'));
  }
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  console.log(`  ${'Total auto-loaded:'.padEnd(35)} ${chalk.yellow(report.before.toLocaleString().padStart(8))} tokens`);

  console.log('');
  console.log(chalk.dim('  AFTER (post-init estimate)'));
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  const essentials = [
    ['CLAUDE.md', 450],
    ['.claude/COMMON_MISTAKES.md', 350],
    ['.claude/QUICK_START.md', 100],
    ['.claude/ARCHITECTURE_MAP.md', 150],
  ];
  for (const [label, tokens] of essentials) {
    console.log(`  ${label.padEnd(35)} ${tokens.toLocaleString().padStart(8)} tokens`);
  }
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  console.log(`  ${'Total auto-loaded:'.padEnd(35)} ${chalk.green(report.after.toLocaleString().padStart(8))} tokens`);

  console.log('');

  if (report.savings > 0) {
    const pct = Math.round((report.savings / report.before) * 100);
    console.log(chalk.green(`  💡 Savings: ${report.savings.toLocaleString()} tokens (${pct}%)`));
    console.log('');
    console.log(`  Run ${chalk.cyan('npx claude-token-optimizer init')} to apply`);
  } else if (report.before === 0) {
    console.log(chalk.dim('  Nothing to measure — directory may already be optimized or is empty.'));
  } else {
    console.log(chalk.green('  ✓ Already optimized! Token usage is within baseline.'));
  }

  console.log('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/measure.test.js`

Expected: all 5 tests pass.

- [ ] **Step 5: Smoke test the command**

Run from a project directory with existing docs:

```bash
node bin/cto.js measure
```

Expected: formatted report printed, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/commands/measure.js tests/measure.test.js
git commit -m "feat: add measure command with real token counting"
```

---

## Task 6: init command

**Files:**
- Create: `src/commands/init.js`
- Create: `tests/init.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/init.test.js`:

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runInit } from '../src/commands/init.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-init-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

const defaultOptions = {
  framework: 'express',
  yes: true,
  projectType: 'Express API',
  techStack: 'Express, PostgreSQL',
  mainFeatures: 'REST API',
};

describe('runInit', () => {
  it('creates .claude/ directory', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude')));
  });

  it('creates CLAUDE.md', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')));
  });

  it('creates .claudeignore', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claudeignore')));
  });

  it('.claudeignore contains framework patterns for express', async () => {
    await runInit(tmpDir, { ...defaultOptions, framework: 'express' });
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('node_modules/**'));
  });

  it('.claudeignore contains framework patterns for go', async () => {
    await runInit(tmpDir, { ...defaultOptions, framework: 'go' });
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('vendor/**'));
  });

  it('creates .claude/COMMON_MISTAKES.md', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'COMMON_MISTAKES.md')));
  });

  it('creates .claude/QUICK_START.md', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'QUICK_START.md')));
  });

  it('creates .claude/ARCHITECTURE_MAP.md', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'ARCHITECTURE_MAP.md')));
  });

  it('creates docs/INDEX.md', async () => {
    await runInit(tmpDir, defaultOptions);
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs', 'INDEX.md')));
  });

  it('CLAUDE.md mentions project type', async () => {
    await runInit(tmpDir, defaultOptions);
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.ok(content.includes('Express API'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/init.test.js`

Expected: error `Cannot find module '../src/commands/init.js'`

- [ ] **Step 3: Implement init.js**

Create `src/commands/init.js`:

```javascript
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { getClaudeIgnore, isKnownFramework, SUPPORTED_FRAMEWORKS } from '../lib/frameworks.js';

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function buildClaudeMd(projectType, techStack, mainFeatures, date) {
  return `# CLAUDE.md

**Quick-start guide for Claude Code - Complete details in linked docs**

---

## Project Overview

${projectType} application for ${mainFeatures}

**Tech Stack**: ${techStack}

---

## Session Start Protocol ⚡

**MANDATORY** at start of each session:

\`\`\`bash
# Load essential docs (~800 tokens - 2 min read)
✓ .claude/COMMON_MISTAKES.md      # ⚠️ CRITICAL - Read FIRST
✓ .claude/QUICK_START.md          # Essential commands
✓ .claude/ARCHITECTURE_MAP.md     # File locations
\`\`\`

**At task completion:**
- Create completion doc in \`.claude/completions/YYYY-MM-DD-task-name.md\`
- Move session file to \`.claude/sessions/archive/\` (if created)

**⚠️ NEVER auto-load:**
- Files in \`.claude/completions/\` (0 token cost)
- Files in \`.claude/sessions/\` (0 token cost)
- Files in \`docs/archive/\` (0 token cost)

---

## Quick Start Commands

\`\`\`bash
# Add your common commands here
\`\`\`

---

**Last Updated**: ${date}
**Optimized with**: [Claude Token Optimizer](https://github.com/nadimtuhin/claude-token-optimizer)
`;
}

export async function runInit(dir, options) {
  const date = new Date().toISOString().split('T')[0];
  const { projectType, techStack, mainFeatures, framework } = options;

  // Directory structure
  const dirs = [
    '.claude/completions',
    '.claude/sessions/active',
    '.claude/sessions/archive',
    '.claude/templates',
    'docs/learnings',
    'docs/archive',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
  }

  // .claudeignore
  const fw = framework?.toLowerCase();
  writeFile(path.join(dir, '.claudeignore'), getClaudeIgnore(fw));

  // CLAUDE.md
  writeFile(
    path.join(dir, 'CLAUDE.md'),
    buildClaudeMd(projectType, techStack, mainFeatures, date)
  );

  // .claude docs
  writeFile(path.join(dir, '.claude', 'COMMON_MISTAKES.md'), `# Common Mistakes

**⚠️ CRITICAL - Read at session start**

---

## Top 5 Critical Mistakes

### 1. [Add Your First Critical Mistake]

**Symptom**:
**Check**:
**Fix**:

### 2. [Add Second Mistake]

### 3. [Add Third Mistake]

### 4. [Add Fourth Mistake]

### 5. [Add Fifth Mistake]

---

**Last Updated**: ${date}
`);

  writeFile(path.join(dir, '.claude', 'QUICK_START.md'), `# Quick Start Commands

---

## Development

\`\`\`bash
# Start development server

# Run tests

# Build for production
\`\`\`

---

**Last Updated**: ${date}
`);

  writeFile(path.join(dir, '.claude', 'ARCHITECTURE_MAP.md'), `# Architecture Map

---

## Directory Structure

\`\`\`
project/
├── [Add your structure]
\`\`\`

## Key File Locations

- **Configuration**:
- **Main entry**:
- **Tests**:

---

**Last Updated**: ${date}
`);

  writeFile(path.join(dir, 'docs', 'INDEX.md'), `# Documentation Index

---

## Session Start (Essential - ~800 tokens)

- \`CLAUDE.md\` (~450 tokens)
- \`.claude/COMMON_MISTAKES.md\` (~350 tokens)
- \`.claude/QUICK_START.md\` (~100 tokens)
- \`.claude/ARCHITECTURE_MAP.md\` (~150 tokens)

## Task-Specific Topics (Load As Needed)

Add topic files in \`docs/learnings/\` and list them here.

---

**Last Updated**: ${date}
`);
}

export async function initCommand(options) {
  const dir = process.cwd();

  console.log('');
  console.log(chalk.bold('╔════════════════════════════════════════════════╗'));
  console.log(chalk.bold('║   Claude Token Optimizer - Project Setup       ║'));
  console.log(chalk.bold('╚════════════════════════════════════════════════╝'));
  console.log('');

  let { framework, yes } = options;
  let projectType, techStack, mainFeatures;

  if (framework && !isKnownFramework(framework)) {
    console.log(chalk.yellow(`⚠️  Unknown framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`));
    framework = undefined;
  }

  if (yes || framework) {
    projectType = framework ? `${framework} application` : 'Application';
    techStack = framework ?? 'Unknown';
    mainFeatures = 'See README';
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(chalk.blue('📋 Project Information'));
    console.log('');
    projectType = await prompt(rl, 'Project Type (e.g., Express, Next.js, Django): ');
    techStack = await prompt(rl, 'Tech Stack (e.g., Express, PostgreSQL, Prisma): ');
    mainFeatures = await prompt(rl, 'Main Features (brief description): ');
    rl.close();
    console.log('');
  }

  console.log(chalk.green('📁 Creating directory structure...'));
  await runInit(dir, { framework, projectType, techStack, mainFeatures });

  console.log('');
  console.log(chalk.green('✅ Setup Complete!'));
  console.log('');
  console.log('📊 Token Optimization:');
  console.log('   • Session start: ~800 tokens (vs ~8,000 before)');
  console.log('   • Savings: ~88% reduction ⚡');
  console.log('');
  console.log('📝 Next Steps:');
  console.log(`   1. Customize ${chalk.cyan('.claude/COMMON_MISTAKES.md')}`);
  console.log(`   2. Update ${chalk.cyan('.claude/QUICK_START.md')} with your commands`);
  console.log(`   3. Fill in ${chalk.cyan('.claude/ARCHITECTURE_MAP.md')}`);
  console.log('');
  console.log(`   Run ${chalk.cyan('npx claude-token-optimizer measure')} to verify savings`);
  console.log('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/init.test.js`

Expected: all 10 tests pass.

- [ ] **Step 5: Smoke test interactive mode**

```bash
node bin/cto.js init --framework nextjs --yes
```

Expected: files created in cwd, success message printed.

- [ ] **Step 6: Commit**

```bash
git add src/commands/init.js tests/init.test.js
git commit -m "feat: add init command, ports init.sh with --framework flag"
```

---

## Task 7: Run full test suite

**Files:** No new files.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests in all 4 test files pass. Zero failures.

- [ ] **Step 2: Test npx flow end-to-end**

```bash
node bin/cto.js --help
node bin/cto.js measure
node bin/cto.js init --framework express --yes
```

Expected: all three commands complete without errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: confirm full test suite passes"
```

---

## Task 8: New framework examples

**Files:**
- Create: `examples/fastapi.md`
- Create: `examples/go.md`
- Create: `examples/spring-boot.md`
- Create: `examples/svelte.md`

- [ ] **Step 1: Create examples/fastapi.md**

```markdown
# FastAPI / Flask Setup Example

**Quick setup for Python web projects - Copy and customize**

---

# Setup Claude Code Documentation for [FastAPI Project Name]

## Project Context

**Project Type**: FastAPI Application
**Tech Stack**:
- FastAPI / Flask
- [Database: PostgreSQL/SQLite]
- [ORM: SQLAlchemy/Tortoise]
- [Testing: pytest]
- [Other: Celery, Redis]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with FastAPI-specific content below.

## FastAPI-Specific Content

### ARCHITECTURE_MAP.md

\`\`\`markdown
## Core Directories

app/
├── api/             # Route definitions (routers)
├── core/            # Config, security, dependencies
├── models/          # SQLAlchemy / Pydantic models
├── schemas/         # Pydantic request/response schemas
├── services/        # Business logic
├── db/              # Database setup, migrations
└── main.py          # FastAPI app creation

## Key Patterns

### Dependency injection
\`\`\`python
from fastapi import Depends
async def get_db() -> AsyncSession: ...
async def route(db: AsyncSession = Depends(get_db)): ...
\`\`\`

### Pydantic v2 model
\`\`\`python
from pydantic import BaseModel, model_validator
class UserCreate(BaseModel):
    email: str
    password: str
    model_config = ConfigDict(str_strip_whitespace=True)
\`\`\`
\`\`\`

### COMMON_MISTAKES.md

\`\`\`markdown
## Top FastAPI/Flask Mistakes

### 1. Pydantic v2 validator syntax changed
**Symptom**: `@validator` decorator not working, import errors
**Check**: Are you on Pydantic v2? `pip show pydantic`
**Fix**: Use `@field_validator` and `@model_validator` instead of `@validator`

### 2. Async route with sync database call blocks event loop
**Symptom**: Slow responses under load, timeouts
**Check**: Are you calling sync SQLAlchemy methods inside `async def` routes?
**Fix**: Use `AsyncSession` and `await db.execute(...)` throughout

### 3. Alembic autogenerate misses changes
**Symptom**: `alembic revision --autogenerate` creates empty migration
**Check**: Is the model imported in `env.py` target_metadata?
**Fix**: Import all models in `alembic/env.py` before `target_metadata = Base.metadata`

### 4. Missing `await` on async function returns coroutine object
**Symptom**: Route returns `<coroutine object>` instead of data
**Fix**: Add `await` before every async call

### 5. pytest fixtures not cleaning up database
**Symptom**: Tests pass alone, fail together (shared state)
**Fix**: Use `yield` fixtures with explicit rollback/truncate
\`\`\`

### .claudeignore additions

\`\`\`
__pycache__/**
*.pyc
.venv/**
venv/**
.pytest_cache/**
htmlcov/**
\`\`\`
```

- [ ] **Step 2: Create examples/go.md**

```markdown
# Go (Gin / chi) Setup Example

**Quick setup for Go web projects - Copy and customize**

---

# Setup Claude Code Documentation for [Go Project Name]

## Project Context

**Project Type**: Go Web Service
**Tech Stack**:
- Go 1.21+
- [Router: Gin / chi / stdlib]
- [Database: PostgreSQL/SQLite]
- [ORM: sqlc / GORM / pgx]
- [Testing: testify]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Go-Specific Content

### ARCHITECTURE_MAP.md

\`\`\`markdown
## Core Directories

cmd/
└── server/main.go    # Entry point

internal/
├── handler/          # HTTP handlers
├── service/          # Business logic
├── repository/       # Database access
├── model/            # Domain types
└── middleware/       # HTTP middleware

pkg/                  # Shared, importable packages

## Key Patterns

### Handler
\`\`\`go
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    user, err := h.service.GetUser(r.Context(), id)
    if err != nil { http.Error(w, err.Error(), 500); return }
    json.NewEncoder(w).Encode(user)
}
\`\`\`

### Interface-based service
\`\`\`go
type UserService interface {
    GetUser(ctx context.Context, id string) (*User, error)
}
\`\`\`
\`\`\`

### COMMON_MISTAKES.md

\`\`\`markdown
## Top Go Mistakes

### 1. Module path mismatch
**Symptom**: `cannot find module providing package`
**Check**: Does `go.mod` module name match import paths in code?
**Fix**: `go mod tidy` and verify module name in `go.mod`

### 2. Goroutine leak — forgetting to cancel context
**Symptom**: Memory grows over time, goroutines pile up
**Fix**: Always `defer cancel()` after `context.WithCancel` / `WithTimeout`

### 3. Interface nil pointer panic
**Symptom**: `nil pointer dereference` on interface method call
**Check**: Is a nil concrete pointer assigned to an interface variable?
**Fix**: Check `if svc == nil` before assignment, or use explicit nil interface checks

### 4. sql.Rows not closed
**Symptom**: Connection pool exhaustion, `too many open files`
**Fix**: Always `defer rows.Close()` immediately after `db.QueryContext`

### 5. Race condition in tests
**Symptom**: Tests fail intermittently with `-race` flag
**Fix**: Run `go test -race ./...` and fix all data races before merging
\`\`\`

### .claudeignore additions

\`\`\`
vendor/**
bin/**
*.test
*.out
\`\`\`
```

- [ ] **Step 3: Create examples/spring-boot.md**

```markdown
# Spring Boot Setup Example

**Quick setup for Spring Boot Java projects - Copy and customize**

---

# Setup Claude Code Documentation for [Spring Boot Project Name]

## Project Context

**Project Type**: Spring Boot Application
**Tech Stack**:
- Spring Boot 3.x
- Java 17+
- [ORM: Spring Data JPA / Hibernate]
- [Database: PostgreSQL/MySQL/H2]
- [Testing: JUnit 5, Mockito]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Spring Boot-Specific Content

### ARCHITECTURE_MAP.md

\`\`\`markdown
## Core Directories

src/main/java/com/example/
├── controller/      # @RestController — HTTP layer
├── service/         # @Service — business logic
├── repository/      # @Repository — JPA/data access
├── model/entity/    # @Entity — JPA domain objects
├── dto/             # Request/response DTOs
├── config/          # @Configuration classes
└── exception/       # Global exception handlers

src/main/resources/
├── application.yml  # Main config
└── application-{profile}.yml  # Profile overrides

## Key Patterns

### REST controller
\`\`\`java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) { ... }
}
\`\`\`
\`\`\`

### COMMON_MISTAKES.md

\`\`\`markdown
## Top Spring Boot Mistakes

### 1. JPA N+1 query problem
**Symptom**: Dozens of SQL queries for a single request
**Check**: Use `EAGER` fetching or is `@OneToMany` uninitialized in a loop?
**Fix**: Use `@EntityGraph` or `JOIN FETCH` in JPQL query

### 2. Bean scope mismatch — injecting request-scoped into singleton
**Symptom**: `ScopeNotActiveException` or stale data across requests
**Fix**: Inject via `ObjectProvider<T>` or use `@Lookup`

### 3. `application.yml` vs environment variables precedence
**Symptom**: Config in yml ignored in production
**Check**: Spring Boot property precedence — env vars override yml
**Fix**: Use `${ENV_VAR:default}` syntax in yml for overridable values

### 4. Missing `@Transactional` on service method
**Symptom**: `LazyInitializationException` when accessing lazy relations
**Fix**: Add `@Transactional` on service methods that read lazy associations

### 5. Maven Wrapper not committed
**Symptom**: `./mvnw: not found` in CI
**Fix**: Commit `mvnw`, `mvnw.cmd`, `.mvn/wrapper/` to git
\`\`\`

### .claudeignore additions

\`\`\`
target/**
.mvn/**
*.class
*.jar
*.war
\`\`\`
```

- [ ] **Step 4: Create examples/svelte.md**

```markdown
# Svelte / SvelteKit Setup Example

**Quick setup for Svelte projects - Copy and customize**

---

# Setup Claude Code Documentation for [Svelte Project Name]

## Project Context

**Project Type**: SvelteKit Application
**Tech Stack**:
- SvelteKit 2.x
- Svelte 5
- [Styling: Tailwind / CSS Modules]
- [Database: Prisma / Drizzle]
- [Testing: Vitest + Playwright]

**Main Features**: [Web app for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Svelte-Specific Content

### ARCHITECTURE_MAP.md

\`\`\`markdown
## Core Directories

src/
├── routes/           # SvelteKit file-based routing
│   ├── +page.svelte  # Page component
│   ├── +page.ts      # Page load function
│   ├── +layout.svelte
│   └── api/          # API routes (+server.ts)
├── lib/
│   ├── components/   # Shared components
│   ├── stores/       # Svelte stores
│   └── utils/        # Helpers
└── app.html          # HTML shell

## Key Patterns

### Store
\`\`\`typescript
import { writable } from 'svelte/store';
export const count = writable(0);
// In component: $count (auto-subscribe)
\`\`\`

### Load function
\`\`\`typescript
export const load: PageLoad = async ({ fetch, params }) => {
    const res = await fetch(`/api/items/${params.id}`);
    return { item: await res.json() };
};
\`\`\`
\`\`\`

### COMMON_MISTAKES.md

\`\`\`markdown
## Top Svelte / SvelteKit Mistakes

### 1. Store value not reactive in template
**Symptom**: UI doesn't update when store changes
**Check**: Are you using `store.value` instead of `$store`?
**Fix**: Use `$store` auto-subscribe syntax in .svelte files; use `get(store)` in .ts files

### 2. Form action not found — wrong route structure
**Symptom**: 404 on form submit or action ignored
**Check**: Is the `+page.server.ts` file in the same route directory as `+page.svelte`?
**Fix**: Form actions must export from `+page.server.ts`, not `+server.ts`

### 3. Adapter not configured for deployment target
**Symptom**: Build works locally, fails on deploy
**Fix**: Install correct adapter (`@sveltejs/adapter-vercel`, `adapter-node`, etc.) and set in `svelte.config.js`

### 4. Svelte 5 runes syntax used with Svelte 4 compiler
**Symptom**: `$state`, `$derived` cause parse errors
**Check**: Is `"svelte": "^5"` in package.json?
**Fix**: Upgrade to Svelte 5 or use legacy store syntax for Svelte 4

### 5. Missing `await` in load function causes undefined data
**Symptom**: `data.items` is undefined on first render
**Fix**: Ensure load function is `async` and all fetches are `await`ed before `return`
\`\`\`

### .claudeignore additions

\`\`\`
node_modules/**
.svelte-kit/**
build/**
dist/**
coverage/**
\`\`\`
```

- [ ] **Step 5: Verify all 4 examples exist and are readable**

Run:
```bash
ls examples/*.md
```

Expected: `angular.md  django.md  express.md  fastapi.md  go.md  laravel.md  nestjs.md  nextjs.md  nuxtjs.md  rails.md  spring-boot.md  svelte.md  vue.md`

- [ ] **Step 6: Commit**

```bash
git add examples/fastapi.md examples/go.md examples/spring-boot.md examples/svelte.md
git commit -m "feat: add FastAPI, Go, Spring Boot, Svelte framework examples"
```

---

## Task 9: Opt-in hooks template

**Files:**
- Create: `templates/hooks/session-end-token-report.sh`

- [ ] **Step 1: Create templates/hooks/ directory and hook script**

```bash
mkdir -p templates/hooks
```

Create `templates/hooks/session-end-token-report.sh`:

```bash
#!/bin/bash
# session-end-token-report.sh
#
# Opt-in Claude Code session-end hook.
# Appends a token usage estimate to .claude/sessions/token-log.md
#
# INSTALL: Copy to .claude/hooks/session-end-token-report.sh
# and ensure it is referenced in your Claude Code settings.

LOG_FILE=".claude/sessions/token-log.md"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

# Count tokens in auto-loadable files (word count × 1.3 as proxy)
WORD_COUNT=$(find . -maxdepth 3 \
  \( -name "*.md" -path "./.claude/*.md" -o -name "CLAUDE.md" \) \
  -not -path "./.claude/completions/*" \
  -not -path "./.claude/sessions/*" \
  2>/dev/null | xargs wc -w 2>/dev/null | tail -1 | awk '{print $1}')

APPROX_TOKENS=$(echo "$WORD_COUNT * 1.3 / 1" | bc 2>/dev/null || echo "?")

mkdir -p "$(dirname "$LOG_FILE")"

if [ ! -f "$LOG_FILE" ]; then
  echo "# Token Log" > "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo "| Date | Time | Est. Session Tokens |" >> "$LOG_FILE"
  echo "|------|------|---------------------|" >> "$LOG_FILE"
fi

echo "| $DATE | $TIME | ~${APPROX_TOKENS} |" >> "$LOG_FILE"
```

- [ ] **Step 2: Make hook executable**

```bash
chmod +x templates/hooks/session-end-token-report.sh
```

- [ ] **Step 3: Commit**

```bash
git add templates/hooks/session-end-token-report.sh
git commit -m "feat: add opt-in session-end token reporting hook"
```

---

## Task 10: Update README + publish prep

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add npx install section at the top of README.md**

Find the existing `## Quick Setup` section and replace:

```markdown
## Quick Setup

Run this in your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash
```
```

With:

```markdown
## Quick Setup

**Option 1: npm (recommended)**

```bash
npx claude-token-optimizer init
```

No install needed. Asks 3 questions, creates the optimized structure in ~30 seconds.

**Measure first** — see your actual token waste before committing:

```bash
npx claude-token-optimizer measure
```

**Option 2: curl (shell fallback)**

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash
```
```

- [ ] **Step 2: Add framework flag docs after the framework table**

Find the existing framework table and add after it:

```markdown
### Framework-aware setup

Pass `--framework` to skip prompts and get optimized `.claudeignore` for your stack:

```bash
npx claude-token-optimizer init --framework nextjs
npx claude-token-optimizer init --framework django
npx claude-token-optimizer init --framework go
```

Supported: `express`, `nextjs`, `vue`, `nuxtjs`, `angular`, `django`, `rails`, `nestjs`, `laravel`, `fastapi`, `go`, `spring-boot`, `svelte`
```

- [ ] **Step 3: Run full test suite one last time**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 4: Final smoke test**

```bash
node bin/cto.js --help
node bin/cto.js measure
node bin/cto.js init --help
```

Expected: all three commands produce correct output, no errors.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add npx install instructions and framework flag docs"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ npm package with `cto` binary — Task 1
- ✅ `measure` command with real tokenizer — Tasks 2, 3, 5
- ✅ `init` command with `--framework` flag — Tasks 4, 6
- ✅ FastAPI, Go, Spring Boot, Svelte examples — Task 8
- ✅ Opt-in hook template — Task 9
- ✅ README updated with npx instructions — Task 10
- ✅ `init.sh` kept as legacy fallback — not deleted anywhere in this plan

**Type consistency check:**
- `scanAutoLoadFiles(dir)` → `{ path, content }[]` — used consistently in scanner.js and measure.js
- `buildReport(dir)` → `{ before, after, savings, files }` — defined in measure.js, tested in measure.test.js
- `runInit(dir, options)` — used in init.js and init.test.js with same signature
- `getClaudeIgnore(framework)` → `string` — used in init.js

**No placeholders:** All code blocks are complete. All test assertions are specific. All commands include expected output.
