import fs from 'node:fs';
import path from 'node:path';

export function buildCursorSessionProtocolSection() {
  return `## Session Start Protocol

**Load at session start:**

\`\`\`bash
✓ docs/INDEX.md
\`\`\`

**At task completion:**
- Create completion doc in \`.cursor/archive/YYYY-MM-DD-task-name.md\`

**⚠️ NEVER auto-load:**
- Files in \`.cursor/archive/\` (0 token cost)
- Files in \`docs/archive/\` (0 token cost)`;
}

export function buildCursorDocsIndexMd(date) {
  return `# Documentation Index

---

## Session Start (Essential)

- \`AGENTS.md\`
- \`.cursor/rules/\` (scoped rules load automatically)

## Task-Specific Topics (Load As Needed)

---

**Last Updated**: ${date}
`;
}

export function buildAgentsMd(projectType, techStack, mainFeatures, date) {
  return `# AGENTS.md

**Quick-start guide for AI agents - Complete details in linked docs**

---

## Project Overview

${projectType} for ${mainFeatures}

**Tech Stack**: ${techStack}

---

## Session Start Protocol

**Load at session start:**

\`\`\`bash
✓ docs/INDEX.md
\`\`\`

**At task completion:**
- Create completion doc in \`.cursor/archive/YYYY-MM-DD-task-name.md\`

**⚠️ NEVER auto-load:**
- Files in \`.cursor/archive/\` (0 token cost)
- Files in \`docs/archive/\` (0 token cost)

---

## Quick Start Commands

\`\`\`bash
\`\`\`

---

**Last Updated**: ${date}
**Optimized with**: [Claude Token Optimizer](https://github.com/nadimtuhin/claude-token-optimizer)
`;
}

export function buildCursorIgnore() {
  return `.cursor/archive/**
docs/archive/**
.git/**
.env
.env.*
!.env.example
*.log
logs/**
.DS_Store
node_modules/**
vendor/**
`;
}

export function getCursorInitDirs() {
  return ['.cursor/rules', '.cursor/archive', 'docs', 'docs/archive'];
}

export function writeCursorInitFiles(dir, projectType, techStack, mainFeatures, date) {
  const writeFile = (p, c) => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    try { if (fs.lstatSync(p).isSymbolicLink()) return; } catch {}
    fs.writeFileSync(p, c, 'utf8');
  };

  writeFile(path.join(dir, 'AGENTS.md'), buildAgentsMd(projectType, techStack, mainFeatures, date));
  writeFile(path.join(dir, '.cursorignore'), buildCursorIgnore());
  writeFile(path.join(dir, 'docs', 'INDEX.md'), buildCursorDocsIndexMd(date));
}
