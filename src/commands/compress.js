import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';
import { markFencedLines } from '../lib/fences.js';

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
  const fenced = markFencedLines(content.split('\n'));
  const result = content.replace(
    /((?:^[ \t]*[-*] .+\n){6,})/gm,
    (block, _group, offset) => {
      // A list block never spans a fence marker, so its first line decides.
      if (fenced[content.slice(0, offset).split('\n').length - 1]) return block;
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

export function stripMarkup(content) {
  const changes = [];
  let result = content;

  const comments = result.match(/<!--[\s\S]*?-->/g) ?? [];
  if (comments.length > 0) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
    changes.push(`Removed ${comments.length} HTML comment${comments.length > 1 ? 's' : ''}`);
  }

  // ponytail: lazy match stops at the first </svg>, so nested <svg> blocks leave
  // residue behind. Ceiling: nested SVGs aren't fully collapsed. Upgrade path: a
  // balance-count scan tracking open/close <svg> tag depth.
  // Opening tag must not end with "/>" — a self-closing <svg/> is not a block start.
  const svgs = result.match(/<svg\b(?:[^>]*[^/>])?>[\s\S]*?<\/svg>/gi) ?? [];
  if (svgs.length > 0) {
    result = result.replace(/<svg\b(?:[^>]*[^/>])?>[\s\S]*?<\/svg>/gi, '[SVG Asset]');
    changes.push(`Collapsed ${svgs.length} inline SVG${svgs.length > 1 ? 's' : ''} to [SVG Asset]`);
  }

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

  const markupResult = stripMarkup(result);
  result = markupResult.result;
  changes.push(...markupResult.changes);

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

export function printCompressionReport(stats, changes, targetLabel = 'CLAUDE.md') {
  const { beforeTokens, afterTokens, pct } = stats;
  console.log('');
  console.log(chalk.bold(`cto compress — ${targetLabel} optimization`));
  console.log('');
  console.log(`  Before: ${chalk.yellow('~' + beforeTokens)} tokens`);
  console.log(`  After:  ${chalk.green('~' + afterTokens)} tokens (${pct}% reduction)`);
  console.log('');
  if (changes.length === 0) {
    console.log(chalk.dim('  No compression opportunities found.'));
  } else {
    console.log('  Changes:');
    for (const c of changes) console.log(`  - ${c}`);
  }
  console.log(chalk.dim('  Counts are estimates (Claude 2 tokenizer) — actual usage on current models varies.'));
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

function writeCompressed(targetPath, targetLabel, original, compressed, backup, stats) {
  if (backup !== false) {
    fs.writeFileSync(targetPath + '.bak', original, 'utf8');
    console.log(chalk.dim(`  Backup: ${targetLabel}.bak`));
  }
  fs.writeFileSync(targetPath, compressed, 'utf8');
  console.log(chalk.green(`✓ Saved — ~${stats.saved} tokens freed (${stats.pct}% reduction)`));
  console.log('');
}

// ─── command entry point ─────────────────────────────────────────────────────

export async function compressCommand(options) {
  const dir = process.cwd();
  const targetPath = path.resolve(dir, options?.file || 'CLAUDE.md');
  const targetLabel = path.relative(dir, targetPath);
  if (!fs.existsSync(targetPath)) {
    const hint = targetLabel === 'CLAUDE.md' ? ' Run: cto init' : '';
    console.error(chalk.red(`✗ ${targetLabel} not found.${hint}`));
    process.exit(1);
  }
  const original = fs.readFileSync(targetPath, 'utf8');
  const { result: compressed, changes } = applyCompressionRules(original, options?.aggressive);
  const stats = computeTokenStats(original, compressed);
  printCompressionReport(stats, changes, targetLabel);
  if (!shouldWrite(original, compressed, changes, options?.dryRun)) return;
  const confirmed = options?.yes || await promptApply();
  if (!confirmed) {
    console.log(chalk.dim('Skipped.'));
    console.log('');
    return;
  }
  writeCompressed(targetPath, targetLabel, original, compressed, options?.backup, stats);
}
