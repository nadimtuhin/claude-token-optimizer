import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { scanAutoLoadFiles } from '../lib/scanner.js';
import { countTokens } from '../lib/tokenizer.js';
import { buildClaudeMd, buildCommonMistakesMd, buildQuickStartMd, buildArchitectureMapMd, buildDocsIndexMd } from './init.js';

export function buildAfterFiles(date) {
  return [
    { label: 'CLAUDE.md', content: buildClaudeMd('Application', 'Your stack', 'See README', date) },
    { label: '.claude/COMMON_MISTAKES.md', content: buildCommonMistakesMd(date) },
    { label: '.claude/QUICK_START.md', content: buildQuickStartMd(date) },
    { label: '.claude/ARCHITECTURE_MAP.md', content: buildArchitectureMapMd(date) },
    { label: 'docs/INDEX.md', content: buildDocsIndexMd(date) },
  ].map(f => ({ label: f.label, tokens: countTokens(f.content) }));
}

export function computeSavingsPct(before, savings) {
  if (!before) return 0;
  return Math.round((savings / before) * 100);
}

export function formatFileBreakdown(files) {
  if (files.length === 0) return [chalk.dim('  (no auto-loadable files found)')];
  return files.map(f => `  ${f.label.padEnd(35)} ${f.tokens.toLocaleString().padStart(8)} tokens`);
}

export function formatMeasureReport(report, isInitialized, dirName) {
  const lines = [
    '',
    chalk.bold('📊 Token Audit — ' + dirName + '/'),
    '',
    chalk.dim('  BEFORE (current state)'),
    chalk.dim('  ' + '─'.repeat(45)),
    ...formatFileBreakdown(report.files),
    chalk.dim('  ' + '─'.repeat(45)),
    `  ${'Total auto-loaded:'.padEnd(35)} ${chalk.yellow(report.before.toLocaleString().padStart(8))} tokens`,
    '',
  ];

  if (report.before === 0) {
    lines.push(chalk.dim('  Nothing to measure — directory may already be optimized or is empty.'));
  } else if (isInitialized) {
    lines.push(chalk.green(`  ✓ Already initialized. Run ${chalk.cyan('cto compress')} to reduce further.`));
  } else {
    lines.push(
      chalk.dim('  AFTER (post-init estimate)'),
      chalk.dim('  ' + '─'.repeat(45)),
      ...report.afterFiles.map(f => `  ${f.label.padEnd(35)} ${f.tokens.toLocaleString().padStart(8)} tokens`),
      chalk.dim('  ' + '─'.repeat(45)),
      `  ${'Total auto-loaded:'.padEnd(35)} ${chalk.green(report.after.toLocaleString().padStart(8))} tokens`,
      '',
      chalk.green(`  💡 Savings: ${report.savings.toLocaleString()} tokens (${computeSavingsPct(report.before, report.savings)}%)`),
      '',
      `  Run ${chalk.cyan('cto init')} to apply`,
    );
  }

  lines.push('');
  return lines;
}

export async function buildReport(dir) {
  const files = await scanAutoLoadFiles(dir);
  const fileBreakdown = files.map(f => ({ label: path.relative(dir, f.path), tokens: countTokens(f.content) }));
  const before = fileBreakdown.reduce((sum, f) => sum + f.tokens, 0);
  const afterFiles = buildAfterFiles(new Date().toISOString().split('T')[0]);
  const after = afterFiles.reduce((sum, f) => sum + f.tokens, 0);
  return { before, after, savings: before - after, files: fileBreakdown, afterFiles };
}

export async function runMeasure(dir) {
  const report = await buildReport(dir);
  const isInitialized = fs.existsSync(path.join(dir, 'CLAUDE.md'));
  const lines = formatMeasureReport(report, isInitialized, path.basename(dir));
  for (const line of lines) console.log(line);
}

export async function measureCommand() {
  return runMeasure(process.cwd());
}
