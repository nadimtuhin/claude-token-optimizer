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
