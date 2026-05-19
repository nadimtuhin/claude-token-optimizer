# Spring Boot Setup Example

**Quick setup for Spring Boot Java projects - Copy and customize**

---

# Setup Claude Code Documentation for [Spring Boot Project Name]

## Project Context

**Project Type**: Spring Boot Application
**Tech Stack**:
- Spring Boot 3.x
- Java 17+
- [ORM: Spring Data JPA / Hibernate]
- [Database: PostgreSQL/MySQL/H2]
- [Testing: JUnit 5, Mockito]

**Main Features**: [REST API for X, Y, Z]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize below.

## Spring Boot-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories

src/main/java/com/example/
├── controller/      # @RestController — HTTP layer
├── service/         # @Service — business logic
├── repository/      # @Repository — JPA/data access
├── model/entity/    # @Entity — JPA domain objects
├── dto/             # Request/response DTOs
├── config/          # @Configuration classes
└── exception/       # Global exception handlers

src/main/resources/
├── application.yml  # Main config
└── application-{profile}.yml  # Profile overrides

## Key Patterns

### REST controller
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) { ... }
}
```

### JPA Repository
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```
```

### COMMON_MISTAKES.md

```markdown
## Top Spring Boot Mistakes

### 1. JPA N+1 query problem
- Symptom: Dozens of SQL queries for a single request
- Check: Use `EAGER` fetching or is `@OneToMany` uninitialized in a loop?
- Fix: Use `@EntityGraph` or `JOIN FETCH` in JPQL query

### 2. Bean scope mismatch — injecting request-scoped into singleton
- Symptom: `ScopeNotActiveException` or stale data across requests
- Fix: Inject via `ObjectProvider<T>` or use `@Lookup`

### 3. `application.yml` vs environment variables precedence
- Symptom: Config in yml ignored in production
- Check: Spring Boot property precedence — env vars override yml
- Fix: Use `${ENV_VAR:default}` syntax in yml for overridable values

### 4. Missing `@Transactional` on service method
- Symptom: `LazyInitializationException` when accessing lazy relations
- Fix: Add `@Transactional` on service methods that read lazy associations

### 5. Maven Wrapper not committed
- Symptom: `./mvnw: not found` in CI
- Fix: Commit `mvnw`, `mvnw.cmd`, `.mvn/wrapper/` to git
```

### .claudeignore additions

```
target/**
.mvn/**
*.class
*.jar
*.war
```
