import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { computeDiff, formatDiffReport } from '../src/commands/diff.js';

const binPath = path.resolve(import.meta.dirname, '../bin/cto.js');

describe('unit — pure logic', () => {
  it('computeDiff: reports token reduction when current is smaller', () => {
    const large = 'word '.repeat(200);
    const small = 'word '.repeat(100);
    const d = computeDiff(small, large);
    assert.ok(d.tokenDelta < 0, `expected negative delta, got ${d.tokenDelta}`);
    assert.ok(d.tokenPct > 0, `expected positive pct, got ${d.tokenPct}`);
    assert.ok(d.backupTokens > d.currentTokens);
  });

  it('computeDiff: reports token increase when current is larger', () => {
    const small = 'word '.repeat(50);
    const large = 'word '.repeat(150);
    const d = computeDiff(large, small);
    assert.ok(d.tokenDelta > 0, `expected positive delta, got ${d.tokenDelta}`);
    assert.ok(d.currentTokens > d.backupTokens);
  });

  it('computeDiff: reports zero delta for identical content', () => {
    const content = 'identical content here';
    const d = computeDiff(content, content);
    assert.strictEqual(d.tokenDelta, 0);
  });

  it('computeDiff: line delta reflects line count difference', () => {
    const backup = 'line1\nline2\nline3\nline4\nline5\n';
    const current = 'line1\nline2\n';
    const d = computeDiff(current, backup);
    assert.ok(d.lineDelta < 0, `expected negative line delta, got ${d.lineDelta}`);
    assert.strictEqual(d.backupLines, 6);
    assert.strictEqual(d.currentLines, 3);
  });

  it('computeDiff: pct is zero when backup has zero tokens', () => {
    const d = computeDiff('some content', '');
    assert.strictEqual(d.tokenPct, 0);
  });

  it('computeDiff: returns all expected fields', () => {
    const d = computeDiff('hello world', 'hello world test');
    assert.ok('currentTokens' in d);
    assert.ok('backupTokens' in d);
    assert.ok('tokenDelta' in d);
    assert.ok('tokenPct' in d);
    assert.ok('currentLines' in d);
    assert.ok('backupLines' in d);
    assert.ok('lineDelta' in d);
  });

  it('formatDiffReport: returns array of strings', () => {
    const d = computeDiff('hello world', 'hello world and more content here');
    const lines = formatDiffReport(d, 'CLAUDE.md', 'CLAUDE.md.bak');
    assert.ok(Array.isArray(lines));
    assert.ok(lines.length > 0);
    assert.ok(lines.every((l) => typeof l === 'string'));
  });

  it('formatDiffReport: includes target label in output', () => {
    const d = computeDiff('short', 'much longer content here '.repeat(10));
    const lines = formatDiffReport(d, 'CLAUDE.md', 'CLAUDE.md.bak');
    const joined = lines.join('\n');
    assert.ok(joined.includes('CLAUDE.md'));
  });

  it('formatDiffReport: shows "Saved" when current is smaller', () => {
    const d = computeDiff('short', 'much longer content here '.repeat(10));
    const joined = formatDiffReport(d, 'CLAUDE.md', 'CLAUDE.md.bak').join('\n');
    assert.ok(joined.includes('Saved'));
  });

  it('formatDiffReport: shows "Added" when current is larger', () => {
    const d = computeDiff('much longer content here '.repeat(10), 'short');
    const joined = formatDiffReport(d, 'CLAUDE.md', 'CLAUDE.md.bak').join('\n');
    assert.ok(joined.includes('Added'));
  });

  it('formatDiffReport: shows no change message for identical content', () => {
    const d = computeDiff('same content', 'same content');
    const joined = formatDiffReport(d, 'CLAUDE.md', 'CLAUDE.md.bak').join('\n');
    assert.ok(joined.includes('No token change'));
  });
});

describe('integration — filesystem', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-diff-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('diffCommand runs without error when .bak exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'shorter content');
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md.bak'), 'much longer content here '.repeat(20));
    const { diffCommand } = await import('../src/commands/diff.js');
    const origCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      await diffCommand({});
    } finally {
      process.chdir(origCwd);
    }
  });
});

describe('e2e — subprocess', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-diff-e2e-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('exits 0 with no-backup message when no .bak file exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'some content');
    const result = spawnSync(process.execPath, [binPath, 'diff'], {
      cwd: tmpDir,
      encoding: 'utf8',
    });
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}\nstderr: ${result.stderr}`);
    assert.ok(
      result.stdout.includes('No CLAUDE.md.bak found'),
      `expected "No CLAUDE.md.bak found" in stdout, got:\n${result.stdout}`
    );
  });
});
