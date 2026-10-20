import chalk from 'chalk';

const TARGETS = {
  'claude-code': {
    id: 'claude-code',
    label: 'Claude Code',
    instructionFile: 'CLAUDE.md',
    supportDir: '.claude',
    archiveDir: '.claude/completions',
    docsDir: 'docs',
    docsIndex: 'docs/INDEX.md',
    ignoreFile: '.claudeignore',
    scanPatterns: ['*.md', '.claude/*.md', 'docs/**/*.md'],
    hint: 'Run: cto init',
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    instructionFile: 'AGENTS.md',
    supportDir: '.cursor/rules',
    archiveDir: '.cursor/archive',
    docsDir: 'docs',
    docsIndex: 'docs/INDEX.md',
    ignoreFile: '.cursorignore',
    scanPatterns: ['AGENTS.md', '.cursor/rules/**/*.mdc', 'docs/**/*.md'],
    hint: 'Run: cto init --target cursor',
  },
};

export function getTarget(id) {
  const t = TARGETS[id];
  if (!t) {
    const valid = Object.keys(TARGETS).join(', ');
    console.error(chalk.red(`Unknown target: ${id}. Valid targets: ${valid}`));
    process.exit(1);
  }
  return t;
}

export function getDefaultTarget() {
  return TARGETS['claude-code'];
}
