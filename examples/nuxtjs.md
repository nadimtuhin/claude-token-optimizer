# Nuxt.js Setup Example

**Quick setup for Nuxt.js projects - Copy and customize**

---

# Setup Claude Code Documentation for [Nuxt.js Project Name]

## Project Context

**Project Type**: Nuxt.js Application
**Tech Stack**:
- Nuxt 3.x
- Vue 3 (Composition API)
- TypeScript
- [Styling: Tailwind / UnoCSS / Vuetify]
- [Data: Pinia / useState]
- [Testing: Vitest / Playwright]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Nuxt.js-specific content below.

## Nuxt.js-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Nuxt 3)

myapp/
├── .nuxt/                # Build output (gitignored)
├── .output/              # Production build
├── components/           # Auto-imported Vue components
│   ├── TheHeader.vue
│   └── AppButton.vue
├── composables/          # Auto-imported composables
│   ├── useAuth.ts
│   └── useFetch.ts
├── layouts/              # App layouts
│   ├── default.vue
│   └── admin.vue
├── middleware/           # Route middleware
│   ├── auth.ts
│   └── guest.ts
├── pages/                # File-based routing
│   ├── index.vue         # /
│   ├── about.vue         # /about
│   └── users/
│       ├── [id].vue      # /users/:id
│       └── index.vue     # /users
├── plugins/              # Vue plugins
│   └── api.ts
├── public/               # Static assets
├── server/               # Server-side code
│   ├── api/              # API routes
│   │   └── hello.ts      # /api/hello
│   ├── middleware/       # Server middleware
│   └── utils/            # Server utilities
├── stores/               # Pinia stores
│   └── user.ts
├── app.vue               # Root component
├── nuxt.config.ts        # Nuxt configuration
└── package.json

## Key Patterns

### Auto-imports
- Components in components/ auto-imported
- Composables in composables/ auto-imported
- Nuxt auto-imports: useRouter, useFetch, useState, etc.

### Rendering Modes
- SSR (default): Server-side rendering
- SSG: Static site generation
- SPA: Single page application
- Hybrid: Per-route rendering mode

### Data Fetching
- useFetch: Composable for data fetching
- useAsyncData: More control over data fetching
- $fetch: Raw fetch with auto-serialization
- Server routes for backend API

### File-based Routing
- pages/ folder defines routes
- [id].vue for dynamic routes
- [...slug].vue for catch-all routes
- Nested folders create nested routes
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Nuxt.js Mistakes

### 1. Using ref/reactive Instead of useState for Shared State

**Symptom**: State not syncing between client and server, hydration mismatches

**Anti-pattern:**
```vue
<!-- composables/useCounter.ts -->
<script setup>
import { ref } from 'vue'

// ❌ Not shared between server and client!
export const useCounter = () => {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
</script>
```

**Correct:**
```vue
<!-- composables/useCounter.ts -->
<script setup>
// ✅ Shared state between server and client
export const useCounter = () => {
  const count = useState('counter', () => 0)
  const increment = () => count.value++
  return { count, increment }
}
</script>
```

### 2. Not Using useFetch/useAsyncData for Data Fetching

**Symptom**: Data not available during SSR, SEO problems, loading flashes

**Anti-pattern:**
```vue
<script setup>
import { ref, onMounted } from 'vue'

const posts = ref([])

// ❌ Only runs on client, not during SSR!
onMounted(async () => {
  const response = await fetch('/api/posts')
  posts.value = await response.json()
})
</script>
```

**Correct:**
```vue
<script setup>
// ✅ Runs during SSR, data available immediately
const { data: posts } = await useFetch('/api/posts')

// Or with more control:
const { data: posts, pending, error } = await useAsyncData(
  'posts',
  () => $fetch('/api/posts')
)
</script>
```

### 3. Accessing window/document Without Client-Side Check

**Symptom**: "window is not defined" error during SSR

**Anti-pattern:**
```vue
<script setup>
// ❌ Crashes during SSR!
const width = window.innerWidth
localStorage.setItem('key', 'value')

onMounted(() => {
  // ❌ Still runs during SSR in Nuxt 3!
  document.querySelector('.my-element')
})
</script>
```

