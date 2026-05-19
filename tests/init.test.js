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

  it('throws if CLAUDE.md exists and --force not set', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'existing content');
    await assert.rejects(
      () => runInit(tmpDir, defaultOptions),
      /already exists/
    );
  });

  it('overwrites CLAUDE.md when --force is set', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'existing content');
    await runInit(tmpDir, { ...defaultOptions, force: true });
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.ok(!content.includes('existing content'));
    assert.ok(content.includes('Express API'));
  });
});
