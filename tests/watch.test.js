import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  bar,
  formatFileRow,
  parseWriteLogEntries,
  formatWriteLogRow,
  buildWatchDisplay,
} from '../src/commands/watch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CTO_BIN = path.resolve(__dirname, '../bin/cto.js');

// ─── unit — pure logic ────────────────────────────────────────────────────────

describe('unit — pure logic', () => {
  describe('bar()', () => {
    it('returns 10 spaces when target is null', () => {
      assert.equal(bar(0, null), '          ');
    });

    it('returns 10 spaces when target is 0', () => {
      assert.equal(bar(100, 0), '          ');
    });

    it('returns all filled when tokens === target', () => {
      assert.equal(bar(100, 100), '█'.repeat(10));
    });

    it('returns all empty when tokens is 0', () => {
      assert.equal(bar(0, 100), '░'.repeat(10));
    });

    it('caps at full bar when tokens exceed target', () => {
      assert.equal(bar(200, 100), '█'.repeat(10));
    });

    it('returns correct partial fill', () => {
      const result = bar(50, 100);
      assert.equal(result.length, 10);
      assert.ok(result.includes('█') && result.includes('░'));
    });
  });

  describe('formatFileRow()', () => {
    it('includes rel filename', () => {
      const row = formatFileRow('CLAUDE.md', 100, 450);
      assert.ok(row.includes('CLAUDE.md'));
    });

    it('includes token count', () => {
      const row = formatFileRow('CLAUDE.md', 123, 450);
      assert.ok(row.includes('123'));
    });

    it('includes target when provided', () => {
      const row = formatFileRow('CLAUDE.md', 0, 450);
      assert.ok(row.includes('target: 450'));
    });

    it('omits target when null', () => {
      const row = formatFileRow('docs/INDEX.md', 0, null);
      assert.ok(!row.includes('target:'));
    });
  });

  describe('parseWriteLogEntries()', () => {
    it('parses markdown table rows', () => {
      const logContent = `| writes | count | time |\n|--------|-------|------|\n| src/foo.js | 847 | 2 min ago |\n| tests/bar.js | 312 | 3 min ago |\n`;
      const entries = parseWriteLogEntries(logContent);
      assert.equal(entries.length, 2);
      assert.equal(entries[0].filePath, 'src/foo.js');
      assert.equal(entries[0].tokStr, '847');
      assert.equal(entries[0].time, '2 min ago');
    });

    it('returns empty array for empty string', () => {
      assert.deepEqual(parseWriteLogEntries(''), []);
    });

    it('returns empty array for non-table content', () => {
      assert.deepEqual(parseWriteLogEntries('just some text\nno table here'), []);
    });
  });

  describe('formatWriteLogRow()', () => {
    it('includes filePath', () => {
      const row = formatWriteLogRow({ filePath: 'src/foo.js', tokStr: '847', time: '2 min ago' });
      assert.ok(row.includes('src/foo.js'));
    });

    it('includes token count', () => {
      const row = formatWriteLogRow({ filePath: 'src/foo.js', tokStr: '847', time: '2 min ago' });
      assert.ok(row.includes('847'));
    });

    it('includes time in parens', () => {
      const row = formatWriteLogRow({ filePath: 'src/foo.js', tokStr: '847', time: '2 min ago' });
      assert.ok(row.includes('(2 min ago)'));
    });
  });
});

// ─── integration — filesystem ─────────────────────────────────────────────────

describe('integration — filesystem', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-watch-'));
    fs.mkdirSync(path.join(tmpDir, '.claude', 'sessions'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('includes timestamp in output', () => {
    const now = new Date('2026-05-20T12:34:56Z');
    const out = buildWatchDisplay(tmpDir, now);
    assert.ok(out.includes('2026-05-20 12:34:56'), `expected timestamp, got: ${out.slice(0, 60)}`);
  });

  it('shows zero tokens when no files exist', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('CLAUDE.md'));
    assert.ok(out.includes('0 tokens') || out.match(/\s+0\s+tokens/), `expected 0 tokens: ${out.slice(0, 200)}`);
  });

  it('shows token count when CLAUDE.md exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'Hello world this is a test. '.repeat(20));
    const out = buildWatchDisplay(tmpDir);
    const match = out.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    assert.ok(match, `expected token count in output: ${out.slice(0, 300)}`);
    assert.ok(parseInt(match[1]) > 0, `expected > 0 tokens, got ${match[1]}`);
  });

  it('includes total line', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Total:'), `expected Total line: ${out}`);
  });

  it('shows target in bar chart row', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('target: 450'), `expected target in CLAUDE.md row: ${out}`);
  });

  it('no session writes section when write-log absent', () => {
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-watch-fresh-'));
    try {
      const out = buildWatchDisplay(freshDir);
      assert.ok(!out.includes('Session writes'), `expected no session writes section: ${out}`);
    } finally {
      fs.rmSync(freshDir, { recursive: true });
    }
  });

  it('shows session writes section when write-log exists', () => {
    const logContent = `| writes | count | time |\n|--------|-------|------|\n| src/commands/init.js | 847 | 2 min ago |\n| tests/init.test.js | 312 | 3 min ago |\n`;
    fs.writeFileSync(path.join(tmpDir, '.claude', 'sessions', 'write-log.md'), logContent);
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Session writes'), `expected session writes section: ${out}`);
  });

  it('shows bar chart characters', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'x '.repeat(200));
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('█') || out.includes('░'), `expected bar chart chars: ${out.slice(0, 300)}`);
  });

  it('includes Ctrl+C prompt', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Ctrl+C'), `expected Ctrl+C prompt: ${out.slice(-100)}`);
  });

  it('token count updates when file changes', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'short');
    const out1 = buildWatchDisplay(tmpDir);
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'much longer content here '.repeat(50));
    const out2 = buildWatchDisplay(tmpDir);
    const m1 = out1.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    const m2 = out2.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    assert.ok(m1 && m2, 'expected token counts in both outputs');
    assert.ok(parseInt(m2[1]) > parseInt(m1[1]), `expected more tokens after bigger file: ${m1[1]} vs ${m2[1]}`);
  });

  it('docs/INDEX.md row has no target', () => {
    const out = buildWatchDisplay(tmpDir);
    const lines = out.split('\n');
    const indexLine = lines.find(l => l.includes('docs/INDEX.md'));
    assert.ok(indexLine, 'expected docs/INDEX.md row');
    assert.ok(!indexLine.includes('target:'), `expected no target for INDEX.md: ${indexLine}`);
  });
});

// ─── e2e — subprocess ─────────────────────────────────────────────────────────

describe('e2e — subprocess', () => {
  it('outputs token monitor header and exits on SIGTERM', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-watch-e2e-'));
    try {
      let stdout = '';
      const child = spawn(process.execPath, [CTO_BIN, 'watch', '--interval', '1'], {
        cwd: tmpDir,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      child.stdout.on('data', chunk => { stdout += chunk.toString(); });

      await new Promise((resolve, reject) => {
        const killTimer = setTimeout(() => { child.kill('SIGTERM'); }, 1000);
        const safetyKill = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('e2e watch timed out')); }, 5000);
        child.on('close', () => {
          clearTimeout(killTimer);
          clearTimeout(safetyKill);
          resolve();
        });
      });

      assert.ok(stdout.includes('token monitor'), `expected "token monitor" in stdout, got: ${stdout.slice(0, 200)}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});
