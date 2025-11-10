# Documentation Maintenance Guide

**When to update docs, archive files, and save common mistakes**

---

## Session Start - What Claude Should Do

### Every Session:
1. **Load these 3 files** (~800 tokens):
   - `.claude/COMMON_MISTAKES.md` ⚠️ CRITICAL
   - `.claude/QUICK_START.md`
   - `.claude/ARCHITECTURE_MAP.md`

2. **Optional** (if complex task):
   - Create session file in `.claude/sessions/active/YYYY-MM-DD-session-N.md`
   - Use template: `.claude/templates/session-template.md`

3. **Load task-specific docs** (as needed):
   - See `docs/INDEX.md` for navigation

### Never Auto-Load:
- ❌ `.claude/completions/**` (0 token cost)
- ❌ `.claude/sessions/**` (0 token cost)
- ❌ `docs/archive/**` (0 token cost)

---

## Task Completion - What Claude Should Do

### At End of Every Task:

1. **Create completion doc**:
   - Location: `.claude/completions/YYYY-MM-DD-task-name.md`
   - Template: `.claude/templates/completion-template.md`
   - Include: Changes, commits, learnings, testing

2. **Move session file** (if created):
   - From: `.claude/sessions/active/`
   - To: `.claude/sessions/archive/`

3. **Update docs if needed** (see "When to Update Docs" below)

---

## When to Update COMMON_MISTAKES.md

**Update when you discover:**

### Critical Errors (Add Immediately):
- ✅ Bug that took >1 hour to debug
- ✅ Error that caused production issue
- ✅ Mistake repeated across multiple sessions
- ✅ Pattern that violates framework conventions
- ✅ Error that could lead to data loss/corruption

### Examples:
- Forgot to register processor in switch statement → Added to COMMON_MISTAKES
- Used `.includes()` in page.evaluate() → Added to browser section
- Forgot to type-check before tests → Added to testing section
- Missed mutation in transaction → Added to database section

### Update Process:
1. Add to appropriate section in `.claude/COMMON_MISTAKES.md`
2. Include:
   - **Symptom**: How you discover the error
   - **Anti-pattern**: Wrong code example
   - **Correct pattern**: Right code example
   - **Why it matters**: Impact of the mistake

---

## When to Update Learnings

**Update `docs/learnings/*.md` when:**

### New Pattern Discovered:
- ✅ Reusable solution for common problem
- ✅ Framework-specific best practice
- ✅ Performance optimization technique
- ✅ Testing pattern that works well

### Implementation Details:
- ✅ New API pattern established
- ✅ Queue job pattern refined
- ✅ Browser automation trick discovered
- ✅ Database query optimization learned

### Update Process:
1. Identify which topic file: `browser-automation.md`, `queue-system.md`, etc.
2. Add to appropriate section
3. Update "Last Updated" date
4. If >1,000 lines, consider splitting
5. Update `docs/INDEX.md` if token estimate changes

---

## When to Archive Documentation

### Archive Immediately:

**Planning Docs** (after implementation):
- ✅ Feature plans once feature is live
- ✅ POC summaries once feature is stable
- ✅ Implementation plans once complete
- **Action**: Move to `docs/archive/` with reason in `docs/archive/README.md`

**Superseded Docs**:
- ✅ Old versions of guides (when rewritten)
- ✅ Status docs replaced by feature memory docs
- ✅ Session summaries (move to `.claude/sessions/archive/`)
- **Action**: Move to appropriate archive folder with README update

**Meta Documentation**:
- ✅ One-time setup guides (after setup complete)
- ✅ Documentation about documentation system
- ✅ Token optimization summaries (after optimization complete)
- **Action**: Move to `docs/archive/` for historical reference

### Keep Active:

**Feature Memory Docs**:
- ❌ Don't archive: `MARKETPLACE_SCRAPER_MEMORY.md`
- ❌ Don't archive: `VEHICLE_UPLOAD_ARCHITECTURE.md`
- **Reason**: Referenced when modifying features

**Active Guides**:
- ❌ Don't archive: `PARALLEL_SUBAGENT_WORKFLOW.md`
- ❌ Don't archive: `WORKFLOW_IMPLEMENTATION_GUIDE.md`
- **Reason**: Used for current development

**Core References**:
- ❌ Don't archive: `COMMON_MISTAKES.md`, `TESTING_METHODOLOGY.md`
- **Reason**: Referenced every session

---

## When to Create New Topic File

**Create new file in `docs/learnings/` when:**

### Topic Doesn't Fit Existing Files:
- ✅ New framework/library added to project
- ✅ New architectural pattern introduced
- ✅ Substantial body of knowledge (>500 lines)
- ✅ Topic referenced frequently

### Process:
1. Create `docs/learnings/new-topic.md`
2. Use structure:
   ```markdown
   # Topic Name

   **Part of**: Optimized documentation structure
   **Token Cost**: ~XXX tokens
   **Load when**: [Description of when to load]

   ---

   ## Table of Contents
   ...

   ## Main Content
   ...

   ## See Also
   - Related topic links
   ```
3. Update `docs/INDEX.md` with navigation entry and token estimate
4. Add cross-references in related topic files
5. Update `.claude/LEARNINGS_INDEX.md` with pointer

---

## When to Split Existing Files

**Split files when:**

### File Too Large:
- ✅ File exceeds 1,000 lines
- ✅ File covers multiple distinct topics
- ✅ File takes >3 minutes to read
- ✅ Token cost exceeds 1,500 tokens

