# Go (Gin / chi) Setup Example

**Quick setup for Go web projects - Copy and customize**

---

# Setup Claude Code Documentation for [Go Project Name]

## Project Context

**Project Type**: Go Web Service
**Tech Stack**:
- Go 1.21+
- [Router: Gin / chi / stdlib]
- [Database: PostgreSQL/SQLite]
- [ORM: sqlc / GORM / pgx]
- [Testing: testify]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Go-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories

cmd/
└── server/main.go    # Entry point

internal/
├── handler/          # HTTP handlers
├── service/          # Business logic
├── repository/       # Database access
├── model/            # Domain types
└── middleware/       # HTTP middleware

pkg/                  # Shared, importable packages

## Key Patterns

### Handler
```go
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    user, err := h.service.GetUser(r.Context(), id)
    if err != nil { http.Error(w, err.Error(), 500); return }
    json.NewEncoder(w).Encode(user)
}
```

### Interface-based service
```go
type UserService interface {
    GetUser(ctx context.Context, id string) (*User, error)
}
```
```

### COMMON_MISTAKES.md

```markdown
## Top Go Mistakes

### 1. Module path mismatch
- Symptom: `cannot find module providing package`
- Check: Does `go.mod` module name match import paths in code?
- Fix: `go mod tidy` and verify module name in `go.mod`

### 2. Goroutine leak — forgetting to cancel context
- Symptom: Memory grows over time, goroutines pile up
- Fix: Always `defer cancel()` after `context.WithCancel` / `WithTimeout`

### 3. Interface nil pointer panic
- Symptom: `nil pointer dereference` on interface method call
- Check: Is a nil concrete pointer assigned to an interface variable?
- Fix: Check `if svc == nil` before assignment, or use explicit nil interface checks

### 4. sql.Rows not closed
- Symptom: Connection pool exhaustion, `too many open files`
- Fix: Always `defer rows.Close()` immediately after `db.QueryContext`

### 5. Race condition in tests
- Symptom: Tests fail intermittently with `-race` flag
- Fix: Run `go test -race ./...` and fix all data races before merging
```

### .claudeignore additions

```
vendor/**
bin/**
*.test
*.out
```
