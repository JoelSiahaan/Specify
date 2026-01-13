# Design Document Guidelines

## Purpose

This document defines what belongs in a feature's `design.md` file versus other documentation types (steering files, requirements.md, tasks.md). Use this as a reference to maintain appropriate abstraction levels and avoid scope drift.

---

## Document Hierarchy

```
.kiro/
├── steering/              # Cross-cutting patterns (reusable across ALL features)
│   ├── architecture.md    # Clean Architecture patterns
│   ├── authorization.md   # Authorization patterns
│   ├── tech.md           # Technology stack
│   └── ...
│
└── specs/
    └── {feature-name}/
        ├── requirements.md   # WHAT the feature does (user stories, acceptance criteria)
        ├── design.md        # HOW the feature works (architecture, data models, flows)
        └── tasks.md         # Implementation steps (concrete coding tasks)
```

---

## What Belongs in design.md

### ✅ Feature-Specific Design (INCLUDE)

**1. Feature Overview**
- High-level description of the feature
- Key design decisions specific to this feature
- Feature-specific architectural choices

**2. Feature Architecture**
- How this feature fits into the overall system
- Feature-specific components and their interactions
- Component diagrams showing feature boundaries

**3. Data Models**
- Domain entities specific to this feature
- Database schema for this feature's tables
- Entity relationships within the feature
- Data validation rules

**4. API Endpoints**
- REST endpoints for this feature
- Request/response formats
- Endpoint-to-use-case mapping

**5. Use Cases**
- List of use cases specific to this feature
- Use case descriptions and flows
- Use case interactions

**6. Critical Flows**
- Feature-specific edge cases
- Complex workflows unique to this feature
- State transitions specific to this feature

**7. Correctness Properties**
- Properties derived from this feature's requirements
- Feature-specific invariants
- Testable properties for this feature

**8. Feature-Specific Error Handling**
- Error scenarios unique to this feature
- Feature-specific error codes
- Domain-specific validation errors

---

## What Does NOT Belong in design.md

### ❌ Cross-Cutting Concerns (MOVE TO STEERING FILES)

**1. Architectural Patterns**
- Clean Architecture layer definitions
- Dependency injection patterns
- Repository pattern implementation
- Unit of Work pattern
- **→ Move to:** `architecture.md` steering file

**2. Authorization Patterns**
- General RBAC implementation
- Policy-based authorization patterns
- Authorization flow diagrams
- **→ Move to:** `authorization.md` steering file

**3. Transaction Management**
- General transaction patterns
- Unit of Work implementation
- Optimistic locking patterns
- **→ Move to:** `transactions.md` steering file

**4. DTO Mapping Patterns**
- General DTO mapping strategies
- Mapper patterns (create, read, update, list)
- Data flow diagrams for DTOs
- **→ Move to:** `dto-mapping.md` steering file

**5. Error Handling Standards**
- Standard error response format
- HTTP status code conventions
- Error category definitions
- **→ Move to:** `error-handling.md` steering file

**6. Testing Strategy**
- General testing approach (unit + property tests)
- Testing framework configuration
- Test organization patterns
- Property test tagging format
- **→ Move to:** `testing-strategy.md` steering file

**7. Security Patterns**
- JWT authentication implementation
- Password hashing standards
- Input sanitization patterns
- **→ Move to:** `security.md` steering file

**8. Technology Stack**
- Framework choices (React, Express, Prisma)
- Library selections
- Build tool configuration
- **→ Already in:** `tech.md` steering file

### ❌ Implementation Details (MOVE TO tasks.md)

**1. Step-by-Step Instructions**
- "First create X, then create Y"
- Detailed implementation order
- **→ Move to:** `tasks.md`

**2. Specific Code Examples**
- Complete function implementations
- Detailed code snippets (beyond illustrative pseudocode)
- Specific variable names
- **→ Move to:** Implementation phase (not design)

**3. File Creation Instructions**
- "Create file at path X"
- Directory structure setup steps
- **→ Move to:** `tasks.md`

**4. Testing Instructions**
- "Write test for function X"
- Specific test case implementations
- **→ Move to:** `tasks.md`

---

## Abstraction Level Guidelines

### Design.md Abstraction Level: **ARCHITECTURAL**

**Appropriate:**
- "The system uses Clean Architecture with four layers"
- "Course entity contains business rules for archiving"
- "Authorization policies are pure functions in the application layer"
- "Assignments use optimistic locking to prevent concurrent grading"

**Too Specific (Implementation Detail):**
- "Create a file called `Course.ts` in `src/domain/entities/`"
- "The `archive()` method should set `this.status = 'ARCHIVED'`"
- "Install TSyringe with `npm install tsyringe`"
- "Write a test that calls `course.archive()` and asserts status"

**Too General (Belongs in Steering):**
- "All features should use Clean Architecture"
- "All authorization should use policy-based access control"
- "All database operations should use transactions"
- "All tests should use Jest and fast-check"

---

## Decision Tree: Where Does This Content Belong?

