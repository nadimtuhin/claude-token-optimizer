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
  stripMarkup,
  applyCompressionRules,
  countBlankLineBlocks,
  countVerboseFences,
  computeTokenStats,
  compressCommand,
  printCompressionReport,
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

    it('leaves list-like lines inside fenced code untouched', () => {
      const items = Array.from({ length: 8 }, (_, i) => `  - run: step${i}`).join('\n');
      const content = '```yaml\nsteps:\n' + items + '\n```\n';
      const { result, changes } = truncateLongLists(content, 3);
      assert.strictEqual(result, content);
      assert.strictEqual(changes.length, 0);
    });

    it('still truncates a list that follows a closed code fence', () => {
      const items = Array.from({ length: 8 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
      const { result, changes } = truncateLongLists('```\ncode\n```\n' + items, 3);
      assert.ok(!result.includes('Item 8'));
      assert.strictEqual(changes.length, 1);
    });
  });

  describe('stripMarkup', () => {
    it('removes a single-line HTML comment', () => {
      const input = 'before\n<!-- comment -->\nafter';
      const { result, changes } = stripMarkup(input);
      assert.ok(!result.includes('<!--'));
      assert.ok(!result.includes('comment'));
      assert.ok(result.includes('before'));
      assert.ok(result.includes('after'));
      assert.ok(changes.some(c => c.includes('HTML comment')), `changes: ${changes}`);
    });

    it('removes a multi-line HTML comment', () => {
      const input = 'before\n<!--\nline1\nline2\n-->\nafter';
      const { result, changes } = stripMarkup(input);
      assert.ok(!result.includes('<!--'));
      assert.ok(!result.includes('line1'));
      assert.ok(result.includes('before'));
      assert.ok(result.includes('after'));
      assert.ok(changes.some(c => c.includes('HTML comment')), `changes: ${changes}`);
    });

    it('replaces an inline SVG block with [SVG Asset]', () => {
      const input = 'before\n<svg width="24" height="24"><path d="M0 0"/></svg>\nafter';
      const { result, changes } = stripMarkup(input);
      assert.ok(result.includes('[SVG Asset]'));
      assert.ok(!result.includes('<svg'));
      assert.ok(!result.includes('<path'));
      assert.ok(changes.some(c => c.includes('SVG')), `changes: ${changes}`);
    });

    it('strips HTML comments inside code fences (not exempt)', () => {
      const input = '```html\n<!-- fenced comment -->\ncode\n```';
      const { result } = stripMarkup(input);
      assert.ok(!result.includes('<!--'));
      assert.ok(!result.includes('fenced comment'));
    });

    it('leaves residue on nested <svg> (lazy match ceiling)', () => {
      const input = '<svg width="10"><svg width="5"></svg></svg>';
      const { result } = stripMarkup(input);
      assert.ok(result.includes('[SVG Asset]'));
      assert.ok(result.includes('</svg>'), 'nested svg leaves a residual closing tag');
    });

    it('leaves unclosed <svg (no closing tag) untouched', () => {
      const input = 'before\n<svg width="10">no closing tag\nafter';
      const { result, changes } = stripMarkup(input);
      assert.strictEqual(result, input);
      assert.ok(!changes.some(c => c.includes('SVG')), `changes: ${changes}`);
    });

    it('does not treat a self-closing <svg .../> as an opening tag (no cross-match content loss)', () => {
      const input = '<svg a/> KEEP ME <svg b="1">x</svg> tail';
      const { result } = stripMarkup(input);
      assert.ok(result.includes('KEEP ME'), 'content between self-closing and paired svg must survive');
      assert.ok(result.includes('<svg a/>'), 'self-closing svg left untouched');
      assert.ok(result.includes('[SVG Asset]'), 'paired svg still collapsed');
    });

    it('leaves a lone self-closing <svg .../> untouched', () => {
      const input = 'before <svg width="10" /> after';
      const { result, changes } = stripMarkup(input);
      assert.strictEqual(result, input);
      assert.ok(!changes.some(c => c.includes('SVG')), `changes: ${changes}`);
    });

    it('does not match <svgfoo> (word-boundary guard)', () => {
      const input = 'before <svgfoo attr>content</svg> after';
      const { result } = stripMarkup(input);
      assert.strictEqual(result, input);
    });

    it('keeps content between two comments (lazy comment match)', () => {
      const input = '<!-- a --> keep <!-- b -->';
      const { result, changes } = stripMarkup(input);
      assert.ok(result.includes('keep'));
      assert.ok(changes.some(c => c.includes('2 HTML comments')), `changes: ${changes}`);
    });

    it('leaves plain content untouched', () => {
      const input = '# Title\n\nSome plain content with no markup.\n';
      const { result, changes } = stripMarkup(input);
      assert.strictEqual(result, input);
      assert.strictEqual(changes.length, 0);
    });

    it('produces same output on same input (deterministic)', () => {
      const input = 'before\n<!-- c -->\n<svg width="1"><path/></svg>\nafter';
      const r1 = stripMarkup(input).result;
      const r2 = stripMarkup(input).result;
      assert.strictEqual(r1, r2);
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

  describe('printCompressionReport', () => {
    function captureLog(fn) {
      const lines = [];
      const orig = console.log;
      console.log = (...args) => lines.push(args.join(' '));
      try {
        fn();
      } finally {
        console.log = orig;
      }
      return lines.join('\n');
    }

    it('prefixes before/after token counts with ~ (estimate marker)', () => {
      const text = captureLog(() =>
        printCompressionReport({ beforeTokens: 500, afterTokens: 300, saved: 200, pct: 40 }, ['change1']));
      assert.ok(text.includes('~500'), `expected ~500: ${text}`);
      assert.ok(text.includes('~300'), `expected ~300: ${text}`);
    });

    it('includes estimate footnote', () => {
      const text = captureLog(() =>
        printCompressionReport({ beforeTokens: 500, afterTokens: 300, saved: 200, pct: 40 }, []));
      assert.ok(
        text.includes('Counts are estimates (Claude 2 tokenizer)'),
        `expected estimate footnote: ${text}`,
      );
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

    it('reports HTML comment and SVG removal changes', () => {
      const input = '# Title\n<!-- comment -->\n<svg width="1"><path/></svg>\ncontent\n';
      const { result, changes } = applyCompressionRules(input);
      assert.ok(changes.some(c => c.includes('HTML comment')), `changes: ${changes}`);
      assert.ok(changes.some(c => c.includes('SVG')), `changes: ${changes}`);
      assert.ok(result.includes('[SVG Asset]'));
      assert.ok(!result.includes('<!--'));
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

  it('interactive apply prints ~ prefixed saved token count', () => {
    const applyTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-apply-'));
    try {
      const content = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
      fs.writeFileSync(path.join(applyTmpDir, 'CLAUDE.md'), content, 'utf8');
      const binPath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../bin/cto.js',
      );
      const result = spawnSync(process.execPath, [binPath, 'compress'], {
        cwd: applyTmpDir,
        encoding: 'utf8',
        timeout: 10000,
        input: 'y\n',
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      assert.ok(
        /~\d+ tokens freed/.test(result.stdout),
        `expected ~N tokens freed in stdout: ${result.stdout}`,
      );
    } finally {
      fs.rmSync(applyTmpDir, { recursive: true, force: true });
    }
  });

  it('--file compresses the given markdown file instead of CLAUDE.md', () => {
    const fileTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-file-'));
    try {
      const content = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
      fs.mkdirSync(path.join(fileTmpDir, 'docs'));
      fs.writeFileSync(path.join(fileTmpDir, 'docs', 'notes.md'), content, 'utf8');
      const binPath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../bin/cto.js',
      );
      const result = spawnSync(process.execPath, [binPath, 'compress', '--file', 'docs/notes.md'], {
        cwd: fileTmpDir,
        encoding: 'utf8',
        timeout: 10000,
        input: 'y\n',
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      assert.ok(result.stdout.includes('docs/notes.md'), `expected target name in stdout: ${result.stdout}`);
      const after = fs.readFileSync(path.join(fileTmpDir, 'docs', 'notes.md'), 'utf8');
      assert.notStrictEqual(after, content, 'docs/notes.md should be compressed');
      assert.strictEqual(fs.readFileSync(path.join(fileTmpDir, 'docs', 'notes.md.bak'), 'utf8'), content);
      assert.ok(!fs.existsSync(path.join(fileTmpDir, 'CLAUDE.md')), 'CLAUDE.md must not be created');
    } finally {
      fs.rmSync(fileTmpDir, { recursive: true, force: true });
    }
  });

  it('--yes applies changes without reading stdin', () => {
    const yesTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compress-yes-'));
    try {
      const content = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
      fs.writeFileSync(path.join(yesTmpDir, 'CLAUDE.md'), content, 'utf8');
      const binPath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../bin/cto.js',
      );
      const result = spawnSync(process.execPath, [binPath, 'compress', '--yes'], {
        cwd: yesTmpDir,
        encoding: 'utf8',
        timeout: 10000,
        input: '',
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      assert.notStrictEqual(fs.readFileSync(path.join(yesTmpDir, 'CLAUDE.md'), 'utf8'), content, 'CLAUDE.md should be compressed');
      assert.strictEqual(fs.readFileSync(path.join(yesTmpDir, 'CLAUDE.md.bak'), 'utf8'), content);
    } finally {
      fs.rmSync(yesTmpDir, { recursive: true, force: true });
    }
  });
});
