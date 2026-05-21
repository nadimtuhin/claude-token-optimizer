import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';

function promptUser(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Parse CLAUDE.md into sections: [{heading, level, content, startLine}]
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

// Find stale items to prune
export function findPruneTargets(content) {
  const targets = [];
  const sections = parseSections(content);

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const heading = sec.heading.trim();

    // Completed / Done sections
    if (/^(completed|done|✓)/i.test(heading)) {
      const sectionText = sec.raw + (sec.content ? '\n' + sec.content : '');
      targets.push({
        type: 'completed',
        heading,
        content: sectionText,
        tokens: countTokens(sectionText),
        startLine: sec.startLine,
        destination: 'completions',
      });
      continue;
    }

    // Session date headers (## YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(heading)) {
      const sectionText = sec.raw + (sec.content ? '\n' + sec.content : '');
      targets.push({
        type: 'session_note',
        heading,
        content: sectionText,
        tokens: countTokens(sectionText),
        startLine: sec.startLine,
        destination: 'sessions/archive',
      });
      continue;
    }

    // Empty sections (header with no content or only whitespace) — skip H1 (structural).
    // A heading is only "empty" if it has no body AND no child sections: if the
    // next section is deeper-nested, this heading is a parent and removing it
    // would silently delete its subsections (see removeSection level logic).
    const next = sections[si + 1];
    const hasChild = next && next.level > sec.level;
    if (sec.level >= 2 && !sec.content.trim() && !hasChild) {
      targets.push({
        type: 'empty',
        heading,
        content: sec.raw,
        tokens: 0,
        startLine: sec.startLine,
        destination: null,
      });
    }
  }

  return targets;
}

// Remove a section from content by its raw heading line
export function removeSection(content, sectionRaw) {
  // Match from this heading to the next same-or-higher-level heading (or EOF)
  const level = (sectionRaw.match(/^(#+)/) || ['', '#'])[1].length;
  const escapedRaw = sectionRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `${escapedRaw}[\\s\\S]*?(?=\\n#{1,${level}}\\s|$)`,
    '',
  );
  return content.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export async function pruneCommand(options) {
  const dir = process.cwd();
  const claudeMdPath = path.join(dir, 'CLAUDE.md');

  if (!fs.existsSync(claudeMdPath)) {
    console.error(chalk.red('✗ CLAUDE.md not found. Run: cto init'));
    process.exit(1);
  }

  const original = fs.readFileSync(claudeMdPath, 'utf8');
  const targets = findPruneTargets(original);

  console.log('');
  console.log(chalk.bold('cto prune — scanning CLAUDE.md'));
  console.log('');

  if (targets.length === 0) {
    console.log(chalk.green('  Nothing to prune. CLAUDE.md looks clean.'));
    console.log('');
    return;
  }

  console.log(`Found ${targets.length} item${targets.length > 1 ? 's' : ''} to prune:\n`);

  if (options?.dryRun) {
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const dest = t.destination ? `→ Archive to .claude/${t.destination}/` : '→ Delete';
      console.log(`  [${i + 1}] "${t.heading}" (line ${t.startLine}, ${t.tokens} tokens)`);
      console.log(`      ${dest}`);
    }
    console.log('');
    console.log(chalk.dim('  --dry-run: no files written.'));
    console.log('');
    return;
  }

  const date = new Date().toISOString().split('T')[0];
  let workingContent = original;
  let totalSaved = 0;
  let actioned = 0;

  const rl = options?.yes
    ? null
    : readline.createInterface({ input: process.stdin, output: process.stdout });

  // Write backup before any changes
  const backupWritten = { done: false };

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const dest = t.destination ? `→ Archive to .claude/${t.destination}/` : '→ Delete';
    console.log(`  [${i + 1}] Section "${t.heading}" (line ${t.startLine}, ${t.tokens} tokens)`);
    console.log(`      ${chalk.dim(dest)}`);

    let accept = true;
    if (!options?.yes) {
      const ans = await promptUser(rl, chalk.blue(`      Apply? [Y/n] `));
      accept = ans.trim().toLowerCase() !== 'n';
    }

    if (!accept) {
      console.log(chalk.dim('      Skipped.'));
      console.log('');
      continue;
    }

    // Write backup once, before first change
    if (!backupWritten.done && options?.backup !== false) {
      fs.writeFileSync(claudeMdPath + '.bak', original, 'utf8');
      backupWritten.done = true;
    }

    // Archive content if it has a destination
    if (t.destination) {
      const archiveDir = path.join(dir, '.claude', t.destination);
      fs.mkdirSync(archiveDir, { recursive: true });
      const archiveFile = path.join(archiveDir,
        `${date}-pruned-${t.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.md`);
      const archiveContent = `# Pruned from CLAUDE.md on ${date}\n\n${t.content}\n`;
      fs.writeFileSync(archiveFile, archiveContent, 'utf8');
      console.log(chalk.dim(`      Archived → ${path.relative(dir, archiveFile)}`));
    }

    workingContent = removeSection(workingContent, t.raw ?? t.content.split('\n')[0]);
    totalSaved += t.tokens;
    actioned++;
    console.log('');
  }

  if (rl) rl.close();

  if (actioned > 0) {
    fs.writeFileSync(claudeMdPath, workingContent, 'utf8');
    const afterTokens = countTokens(workingContent);
    const beforeTokens = countTokens(original);
    console.log(chalk.green(`✓ Saved ${totalSaved} tokens — CLAUDE.md now ${afterTokens} tokens (was ${beforeTokens})`));
  } else {
    console.log(chalk.dim('No changes applied.'));
  }
  console.log('');
}
