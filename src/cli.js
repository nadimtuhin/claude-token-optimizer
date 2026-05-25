import { Command } from 'commander';
import { createRequire } from 'node:module';
import { initCommand } from './commands/init.js';
import { measureCommand } from './commands/measure.js';
import { hooksCommand } from './commands/hooks.js';
import { auditCommand } from './commands/audit.js';
import { compressCommand } from './commands/compress.js';
import { pruneCommand } from './commands/prune.js';
import { watchCommand } from './commands/watch.js';
import { diffCommand } from './commands/diff.js';
import { updateCommand } from './commands/update.js';

const { version } = createRequire(import.meta.url)('../package.json');

export function run() {
  const program = new Command();

  program
    .name('cto')
    .description('Claude Token Optimizer — cut Claude Code context usage by 90%')
    .version(version);

  program
    .command('init')
    .description('Set up optimized documentation structure in your project')
    .option('--framework <name>', 'skip prompts, use known framework patterns (express, nextjs, django, rails, vue, nuxtjs, angular, nestjs, laravel, fastapi, go, spring-boot, svelte)')
    .option('--yes', 'non-interactive with defaults')
    .option('--force', 'overwrite existing CLAUDE.md if present')
    .option('--hooks', 'install all Claude Code hooks non-interactively')
    .action(initCommand);

  program
    .command('measure')
    .description('Measure auto-loaded tokens; guides new projects to cto init, existing to cto compress')
    .action(measureCommand);

  program
    .command('diff')
    .description('Show token delta between a file and its .bak backup (default: CLAUDE.md)')
    .option('--file <path>', 'compare a different file vs its .bak', 'CLAUDE.md')
    .action(diffCommand);

  program
    .command('watch')
    .description('Live token monitor — refreshes dashboard when watched files change')
    .option('--interval <seconds>', 'poll every N seconds instead of using fs.watch')
    .action(watchCommand);

  program
    .command('audit')
    .description('Check CLAUDE.md structure and token health (CI-friendly, exits 1 on errors)')
    .option('--json', 'output machine-readable JSON report')
    .option('--fix', 'auto-create missing files for failing checks')
    .action(auditCommand);

  program
    .command('compress')
    .description('Reduce CLAUDE.md token count with deterministic compression rules')
    .option('--dry-run', 'show changes without writing')
    .option('--backup', 'write CLAUDE.md.bak before overwriting (default: on)', true)
    .option('--no-backup', 'skip backup')
    .option('--aggressive', 'apply more aggressive list truncation')
    .action(compressCommand);

  program
    .command('prune')
    .description('Remove stale sections from CLAUDE.md (completed tasks, session notes, empty sections)')
    .option('--yes', 'auto-accept all removals')
    .option('--dry-run', 'show what would be removed without writing')
    .option('--backup', 'write CLAUDE.md.bak before changes (default: on)', true)
    .option('--no-backup', 'skip backup')
    .action(pruneCommand);

  const hooks = program
    .command('hooks')
    .description('Manage Claude Code hook templates');

  hooks
    .command('list')
    .description('Show available hook templates and install status')
    .action(() => hooksCommand('list'));

  hooks
    .command('install [name]')
    .description('Install a hook template to .claude/hooks/ (use --all for all hooks)')
    .option('-a, --all', 'install all available hook templates')
    .action((name, opts) => hooksCommand('install', name, opts));

  hooks
    .command('remove <name>')
    .description('Remove an installed hook')
    .option('-y, --yes', 'skip confirmation')
    .action((name, opts) => hooksCommand('remove', name, opts));

  hooks
    .command('status')
    .description('Show installed hooks and their last-modified times')
    .action(() => hooksCommand('status'));

  hooks
    .command('settings')
    .description('Print settings.json hooks block for all installed hooks')
    .action(() => hooksCommand('settings'));

  program
    .command('update')
    .description('Update cto to the latest version, or refresh project content templates')
    .option('--content', 'refresh project files (CLAUDE.md sections, hook scripts) without touching custom content')
    .action(updateCommand);

  program.parse();
}
