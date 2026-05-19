import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { getClaudeIgnore, isKnownFramework, SUPPORTED_FRAMEWORKS } from '../lib/frameworks.js';

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

export function buildClaudeMd(projectType, techStack, mainFeatures, date) {
  return `# CLAUDE.md

**Quick-start guide for Claude Code - Complete details in linked docs**

---

## Project Overview

${projectType} for ${mainFeatures}

**Tech Stack**: ${techStack}

---

## Session Start Protocol ⚡

**MANDATORY** at start of each session:

\`\`\`bash
# Load essential docs (~800 tokens - 2 min read)
✓ .claude/COMMON_MISTAKES.md      # ⚠️ CRITICAL - Read FIRST
✓ .claude/QUICK_START.md          # Essential commands
✓ .claude/ARCHITECTURE_MAP.md     # File locations
\`\`\`

**At task completion:**
- Create completion doc in \`.claude/completions/YYYY-MM-DD-task-name.md\`
- Move session file to \`.claude/sessions/archive/\` (if created)

**⚠️ NEVER auto-load:**
- Files in \`.claude/completions/\` (0 token cost)
- Files in \`.claude/sessions/\` (0 token cost)
- Files in \`docs/archive/\` (0 token cost)

---

## Quick Start Commands

\`\`\`bash
# Add your common commands here
\`\`\`

---

**Last Updated**: ${date}
**Optimized with**: [Claude Token Optimizer](https://github.com/nadimtuhin/claude-token-optimizer)
`;
}

export function buildCommonMistakesMd(date) {
  return `# Common Mistakes

**⚠️ CRITICAL - Read at session start**

---

## Top 5 Critical Mistakes

### 1. [Add Your First Critical Mistake]

**Symptom**:
**Check**:
**Fix**:

### 2. [Add Second Mistake]

### 3. [Add Third Mistake]

### 4. [Add Fourth Mistake]

### 5. [Add Fifth Mistake]

---

**Last Updated**: ${date}
`;
}

export function buildQuickStartMd(date) {
  return `# Quick Start Commands

---

## Development

\`\`\`bash
# Start development server

# Run tests

# Build for production
\`\`\`

---

**Last Updated**: ${date}
`;
}

export function buildArchitectureMapMd(date) {
  return `# Architecture Map

---

## Directory Structure

\`\`\`
project/
├── [Add your structure]
\`\`\`

## Key File Locations

- **Configuration**:
- **Main entry**:
- **Tests**:

---

**Last Updated**: ${date}
`;
}

export async function runInit(dir, options) {
  const date = new Date().toISOString().split('T')[0];
  const { projectType, techStack, mainFeatures, framework, force } = options;

  const claudeMdPath = path.join(dir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath) && !force) {
    throw new Error('CLAUDE.md already exists. Run with --force to overwrite.');
  }

  const dirs = [
    '.claude/completions',
    '.claude/sessions/active',
    '.claude/sessions/archive',
    '.claude/templates',
    'docs/learnings',
    'docs/archive',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
  }

  const fw = framework?.toLowerCase();
  writeFile(path.join(dir, '.claudeignore'), getClaudeIgnore(fw));

  writeFile(path.join(dir, 'CLAUDE.md'), buildClaudeMd(projectType, techStack, mainFeatures, date));
  writeFile(path.join(dir, '.claude', 'COMMON_MISTAKES.md'), buildCommonMistakesMd(date));
  writeFile(path.join(dir, '.claude', 'QUICK_START.md'), buildQuickStartMd(date));
  writeFile(path.join(dir, '.claude', 'ARCHITECTURE_MAP.md'), buildArchitectureMapMd(date));

  writeFile(path.join(dir, 'docs', 'INDEX.md'), `# Documentation Index

---

## Session Start (Essential - ~800 tokens)

- \`CLAUDE.md\` (~450 tokens)
- \`.claude/COMMON_MISTAKES.md\` (~350 tokens)
- \`.claude/QUICK_START.md\` (~100 tokens)
- \`.claude/ARCHITECTURE_MAP.md\` (~150 tokens)

## Task-Specific Topics (Load As Needed)

Add topic files in \`docs/learnings/\` and list them here.

---

**Last Updated**: ${date}
`);
}

export async function initCommand(options) {
  const dir = process.cwd();

  console.log('');
  console.log(chalk.bold('╔════════════════════════════════════════════════╗'));
  console.log(chalk.bold('║   Claude Token Optimizer - Project Setup       ║'));
  console.log(chalk.bold('╚════════════════════════════════════════════════╝'));
  console.log('');

  let { framework, yes, force } = options;
  let projectType, techStack, mainFeatures;

  if (framework && !isKnownFramework(framework)) {
    console.log(chalk.yellow(`⚠️  Unknown framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`));
    framework = undefined;
  }

  if (yes || framework) {
    projectType = framework ? `${framework} application` : 'Application';
    techStack = framework ?? 'Unknown';
    mainFeatures = 'See README';
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(chalk.blue('📋 Project Information'));
    console.log('');
    projectType = await prompt(rl, 'Project Type (e.g., Express, Next.js, Django): ');
    techStack = await prompt(rl, 'Tech Stack (e.g., Express, PostgreSQL, Prisma): ');
    mainFeatures = await prompt(rl, 'Main Features (brief description): ');
    rl.close();
    console.log('');
  }

  console.log(chalk.green('📁 Creating directory structure...'));
  try {
    await runInit(dir, { framework, projectType, techStack, mainFeatures, force });
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(chalk.yellow(`⚠️  ${err.message}`));
      return;
    }
    throw err;
  }

  console.log('');
  console.log(chalk.green('✅ Setup Complete!'));
  console.log('');
  console.log('📊 Token Optimization:');
  console.log('   • Session start: ~800 tokens (vs ~8,000 before)');
  console.log('   • Savings: ~88% reduction ⚡');
  console.log('');
  console.log('📝 Next Steps:');
  console.log(`   1. Customize ${chalk.cyan('.claude/COMMON_MISTAKES.md')}`);
  console.log(`   2. Update ${chalk.cyan('.claude/QUICK_START.md')} with your commands`);
  console.log(`   3. Fill in ${chalk.cyan('.claude/ARCHITECTURE_MAP.md')}`);
  console.log('');
  console.log(`   Run ${chalk.cyan('npx claude-token-optimizer measure')} to verify savings`);
  console.log('');
}
