import fs from 'node:fs';
import path from 'node:path';
import { countTokens } from '../lib/tokenizer.js';

const WATCHED = [
  { rel: 'CLAUDE.md', target: 450 },
  { rel: '.claude/COMMON_MISTAKES.md', target: 350 },
  { rel: '.claude/QUICK_START.md', target: 100 },
  { rel: '.claude/ARCHITECTURE_MAP.md', target: 150 },
  { rel: 'docs/INDEX.md', target: null },
];

const WRITE_LOG = '.claude/sessions/write-log.md';
const BAR_WIDTH = 10;

export function bar(tokens, target) {
  if (!target || target <= 0) return '          ';
  const pct = Math.min(tokens / target, 1);
  const filled = Math.round(pct * BAR_WIDTH);
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

export function formatFileRow(rel, tokens, target) {
  const label = rel.padEnd(34);
  const tok = String(tokens).padStart(5);
  const tgt = target ? `  target: ${target}` : '';
  return `  ${label} ${tok} tokens  ${bar(tokens, target)}${tgt}`;
}

export function parseWriteLogEntries(logContent) {
  const entries = [...logContent.matchAll(/^\|\s+([^|]+?)\s+\|\s+(\d+)\s+\|\s+([^|]+?)\s+\|/gm)];
  return entries.map(([, filePath, tokStr, time]) => ({
    filePath: filePath.trim(),
    tokStr,
    time: time.trim(),
  }));
}

export function formatWriteLogRow(entry) {
  const label = entry.filePath.padEnd(34);
  const tok = String(entry.tokStr).padStart(5);
  return `  ${label} ${tok} tokens  (${entry.time})`;
}

export function buildFileRows(watchedEntries, dir) {
  let total = 0;
  let totalTarget = 0;
  const lines = watchedEntries.map(({ rel, target }) => {
    const abs = path.join(dir, rel);
    const tokens = fs.existsSync(abs) ? countTokens(fs.readFileSync(abs, 'utf8')) : 0;
    total += tokens;
    if (target) totalTarget += target;
    return formatFileRow(rel, tokens, target);
  });
  return { lines, total, totalTarget };
}

export function buildWatchDisplay(dir, now = new Date()) {
  const ts = now.toISOString().replace('T', ' ').slice(0, 19);
  const { lines: fileLines, total, totalTarget } = buildFileRows(WATCHED, dir);
  const pct = totalTarget ? Math.round((total / totalTarget) * 100) : 0;
  const totalBar = bar(total, totalTarget || 1050);
  const lines = [
    `cto watch — token monitor  [${ts}]`, '',
    'Auto-loaded files:', ...fileLines, '',
    `  ${'Total:'.padEnd(34)} ${String(total).padStart(5)} / ${totalTarget} tokens  ${totalBar}  ${pct}% of target`,
  ];

  const writeLog = path.join(dir, WRITE_LOG);
  if (fs.existsSync(writeLog)) {
    const entries = parseWriteLogEntries(fs.readFileSync(writeLog, 'utf8'));
    lines.push('', 'Session writes (from hook log):', ...entries.slice(-5).reverse().map(formatWriteLogRow));
  }

  lines.push('', 'Press Ctrl+C to stop');
  return lines.join('\n');
}

export function setupFileWatchers(dir, watched, writeLog, onUpdate) {
  const watchers = [];
  for (const { rel } of [...watched, { rel: writeLog }]) {
    try { watchers.push(fs.watch(path.join(dir, rel), onUpdate)); } catch { /* file may not exist */ }
  }
  return watchers;
}

export function setupDirWatchers(dir, onUpdate) {
  const dirs = [dir, path.join(dir, '.claude'), path.join(dir, '.claude', 'sessions'), path.join(dir, 'docs')];
  const watchers = [];
  for (const watchDir of dirs) {
    if (fs.existsSync(watchDir)) {
      try { watchers.push(fs.watch(watchDir, onUpdate)); } catch { /* ignore */ }
    }
  }
  return watchers;
}

export async function watchCommand(options = {}) {
  const dir = process.cwd();
  const intervalMs = options.interval ? parseInt(options.interval, 10) * 1000 : null;
  let debounce = null;

  function redraw() {
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write(buildWatchDisplay(dir) + '\n');
  }

  function scheduleRedraw() {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(redraw, 200);
  }

  redraw();
  const timer = intervalMs ? setInterval(redraw, intervalMs) : null;
  const watchers = intervalMs ? [] : [
    ...setupFileWatchers(dir, WATCHED, WRITE_LOG, scheduleRedraw),
    ...setupDirWatchers(dir, scheduleRedraw),
  ];

  function cleanup() {
    if (debounce) clearTimeout(debounce);
    if (timer) clearInterval(timer);
    for (const w of watchers) w.close();
    process.stdout.write('\n');
  }

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  await new Promise(() => {});
}
