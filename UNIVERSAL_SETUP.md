# Universal Claude Code Setup Prompt

**Copy this entire prompt and paste into Claude Code for any new project to set up optimized documentation structure**

---

# Setup Optimized Claude Code Documentation for [PROJECT_NAME]

I need you to set up an optimized Claude Code documentation structure for this project. This structure reduces token usage by 90% while preserving all knowledge.

## Project Context

**Project Type**: [Express / Next.js / RedwoodJS / React / etc.]
**Tech Stack**: [List main technologies]
**Main Features**: [Brief description of what the project does]

## Tasks to Complete

### 1. Analyze Project Structure

First, analyze the current project:
- Read package.json to understand the stack
- Check existing documentation files
- Identify project-specific patterns (API structure, database, etc.)

### 2. Create Core Documentation Structure

Create these essential files in the root:

**CLAUDE.md** - Main project guide (keep under 200 lines)
```markdown
Include:
- Project overview (2-3 sentences)
- Session start protocol (load 3-4 essential docs)
- Quick start commands
- Architecture quick reference
- Testing methodology
- Documentation navigation
- Code style guidelines
```

### 3. Create .claude/ Directory Structure

```
.claude/
├── COMMON_MISTAKES.md            # Critical errors to avoid
├── QUICK_START.md                # Essential commands
├── ARCHITECTURE_MAP.md           # File locations
├── LEARNINGS_INDEX.md            # Pointers to detailed docs
├── DOCUMENTATION_MAINTENANCE.md  # When to update docs, archive, save mistakes
├── completions/                  # Task completion docs (NEVER auto-load)
│   └── README.md
├── sessions/                     # Session files (NEVER auto-load)
│   ├── active/
│   ├── archive/
│   └── README.md
└── templates/
    ├── completion-template.md
    └── session-template.md
```

### 4. Create docs/ Directory Structure

```
docs/
├── INDEX.md                  # Master navigation with token estimates
├── QUICK_REFERENCE.md        # Fast lookups
├── learnings/                # Split by topic (load as needed)
│   ├── [topic-1].md
│   ├── [topic-2].md
│   └── [topic-3].md
└── archive/                  # Historical docs (NEVER auto-load)
    └── README.md
```

### 5. Create .claudeignore

```
# Task completion documents (load only when explicitly requested)
.claude/completions/**

# Session files (load only when explicitly requested)
.claude/sessions/**

# Archived documentation (load only when explicitly requested)
docs/archive/**

# Node modules and dependencies
node_modules/**
dist/**
build/**
.next/**

# Git
.git/**

# Environment
.env
.env.*
!.env.example

# Logs
*.log
logs/**

# IDE
.vscode/**
.idea/**

# OS
.DS_Store
```

### 6. Content to Create

Based on the project type, create these files:

**COMMON_MISTAKES.md** - Include:
- Top 5 critical mistakes for this tech stack
- Framework-specific gotchas
- Testing pitfalls
- Deployment issues

**ARCHITECTURE_MAP.md** - Include:
- Project directory structure
- Key file locations
- Common patterns for this framework
- Where to find features

**QUICK_START.md** - Include:
- Essential commands (dev, test, build)
- Database commands (if applicable)
- Testing workflow
- Common workflows

**docs/INDEX.md** - Include:
- Navigation by task type
- Token cost estimates
- Decision trees
- Before/after comparison

**docs/QUICK_REFERENCE.md** - Include:
- Session start checklist
- Common commands
- Code patterns for this framework
- Debugging quick tips
- File locations

**DOCUMENTATION_MAINTENANCE.md** - Include:
- When to update COMMON_MISTAKES.md (critical bugs, production issues)
- When to create completion docs (every task completion)
- When to archive docs (planning docs, POC summaries, superseded files)
- When to update learnings (new patterns, best practices)
- Decision trees and examples

**Completion/Session Templates** - Adapt to project needs

### 7. Project-Specific Topics

For `docs/learnings/`, create topic files based on project:

**Common topics:**
- `testing-patterns.md` - Framework-specific testing
- `common-pitfalls.md` - Anti-patterns for this stack
- `performance.md` - Optimization strategies

**Backend projects add:**
- `database-patterns.md` - ORM, migrations, queries
- `api-design.md` - REST/GraphQL patterns
- `queue-systems.md` - If using background jobs

**Frontend projects add:**
- `state-management.md` - Redux/Zustand/etc patterns
- `component-patterns.md` - Reusable component design
- `routing.md` - Framework routing patterns

**Full-stack projects add:**
- `authentication.md` - Auth patterns
- `deployment.md` - CI/CD and hosting

### 8. Token Optimization Rules

Document in CLAUDE.md:

```markdown
## Session Start Protocol

**MANDATORY** at start of each session:

Load these 3-4 files (~800 tokens):
✓ CLAUDE.md
✓ .claude/COMMON_MISTAKES.md ⚠️ CRITICAL
✓ .claude/QUICK_START.md
✓ .claude/ARCHITECTURE_MAP.md

**Then load task-specific docs** (~500-1500 tokens):
- See docs/INDEX.md for navigation

**⚠️ NEVER auto-load:**
- .claude/completions/** (0 token cost)
- .claude/sessions/** (0 token cost)
- docs/archive/** (0 token cost)
- Only load when user explicitly requests
```

### 9. Framework-Specific Customization

Customize based on project type:

**Express.js:**
- Routes/middleware/controllers structure
- Error handling patterns
- Database connection patterns

**Next.js:**
- App router vs Pages router
- Server/Client component patterns
- API routes structure

**React:**
- Component hierarchy
- State management approach
- Build/deployment process

**Other frameworks:**
- Follow similar patterns
- Document framework conventions
- Include testing approaches

### 10. Validation

After setup, verify:
- [ ] All files created in correct locations
- [ ] .claudeignore prevents auto-loading
- [ ] CLAUDE.md references all docs correctly
- [ ] Token estimates included in INDEX.md
- [ ] Templates are framework-appropriate
- [ ] No broken cross-references

## Expected Result

After completion, provide:
1. Summary of files created
2. Token usage comparison (before/after estimates)
3. Quick start guide for using the new structure
4. Any project-specific notes

## Token Savings Target

- Session start: Reduce to ~800 tokens (from typical ~8,000+)
- Typical task: Reduce to ~1,300 tokens
- Overall: 75-90% savings

## Important Notes

- Keep CLAUDE.md under 200 lines (link to details instead of duplicating)
- Split any file >1,000 lines into topic-based files
- All learnings files should be self-contained
- Include token estimates everywhere
- Cross-reference related docs
- Never auto-load completions, sessions, or archives

---

## Example Session After Setup

```
User: [Starts new Claude Code session]

Claude: [Auto-loads only 4 files: ~800 tokens]
1. CLAUDE.md
2. .claude/COMMON_MISTAKES.md
3. .claude/QUICK_START.md
4. .claude/ARCHITECTURE_MAP.md

Claude: Ready! What would you like to work on?

User: Add a new API endpoint

Claude: [Loads docs/learnings/api-design.md: ~500 tokens]
Total context: ~1,300 tokens (vs 8,000+ before)
```

---

## Getting Started

To use this setup:
1. Copy this entire prompt
2. Paste into Claude Code in your new project
3. Provide project context when asked
4. Claude will create all structure automatically
5. Review and customize as needed

---

**Last Updated**: 2025-11-10
**Source Project**: fb-msg-pipeline-hub (RedwoodJS)
