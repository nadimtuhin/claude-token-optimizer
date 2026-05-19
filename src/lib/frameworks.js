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
coverage/**`,

  nextjs: `# Node / Next.js
node_modules/**
.next/**
out/**
dist/**
coverage/**`,

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
media/**`,

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
bootstrap/cache/**`,

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
*.out`,

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

export function isKnownFramework(name) {
  return SUPPORTED_FRAMEWORKS.includes(name?.toLowerCase());
}
