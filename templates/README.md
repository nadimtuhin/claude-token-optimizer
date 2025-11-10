# Templates

Reusable templates for documentation maintenance and task tracking.

---

## Available Templates

### [completion-template.md](completion-template.md)

**Purpose**: Document completed tasks

**Use when**: Every task completion

**Includes**:
- Task summary
- Files created/modified/deleted
- Features implemented
- Bugs fixed
- Testing performed
- Commits
- Notes for future

**Token cost**: 0 (never auto-loaded via .claudeignore)

---

### [maintenance-guide.md](maintenance-guide.md)

**Purpose**: Guide Claude on documentation maintenance

**Use when**: Setting up new project

**Includes**:
- When to update COMMON_MISTAKES.md
- When to create completion docs
- When to archive documentation
- When to update learnings
- Decision trees and examples

**Token cost**: ~400 tokens (load when maintaining docs)

---

## Usage

### Completion Template

1. **At task completion**: Claude creates `.claude/completions/YYYY-MM-DD-task-name.md`
2. **Uses template**: Fills in all sections with task details
3. **Zero tokens**: Never auto-loaded (via .claudeignore)
4. **Available**: Explicitly request to review past work

**Example**:
```
.claude/completions/2025-11-10-add-authentication.md
.claude/completions/2025-11-11-fix-login-bug.md
.claude/completions/2025-11-12-optimize-queries.md
```

### Maintenance Guide

1. **At project setup**: Copy to `.claude/DOCUMENTATION_MAINTENANCE.md`
2. **Reference in CLAUDE.md**: Link from session start protocol
3. **Load as needed**: When updating docs or making structural changes

---

## Customization

### Completion Template

Customize sections based on your needs:
- Add deployment checklist
- Add review checklist
- Add security checklist
- Add performance metrics

### Maintenance Guide

Customize criteria based on your project:
- Adjust "critical bug" threshold (>1 hour)
- Add project-specific archive rules
- Add team-specific patterns

---

## Token Optimization

**Completion docs system**:
- ✅ Zero tokens (never auto-loaded)
- ✅ 100% knowledge preserved
- ✅ Available on explicit request
- ✅ Scales infinitely (add unlimited docs at 0 token cost)

**Maintenance guide**:
- ✅ ~400 tokens (only when needed)
- ✅ Loaded when maintaining docs
- ✅ Not part of essential session start
- ✅ Ensures consistent doc updates

---

**Last Updated**: 2025-11-11