**Correct:**
```vue
<script setup>
// Option 1: Use process.client
const width = process.client ? window.innerWidth : 0

// Option 2: Use onMounted with client check
onMounted(() => {
  if (process.client) {
    const width = window.innerWidth
  }
})

// Option 3: Use <ClientOnly> component
</script>

<template>
  <ClientOnly>
    <div>{{ window.innerWidth }}</div>
  </ClientOnly>
</template>
```

### 4. Not Defining Server Route Return Types

**Symptom**: No type safety, runtime errors, difficult debugging

**Anti-pattern:**
```typescript
// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = event.context.params.id

  // ❌ No validation, no type safety!
  const user = await db.user.findUnique({ where: { id } })

  return user
})
```

**Correct:**
```typescript
// server/api/users/[id].ts
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    })
  }

  const user = await db.user.findUnique({ where: { id } })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  // ✅ Validate response
  return userSchema.parse(user)
})
```

### 5. Not Using Middleware Correctly

**Symptom**: Auth checks in every page, repeated code, incorrect redirects

**Anti-pattern:**
```vue
<!-- pages/dashboard.vue -->
<script setup>
// ❌ Auth check in every protected page!
const { data: user } = await useFetch('/api/auth/user')

if (!user.value) {
  navigateTo('/login')
}
</script>

<!-- pages/profile.vue -->
<script setup>
// ❌ Duplicated auth check!
const { data: user } = await useFetch('/api/auth/user')

if (!user.value) {
  navigateTo('/login')
}
</script>
```

**Correct:**
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data: user } = await useFetch('/api/auth/user')

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})

// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/dashboard/**': { middleware: ['auth'] },
    '/profile/**': { middleware: ['auth'] },
  },
})
```

Or define in page:
```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  middleware: ['auth']  // ✅ Clean and reusable
})
</script>
```
```

### docs/learnings/

Create these Nuxt.js-specific files:

**data-fetching.md:**
```markdown
# Nuxt.js Data Fetching

## useFetch Composable

```vue
<script setup>
// Basic usage
const { data, pending, error, refresh } = await useFetch('/api/posts')

// With options
const { data: posts } = await useFetch('/api/posts', {
  method: 'GET',
  query: { limit: 10 },
  headers: { 'Authorization': 'Bearer token' },
  // Only fetch on client side
  server: false,
  // Cache key
  key: 'posts-list',
  // Transform response
  transform: (data) => data.posts,
  // Pick specific fields
  pick: ['id', 'title'],
  // Watch reactivity
  watch: [someRef],
})

// Lazy fetch (doesn't block navigation)
const { data, pending } = await useLazyFetch('/api/posts')
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <div v-for="post in posts" :key="post.id">
      {{ post.title }}
    </div>
  </div>
</template>
```

## useAsyncData Composable

```vue
<script setup>
// More control than useFetch
const { data, pending, error, refresh } = await useAsyncData(
  'posts',  // Unique key
  () => $fetch('/api/posts'),
  {
    server: true,  // Fetch on server
    lazy: false,   // Block navigation until loaded
    default: () => [],  // Default value
    transform: (data) => data.posts,
    pick: ['id', 'title'],
    watch: [someRef],
  }
)

// With dependencies
const route = useRoute()
const { data: post } = await useAsyncData(
  `post-${route.params.id}`,
  () => $fetch(`/api/posts/${route.params.id}`)
)

// Lazy version
const { data, pending } = await useLazyAsyncData('key', fetcher)
```

## $fetch Utility

```typescript
// Direct fetch (no composable magic)
const posts = await $fetch('/api/posts')

