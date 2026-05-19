# FastAPI / Flask Setup Example

**Quick setup for Python web projects - Copy and customize**

---

# Setup Claude Code Documentation for [FastAPI Project Name]

## Project Context

**Project Type**: FastAPI Application
**Tech Stack**:
- FastAPI / Flask
- [Database: PostgreSQL/SQLite]
- [ORM: SQLAlchemy/Tortoise]
- [Testing: pytest]
- [Other: Celery, Redis]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with FastAPI-specific content below.

## FastAPI-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories

app/
├── api/             # Route definitions (routers)
├── core/            # Config, security, dependencies
├── models/          # SQLAlchemy / Pydantic models
├── schemas/         # Pydantic request/response schemas
├── services/        # Business logic
├── db/              # Database setup, migrations
└── main.py          # FastAPI app creation

## Key Patterns

### Dependency injection
```python
from fastapi import Depends
async def get_db() -> AsyncSession: ...
async def route(db: AsyncSession = Depends(get_db)): ...
```

### Pydantic v2 model
```python
from pydantic import BaseModel, model_validator
class UserCreate(BaseModel):
    email: str
    password: str
    model_config = ConfigDict(str_strip_whitespace=True)
```
```

### COMMON_MISTAKES.md

```markdown
## Top FastAPI/Flask Mistakes

### 1. Pydantic v2 validator syntax changed
- Symptom: `@validator` decorator not working, import errors
- Check: Are you on Pydantic v2? `pip show pydantic`
- Fix: Use `@field_validator` and `@model_validator` instead of `@validator`

### 2. Async route with sync database call blocks event loop
- Symptom: Slow responses under load, timeouts
- Check: Are you calling sync SQLAlchemy methods inside `async def` routes?
- Fix: Use `AsyncSession` and `await db.execute(...)` throughout

### 3. Alembic autogenerate misses changes
- Symptom: `alembic revision --autogenerate` creates empty migration
- Check: Is the model imported in `env.py` target_metadata?
- Fix: Import all models in `alembic/env.py` before `target_metadata = Base.metadata`

### 4. Missing `await` on async function returns coroutine object
- Symptom: Route returns `<coroutine object>` instead of data
- Fix: Add `await` before every async call

### 5. pytest fixtures not cleaning up database
- Symptom: Tests pass alone, fail together (shared state)
- Fix: Use `yield` fixtures with explicit rollback/truncate
```

### .claudeignore additions

```
__pycache__/**
*.pyc
.venv/**
venv/**
.pytest_cache/**
htmlcov/**
```
