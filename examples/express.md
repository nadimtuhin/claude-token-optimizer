# Express.js Setup Example

**Quick setup for Express.js projects - Copy and customize**

---

# Setup Claude Code Documentation for [Express Project Name]

## Project Context

**Project Type**: Express.js API
**Tech Stack**:
- Express.js
- [Database: PostgreSQL/MongoDB/MySQL]
- [ORM: Prisma/Sequelize/Mongoose]
- [Testing: Jest/Mocha]
- [Other: Redis, Bull, etc.]

**Main Features**: [API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Express-specific content below.

## Express-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories

src/
├── routes/          # Express route definitions
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware (auth, validation)
├── services/        # Business logic
├── models/          # Database models
├── utils/           # Helper functions
├── config/          # Configuration files
└── app.js           # Express app setup

## Key Patterns

### Route Definition
- Routes: src/routes/*.routes.js
- Controllers: src/controllers/*.controller.js
- Middleware: src/middlewares/*.middleware.js

### Error Handling
- Custom errors: src/utils/errors.js
- Error middleware: src/middlewares/errorHandler.js

### Database
- Connection: src/config/database.js
- Models: src/models/
- Migrations: [migrations folder]
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Express.js Mistakes

### 1. Forgot Error Handling Middleware
- Must be LAST middleware: app.use(errorHandler)
- Always use try-catch in async routes
- Use express-async-errors or wrap with asyncHandler

### 2. Missing Input Validation
- Validate ALL user inputs
- Use: express-validator, joi, or zod
- Sanitize before database queries

### 3. Improper Middleware Order
- Body parsers before routes
- Auth middleware before protected routes
- Error handler LAST

### 4. Not Closing Database Connections
- Use connection pooling
- Close connections on process.exit
- Handle connection errors

### 5. Exposing Errors to Client
- Never send stack traces in production
- Use generic error messages
- Log detailed errors server-side
```

### docs/learnings/

Create these Express-specific files:

**api-design.md:**
```markdown
# Express API Design Patterns

## REST Endpoint Structure
GET    /api/resource       # List
GET    /api/resource/:id   # Get one
POST   /api/resource       # Create
PUT    /api/resource/:id   # Update
DELETE /api/resource/:id   # Delete

## Route Organization
- Group by resource
- Use express.Router()
- Version APIs: /api/v1/, /api/v2/

## Controller Pattern
export const getResource = async (req, res, next) => {
  try {
    const data = await Service.get(req.params.id)
    res.json({ data })
  } catch (error) {
    next(error)
  }
}
```

**middleware-patterns.md:**
```markdown
# Express Middleware Patterns

## Authentication
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    req.user = await verifyToken(token)
    next()
  } catch (error) {
    next(new UnauthorizedError())
  }
}

## Validation
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details })
    next()
  }
}
```

**database-patterns.md:**
```markdown
# Database Patterns

## Connection Pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000
})

## Query Pattern
const getUser = async (id) => {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0]
  } finally {
    client.release()
  }
}

## Transaction Pattern
const createOrder = async (orderData) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const order = await client.query('INSERT INTO orders ...')
    await client.query('INSERT INTO order_items ...')
    await client.query('COMMIT')
    return order
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

### QUICK_REFERENCE.md

```markdown
## Express Quick Commands

# Development
npm run dev          # Start dev server (nodemon)
npm start            # Start production server
npm test             # Run tests

# Database
npm run migrate      # Run migrations
npm run seed         # Seed database
npm run db:reset     # Reset database

# Testing
npm test             # All tests
npm test -- --watch  # Watch mode
npm run test:cover   # Coverage report

## Common Patterns

### Route Definition
const router = express.Router()
router.get('/', authMiddleware, controller.getAll)
router.post('/', validateBody(schema), controller.create)

### Error Handling
app.use((err, req, res, next) => {
  logger.error(err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  })
})

### Environment Variables
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=development
```

## Expected Structure After Setup

```
my-express-project/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Express-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Express structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Express commands)
│   ├── learnings/
│   │   ├── api-design.md
│   │   ├── middleware-patterns.md
│   │   ├── database-patterns.md
│   │   ├── testing-patterns.md
│   │   ├── error-handling.md
│   │   └── performance.md
│   └── archive/
└── src/
    ├── routes/
    ├── controllers/
    ├── services/
    └── ...
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For API work, load:
docs/learnings/api-design.md (~500 tokens)

# 3. For middleware work, load:
docs/learnings/middleware-patterns.md (~400 tokens)

Total: ~1,300 tokens (vs 8,000+ before)
```

---

**Last Updated**: 2025-11-10
