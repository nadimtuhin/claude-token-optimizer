import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';

function promptUser(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

export function parseSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[2], level: m[1].length, raw: line, content: '', startLine: i + 1 };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function classifyCompleted(sec) {
  if (!/^(completed|done|✓)/i.test(sec.heading.trim())) return null;
  const sectionText = sec.raw + (sec.content ? '\n' + sec.content : '');
  return {
    type: 'completed',
    heading: sec.heading,
    content: sectionText,
    tokens: countTokens(sectionText),
    startLine: sec.startLine,
    destination: 'completions',
  };
}

function classifySession(sec) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(sec.heading.trim())) return null;
  const sectionText = sec.raw + (sec.content ? '\n' + sec.content : '');
  return {
    type: 'session_note',
    heading: sec.heading,
    content: sectionText,
    tokens: countTokens(sectionText),
    startLine: sec.startLine,
    destination: 'sessions/archive',
  };
}

function classifyEmpty(sec, next) {
  const hasChild = next && next.level > sec.level;
  if (sec.level < 2 || sec.content.trim() || hasChild) return null;
  return {
    type: 'empty',
    heading: sec.heading,
    content: sec.raw,
    tokens: 0,
    startLine: sec.startLine,
    destination: null,
  };
}

export function findPruneTargets(content) {
  const sections = parseSections(content);
  const targets = [];

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const next = sections[si + 1];
    const target =
      classifyCompleted(sec) ||
      classifySession(sec) ||
      classifyEmpty(sec, next);
    if (target) targets.push(target);
  }

  return targets;
}

export function removeSection(content, sectionRaw) {
  const level = (sectionRaw.match(/^(#+)/) || ['', '#'])[1].length;
  const escapedRaw = sectionRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `${escapedRaw}[\\s\\S]*?(?=\\n#{1,${level}}\\s|$)`,
    '',
  );
  return content.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// Pure: formats a single dry-run line for display
export function formatDryRunLine(target, index) {
  const dest = target.destination ? `→ Archive to .claude/${target.destination}/` : '→ Delete';
  return [
    `  [${index + 1}] "${target.heading}" (line ${target.startLine}, ${target.tokens} tokens)`,
    `      ${dest}`,
  ].join('\n');
}

// Pure: builds the archive filename
export function buildArchiveName(date, heading) {
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${date}-pruned-${slug}.md`;
}

// Pure: builds the archive file content
export function buildArchiveContent(date, content) {
  return `# Pruned from CLAUDE.md on ${date}\n\n${content}\n`;
}

// Pure: applies all target removals to content string, returns result + totalSaved
export function applyPruneTargets(content, targets) {
  let result = content;
  let totalSaved = 0;
  for (const t of targets) {
    result = removeSection(result, t.content.split('\n')[0]);
    totalSaved += t.tokens;
  }
  return { result, totalSaved };
}

function writeArchive(dir, target, date) {
  const archiveDir = path.join(dir, '.claude', target.destination);
  fs.mkdirSync(archiveDir, { recursive: true });
  const archiveFile = path.join(archiveDir, buildArchiveName(date, target.heading));
  fs.writeFileSync(archiveFile, buildArchiveContent(date, target.content), 'utf8');
  return archiveFile;
}

function printDryRun(targets) {
  console.log(`Found ${targets.length} item${targets.length > 1 ? 's' : ''} to prune:\n`);
  for (let i = 0; i < targets.length; i++) {
    console.log(formatDryRunLine(targets[i], i));
  }
  console.log('');
  console.log(chalk.dim('  --dry-run: no files written.'));
  console.log('');
}

async function confirmTarget(rl, target, index) {
  const dest = target.destination ? `→ Archive to .claude/${target.destination}/` : '→ Delete';
  console.log(`  [${index + 1}] Section "${target.heading}" (line ${target.startLine}, ${target.tokens} tokens)`);
  console.log(`      ${chalk.dim(dest)}`);
  const ans = await promptUser(rl, chalk.blue(`      Apply? [Y/n] `));
  return ans.trim().toLowerCase() !== 'n';
}

function printTargetYes(target, index) {
  const dest = target.destination ? `→ Archive to .claude/${target.destination}/` : '→ Delete';
  console.log(`  [${index + 1}] Section "${target.heading}" (line ${target.startLine}, ${target.tokens} tokens)`);
  console.log(`      ${chalk.dim(dest)}`);
}

async function collectAccepted(targets, options) {
  const rl = options?.yes ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
  const accepted = [];
  console.log(`Found ${targets.length} item${targets.length > 1 ? 's' : ''} to prune:\n`);
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    let accept = true;
    if (!options?.yes) {
      accept = await confirmTarget(rl, t, i);
    } else {
      printTargetYes(t, i);
    }
    if (!accept) { console.log(chalk.dim('      Skipped.')); console.log(''); continue; }
    accepted.push(t);
    console.log('');
  }
  if (rl) rl.close();
  return accepted;
}

function commitChanges(claudeMdPath, dir, original, accepted, options) {
  if (options?.backup !== false) {
    fs.writeFileSync(claudeMdPath + '.bak', original, 'utf8');
  }
  const date = new Date().toISOString().split('T')[0];
  for (const t of accepted) {
    if (t.destination) {
      const archiveFile = writeArchive(dir, t, date);
      console.log(chalk.dim(`      Archived → ${path.relative(dir, archiveFile)}`));
    }
  }
  const { result, totalSaved } = applyPruneTargets(original, accepted);
  fs.writeFileSync(claudeMdPath, result, 'utf8');
  const afterTokens = countTokens(result);
  const beforeTokens = countTokens(original);
  console.log(chalk.green(`✓ Saved ${totalSaved} tokens — CLAUDE.md now ${afterTokens} tokens (was ${beforeTokens})`));
  console.log('');
}

function loadTargets(claudeMdPath) {
  if (!fs.existsSync(claudeMdPath)) {
    console.error(chalk.red('✗ CLAUDE.md not found. Run: cto init'));
    process.exit(1);
  }
  console.log('');
  console.log(chalk.bold('cto prune — scanning CLAUDE.md'));
  console.log('');
  const original = fs.readFileSync(claudeMdPath, 'utf8');
  return { original, targets: findPruneTargets(original) };
}

export async function pruneCommand(options) {
  const dir = process.cwd();
  const claudeMdPath = path.join(dir, 'CLAUDE.md');
  const { original, targets } = loadTargets(claudeMdPath);
  if (targets.length === 0) {
    console.log(chalk.green('  Nothing to prune. CLAUDE.md looks clean.'));
    console.log('');
    return;
  }
  if (options?.dryRun) { printDryRun(targets); return; }
  const accepted = await collectAccepted(targets, options);
  if (accepted.length === 0) {
    console.log(chalk.dim('No changes applied.'));
    console.log('');
    return;
  }
  commitChanges(claudeMdPath, dir, original, accepted, options);
}
