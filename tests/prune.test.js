import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseSections,
  findPruneTargets,
  removeSection,
  formatDryRunLine,
  buildArchiveName,
  buildArchiveContent,
  applyPruneTargets,
} from '../src/commands/prune.js';

// ---------------------------------------------------------------------------
// Unit — pure logic
// ---------------------------------------------------------------------------

describe('unit — pure logic', () => {
  describe('parseSections', () => {
    it('returns empty array for content with no headings', () => {
      const sections = parseSections('just some text\nno headings\n');
      assert.strictEqual(sections.length, 0);
    });

    it('parses single section', () => {
      const sections = parseSections('# Title\n\nSome content\n');
      assert.strictEqual(sections.length, 1);
      assert.strictEqual(sections[0].heading, 'Title');
      assert.strictEqual(sections[0].level, 1);
    });

    it('parses multiple sections', () => {
      const content = '# Main\n\ntext\n\n## Sub One\n\ncontent\n\n## Sub Two\n\nmore\n';
      const sections = parseSections(content);
      assert.strictEqual(sections.length, 3);
      assert.strictEqual(sections[1].heading, 'Sub One');
      assert.strictEqual(sections[2].heading, 'Sub Two');
    });

    it('records startLine for each section', () => {
      const content = '# First\n\ntext\n\n## Second\n\ncontent\n';
      const sections = parseSections(content);
      assert.strictEqual(sections[0].startLine, 1);
      assert.strictEqual(sections[1].startLine, 5);
    });
  });

  describe('findPruneTargets', () => {
    it('finds ## Completed section', () => {
      const content = '# Project\n\nOverview\n\n## Completed\n\n- task 1\n- task 2\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.some(t => t.type === 'completed'), 'should find completed section');
    });

    it('finds ## Done section', () => {
      const content = '# Project\n\n## Done\n\n- finished thing\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.some(t => t.type === 'completed'));
    });

    it('finds ## YYYY-MM-DD session notes', () => {
      const content = '# Project\n\n## 2026-05-20\n\nSession log here\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.some(t => t.type === 'session_note'), 'should find session note');
    });

    it('finds empty sections', () => {
      const content = '# Project\n\ntext\n\n## TODO\n\n## Active\n\ncontent\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.some(t => t.type === 'empty' && t.heading === 'TODO'),
        'should find empty TODO section');
    });

    it('does not flag non-empty sections as empty', () => {
      const content = '# Project\n\n## Overview\n\nThis has content.\n';
      const targets = findPruneTargets(content);
      assert.ok(!targets.some(t => t.type === 'empty' && t.heading === 'Overview'));
    });

    // Regression: a parent heading with no direct body but with child subsections
    // must NOT be flagged "empty". removeSection deletes through the next
    // same-or-higher-level heading, so pruning the parent would silently delete
    // the children's content (data loss).
    it('does not flag a parent heading that has child subsections as empty', () => {
      const content = '# Project\n\n## Setup\n### Step 1\ndo this\n\n## Notes\n';
      const targets = findPruneTargets(content);
      assert.ok(!targets.some(t => t.type === 'empty' && t.heading === 'Setup'),
        'parent with subsections must not be treated as empty');
      // The genuinely empty trailing sibling is still flagged.
      assert.ok(targets.some(t => t.type === 'empty' && t.heading === 'Notes'),
        'trailing empty section should still be flagged');
    });

    it('still flags a genuinely empty leaf section (no body, no children)', () => {
      const content = '# Project\n\n## Done Stuff\n\n## Empty\n\n## Active\n\ncontent\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.some(t => t.type === 'empty' && t.heading === 'Empty'));
    });

    it('pruning an empty parent would have destroyed child content (guard regression)', () => {
      // Demonstrates the data-loss path the detection fix prevents: if the parent
      // were ever flagged empty, removeSection would erase the child content too.
      const content = '# Project\n\n## Setup\n### Step 1\ndo this\n\n## Notes\n';
      const emptyTargets = findPruneTargets(content).filter(t => t.type === 'empty');
      assert.ok(!emptyTargets.some(t => t.heading === 'Setup'),
        'Setup must not be a prune target');
      // Sanity: removing Setup directly is destructive, proving why the guard matters.
      const destructive = removeSection(content, '## Setup');
      assert.ok(!destructive.includes('do this'),
        'removeSection on a parent is destructive — confirms the detection guard is required');
    });

    it('returns empty array for clean CLAUDE.md', () => {
      const content = [
        '# Project',
        '',
        '## Overview',
        '',
        'Clean project with content.',
        '',
        '## Commands',
        '',
        '```bash',
        'npm start',
        '```',
      ].join('\n');
      const targets = findPruneTargets(content);
      assert.strictEqual(targets.length, 0);
    });

    it('assigns correct destination for completed sections', () => {
      const content = '# Project\n\n## Completed\n\n- done\n';
      const targets = findPruneTargets(content);
      const t = targets.find(t => t.type === 'completed');
      assert.strictEqual(t.destination, 'completions');
    });

    it('assigns correct destination for session notes', () => {
      const content = '# Project\n\n## 2026-01-15\n\nNotes\n';
      const targets = findPruneTargets(content);
      const t = targets.find(t => t.type === 'session_note');
      assert.strictEqual(t.destination, 'sessions/archive');
    });

    it('assigns null destination for empty sections (delete)', () => {
      const content = '# Project\n\n## EmptySection\n\n## Next\n\ncontent\n';
      const targets = findPruneTargets(content);
      const t = targets.find(t => t.type === 'empty');
      assert.strictEqual(t.destination, null);
    });
  });

  describe('removeSection', () => {
    it('removes a section and its content', () => {
      const content = '# Project\n\n## Completed\n\n- task 1\n\n## Active\n\nstuff\n';
      const result = removeSection(content, '## Completed');
      assert.ok(!result.includes('## Completed'), 'section heading should be removed');
      assert.ok(!result.includes('task 1'), 'section content should be removed');
      assert.ok(result.includes('## Active'), 'other sections should remain');
    });

    it('removes trailing blank lines after removal', () => {
      const content = '# Project\n\n## Old\n\ncontent\n\n## New\n\nstuff\n';
      const result = removeSection(content, '## Old');
      assert.ok(!result.includes('\n\n\n'), 'no triple blank lines');
    });

    it('preserves sibling sections', () => {
      const content = '# Main\n\n## A\n\naaa\n\n## B\n\nbbb\n\n## C\n\nccc\n';
      const result = removeSection(content, '## B');
      assert.ok(result.includes('## A'));
      assert.ok(result.includes('## C'));
      assert.ok(!result.includes('## B'));
    });
  });

  describe('formatDryRunLine', () => {
    it('formats a completed target correctly', () => {
      const target = { heading: 'Completed', startLine: 5, tokens: 42, destination: 'completions' };
      const line = formatDryRunLine(target, 0);
      assert.ok(line.includes('[1]'));
      assert.ok(line.includes('"Completed"'));
      assert.ok(line.includes('line 5'));
      assert.ok(line.includes('42 tokens'));
      assert.ok(line.includes('→ Archive to .claude/completions/'));
    });

    it('formats an empty target with Delete destination', () => {
      const target = { heading: 'TODO', startLine: 10, tokens: 0, destination: null };
      const line = formatDryRunLine(target, 2);
      assert.ok(line.includes('[3]'));
      assert.ok(line.includes('→ Delete'));
    });
  });

  describe('buildArchiveName', () => {
    it('slugifies the heading', () => {
      const name = buildArchiveName('2026-05-21', 'Completed Tasks!');
      assert.strictEqual(name, '2026-05-21-pruned-completed-tasks.md');
    });

    it('handles date-format headings', () => {
      const name = buildArchiveName('2026-05-21', '2026-01-15');
      assert.strictEqual(name, '2026-05-21-pruned-2026-01-15.md');
    });
  });

  describe('buildArchiveContent', () => {
    it('wraps content with header', () => {
      const out = buildArchiveContent('2026-05-21', '## Completed\n\n- task\n');
      assert.ok(out.startsWith('# Pruned from CLAUDE.md on 2026-05-21\n'));
      assert.ok(out.includes('## Completed'));
      assert.ok(out.includes('- task'));
    });
  });

  describe('applyPruneTargets', () => {
    it('removes all targets from content and sums tokens', () => {
      const content = '# Project\n\n## Completed\n\n- done\n\n## Active\n\nwork\n';
      const targets = findPruneTargets(content);
      assert.ok(targets.length > 0);
      const { result, totalSaved } = applyPruneTargets(content, targets);
      assert.ok(!result.includes('## Completed'));
      assert.ok(result.includes('## Active'));
      assert.ok(typeof totalSaved === 'number');
    });

    it('returns original content unchanged for empty targets array', () => {
      const content = '# Project\n\n## Active\n\nwork\n';
      const { result, totalSaved } = applyPruneTargets(content, []);
      assert.strictEqual(result, content);
      assert.strictEqual(totalSaved, 0);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration — filesystem
// ---------------------------------------------------------------------------

describe('integration — filesystem', () => {
  function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cto-prune-'));
  }

  it('does nothing when CLAUDE.md has no prune targets', async () => {
    const tmpDir = makeTmpDir();
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const content = '# Project\n\n## Overview\n\nClean content here.\n';
    fs.writeFileSync(claudeMd, content, 'utf8');
    const orig = process.cwd();
    try {
      process.chdir(tmpDir);
      const { pruneCommand } = await import('../src/commands/prune.js');
      await pruneCommand({ yes: true, backup: false });
      const after = fs.readFileSync(claudeMd, 'utf8');
      assert.strictEqual(after, content);
    } finally {
      process.chdir(orig);
    }
  });

  it('removes a Completed section and writes file', async () => {
    const tmpDir = makeTmpDir();
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const content = '# Project\n\n## Active\n\nwork in progress\n\n## Completed\n\n- finished task\n';
    fs.writeFileSync(claudeMd, content, 'utf8');
    const orig = process.cwd();
    try {
      process.chdir(tmpDir);
      const { pruneCommand } = await import('../src/commands/prune.js');
      await pruneCommand({ yes: true, backup: false });
      const after = fs.readFileSync(claudeMd, 'utf8');
      assert.ok(!after.includes('## Completed'), 'Completed section should be removed');
      assert.ok(!after.includes('finished task'), 'Completed content should be removed');
      assert.ok(after.includes('## Active'), 'Active section should remain');
    } finally {
      process.chdir(orig);
    }
  });

  it('archives a Completed section to .claude/completions/', async () => {
    const tmpDir = makeTmpDir();
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const content = '# Project\n\n## Active\n\nwork\n\n## Completed\n\n- done task\n';
    fs.writeFileSync(claudeMd, content, 'utf8');
    const orig = process.cwd();
    try {
      process.chdir(tmpDir);
      const { pruneCommand } = await import('../src/commands/prune.js');
      await pruneCommand({ yes: true, backup: false });
      const archiveDir = path.join(tmpDir, '.claude', 'completions');
      assert.ok(fs.existsSync(archiveDir), 'completions dir should be created');
      const files = fs.readdirSync(archiveDir);
      assert.strictEqual(files.length, 1, 'one archive file should be written');
      const archiveContent = fs.readFileSync(path.join(archiveDir, files[0]), 'utf8');
      assert.ok(archiveContent.includes('done task'));
    } finally {
      process.chdir(orig);
    }
  });

  it('writes backup when backup option is true', async () => {
    const tmpDir = makeTmpDir();
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const content = '# Project\n\n## Active\n\nwork\n\n## Completed\n\n- done\n';
    fs.writeFileSync(claudeMd, content, 'utf8');
    const orig = process.cwd();
    try {
      process.chdir(tmpDir);
      const { pruneCommand } = await import('../src/commands/prune.js');
      await pruneCommand({ yes: true, backup: true });
      assert.ok(fs.existsSync(claudeMd + '.bak'), 'backup file should exist');
      const bak = fs.readFileSync(claudeMd + '.bak', 'utf8');
      assert.strictEqual(bak, content, 'backup should contain original content');
    } finally {
      process.chdir(orig);
    }
  });

  it('dry-run does not write files', async () => {
    const tmpDir = makeTmpDir();
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const content = '# Project\n\n## Active\n\nwork\n\n## Completed\n\n- done\n';
    fs.writeFileSync(claudeMd, content, 'utf8');
    const orig = process.cwd();
    try {
      process.chdir(tmpDir);
      const { pruneCommand } = await import('../src/commands/prune.js');
      await pruneCommand({ dryRun: true });
      const after = fs.readFileSync(claudeMd, 'utf8');
      assert.strictEqual(after, content, 'dry-run must not modify file');
      assert.ok(!fs.existsSync(claudeMd + '.bak'), 'dry-run must not write backup');
    } finally {
      process.chdir(orig);
    }
  });
});

// ---------------------------------------------------------------------------
// E2E — subprocess
// ---------------------------------------------------------------------------

describe('e2e — subprocess', () => {
  const repoRoot = path.resolve(new URL('../', import.meta.url).pathname);
  const ctoBin = path.join(repoRoot, 'bin', 'cto.js');

  function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cto-e2e-'));
  }

  it('exits 1 with error message when CLAUDE.md is missing', () => {
    const tmpDir = makeTmpDir();
    const result = spawnSync('node', [ctoBin, 'prune', '--yes', '--no-backup'], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.strictEqual(result.status, 1, 'should exit with code 1');
    assert.ok(
      result.stderr.includes('CLAUDE.md not found'),
      `stderr should mention CLAUDE.md not found, got: ${result.stderr}`,
    );
  });

  it('prints "Nothing to prune" for a clean CLAUDE.md and exits 0', () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, 'CLAUDE.md'),
      '# Project\n\n## Overview\n\nAll good here.\n',
      'utf8',
    );
    const result = spawnSync('node', [ctoBin, 'prune', '--yes', '--no-backup'], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}\n${result.stderr}`);
    assert.ok(
      result.stdout.includes('Nothing to prune'),
      `stdout should say Nothing to prune, got: ${result.stdout}`,
    );
  });

  it('removes a Completed section and reports token savings', () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, 'CLAUDE.md'),
      '# Project\n\n## Active\n\nwork in progress\n\n## Completed\n\n- finished task\n',
      'utf8',
    );
    const result = spawnSync('node', [ctoBin, 'prune', '--yes', '--no-backup'], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}\n${result.stderr}`);
    assert.ok(
      result.stdout.includes('Saved'),
      `stdout should include "Saved", got: ${result.stdout}`,
    );
    const claudeMd = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.ok(!claudeMd.includes('## Completed'), 'CLAUDE.md should not contain Completed section');
  });

  it('--dry-run prints prune targets but does not modify CLAUDE.md', () => {
    const tmpDir = makeTmpDir();
    const original = '# Project\n\n## Active\n\nwork\n\n## Completed\n\n- done task\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), original, 'utf8');
    const result = spawnSync('node', [ctoBin, 'prune', '--dry-run'], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '0' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}\n${result.stderr}`);
    assert.ok(
      result.stdout.includes('dry-run'),
      `stdout should mention dry-run, got: ${result.stdout}`,
    );
    const after = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.strictEqual(after, original, 'CLAUDE.md must be unchanged after dry-run');
  });
});
