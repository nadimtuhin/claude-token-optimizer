import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  runAudit, applyFixes,
  checkClaudeMdContent, checkIgnoreContent,
  summarizeCounts, formatResults, buildFixSummary,
} from '../src/commands/audit.js';

// ─── helpers ────────────────────────────────────────────────────────────────

let tmpDir;

function setupTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-audit-'));
}

function teardownTmp() {
  fs.rmSync(tmpDir, { recursive: true });
}

function writeFile(rel, content) {
  const full = path.join(tmpDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function findCheck(results, labelFragment) {
  return results.find(r => r.label.includes(labelFragment));
}

const FULL_IGNORE = '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n';

// ─── Unit: pure logic ────────────────────────────────────────────────────────

describe('unit — pure logic', () => {
  describe('checkClaudeMdContent', () => {
    it('passes token count when content is short', () => {
      const results = checkClaudeMdContent('Short content.');
      const r = findCheck(results, 'token count');
      assert.strictEqual(r.pass, true);
    });

    it('warns when token count >= 600', () => {
      const results = checkClaudeMdContent('word '.repeat(600));
      const r = findCheck(results, 'token count');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('warns when content has ## Completed section', () => {
      const results = checkClaudeMdContent('# Project\n\n## Completed\n\n- task\n');
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('warns when content has ## Done section', () => {
      const results = checkClaudeMdContent('# Project\n\n## Done\n\n- task\n');
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, false);
    });

    it('passes no-completed check when content is clean', () => {
      const results = checkClaudeMdContent('# Project\n\n## Overview\n\nLooks good.\n');
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, true);
    });

    it('warns when content has date headers (session notes)', () => {
      const results = checkClaudeMdContent('# Project\n\n## 2026-05-20\n\nSession notes.\n');
      const r = findCheck(results, 'No session notes');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes no-session-notes when content has no date headers', () => {
      const results = checkClaudeMdContent('# Project\n\n## Overview\n\nClean.\n');
      const r = findCheck(results, 'No session notes');
      assert.strictEqual(r.pass, true);
    });

    it('returns exactly 3 checks', () => {
      const results = checkClaudeMdContent('Short.');
      assert.strictEqual(results.length, 3);
    });
  });

  describe('checkIgnoreContent', () => {
    it('passes sessions coverage when present', () => {
      const results = checkIgnoreContent('.claude/sessions/**\n');
      const r = findCheck(results, '.claudeignore covers .claude/sessions/');
      assert.strictEqual(r.pass, true);
    });

    it('fails sessions coverage when absent', () => {
      const results = checkIgnoreContent('node_modules/**\n');
      const r = findCheck(results, '.claudeignore covers .claude/sessions/');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes completions coverage when present', () => {
      const results = checkIgnoreContent('.claude/completions/**\n');
      const r = findCheck(results, '.claudeignore covers .claude/completions/');
      assert.strictEqual(r.pass, true);
    });

    it('fails completions coverage when absent', () => {
      const results = checkIgnoreContent('.claude/sessions/**\n');
      const r = findCheck(results, '.claudeignore covers .claude/completions/');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes archive coverage when present', () => {
      const results = checkIgnoreContent('docs/archive/**\n');
      const r = findCheck(results, 'claudeignore covers docs/archive/');
      assert.strictEqual(r.pass, true);
    });

    it('fails archive coverage when absent', () => {
      const results = checkIgnoreContent('.claude/sessions/**\n.claude/completions/**\n');
      const r = findCheck(results, 'claudeignore covers docs/archive/');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes README.md coverage when present', () => {
      const results = checkIgnoreContent(FULL_IGNORE);
      const r = findCheck(results, 'claudeignore covers README.md');
      assert.strictEqual(r.pass, true);
    });

    it('fails README.md coverage when absent', () => {
      const results = checkIgnoreContent('.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const r = findCheck(results, 'claudeignore covers README.md');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .clinerules coverage when present', () => {
      const results = checkIgnoreContent(FULL_IGNORE);
      const r = findCheck(results, 'claudeignore covers .clinerules');
      assert.strictEqual(r.pass, true);
    });

    it('passes .roomodes coverage when present', () => {
      const results = checkIgnoreContent(FULL_IGNORE);
      const r = findCheck(results, 'claudeignore covers .roomodes');
      assert.strictEqual(r.pass, true);
    });

    it('returns 3 warning-class checks + 9 info-class checks = 12 total', () => {
      const results = checkIgnoreContent('');
      assert.strictEqual(results.length, 12);
    });
  });

  describe('summarizeCounts', () => {
    it('counts errors', () => {
      const results = [
        { pass: false, severity: 'error' },
        { pass: false, severity: 'warning' },
        { pass: true, severity: 'error' },
      ];
      const { errors } = summarizeCounts(results);
      assert.strictEqual(errors, 1);
    });

    it('counts warnings', () => {
      const results = [
        { pass: false, severity: 'warning' },
        { pass: false, severity: 'warning' },
        { pass: true, severity: 'warning' },
      ];
      const { warnings } = summarizeCounts(results);
      assert.strictEqual(warnings, 2);
    });

    it('counts infos', () => {
      const results = [
        { pass: false, severity: 'info' },
        { pass: true, severity: 'info' },
      ];
      const { infos } = summarizeCounts(results);
      assert.strictEqual(infos, 1);
    });

    it('returns zeros when all pass', () => {
      const results = [
        { pass: true, severity: 'error' },
        { pass: true, severity: 'warning' },
        { pass: true, severity: 'info' },
      ];
      const counts = summarizeCounts(results);
      assert.deepEqual(counts, { errors: 0, warnings: 0, infos: 0 });
    });
  });

  describe('buildFixSummary', () => {
    it('returns empty string when no warnings or infos', () => {
      assert.strictEqual(buildFixSummary(0, 0), '');
    });

    it('returns singular warning text', () => {
      const s = buildFixSummary(1, 0);
      assert.ok(s.includes('1 warning'));
      assert.ok(s.includes('remains'));
    });

    it('returns plural warnings text', () => {
      const s = buildFixSummary(2, 0);
      assert.ok(s.includes('2 warnings'));
      assert.ok(s.includes('remain'));
    });

    it('returns info text', () => {
      const s = buildFixSummary(0, 3);
      assert.ok(s.includes('3 info items'));
    });

    it('combines warnings and infos', () => {
      const s = buildFixSummary(1, 2);
      assert.ok(s.includes('1 warning'));
      assert.ok(s.includes('2 info items'));
    });
  });

  describe('formatResults', () => {
    it('returns one line per result', () => {
      const results = [
        { pass: true, label: 'Check A', severity: 'info', detail: null },
        { pass: false, label: 'Check B', severity: 'error', detail: 'fix it' },
      ];
      const lines = formatResults(results, false);
      assert.strictEqual(lines.length, 2);
    });

    it('includes pass symbol for passing check (no color)', () => {
      const results = [{ pass: true, label: 'OK', severity: 'info', detail: null }];
      const [line] = formatResults(results, false);
      assert.ok(line.includes('✓'));
      assert.ok(line.includes('OK'));
    });

    it('includes fail symbol and detail for error check (no color)', () => {
      const results = [{ pass: false, label: 'Bad', severity: 'error', detail: 'do something' }];
      const [line] = formatResults(results, false);
      assert.ok(line.includes('✗'));
      assert.ok(line.includes('do something'));
    });
  });
});

// ─── Integration: filesystem ─────────────────────────────────────────────────

describe('integration — filesystem', () => {
  beforeEach(setupTmp);
  afterEach(teardownTmp);

  describe('runAudit', () => {
    it('fails error when CLAUDE.md missing', () => {
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'CLAUDE.md present');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'error');
    });

    it('passes when CLAUDE.md present', () => {
      writeFile('CLAUDE.md', 'Short content under 600 tokens.');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'CLAUDE.md present');
      assert.strictEqual(r.pass, true);
    });

    it('warns when CLAUDE.md token count >= 600', () => {
      writeFile('CLAUDE.md', 'word '.repeat(600));
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'token count');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes token count when CLAUDE.md is short', () => {
      writeFile('CLAUDE.md', 'Short content.');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'token count');
      assert.strictEqual(r.pass, true);
    });

    it('warns when CLAUDE.md has ## Completed section', () => {
      writeFile('CLAUDE.md', '# Project\n\n## Completed\n\n- task 1\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('warns when CLAUDE.md has ## Done section', () => {
      writeFile('CLAUDE.md', '# Project\n\n## Done\n\n- task 1\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, false);
    });

    it('passes no-completed check when CLAUDE.md is clean', () => {
      writeFile('CLAUDE.md', '# Project\n\n## Overview\n\nLooks good.\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'No completed tasks');
      assert.strictEqual(r.pass, true);
    });

    it('warns when CLAUDE.md has date headers', () => {
      writeFile('CLAUDE.md', '# Project\n\n## 2026-05-20\n\nSession notes here.\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'No session notes');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('info fail when .claudeignore missing', () => {
      writeFile('CLAUDE.md', 'Short content.');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore present');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .claudeignore check when file present', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore present');
      assert.strictEqual(r.pass, true);
    });

    it('warns when .claudeignore does not cover sessions', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', 'node_modules/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore covers');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes sessions coverage when .claudeignore includes sessions path', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore covers .claude/sessions/');
      assert.strictEqual(r.pass, true);
    });

    it('warns when .claudeignore does not cover completions', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore covers .claude/completions/');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes completions coverage when .claudeignore includes completions path', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, '.claudeignore covers .claude/completions/');
      assert.strictEqual(r.pass, true);
    });

    it('warns when .claudeignore does not cover docs/archive', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers docs/archive/');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'warning');
    });

    it('passes archive coverage when .claudeignore includes archive path', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers docs/archive/');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when README.md not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers README.md');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes README.md check when README.md in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers README.md');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when CHANGELOG.md not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers CHANGELOG.md');
      assert.ok(r, 'should have CHANGELOG check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes CHANGELOG.md check when CHANGELOG.md in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers CHANGELOG.md');
      assert.strictEqual(r.pass, true);
    });

    it('info when CONTRIBUTING.md not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers CONTRIBUTING.md');
      assert.ok(r, 'should have CONTRIBUTING.md check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes CONTRIBUTING.md check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers CONTRIBUTING.md');
      assert.strictEqual(r.pass, true);
    });

    it('info when GEMINI.md not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers GEMINI.md');
      assert.ok(r, 'should have GEMINI.md check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes GEMINI.md check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers GEMINI.md');
      assert.strictEqual(r.pass, true);
    });

    it('info when AGENTS.md not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers AGENTS.md');
      assert.ok(r, 'should have AGENTS.md check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes AGENTS.md check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers AGENTS.md');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when .cursorrules not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .cursorrules');
      assert.ok(r, 'should have .cursorrules check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .cursorrules check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .cursorrules');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when .windsurfrules not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .windsurfrules');
      assert.ok(r, 'should have .windsurfrules check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .windsurfrules check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .windsurfrules');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when .clinerules not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .clinerules');
      assert.ok(r, 'should have .clinerules check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .clinerules check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .clinerules');
      assert.strictEqual(r.pass, true);
    });

    it('info warn when .roomodes not in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .roomodes');
      assert.ok(r, 'should have .roomodes check');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes .roomodes check when in .claudeignore', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claudeignore', FULL_IGNORE);
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'claudeignore covers .roomodes');
      assert.strictEqual(r.pass, true);
    });

    it('info fail when essential files missing', () => {
      writeFile('CLAUDE.md', 'Short.');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'Essential files');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes essential files when all 3 present', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('.claude/COMMON_MISTAKES.md', 'content');
      writeFile('.claude/QUICK_START.md', 'content');
      writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'Essential files present (3/3)');
      assert.strictEqual(r.pass, true);
    });

    it('info fail when docs/INDEX.md missing', () => {
      writeFile('CLAUDE.md', 'Short.');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'docs/INDEX.md');
      assert.strictEqual(r.pass, false);
      assert.strictEqual(r.severity, 'info');
    });

    it('passes docs/INDEX.md check when present', () => {
      writeFile('CLAUDE.md', 'Short.');
      writeFile('docs/INDEX.md', 'content');
      const results = runAudit(tmpDir);
      const r = findCheck(results, 'docs/INDEX.md');
      assert.strictEqual(r.pass, true);
    });
  });

  describe('summary filtering', () => {
    it('info-only failures: no errors, no warnings, but infos > 0', () => {
      writeFile('CLAUDE.md', 'Short content.');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const results = runAudit(tmpDir);
      const { errors, warnings, infos } = summarizeCounts(results);
      assert.strictEqual(errors, 0, 'no errors expected');
      assert.strictEqual(warnings, 0, 'no warnings expected');
      assert.ok(infos > 0, 'should have info-level failures');
    });

    it('all checks pass when all files present and clean', () => {
      writeFile('CLAUDE.md', 'Short content.');
      writeFile('.claudeignore', FULL_IGNORE);
      writeFile('.claude/COMMON_MISTAKES.md', 'content');
      writeFile('.claude/QUICK_START.md', 'content');
      writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
      writeFile('docs/INDEX.md', 'content');
      const results = runAudit(tmpDir);
      const failures = results.filter(r => !r.pass);
      assert.strictEqual(failures.length, 0, 'all checks should pass');
    });
  });

  describe('json output fields', () => {
    it('infos count matches info-level failures', () => {
      writeFile('CLAUDE.md', 'Short content.');
      writeFile('.claudeignore', '.claude/sessions/**\n');
      const results = runAudit(tmpDir);
      const infos = results.filter(r => !r.pass && r.severity === 'info');
      assert.ok(infos.length > 0, 'precondition: should have info failures');
      assert.strictEqual(infos.length, 11, 'expected 11 info failures');
    });

    it('infos count is 0 when all files present', () => {
      writeFile('CLAUDE.md', 'Short content.');
      writeFile('.claudeignore', FULL_IGNORE);
      writeFile('.claude/COMMON_MISTAKES.md', 'content');
      writeFile('.claude/QUICK_START.md', 'content');
      writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
      writeFile('docs/INDEX.md', 'content');
      const results = runAudit(tmpDir);
      const infos = results.filter(r => !r.pass && r.severity === 'info');
      assert.strictEqual(infos.length, 0, 'no info failures expected');
    });

    it('errors, warnings, infos are mutually exclusive categories', () => {
      writeFile('CLAUDE.md', 'Short content.');
      writeFile('.claudeignore', '.claude/sessions/**\n');
      const results = runAudit(tmpDir);
      const { errors, warnings, infos } = summarizeCounts(results);
      const total = errors + warnings + infos;
      const allFailing = results.filter(r => !r.pass);
      assert.strictEqual(total, allFailing.length, 'all failures should be categorized');
    });
  });

  describe('applyFixes', () => {
    it('creates CLAUDE.md when missing', () => {
      const results = runAudit(tmpDir);
      applyFixes(tmpDir, results);
      assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should be created');
    });

    it('creates .claudeignore when missing', () => {
      const results = runAudit(tmpDir);
      applyFixes(tmpDir, results);
      assert.ok(fs.existsSync(path.join(tmpDir, '.claudeignore')), '.claudeignore should be created');
    });

    it('creates all 3 essential files when missing', () => {
      const results = runAudit(tmpDir);
      applyFixes(tmpDir, results);
      for (const f of ['.claude/COMMON_MISTAKES.md', '.claude/QUICK_START.md', '.claude/ARCHITECTURE_MAP.md']) {
        assert.ok(fs.existsSync(path.join(tmpDir, f)), `${f} should be created`);
      }
    });

    it('creates docs/INDEX.md when missing', () => {
      const results = runAudit(tmpDir);
      applyFixes(tmpDir, results);
      assert.ok(fs.existsSync(path.join(tmpDir, 'docs', 'INDEX.md')), 'docs/INDEX.md should be created');
    });

    it('does not overwrite existing CLAUDE.md', () => {
      writeFile('CLAUDE.md', 'my existing content');
      const results = runAudit(tmpDir);
      applyFixes(tmpDir, results);
      const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
      assert.strictEqual(content, 'my existing content');
    });

    it('after applyFixes on empty dir, no error-level failures remain', () => {
      const before = runAudit(tmpDir);
      applyFixes(tmpDir, before);
      const after = runAudit(tmpDir);
      const errors = after.filter(r => !r.pass && r.severity === 'error');
      assert.strictEqual(errors.length, 0, `expected no errors, got: ${JSON.stringify(errors)}`);
    });

    it('returns list of created file names', () => {
      const results = runAudit(tmpDir);
      const created = applyFixes(tmpDir, results);
      assert.ok(Array.isArray(created));
      assert.ok(created.length > 0, 'expected at least one file created');
    });

    it('returns empty array when nothing to fix', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', FULL_IGNORE);
      writeFile('.claude/COMMON_MISTAKES.md', 'content');
      writeFile('.claude/QUICK_START.md', 'content');
      writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
      writeFile('docs/INDEX.md', 'content');
      const results = runAudit(tmpDir);
      const created = applyFixes(tmpDir, results);
      assert.strictEqual(created.length, 0);
    });

    it('--fix appends README.md to .claudeignore when missing', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
      const created = applyFixes(tmpDir, runAudit(tmpDir));
      assert.ok(created.some(c => c.includes('.claudeignore')), 'should report .claudeignore modified');
      const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
      assert.ok(content.includes('README.md'), 'README.md should be in .claudeignore');
    });

    it('--fix does not duplicate README.md if already in .claudeignore', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', FULL_IGNORE);
      writeFile('.claude/COMMON_MISTAKES.md', 'content');
      writeFile('.claude/QUICK_START.md', 'content');
      writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
      writeFile('docs/INDEX.md', 'content');
      const created = applyFixes(tmpDir, runAudit(tmpDir));
      assert.ok(!created.some(c => c.includes('.claudeignore')), 'should not modify already-correct .claudeignore');
      const lines = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8').split('\n').filter(l => l.trim() === 'README.md');
      assert.strictEqual(lines.length, 1, 'README.md should appear exactly once');
    });

    it('--fix appends .claude/sessions/** when missing', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', '.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
      const created = applyFixes(tmpDir, runAudit(tmpDir));
      assert.ok(created.some(c => c.includes('sessions')), 'should report sessions added');
      const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
      assert.ok(content.includes('.claude/sessions/**'));
    });

    it('--fix appends .claude/completions/** when missing', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', '.claude/sessions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
      const created = applyFixes(tmpDir, runAudit(tmpDir));
      assert.ok(created.some(c => c.includes('completions')), 'should report completions added');
      const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
      assert.ok(content.includes('.claude/completions/**'));
    });

    it('--fix appends docs/archive/** when missing', () => {
      writeFile('CLAUDE.md', 'content');
      writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
      const created = applyFixes(tmpDir, runAudit(tmpDir));
      assert.ok(created.some(c => c.includes('archive')), 'should report archive added');
      const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
      assert.ok(content.includes('docs/archive/**'));
    });
  });
});

