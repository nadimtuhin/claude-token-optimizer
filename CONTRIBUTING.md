# Contributing to Claude Code Setup

Thank you for your interest in contributing! This project helps developers optimize Claude Code documentation for any project.

---

## How to Contribute

### Reporting Issues

Found a bug or have a suggestion?

1. Check [existing issues](https://github.com/nadimtuhin/claude-code-setup/issues)
2. Create a new issue with:
   - Clear description
   - Steps to reproduce (if bug)
   - Expected vs actual behavior
   - Framework/project type

### Adding Framework Examples

We welcome framework-specific examples! Currently we have Express.js and Next.js. More needed:

**Wanted:**
- Vue.js
- Angular
- NestJS
- Django
- Flask
- FastAPI
- Ruby on Rails
- Laravel
- Spring Boot
- And more!

**How to add:**

1. Fork the repository
2. Copy `examples/express.md` or `examples/nextjs.md`
3. Create `examples/[framework].md`
4. Include:
   - Directory structure
   - Common mistakes (Top 5)
   - Code patterns
   - Testing approaches
   - CLI commands
   - Quick reference
5. Test in a real project
6. Document token savings (before/after)
7. Submit PR

**Template structure:**

```markdown
# [Framework] Setup Example

## Project Context
- Framework version
- Common stack
- Typical features

## Use Universal Setup
(Instructions)

## [Framework]-Specific Content

### ARCHITECTURE_MAP.md
(Directory structure)

### COMMON_MISTAKES.md
(Top 5 mistakes)

### docs/learnings/
(Topic files specific to framework)

### QUICK_REFERENCE.md
(Commands and patterns)

## Expected Structure After Setup
(Complete directory tree)

## Quick Start After Setup
(Session start commands)
```

### Improving Documentation

- Fix typos or unclear instructions
- Add examples or use cases
- Improve clarity
- Add troubleshooting tips

### Testing Changes

Before submitting:

1. Test setup prompt in a real project
2. Verify token savings (measure before/after)
3. Check all cross-references work
4. Validate .claudeignore prevents auto-loading
5. Ensure completion docs system works

---

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/vue-example`)
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** with clear messages:
   ```
   docs: add Vue.js framework example

   - Add examples/vue.md with Vue 3 patterns
   - Include composition API patterns
   - Document Pinia state management
   - Add Vite-specific commands

   Tested on: Vue 3.4, Vite 5, TypeScript
   Token savings: 85% (9,500 → 1,400 tokens)
   ```
6. **Push** to your fork
7. **Submit** pull request with:
   - Clear description of changes
   - Framework/project tested on
   - Token savings data (if applicable)
   - Screenshots (if UI-related)

---

## Code Style

### Markdown Style

- Use ATX-style headers (`#`, `##`, `###`)
- Wrap code blocks with triple backticks and language
- Use bullet lists with `-` or `✅`/`❌` for checkboxes
- Keep lines under 120 characters when possible

### Setup Prompt Style

- Start with project context section
- Use clear section headers
- Provide code examples with comments
- Include token estimates
- Add "Last Updated" date

### Token Estimates

Always include token estimates:
- Essential files: ~100-500 tokens
- Topic files: ~200-700 tokens
- Specify when to load each file

---

## Framework Example Checklist

When adding a framework example, ensure it includes:

- [ ] Project context (framework version, stack)
- [ ] Directory structure (framework-specific)
- [ ] COMMON_MISTAKES.md section (Top 5 mistakes)
- [ ] ARCHITECTURE_MAP.md section (key patterns)
- [ ] QUICK_START.md section (commands)
- [ ] Topic files for `docs/learnings/` (3-6 files)
- [ ] QUICK_REFERENCE.md section (patterns, commands)
- [ ] Expected structure after setup (complete tree)
- [ ] Quick start guide (session start workflow)
- [ ] Tested in real project
- [ ] Token savings documented

---

## Questions?

- **Discussion**: [GitHub Discussions](https://github.com/nadimtuhin/claude-code-setup/discussions)
- **Issues**: [GitHub Issues](https://github.com/nadimtuhin/claude-code-setup/issues)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉
