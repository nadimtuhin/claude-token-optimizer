import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  removeExtraBlankLines,
  shortenCodeFences,
  truncateLongLists,
  applyCompressionRules,
  countBlankLineBlocks,
  countVerboseFences,
  computeTokenStats,
  compressCommand,
} from '../src/commands/compress.js';
import { countTokens } from '../src/lib/tokenizer.js';

// ─── unit — pure logic ───────────────────────────────────────────────────────

describe('unit — pure logic', () => {

  describe('removeExtraBlankLines', () => {
    it('collapses 3+ blank lines to double newline', () => {
      const input = 'line1\n\n\n\nline2';
      assert.ok(!removeExtraBlankLines(input).includes('\n\n\n'));
      assert.ok(removeExtraBlankLines(input).includes('line1\n\nline2'));
    });

    it('leaves single blank lines untouched', () => {
      const input = 'line1\n\nline2';
      assert.strictEqual(removeExtraBlankLines(input), input);
    });

    it('collapses multiple instances', () => {
      const input = 'a\n\n\nb\n\n\n\nc';
      const out = removeExtraBlankLines(input);
      assert.ok(!out.includes('\n\n\n'));
      assert.ok(out.includes('a\n\nb\n\nc'));
    });
  });

  describe('shortenCodeFences', () => {
    it('shortens javascript to js', () => {
      assert.ok(shortenCodeFences('```javascript\ncode\n```').startsWith('```js'));
    });

    it('shortens typescript to ts', () => {
      assert.ok(shortenCodeFences('```typescript\n```').includes('```ts'));
    });

    it('shortens python to py', () => {
      assert.ok(shortenCodeFences('```python\n```').includes('```py'));
    });

    it('leaves short labels untouched', () => {
      const input = '```js\ncode\n```';
      assert.strictEqual(shortenCodeFences(input), input);
    });

    it('leaves bash untouched (no mapping)', () => {
      const input = '```bash\ncode\n```';
      assert.strictEqual(shortenCodeFences(input), input);
    });
  });

  describe('truncateLongLists', () => {
    it('truncates lists with more than maxItems items', () => {
      const items = Array.from({ length: 7 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
      const { result, changes } = truncateLongLists(items, 3);
      const resultLines = result.split('\n').filter(l => l.startsWith('- '));
      assert.ok(resultLines.length <= 4, `got ${resultLines.length} lines`);
      assert.ok(changes.length > 0, 'should report a change');
    });

    it('leaves lists at or below maxItems untouched', () => {
      const items = Array.from({ length: 5 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
      const { result, changes } = truncateLongLists(items, 5);
      assert.strictEqual(changes.length, 0);
      assert.ok(result.includes('Item 5'));
    });

    it('includes "N more" comment when truncating', () => {
      const items = Array.from({ length: 8 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
      const { result } = truncateLongLists(items, 3);
      assert.ok(result.includes('more'), `expected 'more' in: ${result}`);
    });
  });

  describe('countBlankLineBlocks', () => {
    it('counts blocks of 3+ newlines', () => {
      assert.strictEqual(countBlankLineBlocks('a\n\n\nb\n\n\n\nc'), 2);
    });

    it('returns 0 when no extra blank lines', () => {
      assert.strictEqual(countBlankLineBlocks('a\n\nb\n\nc'), 0);
    });
  });

  describe('countVerboseFences', () => {
    it('counts verbose language labels', () => {
      const input = '```javascript\ncode\n```\n```typescript\ncode\n```';
      assert.strictEqual(countVerboseFences(input), 2);
    });

    it('does not count already-short labels', () => {
      assert.strictEqual(countVerboseFences('```js\ncode\n```'), 0);
    });

    it('does not count bash (not in map)', () => {
      assert.strictEqual(countVerboseFences('```bash\ncode\n```'), 0);
    });
  });

  describe('computeTokenStats', () => {
    it('returns correct structure', () => {
      const stats = computeTokenStats('hello world', 'hello');
      assert.ok('beforeTokens' in stats);
      assert.ok('afterTokens' in stats);
      assert.ok('saved' in stats);
      assert.ok('pct' in stats);
    });

    it('saved = beforeTokens - afterTokens', () => {
      const original = 'hello world foo bar';
      const compressed = 'hello';
      const stats = computeTokenStats(original, compressed);
      assert.strictEqual(stats.saved, stats.beforeTokens - stats.afterTokens);
    });

    it('pct is 0 when original is empty', () => {
      const stats = computeTokenStats('', '');
      assert.strictEqual(stats.pct, 0);
    });
  });

  describe('applyCompressionRules', () => {
    it('reports blank line removal changes', () => {
      const input = Array.from({ length: 5 }, (_, i) => `## Section ${i}\n\ncontent\n`).join('\n\n\n');
      const { changes } = applyCompressionRules(input);
      assert.ok(changes.some(c => c.includes('blank')), 'should report blank line removal');
    });

    it('reduces tokens when many verbose code fences present', () => {
      const fences = Array.from({ length: 10 }, () =>
        '```javascript\nconst x = 1;\n```').join('\n\n');
      const { result, changes } = applyCompressionRules(fences);
      const before = countTokens(fences);
      const after = countTokens(result);
      assert.ok(after <= before, `after (${after}) should be <= before (${before})`);
      assert.ok(changes.some(c => c.includes('fence')), 'should report fence changes');
    });

    it('never removes section headings', () => {
      const input = '# Title\n\n## Section One\n\ncontent\n\n## Section Two\n\ncontent\n';
      const { result } = applyCompressionRules(input);
      assert.ok(result.includes('## Section One'));
      assert.ok(result.includes('## Section Two'));
    });

    it('produces same output on same input (deterministic)', () => {
      const input = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
      const r1 = applyCompressionRules(input).result;
      const r2 = applyCompressionRules(input).result;
      assert.strictEqual(r1, r2);
    });
  });

});

// ─── integration — filesystem ────────────────────────────────────────────────

describe('integration — filesystem', () => {
  let tmpDir;
  let origCwd;

  before(() => {
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-test-'));
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('dry-run: does not write files when changes exist', async () => {
    const content = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), content, 'utf8');

    await compressCommand({ dryRun: true });

    const after = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.strictEqual(after, content, 'file should not be modified in dry-run');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'CLAUDE.md.bak')), 'no backup in dry-run');
  });

  it('dry-run: returns without error when no changes', async () => {
    const content = 'clean content\n\nno issues here\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), content, 'utf8');

    await compressCommand({ dryRun: true });

    const after = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.strictEqual(after, content);
  });
});

// ─── e2e — subprocess ────────────────────────────────────────────────────────

describe('e2e — subprocess', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-e2e-'));
    // content with compression opportunities so the report shows changes
    const content = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), content, 'utf8');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exits 0 and prints header with --dry-run', () => {
    const binPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../bin/cto.js',
    );
    const result = spawnSync(process.execPath, [binPath, 'compress', '--dry-run'], {
      cwd: tmpDir,
      encoding: 'utf8',
      timeout: 10000,
    });

    assert.strictEqual(result.status, 0, `exit code was ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
    assert.ok(
      result.stdout.includes('cto compress'),
      `expected "cto compress" in stdout:\n${result.stdout}`,
    );
  });

  it('does not modify CLAUDE.md with --dry-run', () => {
    const binPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../bin/cto.js',
    );
    const before = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');

    spawnSync(process.execPath, [binPath, 'compress', '--dry-run'], {
      cwd: tmpDir,
      encoding: 'utf8',
      timeout: 10000,
    });

    const after = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.strictEqual(after, before, 'CLAUDE.md should be unchanged after --dry-run');
  });
});
