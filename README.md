<div align="center">

# 🚀 Claude Token Optimizer

**Stop wasting Claude Code's context on old docs**

Cut token usage by 90% so Claude can focus on your actual code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer/stargazers)
[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/nadimtuhin/claude-token-optimizer/releases)

</div>

---

## The Problem

Claude Code loads everything at session start. My RedwoodJS project was burning **11,000 tokens** before I even started coding - that's 1,783 lines of documentation, old session notes, and completed task history eating into my context window.

## The Solution

Structure your docs so Claude only loads what it needs:
- **4 essential files** at startup (~800 tokens)
- **Everything else** available but never auto-loaded (0 tokens)
- **Topic-based learnings** you load as needed (~500 tokens each)

Real result: 11,000 → 1,300 tokens. That's 9,700 tokens freed up for your code.

## Quick Setup

Run this in your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash
```

It'll ask about your project type and create the optimized structure. Takes about 2 minutes.

### What You Get

```
your-project/
├── CLAUDE.md                    # Claude reads this first
├── .claudeignore                # Keeps old docs from loading
│
├── .claude/
│   ├── COMMON_MISTAKES.md       # Your top 5 critical bugs
│   ├── QUICK_START.md           # Common commands
│   ├── ARCHITECTURE_MAP.md      # Where things are
│   ├── completions/             # Task history (0 tokens)
│   └── sessions/                # Old work (0 tokens)
│
└── docs/
    ├── INDEX.md
    ├── learnings/               # Load these as needed
    └── archive/                 # Old docs (0 tokens)
```

## How It Works

**Before:**
```
Session start loads:
├── All docs           → 8,000 tokens
├── Old sessions       → 2,000 tokens
├── Task history       → 1,000 tokens
└── Misc               → ???
                Total: ~11,000 tokens
```

**After:**
```
Session start loads:
├── CLAUDE.md          → 450 tokens
├── COMMON_MISTAKES.md → 350 tokens
├── QUICK_START.md     → 100 tokens
└── ARCHITECTURE_MAP.md→ 150 tokens
                Total: ~800 tokens (90% reduction)

Everything else?
Available when you ask, but costs 0 tokens until you do.
```

## Framework-Specific Setup

Got patterns for 9 frameworks with common mistakes and best practices:

| Framework | Example |
|-----------|---------|
| Express.js | [examples/express.md](examples/express.md) |
| Next.js | [examples/nextjs.md](examples/nextjs.md) |
| Vue.js | [examples/vue.md](examples/vue.md) |
| Nuxt.js | [examples/nuxtjs.md](examples/nuxtjs.md) |
| Angular | [examples/angular.md](examples/angular.md) |
| Django | [examples/django.md](examples/django.md) |
| Rails | [examples/rails.md](examples/rails.md) |
| NestJS | [examples/nestjs.md](examples/nestjs.md) |
| Laravel | [examples/laravel.md](examples/laravel.md) |

Each includes the top 5 critical mistakes for that framework (N+1 queries, auth issues, etc).

### Manual Setup

If you want more control or framework-specific patterns:

1. Copy [`UNIVERSAL_SETUP.md`](UNIVERSAL_SETUP.md)
2. Paste it into Claude Code
3. Answer Claude's questions
4. Get framework-specific patterns included

## After Setup

1. **Add your critical bugs** to `.claude/COMMON_MISTAKES.md`
   Only add bugs that took >1 hour to debug. Keep it short.

2. **Document your commands** in `.claude/QUICK_START.md`
   `npm run dev`, database commands, whatever you use daily.

3. **Map your architecture** in `.claude/ARCHITECTURE_MAP.md`
   Where controllers live, how routing works, etc.

4. **Create topic files** in `docs/learnings/` as you learn
   One file per topic (testing, API design, deployment)

5. **Archive completed work**
   Task docs go to `.claude/completions/`, old sessions to `.claude/sessions/archive/`

Claude loads only what it needs. Everything else sits there at 0 token cost until you explicitly ask for it.

## Real Numbers

My RedwoodJS project:
- Before: 8,000 tokens at startup, 11,000 total
- After: 800 tokens at startup, 1,300 total
- **7,200 tokens freed up** for actual code

Your mileage will vary, but 83-87% reduction is typical across frameworks.

## FAQ

**Is the bash script safe?**
It only creates files, never deletes. You can read the [source](init.sh) - it's ~470 lines.

**Works with my framework?**
Yes. The bash script creates a universal structure. Works with any language/framework. We have specific patterns for 8 popular ones, but it's not required.

**What if I have existing docs?**
The setup works alongside them. You can migrate gradually or keep both.

**Can I customize it?**
Everything. Edit files, change structure, adjust what loads. It's just markdown files and a `.claudeignore`.

**How do I maintain it?**
When you hit a critical bug that took >1 hour, add it to `COMMON_MISTAKES.md`. That's the main upkeep. Rest is optional.

## Related Projects

**[Claude Workflows](https://github.com/nadimtuhin/claude-workflows)** - Systematic workflow commands for Claude Code

While this repo optimizes **what Claude knows** (documentation), Claude Workflows optimizes **what Claude does** (processes). They work great together:

- This repo: Documentation structure (4 core files, 0-token historical context)
- Workflows: Process automation (`/dev:start-feature`, `/git:commit`, `/test:run`)

Both use the same principle: 0 tokens until you need them.

## Contributing

Want to add a framework? Copy one of the [examples](examples/), test it on a real project, and submit a PR with token savings.

Needed:
- Flask/FastAPI
- Spring Boot
- Go (Gin/Echo/Fiber)
- Rust (Actix/Axum)
- Phoenix
- ASP.NET Core

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Need Help?

- Bug? [Open an issue](https://github.com/nadimtuhin/claude-token-optimizer/issues)
- Question? [Start a discussion](https://github.com/nadimtuhin/claude-token-optimizer/discussions)
- Love it? Star the repo

## License

MIT - use it however you want.

---

Built because I was tired of Claude loading 11,000 tokens of docs I wrote 3 months ago.

Now it loads 800 tokens and I actually have room to code.