// With options
const posts = await $fetch('/api/posts', {
  method: 'POST',
  body: { title: 'New Post' },
  headers: { 'Authorization': 'Bearer token' },
  params: { limit: 10 },
  retry: 3,
  retryDelay: 500,
  onRequest({ request, options }) {
    // Intercept request
  },
  onResponse({ response }) {
    // Intercept response
  },
})
```

## Server Routes

```typescript
// server/api/posts/index.ts
export default defineEventHandler(async (event) => {
  // Get query params
  const query = getQuery(event)

  // Get body
  const body = await readBody(event)

  // Get headers
  const auth = getHeader(event, 'authorization')

  // Database query
  const posts = await db.post.findMany({
    take: query.limit || 10,
  })

  return posts
})

// server/api/posts/[id].ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const post = await db.post.findUnique({
    where: { id },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: 'Post not found',
    })
  }

  return post
})
```

## Refresh Data

```vue
<script setup>
const { data, refresh } = await useFetch('/api/posts')

const addPost = async () => {
  await $fetch('/api/posts', { method: 'POST', body: newPost })
  await refresh()  // Refetch data
}

// Refresh all data
const refreshAll = () => refreshNuxtData()

// Refresh specific key
const refreshPosts = () => refreshNuxtData('posts')
</script>
```
```

