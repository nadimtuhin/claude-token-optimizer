# Vue.js Setup Example

**Quick setup for Vue.js projects - Copy and customize**

---

# Setup Claude Code Documentation for [Vue.js Project Name]

## Project Context

**Project Type**: Vue.js Application
**Tech Stack**:
- Vue 3.x (Composition API / Options API)
- Vite / Vue CLI
- [State: Pinia / Vuex]
- [Styling: Tailwind / Vuetify / CSS]
- [Testing: Vitest / Jest + Vue Test Utils]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Vue.js-specific content below.

## Vue.js-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Vue 3 + Vite)

src/
├── components/       # Reusable components
├── views/            # Page components
├── router/           # Vue Router
├── stores/           # Pinia stores
├── composables/      # Composition API hooks
├── assets/           # Static assets
├── App.vue           # Root component
└── main.js           # Entry point

## Key Patterns

### Component Structure
- Single File Components (.vue files)
- Composition API (recommended) or Options API
- Props down, events up

### State Management
- Pinia stores in stores/
- Composables for shared logic
- Props for component communication

### Routing
- Route definitions: src/router/index.js
- Route guards: beforeEach, beforeEnter
- Lazy loading: () => import('./views/Page.vue')
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Vue.js Mistakes

### 1. Mutating Props Directly

**Symptom**: Props changed in child component, warning in console

**Anti-pattern:**
```vue
<script setup>
const props = defineProps(['user'])
props.user.name = 'New Name'  // ❌ Don't mutate props!
</script>
```

**Correct:**
```vue
<script setup>
const props = defineProps(['user'])
const emit = defineEmits(['update:user'])

const updateUser = () => {
  emit('update:user', { ...props.user, name: 'New Name' })
}
</script>
```

### 2. Not Using Key in v-for

**Anti-pattern:**
```vue
<div v-for="item in items">  <!-- ❌ Missing key -->
  {{ item.name }}
</div>
```

**Correct:**
```vue
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

### 3. Forgetting ref() for Reactive State

**Anti-pattern:**
```vue
<script setup>
let count = 0  // ❌ Not reactive
</script>
```

**Correct:**
```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)  // ✅ Reactive
</script>
```

### 4. Not Cleaning Up Side Effects

**Anti-pattern:**
```vue
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  setInterval(() => {
    // Do something
  }, 1000)
  // ❌ Interval never cleared!
})
</script>
```

**Correct:**
```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'

let intervalId

onMounted(() => {
  intervalId = setInterval(() => {
    // Do something
  }, 1000)
})

onUnmounted(() => {
  clearInterval(intervalId)  // ✅ Cleanup
})
</script>
```

### 5. Computed vs Methods Confusion

**Wrong use of methods:**
```vue
<template>
  <div>{{ calculateTotal() }}</div>  <!-- ❌ Runs on every render -->
</template>

<script setup>
const calculateTotal = () => {
  // Expensive calculation
}
</script>
```

**Correct with computed:**
```vue
<template>
  <div>{{ total }}</div>  <!-- ✅ Cached -->
</template>

<script setup>
import { computed } from 'vue'
const total = computed(() => {
  // Expensive calculation (only runs when dependencies change)
})
</script>
```
```

### docs/learnings/

Create these Vue.js-specific files:

**component-patterns.md:**
```markdown
# Vue.js Component Patterns

## Composition API (Recommended)

### Basic Component
```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('My Component')
const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<style scoped>
h1 { color: blue; }
</style>
```

### Props and Emits
```vue
<script setup>
const props = defineProps({
  modelValue: String,
  required: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit'])

const updateValue = (value) => {
  emit('update:modelValue', value)
}
</script>
```

### Composables (Reusable Logic)
```javascript
// composables/useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue

  return { count, increment, decrement, reset }
}

// In component:
import { useCounter } from '@/composables/useCounter'
const { count, increment } = useCounter(10)
```

## Options API (Legacy)

```vue
<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  computed: {
    double() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>
```
```

**state-management.md:**
```markdown
# Vue.js State Management (Pinia)

## Store Definition

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const isAuthenticated = ref(false)

  // Getters
  const fullName = computed(() => {
    return user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  })

  // Actions
  async function login(credentials) {
    const response = await api.login(credentials)
    user.value = response.user
    isAuthenticated.value = true
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
  }

  return { user, isAuthenticated, fullName, login, logout }
})
```

## Using in Components

```vue
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// Access state
console.log(userStore.user)

// Access getters
console.log(userStore.fullName)

// Call actions
userStore.login({ email, password })
</script>
```

## Vuex (Legacy)

```javascript
// store/index.js
export default createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => commit('increment'), 1000)
    }
  }
})
```
```

**routing-patterns.md:**
```markdown
# Vue Router Patterns

## Route Definitions

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/users/:id',
    name: 'user',
    component: () => import('../views/UserView.vue'),
    props: true  // Pass route params as props
  },
  {
    path: '/admin',
    component: () => import('../views/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        component: () => import('../views/AdminDashboard.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

## Navigation Guards

```javascript
// Global guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})

// Per-route guard
{
  path: '/admin',
  beforeEnter: (to, from, next) => {
    if (checkAdminRole()) {
      next()
    } else {
      next('/forbidden')
    }
  }
}
```

## Programmatic Navigation

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Navigate
router.push('/users/123')
router.push({ name: 'user', params: { id: 123 } })

// Access route params
const userId = route.params.id
</script>
```
```

**testing-patterns.md:**
```markdown
# Vue.js Testing Patterns

## Component Testing (Vitest + Vue Test Utils)

```javascript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        msg: 'Hello'
      }
    })
    expect(wrapper.text()).toContain('Hello')
  })

  it('emits event on button click', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('submit')
  })

  it('updates reactive data', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.vm.increment()
    expect(wrapper.vm.count).toBe(1)
  })
})
```

## Testing with Pinia

```javascript
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in user', async () => {
    const store = useUserStore()
    await store.login({ email: 'test@example.com', password: 'pass' })
    expect(store.isAuthenticated).toBe(true)
  })
})
```
```

### QUICK_REFERENCE.md

```markdown
## Vue.js Quick Commands

# Development
npm run dev           # Start dev server (Vite)
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # ESLint
npm run format        # Prettier

# Testing
npm run test          # Run tests (Vitest)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

## Common Patterns

### Composition API Component
```vue
<template>
  <div>{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello')
</script>
```

### Pinia Store
```javascript
export const useStore = defineStore('store', () => {
  const state = ref(0)
  const increment = () => state.value++
  return { state, increment }
})
```

### Vue Router Navigation
```javascript
import { useRouter } from 'vue-router'
const router = useRouter()
router.push('/path')
```

### Environment Variables
VITE_API_URL=...       # Client-side (VITE_ prefix required)
```

## Expected Structure After Setup

```
my-vue-project/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Vue-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Vue structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Vue commands)
│   ├── learnings/
│   │   ├── component-patterns.md
│   │   ├── state-management.md
│   │   ├── routing-patterns.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── src/
│   ├── components/
│   ├── views/
│   ├── router/
│   ├── stores/
│   └── App.vue
└── vite.config.js (or vue.config.js)
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For component work, load:
docs/learnings/component-patterns.md (~600 tokens)

# 3. For state management, load:
docs/learnings/state-management.md (~500 tokens)

# 4. For routing, load:
docs/learnings/routing-patterns.md (~400 tokens)

Total: ~1,300-1,500 tokens (vs 9,000+ before)
```

---

**Last Updated**: 2025-11-11
