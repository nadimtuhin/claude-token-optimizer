import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';
import { markFencedLines } from '../lib/fences.js';

function promptUser(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

export function parseSections(content) {
  const lines = content.split('\n');
  const fenced = markFencedLines(lines);
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = !fenced[i] && line.match(/^(#{1,6})\s+(.+)$/);
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

// Pure: formats a Date as local YYYY-MM-DD (no UTC skew from toISOString)
function formatLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Pure: true if a shape-valid Y-M-D date string is a real calendar date
function isValidDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return (
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
}

// Pure: true if the heading's leading YYYY-MM-DD date is strictly older than `days` ago.
// Lexicographic comparison against a local-date cutoff string avoids UTC-midnight skew
// from parsing the heading date itself.
export function isOlderThan(heading, days, now = new Date()) {
  const m = heading.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!m) return false;
  const dateStr = m[1];
  if (!isValidDateString(dateStr)) return false;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return dateStr < formatLocalDate(cutoff);
}

export function findPruneTargets(content, options) {
  const sections = parseSections(content);
  const targets = [];
  const days = options?.days;

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const next = sections[si + 1];
    let target;
    if (days != null) {
      const sessionTarget = classifySession(sec);
      target = sessionTarget && isOlderThan(sec.heading, days, options?.now) ? sessionTarget : null;
    } else {
      target = classifyCompleted(sec) || classifySession(sec) || classifyEmpty(sec, next);
    }
    if (target) targets.push(target);
  }

  return targets;
}

export function removeSection(content, sectionRaw) {
  const level = (sectionRaw.match(/^(#+)/) || ['', '#'])[1].length;
  const lines = content.split('\n');
  const fenced = markFencedLines(lines);
  const start = lines.findIndex((line, i) => !fenced[i] && line === sectionRaw);
  if (start === -1) return content;
  let end = start + 1;
  while (end < lines.length) {
    const m = !fenced[end] && lines[end].match(/^(#{1,6})\s/);
    if (m && m[1].length <= level) break;
    end++;
  }
  lines.splice(start, end - start);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// Pure: formats a single dry-run line for display
export function formatDryRunLine(target, index) {
  const dest = target.destination ? `→ Archive to .claude/${target.destination}/` : '→ Delete';
  return [
    `  [${index + 1}] "${target.heading}" (line ${target.startLine}, ~${target.tokens} tokens)`,
    `      ${dest}`,
  ].join('\n');
}

// Pure: builds the archive filename
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Archives from the default file keep their historical name. Other sources get a
// prefix so `prune --file a.md` and `prune --file b.md` on the same day cannot
// overwrite each other's "completed" archive.
export function buildArchiveName(date, heading, source = 'CLAUDE.md') {
  const sourcePrefix = source === 'CLAUDE.md' ? '' : slugify(source.replace(/\.md$/i, '')) + '-';
  return `${date}-pruned-${sourcePrefix}${slugify(heading)}.md`;
}

// Pure: builds the archive file content
export function buildArchiveContent(date, content, source = 'CLAUDE.md') {
  return `# Pruned from ${source} on ${date}\n\n${content}\n`;
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

function writeArchive(dir, target, date, sourceLabel) {
  const archiveDir = path.join(dir, '.claude', target.destination);
  fs.mkdirSync(archiveDir, { recursive: true });
  const archiveFile = path.join(archiveDir, buildArchiveName(date, target.heading, sourceLabel));
  fs.writeFileSync(archiveFile, buildArchiveContent(date, target.content, sourceLabel), 'utf8');
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
  console.log(`  [${index + 1}] Section "${target.heading}" (line ${target.startLine}, ~${target.tokens} tokens)`);
  console.log(`      ${chalk.dim(dest)}`);
  const ans = await promptUser(rl, chalk.blue(`      Apply? [Y/n] `));
  return ans.trim().toLowerCase() !== 'n';
}

function printTargetYes(target, index) {
  const dest = target.destination ? `→ Archive to .claude/${target.destination}/` : '→ Delete';
  console.log(`  [${index + 1}] Section "${target.heading}" (line ${target.startLine}, ~${target.tokens} tokens)`);
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

function commitChanges(target, original, accepted, options) {
  const { path: targetPath, label: targetLabel, dir } = target;
  if (options?.backup !== false) {
    fs.writeFileSync(targetPath + '.bak', original, 'utf8');
  }
  const date = new Date().toISOString().split('T')[0];
  for (const t of accepted) {
    if (t.destination) {
      const archiveFile = writeArchive(dir, t, date, targetLabel);
      console.log(chalk.dim(`      Archived → ${path.relative(dir, archiveFile)}`));
    }
  }
  const { result, totalSaved } = applyPruneTargets(original, accepted);
  fs.writeFileSync(targetPath, result, 'utf8');
  const afterTokens = countTokens(result);
  const beforeTokens = countTokens(original);
  console.log(chalk.green(`✓ Saved ~${totalSaved} tokens — ${targetLabel} now ~${afterTokens} tokens (was ~${beforeTokens})`));
  console.log('');
}

function loadTargets(target, options) {
  const { path: targetPath, label: targetLabel } = target;
  if (!fs.existsSync(targetPath)) {
    const hint = targetLabel === 'CLAUDE.md' ? ' Run: cto init' : '';
    console.error(chalk.red(`✗ ${targetLabel} not found.${hint}`));
    process.exit(1);
  }
  console.log('');
  console.log(chalk.bold(`cto prune — scanning ${targetLabel}`));
  console.log('');
  const original = fs.readFileSync(targetPath, 'utf8');
  const findOptions = options?.days != null ? { days: options.days, now: options.now } : undefined;
  return { original, targets: findPruneTargets(original, findOptions) };
}

// Pure: validates the --days value; returns an error message or null if valid
export function validateDays(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return 'Invalid --days value: must be an integer >= 1.';
  }
  return null;
}

export async function pruneCommand(options) {
  if (options?.days != null) {
    const error = validateDays(options.days);
    if (error) {
      console.error(chalk.red(`✗ ${error}`));
      process.exit(1);
    }
  }
  const dir = process.cwd();
  const targetPath = path.resolve(dir, options?.file || 'CLAUDE.md');
  const target = { path: targetPath, label: path.relative(dir, targetPath), dir };
  const { original, targets } = loadTargets(target, options);
  if (targets.length === 0) {
    console.log(chalk.green(`  Nothing to prune. ${target.label} looks clean.`));
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
  commitChanges(target, original, accepted, options);
}
