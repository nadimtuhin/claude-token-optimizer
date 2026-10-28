import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseFrontmatter, serializeFrontmatter, classifyRule } from '../src/lib/mdc.js';
import { getTarget, getDefaultTarget } from '../src/lib/targets.js';
import { buildAgentsMd, buildCursorIgnore, getCursorInitDirs } from '../src/lib/cursor-builders.js';
import { scanAutoLoadFiles } from '../src/lib/scanner.js';
import { getClaudeIgnore } from '../src/lib/frameworks.js';

const binPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../bin/cto.js',
);

function runCto(args, opts = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    encoding: 'utf8',
    timeout: 10000,
    ...opts,
  });
}

function assertExists(tmpDir, relPath) {
  assert.ok(fs.existsSync(path.join(tmpDir, relPath)), `${relPath} should exist`);
}

// ─── unit — mdc.js ──────────────────────────────────────────────────────────

describe('unit — mdc.js', () => {
  describe('parseFrontmatter', () => {
    it('parses valid frontmatter', () => {
      const content = '---\nalwaysApply: true\ndescription: test\n---\nbody text';
      const { frontmatter, body } = parseFrontmatter(content);
      assert.strictEqual(frontmatter, 'alwaysApply: true\ndescription: test');
      assert.strictEqual(body, 'body text');
    });

    it('handles CRLF line endings', () => {
      const content = '---\r\nalwaysApply: true\r\n---\r\nbody';
      const { frontmatter, body } = parseFrontmatter(content);
      assert.strictEqual(frontmatter, 'alwaysApply: true');
      assert.strictEqual(body, 'body');
    });

    it('returns null frontmatter when no opening delimiter', () => {
      const content = '# Title\n\nbody';
      const { frontmatter } = parseFrontmatter(content);
      assert.strictEqual(frontmatter, null);
    });

    it('returns null frontmatter when unterminated', () => {
      const content = '---\nalwaysApply: true\nbody without close';
      const { frontmatter } = parseFrontmatter(content);
      assert.strictEqual(frontmatter, null);
    });

    it('handles empty frontmatter', () => {
      const content = '---\n---\nbody';
      const { frontmatter, body } = parseFrontmatter(content);
      assert.strictEqual(frontmatter, '');
      assert.strictEqual(body, 'body');
    });

    it('handles quoted values', () => {
      const content = '---\ndescription: "quoted desc"\n---\nbody';
      const { frontmatter } = parseFrontmatter(content);
      assert.ok(frontmatter.includes('description: "quoted desc"'));
    });
  });

  describe('serializeFrontmatter', () => {
    it('recombines frontmatter and body', () => {
      const result = serializeFrontmatter('alwaysApply: true', 'body');
      assert.strictEqual(result, '---\nalwaysApply: true\n---\nbody');
    });

    it('returns body when frontmatter is null', () => {
      const result = serializeFrontmatter(null, 'body');
      assert.strictEqual(result, 'body');
    });
  });

  describe('classifyRule', () => {
    it('classifies alwaysApply: true as always', () => {
      const content = '---\nalwaysApply: true\n---\nbody';
      const { policy } = classifyRule(content);
      assert.strictEqual(policy, 'always');
    });

    it('classifies globs as scoped', () => {
      const content = '---\nglobs:\n  - src/**/*.ts\n---\nbody';
      const { policy, globs } = classifyRule(content);
      assert.strictEqual(policy, 'scoped');
      assert.deepStrictEqual(globs, ['src/**/*.ts']);
    });

    it('classifies alwaysApply: false + globs as scoped', () => {
      const content = '---\nalwaysApply: false\nglobs:\n  - src/**/*.ts\n---\nbody';
      const { policy } = classifyRule(content);
      assert.strictEqual(policy, 'scoped');
    });

    it('classifies description-only as agent', () => {
      const content = '---\ndescription: Some rule\n---\nbody';
      const { policy, description } = classifyRule(content);
      assert.strictEqual(policy, 'agent');
      assert.strictEqual(description, 'Some rule');
    });

    it('classifies no frontmatter as manual', () => {
      const content = '# Just a heading\n\nbody';
      const { policy } = classifyRule(content);
      assert.strictEqual(policy, 'manual');
    });

    it('handles empty globs list', () => {
      const content = '---\nglobs: []\n---\nbody';
      const { policy } = classifyRule(content);
      assert.strictEqual(policy, 'manual');
    });

    it('handles null globs', () => {
      const content = '---\nglobs:\n---\nbody';
      const { policy } = classifyRule(content);
      assert.strictEqual(policy, 'manual');
    });

    it('handles single-line globs string', () => {
      const content = '---\nglobs: "src/**/*.ts"\n---\nbody';
      const { policy, globs } = classifyRule(content);
      assert.strictEqual(policy, 'scoped');
      assert.deepStrictEqual(globs, ['src/**/*.ts']);
    });
  });
});

