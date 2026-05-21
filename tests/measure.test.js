import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildAfterFiles,
  computeSavingsPct,
  formatFileBreakdown,
  formatMeasureReport,
  buildReport,
  runMeasure,
} from '../src/commands/measure.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CTO_BIN = path.resolve(__dirname, '../bin/cto.js');

// ─── unit — pure logic ────────────────────────────────────────────────────────

describe('unit — pure logic', () => {
  describe('buildAfterFiles()', () => {
    it('returns 5 essential files', () => {
      const files = buildAfterFiles('2026-05-21');
      assert.equal(files.length, 5);
    });

    it('each file has label and tokens', () => {
      const files = buildAfterFiles('2026-05-21');
      for (const f of files) {
        assert.ok(typeof f.label === 'string', 'label should be string');
        assert.ok(typeof f.tokens === 'number' && f.tokens > 0, `tokens should be > 0 for ${f.label}`);
      }
    });

    it('includes CLAUDE.md label', () => {
      const files = buildAfterFiles('2026-05-21');
      assert.ok(files.some(f => f.label === 'CLAUDE.md'));
    });
  });

  describe('computeSavingsPct()', () => {
    it('returns correct percentage', () => {
      assert.equal(computeSavingsPct(1000, 900), 90);
    });

    it('returns 0 when before is 0', () => {
      assert.equal(computeSavingsPct(0, 0), 0);
    });

    it('rounds to integer', () => {
      const pct = computeSavingsPct(3, 1);
      assert.equal(typeof pct, 'number');
      assert.equal(pct, Math.round(pct));
    });
  });

  describe('formatFileBreakdown()', () => {
    it('returns placeholder for empty files array', () => {
      const lines = formatFileBreakdown([]);
      assert.equal(lines.length, 1);
      assert.ok(lines[0].includes('no auto-loadable'));
    });

    it('formats each file as a line', () => {
      const files = [{ label: 'CLAUDE.md', tokens: 100 }, { label: 'README.md', tokens: 50 }];
      const lines = formatFileBreakdown(files);
      assert.equal(lines.length, 2);
      assert.ok(lines[0].includes('CLAUDE.md'));
      assert.ok(lines[1].includes('README.md'));
    });

    it('includes token counts', () => {
      const files = [{ label: 'CLAUDE.md', tokens: 123 }];
      const lines = formatFileBreakdown(files);
      assert.ok(lines[0].includes('123'));
    });
  });

  describe('formatMeasureReport()', () => {
    it('includes directory name in header', () => {
      const report = { before: 0, after: 100, savings: -100, files: [], afterFiles: [] };
      const lines = formatMeasureReport(report, false, 'myproject');
      assert.ok(lines.some(l => typeof l === 'string' && l.includes('myproject')));
    });

    it('shows "Nothing to measure" when before is 0', () => {
      const report = { before: 0, after: 100, savings: -100, files: [], afterFiles: [] };
      const lines = formatMeasureReport(report, false, 'myproject');
      const text = lines.join('\n');
      assert.ok(text.includes('Nothing to measure'));
    });

    it('shows "Already initialized" when isInitialized is true', () => {
      const afterFiles = buildAfterFiles('2026-05-21');
      const after = afterFiles.reduce((s, f) => s + f.tokens, 0);
      const report = { before: 500, after, savings: 500 - after, files: [{ label: 'CLAUDE.md', tokens: 500 }], afterFiles };
      const lines = formatMeasureReport(report, true, 'myproject');
      const text = lines.join('\n');
      assert.ok(text.includes('Already initialized'));
      assert.ok(!text.includes('cto init'));
    });

    it('shows AFTER section and cto init CTA when not initialized', () => {
      const afterFiles = buildAfterFiles('2026-05-21');
      const after = afterFiles.reduce((s, f) => s + f.tokens, 0);
      const report = { before: 5000, after, savings: 5000 - after, files: [{ label: 'README.md', tokens: 5000 }], afterFiles };
      const lines = formatMeasureReport(report, false, 'myproject');
      const text = lines.join('\n');
      assert.ok(text.includes('AFTER'));
      assert.ok(text.includes('cto init'));
    });
  });
});

// ─── integration — filesystem ─────────────────────────────────────────────────

