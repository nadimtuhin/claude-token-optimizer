# Next.js Setup Example

**Quick setup for Next.js projects - Copy and customize**

---

# Setup Claude Code Documentation for [Next.js Project Name]

## Project Context

**Project Type**: Next.js Application
**Tech Stack**:
- Next.js 14+ (App Router / Pages Router)
- React 18+
- [Styling: Tailwind/CSS Modules/Styled Components]
- [Database: Prisma/MongoDB]
- [State: React Context/Zustand/Redux]
- [Testing: Jest/Vitest + Testing Library]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Next.js-specific content below.

## Next.js-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (App Router)

app/
├── (routes)/         # Route groups
├── api/              # API routes
├── components/       # Shared components
├── layout.tsx        # Root layout
└── page.tsx          # Home page

## OR (Pages Router)

pages/
├── api/              # API routes
├── _app.tsx          # App wrapper
├── _document.tsx     # HTML document
└── index.tsx         # Home page

components/           # React components
lib/                  # Utilities
public/               # Static assets
styles/               # Global styles

## Key Patterns

### Route Structure (App Router)
- Routes: app/(group)/page.tsx
- Layouts: app/(group)/layout.tsx
- Loading: app/(group)/loading.tsx
- Error: app/(group)/error.tsx

### API Routes
- App Router: app/api/[route]/route.ts
- Pages Router: pages/api/[route].ts

### Component Organization
- Page components: app/**/page.tsx
- Reusable components: components/
- Server components by default (App Router)
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Next.js Mistakes

### 1. Using Client Components Unnecessarily (App Router)
**Symptom**: Hydration errors, unnecessary client bundle

**Check:**
- Only use 'use client' when needed (hooks, browser APIs, events)
- Server components are default and preferred
- Move interactivity down the component tree

### 2. Not Leveraging Server Components
**Anti-pattern:**
```tsx
'use client'
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
}
```

**Correct:**
```tsx
// Server component - no 'use client'
async function Page() {
  const data = await fetch('...').then(r => r.json())
  return <div>{data}</div>
}
```

### 3. Improper Image Optimization
**Wrong:**
```tsx
<img src="/image.jpg" />
```

**Correct:**
```tsx
import Image from 'next/image'
<Image src="/image.jpg" width={500} height={300} alt="..." />
```

### 4. Not Using Next.js Link
**Wrong:**
```tsx
<a href="/about">About</a>
```

**Correct:**
```tsx
import Link from 'next/link'
<Link href="/about">About</Link>
```

### 5. Forgetting Environment Variables Prefix
- Client vars need NEXT_PUBLIC_ prefix
- Server vars don't need prefix
- Never expose secrets to client
```

### docs/learnings/

Create these Next.js-specific files:

**routing-patterns.md:**
```markdown
# Next.js Routing Patterns

## App Router (Next.js 13+)

### File-based Routing
app/
├── page.tsx              # /
├── about/page.tsx        # /about
├── blog/
│   ├── page.tsx          # /blog
│   └── [slug]/page.tsx   # /blog/:slug
└── (auth)/
    ├── login/page.tsx    # /login
    └── signup/page.tsx   # /signup

### Dynamic Routes
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>
}

### Route Groups (No URL segment)
(auth)/login → /login
(marketing)/about → /about

## Pages Router (Legacy)

pages/
├── index.tsx             # /
├── about.tsx             # /about
├── blog/
│   ├── index.tsx         # /blog
│   └── [slug].tsx        # /blog/:slug
└── api/
    └── users.ts          # /api/users
```

**component-patterns.md:**
```markdown
# Next.js Component Patterns

## Server vs Client Components

### Server Component (Default in App Router)
// No 'use client' directive
async function ServerComponent() {
  const data = await fetch('...').then(r => r.json())
  return <div>{data.title}</div>
}

// Benefits:
// - Direct database access
// - No client bundle
// - Automatic data fetching

### Client Component (When needed)
'use client'
import { useState } from 'react'

function ClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// Use when:
// - useState, useEffect, useContext
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)

## Composition Pattern

// Server component wraps client component
async function Page() {
  const data = await getData() // Server-side

  return (
    <div>
      <ServerContent data={data} />
      <InteractiveButton />  {/* Client component */}
    </div>
  )
}
```

**data-fetching.md:**
```markdown
# Next.js Data Fetching

## App Router Patterns

### Server Components (Recommended)
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // ISR: revalidate every hour
  })
  return <div>{data.title}</div>
}

### Client Components
'use client'
import useSWR from 'swr'

function ClientPage() {
  const { data, error } = useSWR('/api/data', fetcher)
  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  return <div>{data.title}</div>
}

## Caching Strategies

// No caching (always fresh)
fetch('...', { cache: 'no-store' })

// Static (build time)
fetch('...', { cache: 'force-cache' })

// ISR (revalidate periodically)
fetch('...', { next: { revalidate: 60 } })

// On-demand revalidation
import { revalidatePath } from 'next/cache'
revalidatePath('/blog')
```

**api-routes.md:**
```markdown
# Next.js API Routes

## App Router (Route Handlers)

// app/api/users/route.ts
export async function GET(request: Request) {
  const users = await db.user.findMany()
  return Response.json({ users })
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return Response.json({ user }, { status: 201 })
}

// Dynamic routes: app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({ where: { id: params.id } })
  return Response.json({ user })
}

## Pages Router (API Routes)

// pages/api/users.ts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await db.user.findMany()
    res.json({ users })
  } else if (req.method === 'POST') {
    const user = await db.user.create({ data: req.body })
    res.status(201).json({ user })
  }
}
```

### QUICK_REFERENCE.md

```markdown
## Next.js Quick Commands

# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint

# Testing
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage

# Database (if using Prisma)
npx prisma migrate dev     # Run migrations
npx prisma studio          # Database GUI
npx prisma generate        # Generate client

## Common Patterns

### Page Component (App Router)
export default function Page() {
  return <div>Content</div>
}

### Layout Component
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <nav>...</nav>
        {children}
      </body>
    </html>
  )
}

### API Route
export async function GET(request: Request) {
  return Response.json({ data: 'value' })
}

### Environment Variables
NEXT_PUBLIC_API_URL=...    # Client-side
DATABASE_URL=...           # Server-side only
```

## Expected Structure After Setup

```
my-nextjs-project/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Next.js-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (App/Pages router)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Next.js commands)
│   ├── learnings/
│   │   ├── routing-patterns.md
│   │   ├── component-patterns.md
│   │   ├── data-fetching.md
│   │   ├── api-routes.md
│   │   ├── state-management.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── app/ (or pages/)
├── components/
├── lib/
└── public/
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For routing work, load:
docs/learnings/routing-patterns.md (~500 tokens)

# 3. For component work, load:
docs/learnings/component-patterns.md (~600 tokens)

# 4. For API work, load:
docs/learnings/api-routes.md (~400 tokens)

Total: ~1,300-1,400 tokens (vs 8,000+ before)
```

---

**Last Updated**: 2025-11-10
