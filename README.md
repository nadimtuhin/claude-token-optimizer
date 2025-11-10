# Claude Code Setup

**Reusable setup prompts for optimizing Claude Code documentation**

Achieve **90% token savings** on any project in 5 minutes.

---

## Overview

This repository provides ready-to-use setup prompts that optimize Claude Code's documentation structure for any project. The system reduces token usage from ~8,000 to ~800 tokens at session start while preserving all knowledge.

### Benefits

- ✅ **90% token savings** on session start
- ✅ **Zero-token historical context** with completion docs
- ✅ **Selective loading** - load only what you need
- ✅ **Framework-specific** - tailored to your stack
- ✅ **5 minute setup** - automated by Claude Code

---

## Quick Start

### Universal Setup (Any Project)

1. Copy the entire `UNIVERSAL_SETUP.md` file
2. Open Claude Code in your project
3. Paste the prompt
4. Provide project context when asked
5. Claude creates everything automatically

### Framework-Specific Setup

For framework-specific patterns (Express.js, Next.js):

1. Start with Universal Setup (above)
2. Then say: "Also apply the [Express/Next.js] patterns from the example"
3. Claude customizes for your framework

---

## What Gets Created

After setup, your project will have:

```
your-project/
├── CLAUDE.md                           # Main guide (~450 tokens)
├── .claudeignore                       # Prevents auto-loading
│
├── .claude/
│   ├── COMMON_MISTAKES.md              # Critical errors (~350 tokens)
│   ├── QUICK_START.md                  # Commands (~100 tokens)
│   ├── ARCHITECTURE_MAP.md             # File locations (~150 tokens)
│   ├── LEARNINGS_INDEX.md              # Navigation (~200 tokens)
│   ├── DOCUMENTATION_MAINTENANCE.md    # Maintenance guide (~400 tokens)
│   │
│   ├── completions/                    # Task docs (0 tokens - never auto-load)
│   ├── sessions/                       # Session files (0 tokens)
│   └── templates/                      # Reusable templates
│
└── docs/
    ├── INDEX.md                        # Master navigation
    ├── QUICK_REFERENCE.md              # Fast lookups
    ├── learnings/                      # Topic files (load as needed)
    └── archive/                        # Historical (0 tokens)
```

---

## Token Savings

### Before Optimization:
- Session start: ~8,000 tokens (all docs auto-loaded)
- Historical context: ~3,000 tokens (sessions, summaries)
- **Total**: ~11,000 tokens

### After Optimization:
- Session start: ~800 tokens (4 essential files)
- Task-specific: +500-1,500 tokens (1-2 topic files as needed)
- Historical context: 0 tokens (never auto-loaded)
- **Total**: ~1,300 tokens

### Savings: 88% reduction (11,000 → 1,300 tokens)

---

## Available Setups

### 1. Universal Setup
**File**: `UNIVERSAL_SETUP.md`

Works for any project type:
- Express, Next.js, React, Vue, Angular
- Python (Django, Flask, FastAPI)
- Ruby (Rails), PHP (Laravel)
- Any language/framework

**What it creates**:
- Core documentation structure
- Token-optimized file organization
- Completion docs system
- Session file management
- .claudeignore configuration

### 2. Framework Examples

#### Express.js
**File**: `examples/express.md`

**Includes**:
- Express routing patterns
- Middleware organization
- API design patterns
- Database patterns
- Error handling

#### Next.js
**File**: `examples/nextjs.md`

**Includes**:
- App Router vs Pages Router
- Server/Client component patterns
- Data fetching strategies
- API routes
- Routing patterns

---

## How It Works

### Session Start Protocol

**Load 4 essential files** (~800 tokens):
1. `CLAUDE.md` - Project overview
2. `.claude/COMMON_MISTAKES.md` - Critical errors to avoid
3. `.claude/QUICK_START.md` - Essential commands
4. `.claude/ARCHITECTURE_MAP.md` - File locations

**Then load task-specific docs** as needed:
- Browser automation? → Load `docs/learnings/browser-automation.md`
- Queue work? → Load `docs/learnings/queue-system.md`
- Writing tests? → Load `docs/learnings/testing-patterns.md`

### Zero-Token Historical Context

Files in these directories cost **0 tokens**:
- `.claude/completions/` - Task completion docs
- `.claude/sessions/` - Session files
- `docs/archive/` - Historical documentation

They're never auto-loaded but available when explicitly requested.

---

## Documentation Structure

### Essential Files (Always Load - ~800 tokens)
- `CLAUDE.md` - Main project guide
- `.claude/COMMON_MISTAKES.md` - Critical mistakes
- `.claude/QUICK_START.md` - Commands
- `.claude/ARCHITECTURE_MAP.md` - File structure

