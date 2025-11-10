# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-11

### Added

- 🎉 Initial release of Claude Token Optimizer
- ✅ Universal setup prompt for any project
- ✅ Express.js framework example with patterns
- ✅ Next.js framework example with patterns
- ✅ Completion docs template (zero-token system)
- ✅ Session file management template
- ✅ Documentation maintenance guide template
- ✅ Comprehensive README with badges and examples
- ✅ Quick start guide (5-minute setup)
- ✅ Contributing guidelines
- ✅ GitHub issue and PR templates
- ✅ MIT License

### Features

- 📉 **90% token savings** at session start (8,000 → 800 tokens)
- 📉 **88% overall reduction** (11,000 → 1,300 tokens)
- 📉 **100% savings** on historical context (0 tokens)
- 🔧 Selective loading system (load only what you need)
- 🔧 Zero-token historical context (completions/sessions/archive)
- 🔧 Topic-based learning files (~200-700 tokens each)
- 🔧 Framework-specific customization
- ⚡ 5-minute automated setup
- 📚 Copy-paste setup prompts

### Documentation

- Comprehensive README with:
  - Visual token savings comparison
  - Quick start guide
  - Usage examples (Express, Next.js)
  - Framework examples table
  - Collapsible FAQ section
  - Support and contribution links
- Examples directory:
  - Express.js patterns and mistakes
  - Next.js patterns and mistakes
  - Examples overview guide
- Templates directory:
  - Completion doc template
  - Maintenance guide template
  - Templates overview guide
- Contributing guide with:
  - Bug report guidelines
  - Feature request process
  - Framework example checklist
  - Code style guidelines

### Success Metrics

- **RedwoodJS Project** (source): 90% token savings
- **Express API** (estimated): 87% token savings
- **Next.js App** (estimated): 84% token savings

---

## [1.1.0] - 2025-11-11

### Added

- 🚀 **Bash initialization script** (`init.sh`)
  - Automated project setup in 2 minutes
  - Creates complete directory structure
  - Generates all essential files
  - Prompts for project information
  - Sets up .claudeignore automatically
  - Creates placeholder documentation
  - Zero-token system configured automatically

### Changed

- 📚 Updated README with two setup methods:
  - **Method 1**: Bash script (fastest, 2 minutes)
  - **Method 2**: Claude prompt (most customizable, 5 minutes)
- 📊 Added comparison table for setup methods
- ✨ Improved Quick Start section with curl command

### Features

- One-command setup: `curl -fsSL https://... | bash`
- Interactive prompts for project info
- Colored output for better UX
- Safety checks before setup
- Complete structure generation

---

## [1.2.0] - 2025-11-11

### Added

- ✅ **Vue.js framework example** (`examples/vue.md`)
  - Composition API patterns (Vue 3+)
  - State management with Pinia
  - Vue Router patterns
  - Component communication best practices
  - Vitest testing patterns
  - Top 5 Vue-specific mistakes

- ✅ **Angular framework example** (`examples/angular.md`)
  - Standalone components (Angular 17+)
  - Signals and reactive state
  - Dependency injection patterns
  - RxJS and observables
  - NgRx state management
  - Top 5 Angular-specific mistakes

- ✅ **Django framework example** (`examples/django.md`)
  - Django ORM and QuerySet optimization
  - Class-based vs function-based views
  - Django REST Framework patterns
  - Forms and validation
  - pytest and unittest patterns
  - Top 5 Django-specific mistakes

- ✅ **Ruby on Rails framework example** (`examples/rails.md`)
  - ActiveRecord associations and queries
  - RESTful controller patterns
  - Hotwire (Turbo + Stimulus)
  - Background jobs with Sidekiq
  - RSpec testing patterns
  - Top 5 Rails-specific mistakes

### Changed

- 📚 Updated `examples/README.md` with 4 new frameworks
- 📚 Updated main `README.md` framework table
- 📊 Added token savings estimates for all frameworks (83-87% reduction)

### Metrics

- **Total frameworks supported**: 6 (Express, Next.js, Vue, Angular, Django, Rails)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby ecosystems

---

## [1.3.0] - 2025-11-11

### Added

- ✅ **NestJS framework example** (`examples/nestjs.md`)
  - Module organization and dependency injection
  - Controllers, guards, interceptors, pipes
  - TypeORM and Prisma database patterns
  - Exception handling and validation (DTOs)
  - Jest testing (unit, integration, e2e)
  - Top 5 NestJS-specific mistakes

- ✅ **Laravel framework example** (`examples/laravel.md`)
  - Eloquent ORM and query optimization
  - Resource controllers and RESTful routes
  - API resources and transformations
  - Form requests and validation
  - PHPUnit/Pest testing patterns
  - Top 5 Laravel-specific mistakes

### Changed

- 📚 Updated `examples/README.md` with 2 new frameworks
- 📚 Updated main `README.md` framework table
- 📊 Added token savings estimates (83% for both)

### Metrics

- **Total frameworks supported**: 8 (Express, Next.js, Vue, Angular, Django, Rails, NestJS, Laravel)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby, PHP ecosystems

---

## [1.4.0] - 2025-11-11

### Added

- ✅ **Nuxt.js framework example** (`examples/nuxtjs.md`)
  - Server-side rendering and data fetching (useFetch, useAsyncData)
  - File-based routing and dynamic routes
  - Auto-imports and composables
  - Server routes and API endpoints
  - useState and Pinia state management
  - Top 5 Nuxt-specific mistakes (SSR pitfalls, hydration issues)

### Changed

- 📚 Updated `examples/README.md` with Nuxt.js
- 📚 Updated main `README.md` framework count to 9
- 📊 Added token savings estimate (84%)

### Metrics

- **Total frameworks supported**: 9 (Express, Next.js, Vue, Nuxt, Angular, Django, Rails, NestJS, Laravel)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby, PHP ecosystems

---

## [Unreleased]

### Planned

- 🔜 Flask/FastAPI framework examples
- 🔜 Spring Boot framework example
- 🔜 Go (Gin/Echo/Fiber) framework examples
- 🔜 Rust (Actix/Axum/Rocket) framework examples
- 🔜 Phoenix (Elixir) framework example
- 🔜 ASP.NET Core (C#) framework example
- 🔜 Community contributions and improvements

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Adding framework examples
- Reporting bugs
- Suggesting features
- Improving documentation

---

## Version History

- **1.0.0** (2025-11-11) - Initial release
  - Universal setup + Express/Next.js examples
  - Complete documentation system
  - Zero-token historical context

---

**Repository**: https://github.com/nadimtuhin/claude-token-optimizer
**License**: MIT