// ─── unit — targets.js ──────────────────────────────────────────────────────

describe('unit — targets.js', () => {
  it('getDefaultTarget returns claude-code', () => {
    const t = getDefaultTarget();
    assert.strictEqual(t.id, 'claude-code');
  });

  it('getTarget returns cursor', () => {
    const t = getTarget('cursor');
    assert.strictEqual(t.id, 'cursor');
    assert.strictEqual(t.instructionFile, 'AGENTS.md');
  });

  it('getTarget exits 1 for unknown target', () => {
    const result = runCto(['init', '--target', 'unknown', '--yes']);
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('Unknown target'));
  });
});

// ─── unit — cursor-builders.js ──────────────────────────────────────────────

describe('unit — cursor-builders.js', () => {
  it('buildAgentsMd contains AGENTS.md header', () => {
    const md = buildAgentsMd('App', 'Stack', 'Features', '2026-10-20');
    assert.ok(md.startsWith('# AGENTS.md'));
    assert.ok(md.includes('Stack'));
  });

  it('buildCursorIgnore has base patterns', () => {
    const ignore = buildCursorIgnore();
    assert.ok(ignore.includes('node_modules'));
    assert.ok(ignore.includes('.git'));
  });

  it('getCursorInitDirs returns cursor dirs', () => {
    const dirs = getCursorInitDirs();
    assert.ok(dirs.includes('.cursor/rules'));
    assert.ok(dirs.includes('docs'));
  });
});

// ─── integration — cursor init ──────────────────────────────────────────────

describe('integration — cursor init', () => {
  let tmpDir;
  let origCwd;

  before(() => {
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-cursor-init-'));
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates AGENTS.md, .cursorignore, .cursor/rules/, docs/INDEX.md', async () => {
    const result = runCto(['init', '--target', 'cursor', '--yes']);
    assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    assertExists(tmpDir, 'AGENTS.md');
    assertExists(tmpDir, '.cursorignore');
    assertExists(tmpDir, path.join('.cursor', 'rules'));
    assertExists(tmpDir, path.join('docs', 'INDEX.md'));
  });

  it('does not create .claude/ files', () => {
    assert.ok(!fs.existsSync(path.join(tmpDir, '.claude')), '.claude/ should not exist');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should not exist');
  });

});

// ─── integration — cursor measure ───────────────────────────────────────────

describe('integration — cursor measure', () => {
  let tmpDir;
  let origCwd;

  before(() => {
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-cursor-measure-'));
    process.chdir(tmpDir);

    // Create cursor project structure
    fs.mkdirSync(path.join(tmpDir, '.cursor', 'rules'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# AGENTS.md\n\nbody', 'utf8');
    fs.writeFileSync(path.join(tmpDir, '.cursor', 'rules', 'backend.mdc'), '---\nalwaysApply: true\n---\nbackend rules', 'utf8');
    fs.writeFileSync(path.join(tmpDir, '.cursor', 'rules', 'frontend.mdc'), '---\nglobs:\n  - src/**/*.ts\n---\nfrontend rules', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'docs', 'INDEX.md'), '# Docs', 'utf8');
  });

  after(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('discovers AGENTS.md, .cursor/rules/**/*.mdc, and docs/', async () => {
    const target = getTarget('cursor');
    const files = await scanAutoLoadFiles(tmpDir, target);
    const paths = files.map(f => path.relative(tmpDir, f.path));

    assert.ok(paths.includes('AGENTS.md'), 'should find AGENTS.md');
    assert.ok(paths.includes(path.join('.cursor', 'rules', 'backend.mdc')), 'should find backend.mdc');
    assert.ok(paths.includes(path.join('.cursor', 'rules', 'frontend.mdc')), 'should find frontend.mdc');
    assert.ok(paths.includes(path.join('docs', 'INDEX.md')), 'should find docs/INDEX.md');
  });

  it('measure --target cursor exits 0', () => {
    const result = runCto(['measure', '--target', 'cursor']);
    assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  });
});

// ─── regression — claude-code unchanged ──────────────────────────────────────

describe('regression — claude-code unchanged', () => {
  let tmpDir;
  let origCwd;

  before(() => {
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-claude-regression-'));
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('init creates CLAUDE.md and .claude/ files', async () => {
    const result = runCto(['init', '--yes']);
    assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    assertExists(tmpDir, 'CLAUDE.md');
    assertExists(tmpDir, '.claudeignore');
    assertExists(tmpDir, path.join('.claude', 'COMMON_MISTAKES.md'));
  });

  it('getClaudeIgnore returns expected patterns', () => {
    const ignore = getClaudeIgnore('express');
    assert.ok(ignore.includes('node_modules'));
    assert.ok(ignore.includes('.git'));
  });

  it('measure without --target uses claude-code', () => {
    const result = runCto(['measure']);
    assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  });
});
