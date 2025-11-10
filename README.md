# Claude Token Optimizer

<div align="center">

**🚀 Reduce Claude Code token usage by 90% in 5 minutes**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/nadimtuhin/claude-token-optimizer/releases)

[Quick Start](#-quick-start) • [Features](#-key-features) • [Examples](#-usage-examples) • [Contributing](#-contributing)

</div>

---

## 📊 Token Savings

<table>
<tr>
<td width="50%">

### Before Optimization 😰
- **Session start**: 8,000 tokens
- **Historical context**: 3,000 tokens
- **Task completion**: Load everything
- **Total**: ~11,000 tokens

</td>
<td width="50%">

### After Optimization 🎉
- **Session start**: 800 tokens (↓ 90%)
- **Historical context**: 0 tokens (↓ 100%)
- **Task completion**: Load as needed
- **Total**: ~1,300 tokens (↓ 88%)

</td>
</tr>
</table>

**Result**: Save **~9,700 tokens per session** = More context for actual work!

---

## 🎯 What Is This?

Claude Token Optimizer provides **copy-paste setup prompts** that restructure your project's documentation for maximum token efficiency. It works with **any framework** and takes **5 minutes** to set up.

### The Problem

Claude Code auto-loads all documentation at session start, consuming thousands of tokens before you even begin working. Historical context (old sessions, completed tasks) takes even more tokens despite rarely being needed.

### The Solution

Smart documentation architecture:
- ✅ **Selective loading** - Load only 4 essential files at start
- ✅ **Zero-token history** - Task completion docs never auto-load
- ✅ **Topic-based learning** - Load specific topics as needed
- ✅ **Framework-optimized** - Patterns for Express, Next.js, and more

---

## ⚡ Quick Start

### Method 1: Bash Script (Fastest) 🚀

Perfect for quick setup with basic structure:

```bash
# 1. Download and run the init script
curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/init.sh | bash

# Or clone and run locally
git clone https://github.com/nadimtuhin/claude-token-optimizer.git
cd your-project
../claude-token-optimizer/init.sh
```

The script will:
- ✅ Create complete directory structure
- ✅ Generate all essential files
- ✅ Set up .claudeignore
- ✅ Create placeholder documentation
- ✅ Configure zero-token system

**Time**: 2 minutes | **Effort**: Run one command

### Method 2: Claude Code Prompt (Most Customizable) 🎨

Best for framework-specific patterns and full customization:

**1️⃣ Copy the Setup Prompt**

Open [`UNIVERSAL_SETUP.md`](UNIVERSAL_SETUP.md) and copy the entire file.

**2️⃣ Paste in Claude Code**

Open Claude Code in your project and paste the prompt.

**3️⃣ Provide Context**

```
Project Type: [Express / Next.js / React / Django / etc.]
Tech Stack: [List main technologies]
Main Features: [Brief description]
```

**4️⃣ Done!**

Claude automatically creates your optimized documentation structure with framework-specific patterns.

**Time**: ~5 minutes | **Savings**: 90% tokens | **Effort**: Copy-paste

### Which Method to Choose?

| Method | Speed | Customization | Best For |
|--------|-------|---------------|----------|
| **Bash Script** | ⚡⚡⚡ 2 min | Basic structure | Quick setup, any project |
| **Claude Prompt** | ⚡⚡ 5 min | Full framework patterns | Express, Next.js, custom needs |

---

## 🎁 Key Features

<table>
<tr>
<td width="33%">

### 📉 Token Savings
- **90%** reduction at session start
- **88%** overall reduction
- **100%** savings on history

</td>
<td width="33%">

### 🔧 Framework Support
- Universal (any framework)
- Express.js patterns
- Next.js patterns
- More coming!

</td>
<td width="33%">

### ⚡ Easy Setup
- 5-minute setup
- Copy-paste prompts
- Automated by Claude
- No manual work

</td>
</tr>
</table>

---

## 📁 What Gets Created

```
your-project/
├── CLAUDE.md                           # Main guide (~450 tokens)
├── .claudeignore                       # Prevents auto-loading
│
├── .claude/
│   ├── COMMON_MISTAKES.md              # Critical errors (~350 tokens) ⚠️
│   ├── QUICK_START.md                  # Commands (~100 tokens)
│   ├── ARCHITECTURE_MAP.md             # File locations (~150 tokens)
│   ├── LEARNINGS_INDEX.md              # Navigation (~200 tokens)
│   ├── DOCUMENTATION_MAINTENANCE.md    # Maintenance guide (~400 tokens)
│   │
│   ├── completions/                    # Task docs (0 tokens - never auto-load) 🎯
│   │   └── README.md
│   │
│   ├── sessions/                       # Session history (0 tokens) 📝
│   │   ├── active/
│   │   ├── archive/
│   │   └── README.md
│   │
│   └── templates/
│       ├── completion-template.md
│       └── session-template.md
│
└── docs/
    ├── INDEX.md                        # Master navigation
    ├── QUICK_REFERENCE.md              # Fast lookups
    │
    ├── learnings/                      # Topic files (load as needed) 📚
    │   ├── [topic-1].md                (~200-700 tokens each)
    │   ├── [topic-2].md
    │   └── [topic-3].md
    │
    └── archive/                        # Historical docs (0 tokens) 📦
        └── README.md
```

**Session Start**: Only 4 files auto-load (~800 tokens)
**Task-Specific**: Load 1-2 topic files as needed (~500-1500 tokens)
**Historical**: Never auto-loaded (0 tokens, infinite storage)

---

## 🚀 Usage Examples

### Express.js API

```bash
# 1. Copy UNIVERSAL_SETUP.md → Paste in Claude Code
# 2. Provide context:
#    Project: Express REST API
#    Stack: Express, PostgreSQL, Prisma, Jest
#    Features: Auth, payments, webhooks

# ✅ Result in 5 minutes:
# - docs/learnings/api-design.md
# - docs/learnings/middleware-patterns.md
# - docs/learnings/database-patterns.md
# - docs/learnings/error-handling.md
# - Common mistakes: Missing error handler, middleware order
```

**Token savings**: 87% (10,000 → 1,300 tokens)

### Next.js App

```bash
# 1. Copy UNIVERSAL_SETUP.md → Paste in Claude Code
# 2. Provide context:
#    Project: Next.js E-commerce
#    Stack: Next.js 14 (App Router), Tailwind, Prisma
#    Features: Product catalog, checkout, admin

# ✅ Result in 5 minutes:
# - docs/learnings/routing-patterns.md
# - docs/learnings/component-patterns.md
# - docs/learnings/data-fetching.md
# - docs/learnings/api-routes.md
# - Common mistakes: Client components, image optimization
```

**Token savings**: 84% (9,000 → 1,400 tokens)

### Any Framework

Works with Vue, Angular, Django, Flask, Rails, Laravel, Go, Rust, and more!

---

## 📚 Documentation

### Core Files

- **[UNIVERSAL_SETUP.md](UNIVERSAL_SETUP.md)** - Works for any project
- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

### Examples

- **[Express.js Example](examples/express.md)** - API patterns, middleware, database
- **[Next.js Example](examples/nextjs.md)** - Routing, components, data fetching
- **[Examples Guide](examples/README.md)** - Overview of all examples

### Templates

- **[Completion Template](templates/completion-template.md)** - Task documentation
- **[Maintenance Guide](templates/maintenance-guide.md)** - When to update docs
- **[Templates Guide](templates/README.md)** - Template overview

---

## 💡 How It Works

### Session Start Protocol

Claude loads **only 4 essential files** (~800 tokens):

1. 📖 `CLAUDE.md` - Project overview
2. ⚠️ `.claude/COMMON_MISTAKES.md` - Critical errors to avoid
3. ⚡ `.claude/QUICK_START.md` - Essential commands
4. 🗺️ `.claude/ARCHITECTURE_MAP.md` - File locations

### Task-Specific Loading

Claude loads additional docs **only when needed**:

| Task | Load | Tokens |
|------|------|--------|
| API work | `docs/learnings/api-design.md` | ~500 |
| Testing | `docs/learnings/testing-patterns.md` | ~300 |
| Debugging | `docs/learnings/common-pitfalls.md` | ~700 |
| Performance | `docs/learnings/performance.md` | ~150 |

**Total**: ~1,300 tokens vs ~8,000+ before

### Zero-Token Historical Context

These directories **cost 0 tokens** (never auto-loaded):

- 🎯 `.claude/completions/` - Task completion docs
- 📝 `.claude/sessions/` - Session history
- 📦 `docs/archive/` - Historical documentation

Available when explicitly requested, but otherwise free!

---

## ✨ Framework Examples

### Available Now

| Framework | Status | Savings | File |
|-----------|--------|---------|------|
| **Express.js** | ✅ Ready | 87% | [express.md](examples/express.md) |
| **Next.js** | ✅ Ready | 84% | [nextjs.md](examples/nextjs.md) |

### Coming Soon (PRs Welcome!)

- 🔜 Vue.js
- 🔜 Angular
- 🔜 NestJS
- 🔜 Django / Flask
- 🔜 Ruby on Rails
- 🔜 Laravel
- 🔜 Spring Boot

**Want to add a framework?** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🎨 Customization

### Adding New Topics

```bash
# 1. Create topic file
docs/learnings/your-topic.md

# 2. Update navigation
docs/INDEX.md  # Add navigation entry + token estimate

# 3. Add cross-references
# Link from related topic files
```

### Framework-Specific Patterns

```bash
# 1. Update common mistakes
.claude/COMMON_MISTAKES.md  # Add framework pitfalls

# 2. Customize architecture
.claude/ARCHITECTURE_MAP.md  # Your file structure

# 3. Create learnings
docs/learnings/  # Framework-specific patterns

# 4. Update commands
docs/QUICK_REFERENCE.md  # Framework CLI commands
```

---

## 📈 Success Stories

### RedwoodJS Project (Original)

<table>
<tr>
<td><b>Before</b></td>
<td>8,000 tokens at session start</td>
</tr>
<tr>
<td><b>After</b></td>
<td>800 tokens at session start</td>
</tr>
<tr>
<td><b>Savings</b></td>
<td>90% (7,200 tokens saved)</td>
</tr>
<tr>
<td><b>Method</b></td>
<td>Split DETAILED_LEARNINGS (1,783 lines) → 6 topic files</td>
</tr>
</table>

### Express API (Estimated)

**Before**: 10,000 tokens → **After**: 1,300 tokens → **Savings**: 87%

### Next.js App (Estimated)

**Before**: 9,000 tokens → **After**: 1,400 tokens → **Savings**: 84%

---

## 🤝 Contributing

Contributions are welcome! We especially need:

- 🌟 **Framework examples** (Vue, Angular, Django, etc.)
- 📚 **Documentation improvements**
- 🐛 **Bug reports** and fixes
- 💡 **Feature suggestions**

**How to contribute:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/vue-example`)
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## ❓ FAQ

<details>
<summary><b>Q: Will this work with my framework?</b></summary>

**A**: Yes! The universal setup works with any framework. Framework examples (Express, Next.js) provide additional patterns but are optional.
</details>

<details>
<summary><b>Q: What if I already have documentation?</b></summary>

**A**: The setup prompts will analyze existing docs and either integrate or suggest consolidation. No work is lost.
</details>

<details>
<summary><b>Q: Can I customize the structure?</b></summary>

**A**: Absolutely! The prompts create a starting point. Customize topic files, token estimates, and organization to your needs.
</details>

<details>
<summary><b>Q: How do I maintain this long-term?</b></summary>

**A**: The system includes `DOCUMENTATION_MAINTENANCE.md` with guidance on when to update docs, archive files, and save common mistakes.
</details>

<details>
<summary><b>Q: Does this work for non-JavaScript projects?</b></summary>

**A**: Yes! Universal setup works for Python, Ruby, Go, Rust, PHP, Java, etc. Framework examples are currently JavaScript-focused but more coming soon.
</details>

<details>
<summary><b>Q: What about existing Claude Code projects?</b></summary>

**A**: You can apply this to existing projects. Claude will help migrate your current docs to the optimized structure.
</details>

---

## 📄 License

[MIT License](LICENSE) - feel free to use in personal and commercial projects.

---

## 🙏 Acknowledgments

Developed while optimizing documentation for a RedwoodJS project. The system reduced token usage by 90% and has been generalized for any project.

**Special thanks to:**
- The Claude Code team at Anthropic
- The open source community
- Early adopters and contributors

---

## 📞 Support

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/nadimtuhin/claude-token-optimizer/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/nadimtuhin/claude-token-optimizer/discussions)
- ⭐ **Star the repo** to show support!

---

## 🚀 Get Started

Ready to save 90% on tokens?

1. **[Copy UNIVERSAL_SETUP.md](UNIVERSAL_SETUP.md)**
2. **Paste in Claude Code**
3. **Provide project context**
4. **Done in 5 minutes!**

[Get Started →](UNIVERSAL_SETUP.md)

---

<div align="center">

**Made with ❤️ for the Claude Code community**

[![Star on GitHub](https://img.shields.io/github/stars/nadimtuhin/claude-token-optimizer?style=social)](https://github.com/nadimtuhin/claude-token-optimizer/stargazers)

</div>