describe('integration — filesystem', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  describe('buildReport()', () => {
    it('returns before and after token counts', async () => {
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Hello world\n\nThis is a test project with some documentation.');
      const report = await buildReport(tmpDir);
      assert.ok(typeof report.before === 'number', 'before should be a number');
      assert.ok(typeof report.after === 'number', 'after should be a number');
    });

    it('before is 0 for empty directory', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-empty-'));
      try {
        const report = await buildReport(emptyDir);
        assert.equal(report.before, 0);
      } finally {
        fs.rmSync(emptyDir, { recursive: true });
      }
    });

    it('after equals sum of afterFiles token counts', async () => {
      const report = await buildReport(tmpDir);
      assert.ok(Array.isArray(report.afterFiles), 'afterFiles should be an array');
      assert.equal(report.afterFiles.length, 5, 'should have 5 essential files');
      const sum = report.afterFiles.reduce((s, f) => s + f.tokens, 0);
      assert.equal(report.after, sum, 'after should equal sum of afterFiles tokens');
      assert.ok(report.after > 0, 'after should be non-zero (real tokenization)');
    });

    it('savings is before minus after', async () => {
      const bigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-big-'));
      try {
        fs.writeFileSync(path.join(bigDir, 'README.md'), '# Big doc\n' + 'word '.repeat(500));
        const report = await buildReport(bigDir);
        assert.equal(report.savings, report.before - report.after);
      } finally {
        fs.rmSync(bigDir, { recursive: true });
      }
    });

    it('includes file breakdown', async () => {
      const claudeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-claude-'));
      try {
        fs.writeFileSync(path.join(claudeDir, 'CLAUDE.md'), '# Claude');
        const report = await buildReport(claudeDir);
        assert.ok(Array.isArray(report.files));
        assert.ok(report.files.length > 0);
        assert.ok('label' in report.files[0]);
        assert.ok('tokens' in report.files[0]);
      } finally {
        fs.rmSync(claudeDir, { recursive: true });
      }
    });
  });

  describe('runMeasure() CTA', () => {
    it('shows cto init CTA for uninitialized project', async () => {
      const uninitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-uninit-'));
      try {
        fs.writeFileSync(path.join(uninitDir, 'README.md'), '# Big doc\n' + 'word '.repeat(500));
        const lines = [];
        const orig = console.log;
        console.log = (...args) => lines.push(args.join(' '));
        await runMeasure(uninitDir);
        console.log = orig;
        const output = lines.join('\n');
        assert.ok(output.includes('cto init'), 'should suggest cto init for uninitialized project');
        assert.ok(output.includes('AFTER'), 'should show AFTER section for uninitialized project');
      } finally {
        fs.rmSync(uninitDir, { recursive: true });
      }
    });

    it('shows already-initialized message when CLAUDE.md exists', async () => {
      const initDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-init-'));
      try {
        fs.writeFileSync(path.join(initDir, 'CLAUDE.md'), '# Claude\n\nProject overview.');
        fs.writeFileSync(path.join(initDir, 'README.md'), '# Big doc\n' + 'word '.repeat(500));
        const lines = [];
        const orig = console.log;
        console.log = (...args) => lines.push(args.join(' '));
        await runMeasure(initDir);
        console.log = orig;
        const output = lines.join('\n');
        assert.ok(output.includes('Already initialized'), 'should show already-initialized for projects with CLAUDE.md');
        assert.ok(!output.includes('cto init'), 'should not suggest cto init when already initialized');
        assert.ok(!output.includes('AFTER'), 'should not show AFTER section when already initialized');
      } finally {
        fs.rmSync(initDir, { recursive: true });
      }
    });
  });
});

// ─── e2e — subprocess ─────────────────────────────────────────────────────────

describe('e2e — subprocess', () => {
  it('exits 0 in empty directory', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-measure-e2e-'));
    try {
      const exitCode = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [CTO_BIN, 'measure'], {
          cwd: tmpDir,
          env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        });
        const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('e2e measure timed out')); }, 10000);
        child.on('close', code => { clearTimeout(timeout); resolve(code); });
      });
      assert.equal(exitCode, 0, `expected exit code 0, got ${exitCode}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});