### Process:
1. Identify logical topic boundaries
2. Create new files in `docs/learnings/`
3. Move content to new files
4. Update cross-references
5. Update `docs/INDEX.md` navigation
6. Move original to `docs/archive/` with `.bak` extension
7. Document in `docs/archive/README.md`

### Example:
- Original: `DETAILED_LEARNINGS.md` (1,783 lines, ~2,400 tokens)
- Split into: 6 topic files (~200-700 tokens each)
- Result: Load only what you need (80% token savings)

---

## Special Cases

### Quick Bug Fixes:
- **Don't create completion doc** for trivial fixes (<10 min)
- **Do update COMMON_MISTAKES.md** if bug was non-obvious
- **Do create session file** if debugging took >1 hour

### Research Tasks:
- **Create completion doc** with findings
- **Update learnings** if patterns discovered
- **Don't create session file** unless multi-hour research

### Refactoring:
- **Create completion doc** with before/after
- **Update ARCHITECTURE_MAP.md** if structure changed
- **Update learnings** if new patterns established

---

## Maintenance Checklist

### Weekly (User-Driven):
- [ ] Review `.claude/sessions/active/` - archive completed sessions
- [ ] Check if any planning docs can be archived
- [ ] Review `docs/learnings/*.md` - any files >1,000 lines to split?

### After Major Features:
- [ ] Create completion doc
- [ ] Update feature memory doc (if applicable)
- [ ] Archive feature planning docs
- [ ] Update COMMON_MISTAKES.md with gotchas discovered
- [ ] Update relevant learnings files with new patterns

### Monthly (User-Driven):
- [ ] Review `docs/archive/README.md` - is it up to date?
- [ ] Check token estimates in `docs/INDEX.md` - still accurate?
- [ ] Review `.claude/completions/` - good coverage of major tasks?

---

## Quick Reference

### Decision Tree: Should I Update This Doc?

```
Did I discover a CRITICAL mistake?
  └─ YES → Update .claude/COMMON_MISTAKES.md

Did I learn a reusable pattern?
  └─ YES → Update docs/learnings/[topic].md

Did I complete a task?
  └─ YES → Create .claude/completions/YYYY-MM-DD-task.md

Did I implement a planned feature?
  └─ YES → Archive the planning doc

Is this doc superseded?
  └─ YES → Archive to docs/archive/ or .claude/sessions/archive/

Is this a quick bug fix?
  └─ NO completion doc needed (unless non-obvious)
```

---

## Examples

### Example 1: Fixed Queue Job Not Running

**Mistake**: Forgot to register processor in switch statement

**Actions**:
1. ✅ Fix the bug
2. ✅ Update `.claude/COMMON_MISTAKES.md` → "Queue Jobs" section
3. ✅ Update `docs/learnings/queue-system.md` → Add registration pattern
4. ✅ Create completion doc if task took >15 minutes
5. ❌ Don't archive anything (no planning docs involved)

### Example 2: Implemented Scheduled Posts Feature

**Task**: Full-stack feature from planning doc

**Actions**:
1. ✅ Create completion doc: `.claude/completions/2025-11-10-scheduled-posts.md`
2. ✅ Archive planning doc: `docs/archive/SCHEDULED_POSTS_PLAN.md`
3. ✅ Update `docs/archive/README.md` with reason
4. ✅ Create feature memory doc: `docs/SCHEDULED_POSTS_MEMORY.md`
5. ✅ Update `docs/INDEX.md` navigation
6. ✅ Add any critical mistakes to `.claude/COMMON_MISTAKES.md`
7. ✅ Move session file to `.claude/sessions/archive/`

### Example 3: Discovered Better Testing Pattern

**Discovery**: Learned that mocking queue in tests prevents flakiness

**Actions**:
1. ✅ Update `docs/learnings/testing-patterns.md` → Add queue mocking pattern
2. ✅ Update `.claude/TESTING_METHODOLOGY.md` → Reference new pattern
3. ✅ Update "Last Updated" dates
4. ❌ Don't create completion doc (pattern discovery, not task completion)
5. ❌ Don't archive anything

### Example 4: Documentation Optimization (This Task)

**Task**: Optimize documentation structure for token savings

**Actions**:
1. ✅ Created completion doc: `.claude/completions/2025-11-10-documentation-optimization.md`
2. ✅ Archived 28 files to `docs/archive/` and `.claude/sessions/archive/`
3. ✅ Updated `docs/archive/README.md` with all archived files
4. ✅ Created this maintenance guide
5. ✅ Updated `CLAUDE.md` with reference to maintenance guide
6. ❌ No COMMON_MISTAKES.md updates (no critical errors discovered)

---

## Anti-Patterns (Don't Do This)

### ❌ Don't Auto-Load Historical Files
- Never load `.claude/completions/**`
- Never load `.claude/sessions/**`
- Never load `docs/archive/**`
- **Why**: Wastes tokens (0 token cost is the goal)

### ❌ Don't Duplicate Content
- Don't copy learnings into CLAUDE.md
- Don't copy patterns into multiple files
- **Why**: Increases token cost, creates sync issues
- **Instead**: Link to detailed docs

### ❌ Don't Archive Active References
- Don't archive feature memory docs
- Don't archive core methodology docs
- **Why**: Breaks workflows, increases confusion

### ❌ Don't Skip Completion Docs
- Even if task seems "complete"
- **Why**: Loses institutional knowledge
- **Instead**: Quick completion doc is better than none

### ❌ Don't Let Files Grow Unbounded
- Split files >1,000 lines
- **Why**: High token cost, hard to navigate
- **Instead**: Create focused topic files

---

**Last Updated**: 2025-11-10
**Review**: After every major feature or documentation change
