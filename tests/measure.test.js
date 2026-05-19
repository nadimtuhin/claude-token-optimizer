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

  it('after equals sum of afterFiles token counts', async () => {
    const report = await buildReport(tmpDir);
    assert.ok(Array.isArray(report.afterFiles), 'afterFiles should be an array');
    assert.equal(report.afterFiles.length, 4, 'should have 4 essential files');
    const sum = report.afterFiles.reduce((s, f) => s + f.tokens, 0);
    assert.equal(report.after, sum, 'after should equal sum of afterFiles tokens');
    assert.ok(report.after > 0, 'after should be non-zero (real tokenization)');
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
