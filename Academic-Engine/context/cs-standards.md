---
title: "Software Development Standards & Best Practices"
type: "standards-context"
status: "active"
version: "1.0.0"
last_updated: "2026-09-20"
tags:
  - standards
  - clean-code
  - solid
  - testing
---

# Software Development Standards & Best Practices

> [!NOTE] Purpose
> Reference document for code quality standards, engineering best practices, and professional development conventions used across all course projects.

## 1. Clean Code Principles (Robert C. Martin)

- **Meaningful names:** Variables, functions, and classes should reveal intent
- **Small functions:** Each function does one thing well (< 20 lines ideal)
- **Single Responsibility:** Each module/class has one reason to change
- **DRY:** Don't Repeat Yourself — extract duplication into reusable units
- **KISS:** Keep It Simple — prefer clarity over cleverness
- **Boy Scout Rule:** Leave the code cleaner than you found it

## 2. SOLID Principles

| Principle | Rule | Example |
|---|---|---|
| **S** — Single Responsibility | A class should have one, and only one, reason to change | Separate `UserValidator` from `UserRepository` |
| **O** — Open/Closed | Open for extension, closed for modification | Use interfaces/abstract classes for polymorphism |
| **L** — Liskov Substitution | Subtypes must be substitutable for their base types | A `Square` should behave as a `Rectangle` |
| **I** — Interface Segregation | Many specific interfaces > one general-purpose interface | Split `IWorker` into `IWorkable` + `IFeedable` |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | Inject dependencies via constructor |

## 3. Testing Pyramid

```
        /  E2E  \          ← Few, slow, expensive
       /----------\
      / Integration \      ← Some, moderate speed
     /----------------\
    /   Unit Tests      \  ← Many, fast, cheap
```

- **Unit tests:** Test individual functions/methods in isolation
- **Integration tests:** Test interactions between modules
- **E2E tests:** Test complete user flows through the system
- **Test naming:** `should_[expected]_when_[condition]`
- **AAA pattern:** Arrange, Act, Assert

## 4. Version Control (Git)

### Branching Strategy
- `main` — production-ready code
- `develop` — integration branch
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `release/<version>` — release preparation

### Conventional Commits
```
<type>(<scope>): <description>

feat: add user authentication module
fix: resolve null pointer in payment service
docs: update API documentation
test: add unit tests for OrderService
refactor: extract validation logic to separate class
chore: update dependencies
```

## 5. Code Review Checklist

- [ ] Does the code work? (functionality, edge cases)
- [ ] Is it readable? (naming, comments, structure)
- [ ] Is it tested? (unit tests, coverage)
- [ ] Is it secure? (input validation, auth checks)
- [ ] Is it performant? (no N+1 queries, efficient algorithms)
- [ ] Does it follow project conventions?
- [ ] Is error handling appropriate?
- [ ] Is the documentation updated?

## 6. Documentation Standards

### README Structure
1. Project title and description
2. Prerequisites and installation
3. Usage / Getting started
4. API reference (if applicable)
5. Testing instructions
6. Contributing guidelines
7. License

### Code Comments
- **DO:** Explain *why*, not *what*
- **DO:** Document public APIs with docstrings
- **DON'T:** Comment obvious code
- **DON'T:** Leave commented-out code in production

## 7. Security Fundamentals (OWASP Awareness)

1. Injection (SQL, NoSQL, OS command)
2. Broken authentication
3. Sensitive data exposure
4. XML external entities (XXE)
5. Broken access control
6. Security misconfiguration
7. Cross-site scripting (XSS)
8. Insecure deserialization
9. Using components with known vulnerabilities
10. Insufficient logging & monitoring
