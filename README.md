# 🚀 Claude Token Optimizer

<div align="center">

### Reduce Claude Code token usage by 90% in 2 minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer/stargazers)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/nadimtuhin/claude-token-optimizer/releases)

**Save 9,700 tokens per session = More context for actual work**

</div>

---

## 🎯 What You Get

<table>
<tr>
<td align="center" width="33%">
<h3>📉 90% Token Savings</h3>
From 8,000 → 800 tokens<br>at session start
</td>
<td align="center" width="33%">
<h3>⚡ 2-Min Setup</h3>
One command<br>Zero manual work
</td>
<td align="center" width="33%">
<h3>🔧 Any Framework</h3>
Express, Next.js, Django<br>Vue, React, Rails...
</td>
</tr>
</table>

---

## 🚀 Quick Setup (Choose One)

### Option A: Bash Script (Fastest)

**Perfect for most users** - Automatic setup in 2 minutes:

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash
```

That's it! ✅ The script creates everything you need.

<details>
<summary>What does this do?</summary>

- Creates `.claude/` folder with documentation
- Creates `docs/` folder for learnings
- Sets up `.claudeignore` (prevents wasting tokens)
- Creates `CLAUDE.md` main guide
- Prompts you for project info
- Shows you next steps

**Safe**: Reviews your project type first and asks permission.
</details>

### Option B: Manual Setup with Claude

**For framework-specific patterns** (Express, Next.js):

1. Copy [`UNIVERSAL_SETUP.md`](UNIVERSAL_SETUP.md)
2. Paste entire file into Claude Code
3. Answer Claude's questions about your project
4. Done in 5 minutes

<details>
<summary>When to use this?</summary>

Use this if you want:
- Express.js routing patterns
- Next.js component patterns
- Framework-specific common mistakes
- Custom setup for your tech stack

Otherwise, use the bash script (it's faster).
</details>

---

## 💡 How It Works

### Before Optimization 😰

```
Claude loads at session start:
├── All documentation files      → 8,000 tokens
├── Old session notes           → 2,000 tokens
├── Completed task history      → 1,000 tokens
└── Everything else             → ???
                        Total: ~11,000 tokens WASTED
```

### After Optimization 🎉

```
Claude loads at session start:
├── CLAUDE.md                   → 450 tokens ✅
├── COMMON_MISTAKES.md          → 350 tokens ✅
├── QUICK_START.md              → 100 tokens ✅
└── ARCHITECTURE_MAP.md         → 150 tokens ✅
                        Total: ~800 tokens (90% savings!)

Everything else?
├── Completions (task history)  → 0 tokens (never loads)
├── Sessions (old work)         → 0 tokens (never loads)
└── Archive (historical docs)   → 0 tokens (never loads)
                        Available when needed, costs nothing
```

**Result**: You save ~9,700 tokens per session for actual work!

---

## 📁 What Gets Created

After running the setup, you'll have:

```
your-project/
├── CLAUDE.md                    ← Main guide (Claude reads this first)
├── .claudeignore                ← Prevents loading old files
│
├── .claude/                     ← Essential docs (always loads)
│   ├── COMMON_MISTAKES.md       ← Top 5 mistakes (you customize)
│   ├── QUICK_START.md           ← Your common commands
│   ├── ARCHITECTURE_MAP.md      ← Where files are
│   │
│   ├── completions/             ← Task history (NEVER loads)
│   └── sessions/                ← Session notes (NEVER loads)
│
└── docs/
    ├── INDEX.md                 ← Table of contents
    ├── learnings/               ← Topic files (load as needed)
    └── archive/                 ← Old docs (NEVER loads)
