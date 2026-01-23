# Testing Strategy

## Purpose

This document defines the testing standards that ALL features must follow. Consistent testing ensures code quality, correctness, and maintainability across the entire codebase.

---

## Testing Philosophy

**Key Principles:**
1. **Unit Tests**: Validate specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Validate universal properties across all inputs (minimum 100 iterations)
3. **Test Early**: Write tests alongside implementation, not after
4. **Task-Specific Execution**: Run only relevant tests during development, full suite before commit

---

## Testing Framework

- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check (minimum 100 iterations)
- **API Testing**: Supertest for HTTP endpoints
- **Database Testing**: Dedicated test database (port 5433)

---

## Mock Standards (CRITICAL)

### Standard Mock Pattern

**✅ CORRECT Pattern - Use This:**

```typescript
import { SomeUseCase } from '../SomeUseCase';
import { ISomeRepository } from '../../../../domain/repositories/ISomeRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';

describe('SomeUseCase', () => {
  let useCase: SomeUseCase;
  let mockSomeRepository: jest.Mocked<ISomeRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ALL interface methods
    mockSomeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ISomeRepository>;

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    mockAuthPolicy = {
      canCreateCourse: jest.fn(),
      canAccessCourse: jest.fn(),
      canModifyCourse: jest.fn(),
      canArchiveCourse: jest.fn(),
      canDeleteCourse: jest.fn(),
      canEnrollInCourse: jest.fn(),
      canViewMaterials: jest.fn(),
      canManageMaterials: jest.fn(),
      canViewAssignments: jest.fn(),
      canManageAssignments: jest.fn(),
      canSubmitAssignment: jest.fn(),
      canGradeSubmissions: jest.fn(),
      canViewSubmission: jest.fn(),
      canExportGrades: jest.fn(),
      canViewProgress: jest.fn()
    } as jest.Mocked<IAuthorizationPolicy>;

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockUser);

    // Direct dependency injection
    useCase = new SomeUseCase(
      mockSomeRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });
});
```

### Common Mistakes

❌ **WRONG - Never Do This:**

```typescript
// ❌ DO NOT mock tsyringe container
jest.mock('tsyringe', () => ({
  container: { resolve: jest.fn() }
}));

// ❌ DO NOT use incomplete mocks
mockAuthPolicy = {
  canCreateCourse: jest.fn()
  // Missing 14 other methods!
};

// ❌ DO NOT forget parameters
useCase = new SomeUseCase(mockRepository, mockAuthPolicy);
// Missing mockUserRepository!
```

### Mock Patterns by Type

**Repository Mocks:**
```typescript
mockCourseRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  findByTeacherId: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
} as jest.Mocked<ICourseRepository>;
```

**Mock Return Values:**
```typescript
// Async methods (Promises)
mockRepository.findById.mockResolvedValue(entity);
mockRepository.save.mockResolvedValue(entity);
mockRepository.findById.mockResolvedValue(null); // Not found

// Sync methods (Direct values)
mockAuthPolicy.canArchiveCourse.mockReturnValue(true);
mockAuthPolicy.canDeleteCourse.mockReturnValue(false);
```

---

## Testing by Layer

### Domain Layer
- **Focus**: Business logic without external dependencies
- **No mocks needed**: Pure domain logic
- Test entity state transitions, value object validation, domain services

### Application Layer (Use Cases)
- **Focus**: Orchestration and authorization
- **Mock**: Repositories, policies, file storage
- **Pattern**: Use `jest.Mocked<Interface>` with direct injection
- Test authorization before business logic, repository calls, error handling

### Infrastructure Layer
- **Focus**: Integration with external systems
- **Use real**: Database (test DB), file system (temp directory)
- Test repository CRUD, entity ↔ database mapping, transactions

### Presentation Layer
- **Focus**: API endpoints and validation
- **Use**: Supertest for HTTP testing
- Test request validation, authentication, authorization, status codes

---

## Test Execution

### Task-Specific Testing (Development)

**Run ONLY relevant tests during task implementation:**

```bash
# Specific test file
npm test -- ComponentName.test.ts

# Specific component
npm test -- Course

# Specific layer
npm test -- src/application
```

### Full Test Suite (Before Commit)

**Run full suite ONLY:**
- Before committing code
- Before deployment
- In CI/CD pipeline
- After completing all tasks

```bash
npm test
```

---

## Database Migration for Tests

**CRITICAL**: Apply migrations to test database before running integration tests.

```bash
# 1. Create migration (dev database)
npx prisma migrate dev --name add_model

# 2. Apply to test database
$env:DATABASE_URL="postgresql://lms_test_user:test_password@localhost:5433/lms_test"
npx prisma migrate deploy

# 3. Run tests
npm test -- RepositoryName.test.ts
```

**Two Databases:**
- Dev: `localhost:5432` (for development)
- Test: `localhost:5433` (for testing)

---

## Property-Based Testing

### Configuration

```typescript
fc.assert(
  fc.asyncProperty(
    fc.string(),
    fc.integer({ min: 0, max: 100 }),
    async (input1, input2) => {
      // Test implementation
    }
  ),
  { numRuns: 100, timeout: 5000 }
)
```

### Common Patterns

1. **Invariants**: Properties that remain constant
2. **Round-Trip**: `decode(encode(x)) === x`
3. **Idempotence**: `f(x) === f(f(x))`
4. **Error Conditions**: Invalid inputs always rejected

---

## Test Organization

### File Naming
- Unit tests: `ComponentName.test.ts`
- Property tests: `ComponentName.properties.test.ts`
- Integration tests: `ComponentName.integration.test.ts`

### Directory Structure
```
src/
  domain/entities/__tests__/
  application/use-cases/course/__tests__/
  infrastructure/persistence/repositories/__tests__/
  presentation/api/controllers/__tests__/
```

---

## Refactoring Checklist

When adding new dependencies to use cases:

**Use Case:**
- [ ] Add parameter to constructor
- [ ] Add `@inject('InterfaceName')` decorator
- [ ] Use injected dependency (not `container.resolve()`)

**Test File:**
- [ ] Remove `tsyringe` mocking code
- [ ] Add mock with ALL interface methods
- [ ] Mock return values in `beforeEach()`
- [ ] Update constructor call with new parameter
- [ ] Run tests to verify

---

## Summary

**Critical Rules:**

1. ✅ Use `jest.Mocked<Interface>` for all mocks
2. ✅ Mock ALL methods from interface
3. ✅ Pass mocks directly to constructors
4. ✅ Reset mocks with `jest.clearAllMocks()`
5. ✅ Run task-specific tests during development
6. ✅ Run full suite before commit

7. ❌ Never mock `tsyringe` container
8. ❌ Never use incomplete interface mocks
9. ❌ Never skip `jest.clearAllMocks()`
10. ❌ Never run full suite during task development

**Standard Pattern:**
```typescript
mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  // ... ALL methods
} as jest.Mocked<IRepository>;

useCase = new UseCase(mockRepo, mockUserRepo, mockAuthPolicy);
```

**Remember**: Consistent mocking patterns prevent maintenance issues. Always use the standard pattern above.
