# Trivy + Dependabot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Trivy filesystem vulnerability scanning (SARIF → GitHub Security tab) and Dependabot auto-update PRs for npm + GitHub Actions dependencies.

**Architecture:** Two YAML config files only — no changes to CLI source. Trivy runs on PRs to main and weekly on Mondays. Dependabot opens version-bump PRs for npm deps and the Actions themselves on the same Monday schedule.

**Tech Stack:** GitHub Actions, aquasecurity/trivy-action, github/codeql-action, Dependabot v2 config.

---

## File Structure

```
.github/
├── workflows/
│   └── trivy.yml        # NEW — Trivy filesystem scan + SARIF upload
└── dependabot.yml       # NEW — npm + github-actions weekly update config
```

---

### Task 1: Trivy Security Scan Workflow

**Files:**
- Create: `.github/workflows/trivy.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

Expected: directory exists (no error if already present).

- [ ] **Step 2: Write `.github/workflows/trivy.yml`**

Create the file with this exact content:

```yaml
name: Trivy Security Scan

on:
  pull_request:
    branches:
      - main
  schedule:
    - cron: '0 9 * * 1'

permissions:
  security-events: write
  actions: read
  contents: read

jobs:
  trivy:
    name: Trivy Filesystem Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@v0.36.0
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
```

Key decisions:
- `scan-type: fs` scans the filesystem (including `package-lock.json`) — no Docker image needed
- `severity: CRITICAL,HIGH` suppresses LOW/MEDIUM noise
- `if: always()` on upload ensures SARIF is uploaded even if Trivy finds vulnerabilities (exit code > 0 without `exit-code: '1'` set — no hard failure)
- Pinned action versions so Dependabot can open bump PRs

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/trivy.yml'))" && echo "YAML valid"
```

Expected output: `YAML valid`

If `python3` is unavailable:
```bash
node -e "JSON.stringify(require('js-yaml').load(require('fs').readFileSync('.github/workflows/trivy.yml','utf8')))" 2>/dev/null && echo "YAML valid" || echo "Install js-yaml first: npm i -g js-yaml"
```

- [ ] **Step 4: Verify key fields are present**

```bash
grep -E "security-events: write|aquasecurity/trivy-action|upload-sarif|cron:" .github/workflows/trivy.yml
```

Expected: 4 lines printed (one per grep match). If any are missing, the file content is wrong.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/trivy.yml
git commit -m "ci: add Trivy filesystem vulnerability scan workflow"
```

---

### Task 2: Dependabot Configuration

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Write `.github/dependabot.yml`**

Create the file with this exact content:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
```

Key decisions:
- Two ecosystems: `npm` (covers `@anthropic-ai/tokenizer`, `chalk`, `commander`, `glob`) and `github-actions` (covers `actions/checkout`, `aquasecurity/trivy-action`, `github/codeql-action`)
- Both on Monday so Dependabot PRs and Trivy scan land the same week
- `open-pull-requests-limit: 5` prevents inbox flood if many deps update at once

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))" && echo "YAML valid"
```

Expected output: `YAML valid`

- [ ] **Step 3: Verify both ecosystems are configured**

```bash
grep "package-ecosystem" .github/dependabot.yml
```

Expected output:
```
  - package-ecosystem: "npm"
  - package-ecosystem: "github-actions"
```

- [ ] **Step 4: Commit**

```bash
git add .github/dependabot.yml
git commit -m "ci: add Dependabot config for npm and github-actions"
```

---

## Verification After Both Tasks

Once both files are committed and pushed:

- [ ] Push branch and open a PR targeting `main`
- [ ] Confirm the `Trivy Security Scan` workflow appears in the PR's Checks tab
- [ ] After the workflow completes: visit `https://github.com/nadimtuhin/claude-token-optimizer/security/code-scanning` — scan results (or "No alerts" if clean) should appear
- [ ] Confirm `.github/dependabot.yml` is present on the branch (Dependabot activates on merge to default branch)
