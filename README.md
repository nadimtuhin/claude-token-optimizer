<div align="center">

# 🚀 Claude Token Optimizer

**Stop wasting Claude Code's context on old docs**

Cut token usage by 90% so Claude can focus on your actual code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer/stargazers)
[![npm version](https://img.shields.io/npm/v/claude-token-optimizer.svg)](https://www.npmjs.com/package/claude-token-optimizer)
[![npm downloads](https://img.shields.io/npm/dm/claude-token-optimizer.svg)](https://www.npmjs.com/package/claude-token-optimizer)

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

**Option A — no install (npx):**

```bash
npx claude-token-optimizer init
```

**Option B — one-line curl install (global `cto` alias):**

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/install.sh | bash
cto init
```

**Option C — npm global:**

```bash
npm install -g claude-token-optimizer
cto init
```

All three options auto-detect your framework and create the optimized structure in ~30 seconds.

**Measure first** — see your actual token waste before committing:

```bash
npx claude-token-optimizer measure
# or
cto measure
```

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

Got patterns for 13 frameworks with common mistakes and best practices:

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
| FastAPI / Flask | [examples/fastapi.md](examples/fastapi.md) |
| Go (Gin/chi) | [examples/go.md](examples/go.md) |
| Spring Boot | [examples/spring-boot.md](examples/spring-boot.md) |
| Svelte / SvelteKit | [examples/svelte.md](examples/svelte.md) |

Each includes the top 5 critical mistakes for that framework (N+1 queries, auth issues, etc).

### Framework-aware setup

`cto init` auto-detects your framework from `package.json`, `requirements.txt`, `go.mod`, `composer.json`, `pom.xml`, or `Gemfile` — no flag needed for most projects. The detected framework is written into `CLAUDE.md`'s Tech Stack line automatically.

Pass `--framework` to override:

```bash
cto init --framework nextjs
cto init --framework django
cto init --framework go
```

Supported: `express`, `nextjs`, `vue`, `nuxtjs`, `angular`, `django`, `rails`, `nestjs`, `laravel`, `fastapi`, `go`, `spring-boot`, `svelte`

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

## CLI Reference

| Command | Description |
|---------|-------------|
| `cto init` | Set up documentation structure (auto-detects framework) |
| `cto measure` | Show auto-loaded token cost; guides first-time users to `cto init`, initialized projects to `cto compress` |
| `cto audit` | Health check — 19 structural checks, CI-friendly, exits 1 on errors (`--fix` auto-creates missing files and patches .claudeignore) |
| `cto compress` | Reduce CLAUDE.md size with deterministic rules (dry-run safe) |
| `cto prune` | Remove stale sections interactively — archives, never deletes |
| `cto diff` | Token delta after compress/prune — before vs after, % saved |
| `cto watch` | Live token dashboard — refreshes on file change, ASCII bar charts |
| `cto hooks` | Install, list, and manage Claude Code hook templates |
| `cto update` | Update cto to the latest npm version |
| `cto update --content` | Refresh project files to latest templates (merge-safe — never overwrites your custom content) |

### Ongoing maintenance

```bash
# Check CLAUDE.md health (exits 1 on errors — CI-friendly)
cto audit

# Reduce token count with rule-based compression
cto compress

# Remove completed tasks, session notes, and empty sections
cto prune

# See how many tokens compress/prune saved (compares CLAUDE.md vs .bak)
cto diff
```

**CI integration** — exits 1 on errors, machine-readable JSON:

```bash
# If cto is installed globally
cto audit --json

# Without global install (CI / one-shot)
npx claude-token-optimizer audit --json
```

JSON output: `{ "errors": 0, "warnings": 0, "infos": 2, "results": [...] }`

Exit codes: `1` when `errors > 0`, `0` for warnings/info-only or all clear.

Works in GitHub Actions, GitLab CI, and any shell that checks exit codes.

## Hooks

Claude Code hooks run shell scripts on events — before/after tool calls, on session start/end. Pair them with `claude-token-optimizer` to get active token monitoring.

### Available hook templates

```
templates/hooks/
├── pre-tool-token-guard.sh           # PreToolUse       · warn/block heavy auto-loaded files
├── pre-tool-read-guard.sh            # PreToolUse       · block lock files, binaries, huge reads
├── pre-tool-bash-guard.sh            # PreToolUse       · block find /, cat node_modules, bare grep -r
├── post-write-token-diff.sh          # PostToolUse      · log per-file write token cost
├── session-end-token-report.sh       # PostToolUse      · log session token totals
├── user-prompt-inject-context.sh     # UserPromptSubmit · auto-load topic docs from docs/learnings/
├── user-prompt-inject-snapshot.sh    # UserPromptSubmit · inject previous session snapshot (warm restart)
├── user-prompt-validate-claude-md.sh # UserPromptSubmit · validate CLAUDE.md structure once/session
├── user-prompt-ghost-scanner.sh      # UserPromptSubmit · detect unreferenced CLAUDE.md sections (ghost tokens)
├── stop-session-snapshot.sh          # Stop             · write session snapshot after each turn
├── stop-path-guard.sh                # Stop             · exit 2 if assistant mentions missing paths
└── notification-token-display.sh     # Notification     · show session token estimate on first notification
```

### Quick install

```bash
# Install all hooks at once
cto hooks install --all

# Print the settings.json block for all installed hooks (pipe-safe JSON)
cto hooks settings
```

Copy the `settings` output into `~/.claude/settings.json` (merge with existing content).

Or install one at a time:

```bash
cto hooks install pre-tool-token-guard
cto hooks install user-prompt-inject-context
cto hooks list    # see all available
cto hooks status  # see what's installed
```

---

**`pre-tool-token-guard.sh`** — fires once per session, warns when auto-loaded files exceed a threshold:

```
⚠️  Token warning: ~3,400 tokens in auto-loaded files (target: <2000)
   Run: cto measure  to see the breakdown
```

- `CTO_WARN_TOKENS` — warn threshold (default: 2000)
- `CTO_BLOCK_TOKENS` — block threshold, exit 2 (default: 8000)

---

**`user-prompt-inject-context.sh`** — the most powerful hook: keyword-matches the user's prompt against filenames in `docs/learnings/` and injects matching files as context Claude sees before answering. Zero token cost for files that don't match.

```
User: "how should I handle database migrations?"
→ 💡 Auto-loaded: docs/learnings/database.md (~85 tokens)
Claude now answers from your project's migration docs, not training data.
```

Put your project's hard-won knowledge in `docs/learnings/` (one file per topic). The hook loads the right file when you need it, nothing when you don't.

- `CTO_LEARNINGS_DIR` — path to learnings dir (default: `docs/learnings`)
- `CTO_MAX_INJECT_FILES` — max files per prompt (default: 3)
- `CTO_MAX_INJECT_WORDS` — max total words injected (default: 1500)

---

**`post-write-token-diff.sh`** — logs token cost of every Write/Edit to `.claude/sessions/write-log.md`:

```
📝 Write log: ~4,200 tokens written this session (across 6 files)
```

- `CTO_WRITE_ADVISORY_TOKENS` — advisory threshold (default: 5000)

## Real Numbers

My RedwoodJS project:
- Before: 8,000 tokens at startup, 11,000 total
- After: 800 tokens at startup, 1,300 total
- **7,200 tokens freed up** for actual code

Your mileage will vary, but 83-87% reduction is typical across frameworks.

## FAQ

**Is `cto init` safe?**
Yes. If `CLAUDE.md` already exists, `cto init` appends only missing sections — it never overwrites your content. Use `--force` to replace completely. Support files like `COMMON_MISTAKES.md` are never overwritten on re-run. Use `--dry-run` on `compress` and `prune` to preview changes before writing.

**Works with my framework?**
Yes. Works with any language/framework. Auto-detects from `package.json`, `requirements.txt`, `go.mod`, `composer.json`, or `Gemfile`. Specific patterns for 13 frameworks, but it's not required.

**What if I have an existing `CLAUDE.md`?**
`cto init` detects it and appends only what's missing (e.g. the Session Start Protocol section). Your existing content is preserved. Run it safely on any project that already has a `CLAUDE.md`.

**Can I customize it?**
Everything. Edit files, change structure, adjust what loads. It's just markdown files and a `.claudeignore`.

**How do I maintain it?**
When you hit a critical bug that took >1 hour, add it to `COMMON_MISTAKES.md`. Run `cto audit` occasionally to catch drift (also works in CI). Use `cto compress` and `cto prune` when CLAUDE.md starts growing.

## Related Projects

**[Claude Workflows](https://github.com/nadimtuhin/claude-workflows)** - Systematic workflow commands for Claude Code

While this repo optimizes **what Claude knows** (documentation), Claude Workflows optimizes **what Claude does** (processes). They work great together:

- This repo: Documentation structure (4 core files, 0-token historical context)
- Workflows: Process automation (`/dev:start-feature`, `/git:commit`, `/test:run`)

Both use the same principle: 0 tokens until you need them.

## Contributing

Want to add a framework? Copy one of the [examples](examples/), test it on a real project, and submit a PR with token savings.

Needed:
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
