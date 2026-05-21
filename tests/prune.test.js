import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSections, findPruneTargets, removeSection } from '../src/commands/prune.js';

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
