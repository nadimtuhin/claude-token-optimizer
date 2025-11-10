# Framework Examples

Framework-specific setup examples with common patterns, mistakes, and best practices.

---

## Available Examples

### [Express.js](express.md)

**For**: REST APIs with Express.js

**Includes**:
- Express routing and middleware patterns
- API design best practices
- Database connection patterns
- Error handling strategies
- Common mistakes to avoid

**Use when building**: REST APIs, microservices, backend services

---

### [Next.js](nextjs.md)

**For**: React applications with Next.js

**Includes**:
- App Router vs Pages Router patterns
- Server vs Client component patterns
- Data fetching strategies
- API routes organization
- Routing and navigation
- Common mistakes to avoid

**Use when building**: Web applications, JAMstack sites, full-stack React apps

---

### [Vue.js](vue.md)

**For**: Vue.js applications

**Includes**:
- Composition API patterns (Vue 3+)
- Component communication (props/emits)
- State management with Pinia
- Vue Router patterns
- Testing with Vitest
- Common mistakes to avoid

**Use when building**: SPAs, progressive web apps, modern Vue applications

---

### [Angular](angular.md)

**For**: Angular applications

**Includes**:
- Standalone components (Angular 17+)
- Signals and reactive state
- Dependency injection patterns
- RxJS and observables
- Route guards and resolvers
- Common mistakes to avoid

**Use when building**: Enterprise applications, TypeScript-first projects

---

### [Django](django.md)

**For**: Django (Python) applications

**Includes**:
- Django ORM and QuerySet optimization
- Class-based vs function-based views
- Django REST Framework patterns
- Forms and validation
- Testing with pytest
- Common mistakes to avoid

**Use when building**: Web applications, REST APIs, CMS systems

---

### [Ruby on Rails](rails.md)

**For**: Rails applications

**Includes**:
- ActiveRecord associations and queries
- RESTful controller patterns
- Hotwire (Turbo + Stimulus)
- Background jobs with Sidekiq
- RSpec testing patterns
- Common mistakes to avoid

**Use when building**: Full-stack web applications, MVPs, CRUD apps

---

### [NestJS](nestjs.md)

**For**: NestJS (Node.js) applications

**Includes**:
- Module organization and dependency injection
- Controllers, guards, interceptors, pipes
- TypeORM and Prisma patterns
- Testing with Jest (unit, integration, e2e)
- Exception handling and validation
- Common mistakes to avoid

**Use when building**: Enterprise Node.js APIs, microservices, TypeScript projects

---

### [Laravel](laravel.md)

**For**: Laravel (PHP) applications

**Includes**:
- Eloquent ORM and query optimization
- Resource controllers and routes
- API resources and transformations
- Form requests and validation
- PHPUnit/Pest testing patterns
- Common mistakes to avoid

**Use when building**: PHP web applications, REST APIs, CMS systems

---

## How to Use

1. **Start with Universal Setup**
   - Copy and use `UNIVERSAL_SETUP.md` first
   - This creates the base structure

2. **Apply Framework Example**
   - After universal setup completes
   - Say: "Also apply the [Express/Next.js] patterns"
   - Claude customizes for your framework

3. **Result**
   - Framework-specific common mistakes
   - Framework-specific learnings files
   - Framework-specific quick reference

---

## Contributing New Examples

Want to add a framework? See `CONTRIBUTING.md`

**Needed examples:**
- Flask / FastAPI
- Spring Boot
- Go (Gin / Echo)
- Rust (Actix / Axum)
- And more!

---

## Token Savings by Framework

| Framework | Before | After | Savings |
|-----------|--------|-------|---------|
| Express | ~10,000 | ~1,300 | 87% |
| Next.js | ~9,000 | ~1,400 | 84% |
| Vue.js | ~9,500 | ~1,500 | 84% |
| Angular | ~10,500 | ~1,500 | 86% |
| Django | ~11,000 | ~1,800 | 84% |
| Rails | ~10,000 | ~1,700 | 83% |
| NestJS | ~11,500 | ~1,900 | 83% |
| Laravel | ~10,500 | ~1,800 | 83% |

---

**Last Updated**: 2025-11-11
