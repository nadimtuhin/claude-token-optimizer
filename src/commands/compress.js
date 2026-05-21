import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';

const LANG_SHORT = {
  javascript: 'js', typescript: 'ts', python: 'py', ruby: 'rb',
  golang: 'go', shell: 'sh', dockerfile: 'docker',
};

// ─── pure helpers ────────────────────────────────────────────────────────────

export function removeExtraBlankLines(content) {
  return content.replace(/\n{3,}/g, '\n\n');
}

export function shortenCodeFences(content) {
  return content.replace(/^(```)(javascript|typescript|python|ruby|golang|shell|dockerfile)$/gm,
    (_, fence, lang) => fence + (LANG_SHORT[lang] ?? lang));
}

export function truncateLongLists(content, maxItems = 3) {
  const changes = [];
  const result = content.replace(
    /((?:^[ \t]*[-*] .+\n){6,})/gm,
    (block) => {
      const lines = block.split('\n').filter(Boolean);
      if (lines.length <= maxItems) return block;
      const kept = lines.slice(0, maxItems);
      const dropped = lines.length - maxItems;
      changes.push(`Truncated list (kept ${maxItems} of ${lines.length} items)`);
      return kept.join('\n') + `\n- # ... ${dropped} more\n`;
    },
  );
  return { result, changes };
}

export function countBlankLineBlocks(content) {
  return (content.match(/\n{3,}/g) ?? []).length;
}

export function countVerboseFences(content) {
  return (content.match(/^```(javascript|typescript|python|ruby|golang|shell|dockerfile)$/gm) ?? []).length;
}

export function computeTokenStats(original, compressed) {
  const beforeTokens = countTokens(original);
  const afterTokens = countTokens(compressed);
  const saved = beforeTokens - afterTokens;
  const pct = beforeTokens > 0 ? Math.round((saved / beforeTokens) * 100) : 0;
  return { beforeTokens, afterTokens, saved, pct };
}

export function applyCompressionRules(content, aggressive = false) {
  const changes = [];
  let result = content;

  const blanksRemoved = countBlankLineBlocks(result);
  result = removeExtraBlankLines(result);
  if (blanksRemoved > 0)
    changes.push(`Removed ${blanksRemoved} extra blank line block${blanksRemoved > 1 ? 's' : ''}`);

  const fencesShortened = countVerboseFences(result);
  result = shortenCodeFences(result);
  if (fencesShortened > 0)
    changes.push(`Shortened ${fencesShortened} code fence label${fencesShortened > 1 ? 's' : ''}`);

  const maxItems = aggressive ? 3 : 5;
  const listResult = truncateLongLists(result, maxItems);
  result = listResult.result;
  changes.push(...listResult.changes);

  return { result, changes };
}

// ─── output helpers ──────────────────────────────────────────────────────────

export function printCompressionReport(stats, changes) {
  const { beforeTokens, afterTokens, pct } = stats;
  console.log('');
  console.log(chalk.bold('cto compress — CLAUDE.md optimization'));
  console.log('');
  console.log(`  Before: ${chalk.yellow(beforeTokens)} tokens`);
  console.log(`  After:  ${chalk.green(afterTokens)} tokens (${pct}% reduction)`);
  console.log('');
  if (changes.length === 0) {
    console.log(chalk.dim('  No compression opportunities found.'));
    console.log('');
    return;
  }
  console.log('  Changes:');
  for (const c of changes) console.log(`  - ${c}`);
  console.log('');
}

// Returns false and prints reason if writing should be skipped; true otherwise.
function shouldWrite(original, compressed, changes, dryRun) {
  if (changes.length === 0) return false;
  if (dryRun) {
    console.log(chalk.dim('  --dry-run: no files written.'));
    console.log('');
    return false;
  }
  if (original === compressed) {
    console.log(chalk.dim('  Content unchanged after compression.'));
    console.log('');
    return false;
  }
  return true;
}

async function promptApply() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise(resolve =>
    rl.question(chalk.blue('Apply changes? [y/N] '), resolve));
  rl.close();
  console.log('');
  return ans.trim().toLowerCase() === 'y';
}

function writeCompressed(claudeMdPath, original, compressed, backup, stats) {
  if (backup !== false) {
    fs.writeFileSync(claudeMdPath + '.bak', original, 'utf8');
    console.log(chalk.dim('  Backup: CLAUDE.md.bak'));
  }
  fs.writeFileSync(claudeMdPath, compressed, 'utf8');
  console.log(chalk.green(`✓ Saved — ${stats.saved} tokens freed (${stats.pct}% reduction)`));
  console.log('');
}

// ─── command entry point ─────────────────────────────────────────────────────

export async function compressCommand(options) {
  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    console.error(chalk.red('✗ CLAUDE.md not found. Run: cto init'));
    process.exit(1);
  }
  const original = fs.readFileSync(claudeMdPath, 'utf8');
  const { result: compressed, changes } = applyCompressionRules(original, options?.aggressive);
  const stats = computeTokenStats(original, compressed);
  printCompressionReport(stats, changes);
  if (!shouldWrite(original, compressed, changes, options?.dryRun)) return;
  const confirmed = await promptApply();
  if (!confirmed) {
    console.log(chalk.dim('Skipped.'));
    console.log('');
    return;
  }
  writeCompressed(claudeMdPath, original, compressed, options?.backup, stats);
}