```
Is this content about a specific feature?
│
├─ YES → Is it architectural (HOW it works)?
│   │
│   ├─ YES → Is it reusable across multiple features?
│   │   │
│   │   ├─ YES → Steering file (e.g., architecture.md, authorization.md)
│   │   │
│   │   └─ NO → design.md (feature-specific architecture)
│   │
│   └─ NO → Is it about WHAT the feature does?
│       │
│       ├─ YES → requirements.md (user stories, acceptance criteria)
│       │
│       └─ NO → Is it step-by-step implementation?
│           │
│           └─ YES → tasks.md (implementation tasks)
│
└─ NO → Is it a cross-cutting concern?
    │
    └─ YES → Steering file (applies to all features)
```

---

## Examples: Correct Placement

### Example 1: Clean Architecture Layers

**❌ Wrong (in design.md):**
```markdown
## Clean Architecture Layers

The application uses four layers:
1. Domain Layer - Business logic
2. Application Layer - Use cases
3. Infrastructure Layer - External concerns
4. Presentation Layer - UI and API

Dependencies flow inward...
```

**✅ Right (in architecture.md steering file):**
```markdown
# Architecture Patterns

## Clean Architecture

All features must follow Clean Architecture with four layers...
```

**✅ Right (in design.md):**
```markdown
## Architecture

This feature follows Clean Architecture principles (see architecture.md).

### Feature Components

**Domain Layer:**
- Course entity: Manages course lifecycle and validation
- Assignment entity: Handles due dates and grading locks

**Application Layer:**
- CreateCourseUseCase: Generates unique course codes
- ArchiveCourseUseCase: Archives course and closes assignments
```

### Example 2: Authorization

**❌ Wrong (in design.md):**
```markdown
## Authorization

The system uses policy-based authorization. Policies are pure functions
that receive user and resource data and return boolean decisions.

Authorization flow:
1. Middleware validates JWT
2. Use case loads data
3. Policy checks access
4. Business logic executes
```

**✅ Right (in authorization.md steering file):**
```markdown
# Authorization Patterns

All features must use policy-based authorization...
```

**✅ Right (in design.md):**
```markdown
## Authorization

This feature uses policy-based authorization (see authorization.md).

### Feature-Specific Access Rules

| Resource | Student (Enrolled) | Teacher (Owner) |
|----------|-------------------|-----------------|
| Course   | Read              | Read/Update     |
| Materials| Read/Download     | Full CRUD       |
```

### Example 3: Error Handling

**❌ Wrong (in design.md):**
```markdown
## Error Handling

All errors follow this format:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

Error categories:
- 400: Validation errors
- 401: Authentication errors
- 403: Authorization errors
```

**✅ Right (in error-handling.md steering file):**
```markdown
# Error Handling Standards

All API errors must follow this format...
```

**✅ Right (in design.md):**
```markdown
## Error Handling

This feature follows standard error handling (see error-handling.md).

### Feature-Specific Errors

- `COURSE_CODE_INVALID`: Course code not found (400)
- `COURSE_ARCHIVED`: Cannot enroll in archived course (400)
- `ASSIGNMENT_CLOSED`: Assignment closed for submissions (400)
```

---

## Red Flags: Content That Doesn't Belong

### 🚩 Red Flag 1: "All features should..."
**Problem:** This is a cross-cutting concern, not feature-specific.
**Solution:** Move to a steering file.

### 🚩 Red Flag 2: "First, create a file..."
**Problem:** This is an implementation step, not architectural design.
**Solution:** Move to tasks.md.

### 🚩 Red Flag 3: Complete code implementations
**Problem:** Design should show structure, not implementation.
**Solution:** Use pseudocode or interface definitions only.

### 🚩 Red Flag 4: "Install package X with npm install..."
**Problem:** This is setup instruction, not design.
**Solution:** Move to tech.md or tasks.md.

### 🚩 Red Flag 5: Detailed test implementations
**Problem:** Design defines what to test (properties), not how to test.
**Solution:** Move test implementation to tasks.md.

---

## Quick Reference: Content Checklist

### ✅ design.md Should Have:
- [ ] Feature overview and key decisions
- [ ] Feature-specific components and interactions
- [ ] Data models for this feature
- [ ] API endpoints for this feature
- [ ] Use cases for this feature
- [ ] Critical flows unique to this feature
- [ ] Correctness properties from requirements
- [ ] Feature-specific error codes

### ❌ design.md Should NOT Have:
- [ ] General architectural patterns (→ steering files)
- [ ] Cross-cutting concerns (→ steering files)
- [ ] Step-by-step implementation (→ tasks.md)
- [ ] Complete code examples (→ implementation)
- [ ] Setup instructions (→ tech.md or tasks.md)
- [ ] Test implementations (→ tasks.md)

---

## When in Doubt

**Ask yourself:**
1. **Is this reusable across multiple features?** → Steering file
2. **Is this specific to this feature's architecture?** → design.md
3. **Is this a step-by-step instruction?** → tasks.md
4. **Is this about what the feature does?** → requirements.md

**Golden Rule:** Design documents describe the "HOW" at an architectural level, not the "WHAT" (requirements) or the "STEP-BY-STEP" (tasks).
