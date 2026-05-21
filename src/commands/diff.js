import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { countTokens } from '../lib/tokenizer.js';

export function computeDiff(currentContent, backupContent) {
  const currentTokens = countTokens(currentContent);
  const backupTokens = countTokens(backupContent);
  const tokenDelta = currentTokens - backupTokens;
  const tokenPct = backupTokens > 0 ? Math.round((Math.abs(tokenDelta) / backupTokens) * 100) : 0;

  const currentLines = currentContent.split('\n').length;
  const backupLines = backupContent.split('\n').length;
  const lineDelta = currentLines - backupLines;

  return { currentTokens, backupTokens, tokenDelta, tokenPct, currentLines, backupLines, lineDelta };
}

export function formatDiffReport(d, targetLabel, backupLabel) {
  const sep = '─'.repeat(44);
  const lines = [
    '',
    chalk.bold(`📊 Token diff — ${targetLabel}`),
    '',
    chalk.dim(`  ${sep}`),
    `  ${'Before (' + backupLabel + '):'.padEnd(36)} ${chalk.yellow(String(d.backupTokens).padStart(6))} tokens`,
    `  ${'After  (' + targetLabel + '):'.padEnd(36)} ${chalk.cyan(String(d.currentTokens).padStart(6))} tokens`,
    chalk.dim(`  ${sep}`),
  ];

  if (d.tokenDelta < 0) {
    const saved = Math.abs(d.tokenDelta);
    lines.push(`  ${'Saved:'.padEnd(36)} ${chalk.green(String(saved).padStart(6))} tokens  ${chalk.green('(-' + d.tokenPct + '%)')}`);
  } else if (d.tokenDelta > 0) {
    lines.push(`  ${'Added:'.padEnd(36)} ${chalk.red('+' + d.tokenDelta.toString().padStart(5))} tokens  ${chalk.red('(+' + d.tokenPct + '%)')}`);
  } else {
    lines.push(`  ${chalk.dim('No token change.')}`);
  }

  const lineSign = d.lineDelta <= 0 ? '' : '+';
  const lineColor = d.lineDelta < 0 ? chalk.green : d.lineDelta > 0 ? chalk.red : chalk.dim;
  lines.push('');
  lines.push(`  Line diff: ${lineColor(lineSign + d.lineDelta + ' lines')}  (${d.backupLines} → ${d.currentLines})`);
  lines.push('');

  return lines;
}

export async function diffCommand(options = {}) {
  const dir = process.cwd();
  const targetFile = options.file || 'CLAUDE.md';
  const targetPath = path.isAbsolute(targetFile) ? targetFile : path.join(dir, targetFile);
  const backupPath = targetPath + '.bak';

  if (!fs.existsSync(backupPath)) {
    console.log('');
    console.log(chalk.yellow(`  No ${path.basename(backupPath)} found.`));
    console.log(`  Run ${chalk.cyan('cto compress')} or ${chalk.cyan('cto prune')} first (both create a .bak).`);
    console.log('');
    return;
  }

  if (!fs.existsSync(targetPath)) {
    console.log(chalk.red(`  Error: ${targetFile} not found.`));
    return;
  }

  const current = fs.readFileSync(targetPath, 'utf8');
  const backup = fs.readFileSync(backupPath, 'utf8');
  const d = computeDiff(current, backup);
  const targetLabel = path.relative(dir, targetPath);
  const backupLabel = path.relative(dir, backupPath);
  formatDiffReport(d, targetLabel, backupLabel).forEach((line) => console.log(line));
}
