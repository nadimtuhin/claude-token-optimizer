# Design: npm CLI + Token Measurement + Framework Expansion

**Date:** 2026-05-20
**Status:** Approved

## Summary

Convert `claude-token-optimizer` from a curl-piped shell script into a proper npm package with two CLI commands (`init`, `measure`), real token counting, four new framework examples, and opt-in session hooks.

## Motivation

- `curl | bash` is friction for JS devs; `npx` is frictionless
- Token savings claims are estimates — real counts build trust
- Competitor (ECC) has 19 ecosystems; we have 9
- No tool on the market measures actual Claude auto-load token cost

---

## Architecture

### Repo structure

```
claude-token-optimizer/
├── bin/
│   └── cto.js              # entry point (#!/usr/bin/env node)
├── src/
│   ├── cli.js              # commander setup, registers subcommands
│   ├── commands/
│   │   ├── init.js         # interactive setup
│   │   └── measure.js      # token scan + before/after report
│   └── lib/
│       ├── tokenizer.js    # wraps @anthropic-ai/tokenizer
│       ├── scanner.js      # finds files Claude would auto-load
│       └── frameworks.js   # framework-specific .claudeignore patterns
├── examples/               # existing + 4 new frameworks
├── templates/
│   └── hooks/
│       └── session-end-token-report.sh
├── init.sh                 # legacy fallback — kept, not deleted
├── package.json
└── README.md
```

### npm package config

- **name**: `claude-token-optimizer`
- **bin**: `{ "cto": "bin/cto.js" }`
- **engines**: `{ "node": ">=18" }`
- **dependencies**: `commander`, `@anthropic-ai/tokenizer`, `glob`, `chalk`

---

## Commands

### `npx claude-token-optimizer init`

Interactive setup replacing `init.sh`. Flags:
- `--framework <name>` — skip prompts, use known framework patterns
- `--yes` — non-interactive with defaults

Flow:
1. Detect project type (check package.json, requirements.txt, go.mod, pom.xml, etc.)
2. Prompt for project type, tech stack, main features (or use `--framework` flag)
3. Create `.claude/` directory structure
4. Write `CLAUDE.md`, `.claudeignore`, placeholder docs
5. Apply framework-specific `.claudeignore` patterns
6. Print token savings estimate

### `npx claude-token-optimizer measure`

Scans cwd. Compares current auto-load token cost vs. post-init estimate.

Flow:
1. Find all files in cwd (respects existing `.claudeignore` if present)
2. Determine which files Claude Code would auto-load (CLAUDE.md, docs at root, .claude/*.md)
3. Count real tokens via `@anthropic-ai/tokenizer`
4. Show "BEFORE" breakdown by file/directory
5. Compute "AFTER" estimate based on optimized structure (4 essential files ~1,050 tokens)
6. Print savings percentage + CTA to run `init`

Sample output:
```
📊 Token Audit — my-project/

  BEFORE (current state)
  ─────────────────────────────────────────
  README.md                     1,240 tokens
  docs/                         8,430 tokens
  .claude/sessions/             2,100 tokens
  ─────────────────────────────────────────
  Total auto-loaded:           11,770 tokens

  AFTER (post-init estimate)
  ─────────────────────────────────────────
  CLAUDE.md                       450 tokens
  .claude/COMMON_MISTAKES.md      350 tokens
  .claude/QUICK_START.md          100 tokens
  .claude/ARCHITECTURE_MAP.md     150 tokens
  ─────────────────────────────────────────
  Total auto-loaded:            1,050 tokens

  💡 Savings: 10,720 tokens (91%)

  Run `npx claude-token-optimizer init` to apply
```

---

## Framework Examples

Four new `examples/` files using the same format as existing examples:

| File | Key coverage |
|------|-------------|
| `examples/fastapi.md` | virtual envs, Pydantic v2 gotchas, alembic migrations, pytest patterns |
| `examples/go.md` | module paths, interface patterns, goroutine leaks, testify setup |
| `examples/spring-boot.md` | bean scope, JPA N+1, application.yml vs env vars, Maven wrapper |
| `examples/svelte.md` | store reactivity, SvelteKit routing, form actions, adapter config |

---

## Hooks (opt-in)

Ships as `templates/hooks/session-end-token-report.sh`.

Not auto-installed by `init` — too opinionated. README explains how to opt in by copying to `.claude/hooks/`.

Hook behaviour: on session end, counts tokens in files matching auto-load patterns and appends a one-line entry to `.claude/sessions/token-log.md`.

---

## Data Flow

```
cto measure
  └── scanner.js: glob cwd, filter by auto-load heuristics
        └── tokenizer.js: count tokens per file
              └── measure.js: aggregate, format, print report

cto init
  └── detect project type
        └── prompt user (or use --framework flag)
              └── init.js: write files from templates
                    └── frameworks.js: apply framework-specific .claudeignore
```

---

## Error Handling

- Missing Node.js <18: exit with clear version error
- Empty directory: warn, continue
- File read errors: skip file, note in output
- No files found to scan: print "Nothing to measure — project may already be optimized"

---

## Testing

- Unit tests for `tokenizer.js` (known string → expected token count)
- Unit tests for `scanner.js` (mock fs, verify correct files selected)
- Integration test: run `init` in tmp dir, verify file structure matches expected
- Integration test: run `measure` in fixture project, verify output format

---

## Build Sequence

1. `package.json` + `bin/cto.js` entry point
2. `src/cli.js` with commander + two subcommands stubbed
3. `src/lib/tokenizer.js` + `src/lib/scanner.js`
4. `src/commands/measure.js` (full implementation)
5. `src/commands/init.js` (port init.sh logic)
6. `src/lib/frameworks.js` (framework patterns)
7. Four new `examples/` files
8. `templates/hooks/session-end-token-report.sh`
9. Update `README.md` with npx instructions
10. Tests
