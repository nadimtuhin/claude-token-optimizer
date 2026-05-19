# Svelte / SvelteKit Setup Example

**Quick setup for Svelte projects - Copy and customize**

---

# Setup Claude Code Documentation for [Svelte Project Name]

## Project Context

**Project Type**: SvelteKit Application
**Tech Stack**:
- SvelteKit 2.x
- Svelte 5
- [Styling: Tailwind / CSS Modules]
- [Database: Prisma / Drizzle]
- [Testing: Vitest + Playwright]

**Main Features**: [Web app for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Svelte-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories

src/
├── routes/           # SvelteKit file-based routing
│   ├── +page.svelte  # Page component
│   ├── +page.ts      # Page load function
│   ├── +layout.svelte
│   └── api/          # API routes (+server.ts)
├── lib/
│   ├── components/   # Shared components
│   ├── stores/       # Svelte stores
│   └── utils/        # Helpers
└── app.html          # HTML shell

## Key Patterns

### Store
```typescript
import { writable } from 'svelte/store';
export const count = writable(0);
// In component: $count (auto-subscribe)
```

### Load function
```typescript
export const load: PageLoad = async ({ fetch, params }) => {
    const res = await fetch(`/api/items/${params.id}`);
    return { item: await res.json() };
};
```
```

### COMMON_MISTAKES.md

```markdown
## Top Svelte / SvelteKit Mistakes

### 1. Store value not reactive in template
- Symptom: UI doesn't update when store changes
- Check: Are you using `store.value` instead of `$store`?
- Fix: Use `$store` auto-subscribe syntax in .svelte files; use `get(store)` in .ts files

### 2. Form action not found — wrong route structure
- Symptom: 404 on form submit or action ignored
- Check: Is the `+page.server.ts` file in the same route directory as `+page.svelte`?
- Fix: Form actions must export from `+page.server.ts`, not `+server.ts`

### 3. Adapter not configured for deployment target
- Symptom: Build works locally, fails on deploy
- Fix: Install correct adapter (`@sveltejs/adapter-vercel`, `adapter-node`, etc.) and set in `svelte.config.js`

### 4. Svelte 5 runes syntax used with Svelte 4 compiler
- Symptom: `$state`, `$derived` cause parse errors
- Check: Is `"svelte": "^5"` in package.json?
- Fix: Upgrade to Svelte 5 or use legacy store syntax for Svelte 4

### 5. Missing `await` in load function causes undefined data
- Symptom: `data.items` is undefined on first render
- Fix: Ensure load function is `async` and all fetches are `await`ed before `return`
```

### .claudeignore additions

```
node_modules/**
.svelte-kit/**
build/**
dist/**
coverage/**
```
