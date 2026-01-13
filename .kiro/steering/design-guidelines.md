# Design Document Guidelines

## Purpose

This document defines what belongs in a feature's `design.md` file versus other documentation types (steering files, requirements.md, tasks.md). Use this as a reference to maintain appropriate abstraction levels and avoid scope drift.

---

## Document Hierarchy

```
.kiro/
├── steering/              # Cross-cutting patterns (reusable across ALL features)
│   ├── error-handling.md  # Error handling standards
│   ├── testing-strategy.md # Testing approach and frameworks
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
- Clean Architecture layer organization for this feature
- Authorization strategy for this feature

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
- Property-to-requirement mapping

**8. Feature-Specific Error Handling**
- Error scenarios unique to this feature
- Feature-specific error codes (e.g., `COURSE_CODE_INVALID`, `ASSIGNMENT_CLOSED`)
- Domain-specific validation errors
- Feature-specific error handling flows
- Reference to error-handling.md for standard patterns

**9. Feature-Specific Testing Considerations**
- Which correctness properties to test for this feature
- Feature-specific test scenarios and edge cases
- Security testing specific to this feature's requirements
- Integration points that need testing
- Reference to testing-strategy.md for general approach

---

## What Does NOT Belong in design.md

### ❌ Cross-Cutting Concerns (MOVE TO STEERING FILES)

**1. Error Handling Standards**
- Standard error response format
- HTTP status code conventions
- Error category definitions (401, 403, 400, 404, 500)
- Error class hierarchy (ApplicationError, DomainError, etc.)
- Error handler middleware patterns
- Logging best practices
- **→ Move to:** `error-handling.md` steering file

**2. Testing Strategy**
- General testing approach (unit + property tests)
- Testing framework configuration (Jest, fast-check, Supertest)
- Test organization patterns and directory structure
- Property test tagging format
- Testing by Clean Architecture layer
- Unit testing and property-based testing guidelines
- **→ Move to:** `testing-strategy.md` steering file

**3. Technology Stack**
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
- "All features should follow standard error response format" (→ error-handling.md)
- "All tests should use Jest and fast-check" (→ testing-strategy.md)
- "All features should use React 19.2 with TypeScript" (→ tech.md)

---

## Decision Tree: Where Does This Content Belong?

```
Is this content about a specific feature?
│
├─ YES → Is it architectural (HOW it works)?
│   │
│   ├─ YES → Is it reusable across multiple features?
│   │   │
│   │   ├─ YES → Steering file (e.g., error-handling.md, testing-strategy.md, tech.md)
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

### Example 1: Error Handling

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
- 404: Not Found
- 500: Internal Server Error

Error classes:
- ApplicationError
- DomainError
- InfrastructureError

Error handler middleware pattern...
```

**✅ Right (in error-handling.md steering file):**
```markdown
# Error Handling Standards

All API errors must follow this format...

## Standard Error Categories
- 401: Authentication errors
- 403: Authorization errors
- 400: Validation errors
- 404: Not Found
- 500: Internal Server Error

## Error Classes
- ApplicationError (Application Layer)
- DomainError (Domain Layer)
- InfrastructureError (Infrastructure Layer)

## Error Handler Middleware
[Pattern for global error handler]
```

**✅ Right (in design.md):**
```markdown
## Error Handling

This feature follows standard error handling (see error-handling.md).

### Feature-Specific Errors

**Course Management:**
- `COURSE_CODE_INVALID`: Course code not found (400)
- `COURSE_ARCHIVED`: Cannot enroll in archived course (400)

**Assignment Management:**
- `ASSIGNMENT_CLOSED`: Assignment closed for submissions (400)
- `ASSIGNMENT_PAST_DUE`: Cannot edit past due date (400)

### Feature-Specific Error Scenarios

**Course Code Collision:**
- Retry generation up to 5 times
- Return INTERNAL_ERROR if all retries fail

**Concurrent Grading:**
- Use database transactions to prevent race conditions
- Lock assignment when first grade is saved
```

### Example 2: Testing Strategy

**❌ Wrong (in design.md):**
```markdown
## Testing Strategy

### Testing Approach
The LMS uses a dual testing approach combining unit tests and property-based tests.

### Testing Framework
- Unit Testing: Jest with React Testing Library
- Property-Based Testing: fast-check
- API Testing: Supertest

### Test Configuration
- Property Tests: Minimum 100 iterations per test
- Coverage Target: 80% minimum

### Testing by Clean Architecture Layer
[Detailed testing approach for each layer]

### Property Test Tagging
Each property test must reference its design document property:
```typescript
// Feature: core-lms, Property 1: Authentication round-trip
```
```

**✅ Right (in testing-strategy.md steering file):**
```markdown
# Testing Strategy

## Testing Philosophy
Dual testing approach: unit tests + property-based tests

## Testing Framework
- Jest with React Testing Library
- fast-check for property-based testing
- Supertest for API testing

## Test Configuration
- Minimum 100 iterations per property test
- 80% code coverage minimum

## Testing by Clean Architecture Layer
[Detailed approach for Domain, Application, Infrastructure, Presentation]

## Property Test Tagging
Format: `Feature: {feature_name}, Property {number}: {property_text}`
```

**✅ Right (in design.md):**
```markdown
## Testing Strategy

This feature follows the testing strategy defined in testing-strategy.md.

### Feature-Specific Testing Focus

The LMS testing focuses on validating the correctness properties defined in this document:

1. **Authentication and Authorization**: JWT token lifecycle, role-based access control
2. **Course Lifecycle**: State transitions (Active → Archived → Deleted)
3. **Assignment Submission**: Timing rules, grading lock mechanism
4. **Quiz Taking**: Timer enforcement, submission validation
5. **Grading Workflow**: Manual grading, grade persistence

### Security Testing Strategy

Security testing specific to LMS requirements (Requirement 20):

**Authentication Security** (Requirement 1, 20.1):
- Valid credentials create session with hashed password
- Expired JWT tokens rejected

**File Upload Security** (Requirement 20.3, 20.4, 20.5):
- Executable files rejected
- Files exceeding 10MB rejected
- File access requires authorization
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
- [ ] Feature architecture (Clean Architecture layers for this feature)
- [ ] Authorization strategy for this feature
- [ ] Data models for this feature
- [ ] API endpoints for this feature
- [ ] Use cases for this feature
- [ ] Critical flows unique to this feature
- [ ] Correctness properties from requirements
- [ ] Feature-specific error codes and error scenarios
- [ ] Feature-specific testing focus and security testing
- [ ] References to steering files (error-handling.md, testing-strategy.md, tech.md)

### ❌ design.md Should NOT Have:
- [ ] Standard error response format (→ error-handling.md)
- [ ] General testing approach and frameworks (→ testing-strategy.md)
- [ ] Technology stack choices (→ tech.md)
- [ ] Cross-cutting concerns (→ steering files)
- [ ] Step-by-step implementation (→ tasks.md)
- [ ] Complete code examples (→ implementation)
- [ ] Setup instructions (→ tech.md or tasks.md)
- [ ] Test implementations (→ tasks.md)

---

## When in Doubt

**Ask yourself:**
1. **Is this reusable across multiple features?** → Steering file (error-handling.md, testing-strategy.md, tech.md)
2. **Is this specific to this feature's architecture?** → design.md
3. **Is this a step-by-step instruction?** → tasks.md
4. **Is this about what the feature does?** → requirements.md

**Golden Rule:** Design documents describe the "HOW" at an architectural level, not the "WHAT" (requirements) or the "STEP-BY-STEP" (tasks).