**routing-and-layouts.md:**
```markdown
# Nuxt.js Routing and Layouts

## File-based Routing

```
pages/
├── index.vue              → /
├── about.vue              → /about
├── posts/
│   ├── index.vue          → /posts
│   ├── [id].vue           → /posts/:id
│   └── [...slug].vue      → /posts/* (catch-all)
└── admin/
    └── users/
        └── [id].vue       → /admin/users/:id
```

## Dynamic Routes

```vue
<!-- pages/users/[id].vue -->
<script setup>
const route = useRoute()
const id = route.params.id

// Or use composable
const { data: user } = await useFetch(`/api/users/${id}`)
</script>

<template>
  <div>User ID: {{ id }}</div>
</template>
```

## Catch-all Routes

```vue
<!-- pages/[...slug].vue -->
<script setup>
const route = useRoute()
const slug = route.params.slug  // Array of segments

// Example: /blog/2024/01/post-title
// slug = ['blog', '2024', '01', 'post-title']
</script>
```

## Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <TheHeader />
    <main>
      <slot />  <!-- Page content -->
    </main>
    <TheFooter />
  </div>
</template>

<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <AdminSidebar />
    <slot />
  </div>
</template>
```

Using layouts in pages:

```vue
<!-- pages/index.vue -->
<script setup>
definePageMeta({
  layout: 'default',  // Use default.vue layout
})
</script>

<!-- pages/admin/dashboard.vue -->
<script setup>
definePageMeta({
  layout: 'admin',  // Use admin.vue layout
})
</script>

<!-- pages/login.vue -->
<script setup>
definePageMeta({
  layout: false,  // No layout
})
</script>
```

## Navigation

```vue
<script setup>
const router = useRouter()

// Navigate programmatically
const goToAbout = () => {
  navigateTo('/about')
  // or
  router.push('/about')
}

// With params
navigateTo(`/posts/${postId}`)

// With query
navigateTo({ path: '/search', query: { q: 'nuxt' } })

// External URL
navigateTo('https://nuxt.com', { external: true })

// Replace (no history)
navigateTo('/login', { replace: true })
</script>

<template>
  <!-- Declarative navigation -->
  <NuxtLink to="/about">About</NuxtLink>
  <NuxtLink :to="`/posts/${post.id}`">{{ post.title }}</NuxtLink>

  <!-- External link -->
  <NuxtLink to="https://nuxt.com" external>Nuxt</NuxtLink>

  <!-- Custom active class -->
  <NuxtLink to="/posts" active-class="active" exact-active-class="exact-active">
    Posts
  </NuxtLink>
</template>
```

## Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useState('user')

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})

// middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useState('user')

  if (!user.value?.isAdmin) {
    return abortNavigation('Not authorized')
  }
})
```

Using middleware:

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  middleware: ['auth'],  // Single middleware
})
</script>

<!-- pages/admin/index.vue -->
<script setup>
definePageMeta({
  middleware: ['auth', 'admin'],  // Multiple middleware
})
</script>
```

Global middleware:

```typescript
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Runs on every route change
  trackPageView(to.path)
})
```

## Route Meta

```vue
<script setup>
definePageMeta({
  title: 'Dashboard',
  layout: 'admin',
  middleware: ['auth'],
  // Custom meta
  requiresSubscription: true,
  pageType: 'protected',
})

// Access in middleware
const requiresSubscription = to.meta.requiresSubscription
</script>
```
```

**state-management.md:**
```markdown
# Nuxt.js State Management

## useState Composable

```typescript
// Shared state across components
const counter = useState('counter', () => 0)
const user = useState('user', () => null)

// Usage in component
const counter = useState('counter')
counter.value++

// With type
const user = useState<User | null>('user', () => null)
```

## Pinia Stores

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function login(credentials: Credentials) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    user.value = data.user
  }

  function logout() {
    user.value = null
    navigateTo('/login')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
})

// Usage in component
const userStore = useUserStore()
await userStore.login({ email, password })
```

## App State (app.vue)

```vue
<!-- app.vue -->
<script setup>
// Initialize global state
const user = useState('user', () => null)

// Fetch user on app load
const { data } = await useFetch('/api/auth/user')
if (data.value) {
  user.value = data.value
}
</script>
```

## Cookie State

```vue
<script setup>
// Synced with cookie
const token = useCookie('token', {
  maxAge: 60 * 60 * 24 * 7,  // 7 days
  secure: true,
  sameSite: 'strict',
})

// Set token
token.value = 'new-token'

// Clear token
token.value = null
</script>
```
```

**testing-patterns.md:**
```markdown
# Nuxt.js Testing Patterns

## Component Testing (Vitest)

```typescript
// components/AppButton.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Click me',
      },
    })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(AppButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
```

## Testing with Nuxt Utils

```typescript
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('UserProfile', () => {
  it('fetches and displays user', async () => {
    const wrapper = await mountSuspended(UserProfile, {
      props: { userId: '123' },
    })

    expect(wrapper.text()).toContain('John Doe')
  })
})
```

## E2E Testing (Playwright)

```typescript
// tests/e2e/home.test.ts
import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toHaveText('Welcome to Nuxt')

  // Test navigation
  await page.click('text=About')
  await expect(page).toHaveURL('/about')
})

test('user can login', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('.welcome')).toContainText('Welcome back')
})
```
```

### QUICK_REFERENCE.md

```markdown
## Nuxt.js Quick Commands

# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run generate         # Static site generation
npm run preview          # Preview production build

# Testing
npm run test             # Run tests
npm run test:e2e         # E2E tests

# Other
npx nuxi analyze         # Analyze bundle
npx nuxi typecheck       # Type check

## Common Patterns

### Data Fetching
```vue
<script setup>
const { data, pending, error } = await useFetch('/api/posts')
</script>
```

### Shared State
```vue
<script setup>
const user = useState('user', () => null)
</script>
```

### Navigation
```vue
<script setup>
const router = useRouter()
navigateTo('/about')
</script>

<template>
  <NuxtLink to="/about">About</NuxtLink>
</template>
```

### Server Route
```typescript
// server/api/hello.ts
export default defineEventHandler((event) => {
  return { message: 'Hello' }
})
```

### Middleware
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Check auth
})
```

### Environment Variables
```env
# .env
NUXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...

# Access public vars:
const config = useRuntimeConfig()
config.public.apiUrl

# Access private vars (server only):
config.databaseUrl
```
```

## Expected Structure After Setup

```
my-nuxt-app/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Nuxt-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Nuxt structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Nuxt commands)
│   ├── learnings/
│   │   ├── data-fetching.md
│   │   ├── routing-and-layouts.md
│   │   ├── state-management.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── components/
├── pages/
├── server/
│   └── api/
├── nuxt.config.ts
└── package.json
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For data fetching, load:
docs/learnings/data-fetching.md (~600 tokens)

# 3. For routing/layouts, load:
docs/learnings/routing-and-layouts.md (~500 tokens)

# 4. For state management, load:
docs/learnings/state-management.md (~400 tokens)

Total: ~1,300-1,500 tokens (vs 9,000+ before)
```

---

**Last Updated**: 2025-11-11