```

**🎯 Key Point**: Only 4 files auto-load. Everything else is available but costs 0 tokens.

---

## ✨ Features

### Zero-Token History

Old work costs **0 tokens** but stays available:

- ✅ Task completion docs in `.claude/completions/`
- ✅ Old session notes in `.claude/sessions/archive/`
- ✅ Superseded docs in `docs/archive/`

**Access anytime**: "Claude, show me the completion doc from yesterday"

### Load What You Need

Topic files load only when needed:

```bash
Working on API? → Load docs/learnings/api-design.md (~500 tokens)
Writing tests?  → Load docs/learnings/testing.md (~300 tokens)
Debugging?      → Load docs/learnings/debugging.md (~700 tokens)
```

### Framework Examples

Pre-made patterns for popular frameworks:

| Framework | Status | File |
|-----------|--------|------|
| Express.js | ✅ Ready | [examples/express.md](examples/express.md) |
| Next.js | ✅ Ready | [examples/nextjs.md](examples/nextjs.md) |
| Vue.js | 🔜 Coming | [Contribute!](CONTRIBUTING.md) |
| Django | 🔜 Coming | [Contribute!](CONTRIBUTING.md) |

---

## 📊 Real Results

### RedwoodJS Project (Original Use Case)

Before optimization:
- 📊 8,000 tokens at session start
- 📊 11,000 total tokens

After optimization:
- ✅ 800 tokens at session start
- ✅ 1,300 total tokens
- 🎉 **90% savings** (7,200 tokens freed up)

**How?** Split 1,783-line doc → 6 topic files (load as needed)

### Your Project (Estimated)

- **Before**: ~10,000 tokens consumed before you start
- **After**: ~1,300 tokens (only load what you need)
- **Savings**: ~8,700 tokens = More space for your actual code

---

## 🎓 Next Steps After Setup

1. **Customize Common Mistakes**

   Edit `.claude/COMMON_MISTAKES.md` with your top 5 critical bugs

2. **Add Your Commands**

   Edit `.claude/QUICK_START.md` with `npm run dev`, etc.

3. **Document Your Structure**

   Edit `.claude/ARCHITECTURE_MAP.md` with your folders

4. **Create Topic Files** (optional)

   Add files to `docs/learnings/` for specific topics

5. **Test It**

   Start Claude Code and verify it loads only 4 files (~800 tokens)

---

## ❓ FAQ

<details>
<summary><b>Is this safe to run?</b></summary>

Yes! The bash script:
- Only creates new files (never deletes)
- Asks permission before starting
- Shows what it's doing (colored output)
- Open source (you can read the code)

</details>

<details>
<summary><b>Will this work with my framework?</b></summary>

**Yes!** Works with any framework:
- JavaScript: Express, Next.js, React, Vue, Angular, NestJS
- Python: Django, Flask, FastAPI
- Ruby: Rails
- PHP: Laravel
- Go, Rust, Java, etc.

The bash script creates a universal structure. Claude Code prompt adds framework patterns.
</details>

<details>
<summary><b>What if I already have documentation?</b></summary>

No problem! The setup works alongside existing docs. You can:
- Move existing docs to the new structure
- Keep both (old docs still work)
- Gradually migrate over time

Claude will help you organize existing content.
</details>

<details>
<summary><b>Can I customize it?</b></summary>

Absolutely! Everything is customizable:
- Edit any file to match your needs
- Add/remove topic files
- Change the structure
- Adjust token estimates

The setup is a starting point, not a rigid system.
</details>

<details>
<summary><b>How do I maintain this long-term?</b></summary>

The system includes `DOCUMENTATION_MAINTENANCE.md` with guidance on:
- When to update COMMON_MISTAKES.md (bugs > 1 hour)
- When to create completion docs (every task)
- When to archive old docs (after implementation)

TL;DR: Keep adding to COMMON_MISTAKES when you find critical bugs.
</details>

<details>
<summary><b>What about my existing Claude Code project?</b></summary>

You can apply this to existing projects! Run the setup and Claude will help migrate your current docs to the optimized structure.
</details>

---

## 🤝 Contributing

We need framework examples! Current wishlist:

- 🔜 Vue.js
- 🔜 Angular
- 🔜 Django / Flask
- 🔜 Ruby on Rails
- 🔜 Laravel
- 🔜 NestJS

**How to contribute**:

1. Fork this repo
2. Create `examples/your-framework.md` (copy Express or Next.js example)
3. Test in real project
4. Submit PR with token savings

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Detailed setup instructions
- **[Universal Setup](UNIVERSAL_SETUP.md)** - Copy-paste prompt for Claude
- **[Express Example](examples/express.md)** - Express.js patterns
- **[Next.js Example](examples/nextjs.md)** - Next.js patterns
- **[Contributing Guide](CONTRIBUTING.md)** - How to help
- **[Changelog](CHANGELOG.md)** - Version history

---

## 🆘 Need Help?

- 🐛 **Bug?** [Open an issue](https://github.com/nadimtuhin/claude-token-optimizer/issues/new?template=bug_report.md)
- 💡 **Feature idea?** [Suggest it](https://github.com/nadimtuhin/claude-token-optimizer/issues/new?template=feature_request.md)
- 💬 **Questions?** [Start a discussion](https://github.com/nadimtuhin/claude-token-optimizer/discussions)
- ⭐ **Love it?** Star the repo!

---

## 📄 License

MIT License - use freely in personal and commercial projects.

See [LICENSE](LICENSE) file for details.

---

<div align="center">

## 🎉 Ready to Save 90% on Tokens?

### Run this command now:

```bash
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash
```

**Takes 2 minutes • Saves 9,700 tokens per session • Works with any project**

<br>

**Made with ❤️ for the Claude Code community**

[![Star on GitHub](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer)

</div>
