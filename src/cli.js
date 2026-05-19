import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { measureCommand } from './commands/measure.js';

export function run() {
  const program = new Command();

  program
    .name('cto')
    .description('Claude Token Optimizer — cut Claude Code context usage by 90%')
    .version('2.0.0');

  program
    .command('init')
    .description('Set up optimized documentation structure in your project')
    .option('--framework <name>', 'skip prompts, use known framework patterns (express, nextjs, django, rails, vue, nuxtjs, angular, nestjs, laravel, fastapi, go, spring-boot, svelte)')
    .option('--yes', 'non-interactive with defaults')
    .option('--force', 'overwrite existing CLAUDE.md if present')
    .action(initCommand);

  program
    .command('measure')
    .description('Show token cost of current project vs. post-optimization estimate')
    .action(measureCommand);

  program.parse();
}
