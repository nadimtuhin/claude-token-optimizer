import fs from 'node:fs';
import path from 'node:path';

export const SUPPORTED_FRAMEWORKS = [
  'express', 'nextjs', 'vue', 'nuxtjs', 'angular',
  'django', 'rails', 'nestjs', 'laravel',
  'fastapi', 'go', 'spring-boot', 'svelte',
];

const BASE_IGNORE = `# Task completion documents
.claude/completions/**

# Session files
.claude/sessions/**

# Archived documentation
docs/archive/**

# User-facing docs (not needed during dev sessions — devs have CLAUDE.md)
CHANGELOG.md
README.md
CONTRIBUTING.md
GEMINI.md
AGENTS.md
.cursorrules
.windsurfrules
.clinerules
.roomodes

# Git
.git/**

# Environment
.env
.env.*
!.env.example

# Logs
*.log
logs/**

# OS
.DS_Store
`;

const FRAMEWORK_EXTRA = {
  express: `# Node
node_modules/**
dist/**
build/**
coverage/**
*.min.js`,

  nextjs: `# Node / Next.js
node_modules/**
.next/**
out/**
dist/**
coverage/**
__snapshots__/**
*.snap
public/fonts/**`,

  vue: `# Node / Vue
node_modules/**
dist/**
coverage/**`,

  nuxtjs: `# Node / Nuxt
node_modules/**
.nuxt/**
.output/**
dist/**
coverage/**`,

  angular: `# Node / Angular
node_modules/**
dist/**
.angular/**
coverage/**`,

  django: `# Python / Django
__pycache__/**
*.pyc
.venv/**
venv/**
staticfiles/**
media/**
**/migrations/*.py`,

  rails: `# Ruby / Rails
vendor/**
tmp/**
log/**
public/assets/**
.bundle/**`,

  nestjs: `# Node / NestJS
node_modules/**
dist/**
coverage/**`,

  laravel: `# PHP / Laravel
vendor/**
node_modules/**
storage/logs/**
bootstrap/cache/**
*.lock`,

  fastapi: `# Python / FastAPI
__pycache__/**
*.pyc
.venv/**
venv/**
.pytest_cache/**
htmlcov/**`,

  go: `# Go
vendor/**
bin/**
*.test
*.out
*.pb.go`,

  'spring-boot': `# Java / Spring Boot
target/**
.mvn/**
*.class
*.jar
*.war`,

  svelte: `# Node / Svelte
node_modules/**
.svelte-kit/**
build/**
dist/**
coverage/**`,
};

export function getClaudeIgnore(framework) {
  const extra = FRAMEWORK_EXTRA[framework] ?? '';
  return extra ? `${BASE_IGNORE}\n${extra}\n` : `${BASE_IGNORE}\n`;
}

export function detectFromPackageJson(content) {
  try {
    const { dependencies: d = {}, devDependencies: dd = {} } = JSON.parse(content);
    const deps = { ...d, ...dd };
    if (deps['next']) return 'nextjs';
    if (deps['nuxt']) return 'nuxtjs';
    if (deps['@angular/core']) return 'angular';
    if (deps['@nestjs/core']) return 'nestjs';
    if (deps['svelte']) return 'svelte';
    if (deps['vue']) return 'vue';
    if (deps['express']) return 'express';
  } catch { /* ignore malformed */ }
  return null;
}

export function detectFromRequirements(content) {
  if (/^django/im.test(content)) return 'django';
  if (/^fastapi/im.test(content)) return 'fastapi';
  return null;
}

export function detectFromPyproject(content) {
  if (/django/i.test(content)) return 'django';
  if (/fastapi/i.test(content)) return 'fastapi';
  return null;
}

export function detectFromComposer(content) {
  try {
    const { require: r = {} } = JSON.parse(content);
    if (r['laravel/framework']) return 'laravel';
  } catch { /* ignore */ }
  return null;
}

export function detectFromGemfile(content) {
  return /gem ['"]rails['"]/i.test(content) ? 'rails' : null;
}

export function detectFromPom(content) {
  return /spring-boot/i.test(content) ? 'spring-boot' : null;
}

export function detectFramework(dir) {
  const read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return null; } };

  const pkg = read('package.json');
  if (pkg) { const r = detectFromPackageJson(pkg); if (r) return r; }

  const req = read('requirements.txt');
  if (req) { const r = detectFromRequirements(req); if (r) return r; }

  const pyproject = read('pyproject.toml');
  if (pyproject) { const r = detectFromPyproject(pyproject); if (r) return r; }

  if (read('go.mod')) return 'go';

  const composer = read('composer.json');
  if (composer) { const r = detectFromComposer(composer); if (r) return r; }

  const gemfile = read('Gemfile');
  if (gemfile) { const r = detectFromGemfile(gemfile); if (r) return r; }

  const pom = read('pom.xml') || read('build.gradle');
  if (pom) { const r = detectFromPom(pom); if (r) return r; }

  return null;
}

export function isKnownFramework(name) {
  return SUPPORTED_FRAMEWORKS.includes(name?.toLowerCase());
}