### Topic Files (Load As Needed - ~200-700 tokens each)
Split by concern for selective loading:
- `docs/learnings/api-design.md`
- `docs/learnings/testing-patterns.md`
- `docs/learnings/performance.md`
- (Framework-specific topics)

### Historical Files (Never Auto-Load - 0 tokens)
- `.claude/completions/` - Completed task documentation
- `.claude/sessions/` - Session history
- `docs/archive/` - Superseded documentation

---

## Usage Examples

### Example 1: Express API Project

```bash
# 1. Copy UNIVERSAL_SETUP.md
# 2. Paste in Claude Code
# 3. Provide context:
#    - Project: Express REST API
#    - Stack: Express, PostgreSQL, Prisma, Jest
#    - Features: User auth, payments, webhooks

# Result: Complete structure created in 5 minutes
# - docs/learnings/api-design.md
# - docs/learnings/middleware-patterns.md
# - docs/learnings/database-patterns.md
# - Common mistakes: Missing error handler, improper middleware order
```

### Example 2: Next.js App

```bash
# 1. Copy UNIVERSAL_SETUP.md
# 2. Paste in Claude Code
# 3. Provide context:
#    - Project: Next.js E-commerce
#    - Stack: Next.js 14 (App Router), Tailwind, Prisma
#    - Features: Product catalog, checkout, admin

# Result: Next.js-optimized structure
# - docs/learnings/routing-patterns.md
# - docs/learnings/component-patterns.md
# - docs/learnings/data-fetching.md
# - Common mistakes: Using client components unnecessarily
```

---

## Customization

### Adding New Topics

1. Create file in `docs/learnings/your-topic.md`
2. Update `docs/INDEX.md` with navigation entry and token estimate
3. Add cross-references in related topics

### Adapting for Your Framework

1. Update `COMMON_MISTAKES.md` with framework pitfalls
2. Customize `ARCHITECTURE_MAP.md` with your structure
3. Create framework-specific learnings
4. Update `QUICK_REFERENCE.md` with framework commands

---

## Documentation Maintenance

The system includes guidance for Claude on when to update docs:

### Update COMMON_MISTAKES.md when:
- ✅ Bug took >1 hour to debug
- ✅ Error could cause production issue
- ✅ Mistake repeated across sessions
- ✅ Pattern violates framework conventions

### Create completion doc when:
- ✅ Every task completion

### Archive docs when:
- ✅ Planning docs after feature implemented
- ✅ POC summaries after feature stabilizes
- ✅ Superseded status docs

See `templates/maintenance-guide.md` for complete guide.

---

## Success Stories

### RedwoodJS Project (Source)
- **Before**: 8,000 tokens at session start
- **After**: 800 tokens at session start
- **Savings**: 90%
- **Files split**: DETAILED_LEARNINGS (1,783 lines) → 6 topic files

### Express API (Estimated)
- **Before**: ~10,000 tokens (all docs + examples)
- **After**: ~1,300 tokens (essentials + api-design)
- **Savings**: 87%

### Next.js App (Estimated)
- **Before**: ~9,000 tokens (all React + Next docs)
- **After**: ~1,400 tokens (essentials + component-patterns)
- **Savings**: 84%

---

## Contributing

Contributions welcome! Please see `CONTRIBUTING.md`.

### Adding Framework Examples

To add a new framework example:

1. Copy `examples/express.md` or `examples/nextjs.md`
2. Replace with framework-specific:
   - Directory structure
   - Common mistakes
   - Code patterns
   - Testing approaches
   - CLI commands
3. Test in a real project
4. Submit PR with token savings data

---

## FAQ

### Q: Will this work with my framework?
**A**: Yes! The universal setup works with any framework. Framework examples (Express, Next.js) provide additional patterns but are optional.

### Q: What if I already have documentation?
**A**: The setup prompts will analyze existing docs and either integrate or suggest consolidation.

### Q: Can I customize the structure?
**A**: Absolutely! The prompts create a starting point. Customize topic files, token estimates, and organization to your needs.

### Q: How do I maintain this long-term?
**A**: The system includes `DOCUMENTATION_MAINTENANCE.md` with guidance on when to update docs, archive files, and save common mistakes.

### Q: Does this work for non-JavaScript projects?
**A**: Yes! Universal setup works for Python, Ruby, Go, Rust, PHP, etc. Framework examples are currently JavaScript-focused but more coming soon.

---

## License

MIT License - see `LICENSE` file

---

## Support

- **Issues**: [GitHub Issues](https://github.com/nadimtuhin/claude-code-setup/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nadimtuhin/claude-code-setup/discussions)

---

## Acknowledgments

Developed while optimizing documentation for a RedwoodJS project. The system reduced token usage by 90% and made it reusable for any project.

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