// ─── E2E: subprocess ─────────────────────────────────────────────────────────

describe('e2e — subprocess', () => {
  const binPath = path.resolve('/Users/nadimtuhin/opensource/claude-token-optimizer/bin/cto.js');
  const repoDir = path.resolve('/Users/nadimtuhin/opensource/claude-token-optimizer');

  it('exits 0 on a project that passes all checks', () => {
    // The repo itself has CLAUDE.md; run audit in a tmp dir with all files
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-e2e-'));
    try {
      fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), 'Short content.');
      fs.writeFileSync(path.join(tmp, '.claudeignore'), FULL_IGNORE);
      fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.claude/COMMON_MISTAKES.md'), 'content');
      fs.writeFileSync(path.join(tmp, '.claude/QUICK_START.md'), 'content');
      fs.writeFileSync(path.join(tmp, '.claude/ARCHITECTURE_MAP.md'), 'content');
      fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'docs/INDEX.md'), 'content');
      const result = spawnSync('node', [binPath, 'audit'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });
      assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      assert.ok(result.stdout.includes('cto audit'), 'should print audit header');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('exits 1 when CLAUDE.md is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-e2e-'));
    try {
      const result = spawnSync('node', [binPath, 'audit'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });
      assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}`);
      assert.ok(result.stdout.includes('CLAUDE.md present'), 'should mention CLAUDE.md check');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it('stdout contains health report header', () => {
    const result = spawnSync('node', [binPath, 'audit'], { cwd: repoDir, encoding: 'utf8', timeout: 10000 });
    assert.ok(result.stdout.includes('cto audit'), 'should print "cto audit" header');
  });

  it('--json flag outputs valid JSON with results array', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-e2e-'));
    try {
      fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), 'Short content.');
      fs.writeFileSync(path.join(tmp, '.claudeignore'), FULL_IGNORE);
      fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.claude/COMMON_MISTAKES.md'), 'content');
      fs.writeFileSync(path.join(tmp, '.claude/QUICK_START.md'), 'content');
      fs.writeFileSync(path.join(tmp, '.claude/ARCHITECTURE_MAP.md'), 'content');
      fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'docs/INDEX.md'), 'content');
      const result = spawnSync('node', [binPath, 'audit', '--json'], { cwd: tmp, encoding: 'utf8', timeout: 10000 });
      let parsed;
      assert.doesNotThrow(() => { parsed = JSON.parse(result.stdout); }, 'should output valid JSON');
      assert.ok(Array.isArray(parsed.results), 'results should be array');
      assert.ok('errors' in parsed, 'should have errors field');
      assert.ok('warnings' in parsed, 'should have warnings field');
      assert.ok('infos' in parsed, 'should have infos field');
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });
});
