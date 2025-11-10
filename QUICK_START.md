# Quick Start Guide

Get 90% token savings in 5 minutes.

---

## For Any Project (Universal)

### 1. Copy the Setup Prompt

```bash
# Open UNIVERSAL_SETUP.md
# Copy entire file (Cmd+A, Cmd+C)
```

### 2. Open Claude Code

```bash
# Navigate to your project
cd my-project

# Open Claude Code
# (Use your IDE's Claude Code integration)
```

### 3. Paste and Provide Context

Paste the entire `UNIVERSAL_SETUP.md` content, then provide:

```
Project Type: [Express / Next.js / React / Django / etc.]
Tech Stack: [List main technologies]
Main Features: [Brief description]
```

### 4. Let Claude Work

Claude will automatically create:
- ✅ `.claudeignore` (prevents auto-loading)
- ✅ `.claude/` directory (essential docs)
- ✅ `docs/` directory (topic files)
- ✅ `CLAUDE.md` (main guide)
- ✅ Templates for completion docs

**Time**: ~5 minutes

### 5. Verify Setup

Check the structure:

```bash
tree -L 2 .claude/
tree -L 2 docs/

# Should see:
# .claude/
#   ├── COMMON_MISTAKES.md
#   ├── QUICK_START.md
#   ├── ARCHITECTURE_MAP.md
#   └── ...
```

---

## For Framework-Specific Projects

### Express.js

**After universal setup**:

```
Also apply the Express.js patterns from the example.
```

Claude will add:
- ✅ Express routing patterns
- ✅ Middleware organization
- ✅ API design patterns
- ✅ Database patterns

### Next.js

**After universal setup**:

```
Also apply the Next.js patterns from the example.
```

Claude will add:
- ✅ App/Pages Router patterns
- ✅ Server/Client components
- ✅ Data fetching strategies
- ✅ API routes patterns

---

## Session Start After Setup

### Every Session

Claude will now automatically load only 4 essential files (~800 tokens):

1. `CLAUDE.md` - Project overview
2. `.claude/COMMON_MISTAKES.md` - Critical errors
3. `.claude/QUICK_START.md` - Commands
4. `.claude/ARCHITECTURE_MAP.md` - File locations

### Task-Specific Loading

Claude will load additional docs as needed:

```
Working on API? → Load docs/learnings/api-design.md
Writing tests? → Load docs/learnings/testing-patterns.md
Debugging? → Load docs/learnings/common-pitfalls.md
```

**Total**: ~1,300 tokens vs ~8,000+ before (84% savings)

---

## Verification Checklist

After setup, verify:

- [ ] `.claudeignore` exists and includes completions/, sessions/, archive/
- [ ] `CLAUDE.md` is concise (<200 lines)
- [ ] `.claude/COMMON_MISTAKES.md` has top 5 mistakes
- [ ] `docs/INDEX.md` has token estimates
- [ ] `docs/learnings/` has 3-6 topic files
- [ ] Templates exist in `.claude/templates/`
- [ ] No broken cross-references

---

## Example Session Flow

### 1. Start Session

```
Claude: [Auto-loads 4 files: ~800 tokens]
Ready! What would you like to work on?
```

### 2. User Requests Feature

```
User: Add authentication to the API
```

### 3. Claude Loads Relevant Docs

```
Claude: [Loads docs/learnings/api-design.md: ~500 tokens]
Total context: ~1,300 tokens

I'll implement authentication...
```

### 4. Task Completion

```
Claude: [Creates .claude/completions/2025-11-11-add-authentication.md]
Token cost: 0 (never auto-loaded)

Authentication complete! Tested and deployed.
```

---

## Troubleshooting

### Issue: Too many files auto-loading

**Fix**: Check `.claudeignore` includes:
```
.claude/completions/**
.claude/sessions/**
docs/archive/**
```

### Issue: Can't find specific pattern

**Fix**: Check `docs/INDEX.md` navigation table

### Issue: Token usage still high

**Fix**:
- Ensure loading only 4 files at start
- Check no sessions auto-loading
- Split any file >1,000 lines

---

## Next Steps

1. **Use the system**: Start new sessions, verify token savings
2. **Customize**: Add project-specific patterns to `docs/learnings/`
3. **Maintain**: Update `COMMON_MISTAKES.md` when bugs found
4. **Share**: Use setup prompts on other projects

---

## Getting Help

- **Documentation**: See `README.md`
- **Examples**: See `examples/` directory
- **Templates**: See `templates/` directory
- **Issues**: [GitHub Issues](https://github.com/nadimtuhin/claude-code-setup/issues)

---

**Ready to save 90% on tokens?** Start with `UNIVERSAL_SETUP.md`!

---

**Last Updated**: 2025-11-11
