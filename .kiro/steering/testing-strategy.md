# Testing Strategy

## Purpose

This document defines the testing standards that ALL features must follow. Consistent testing ensures code quality, correctness, and maintainability across the entire codebase.

---

## Testing Framework

### Backend (Jest)
- **Framework**: Jest
- **Unit Testing**: Jest for domain, application, infrastructure layers
- **Integration Testing**: Jest + Supertest for API endpoints
- **Property-Based Testing**: fast-check (minimum 100 iterations)
- **Database Testing**: Dedicated test database (port 5433)

### Frontend (Vitest)
- **Framework**: Vitest
- **Component Testing**: Vitest + React Testing Library
- **Unit Testing**: Vitest for services, utilities, hooks
- **Mocking**: vi.fn() and vi.mock() (Vitest API)

**Note**: Jest and Vitest have nearly identical APIs. The main difference is the mock function naming:
- **Jest**: `jest.fn()`, `jest.mock()`, `jest.clearAllMocks()`
- **Vitest**: `vi.fn()`, `vi.mock()`, `vi.clearAllMocks()`

---

## Testing Philosophy

**Key Principles:**
1. **Unit Tests**: Validate specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Validate universal properties across all inputs (minimum 100 iterations)
3. **Test Early**: Write tests alongside implementation, not after
4. **Task-Specific Execution**: Run only relevant tests during development, full suite before commit

---

## Mock Standards

### Backend (Jest) - Mock Pattern

```typescript
import { SomeUseCase } from '../SomeUseCase';
import { ISomeRepository } from '../../../../domain/repositories/ISomeRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';

describe('SomeUseCase', () => {
  let useCase: SomeUseCase;
  let mockSomeRepository: jest.Mocked<ISomeRepository>;
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

    mockAuthPolicy = {
      canCreateCourse: jest.fn(),
      canAccessCourse: jest.fn(),
      // ... ALL policy methods
    } as jest.Mocked<IAuthorizationPolicy>;

    // Mock return values
    mockSomeRepository.findById.mockResolvedValue(entity);
    mockAuthPolicy.canCreateCourse.mockReturnValue(true);

    // Direct dependency injection
    useCase = new SomeUseCase(mockSomeRepository, mockAuthPolicy);
  });
});
```

### Frontend (Vitest) - Mock Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SomeComponent } from '../SomeComponent';
import { someService } from '../../../services';

// Mock service
vi.mock('../../../services', () => ({
  someService: {
    getData: vi.fn(),
    saveData: vi.fn(),
  },
}));

describe('SomeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock return values
    (someService.getData as any).mockResolvedValue({ data: [] });
  });

  it('should render component', async () => {
    render(<SomeComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Key Differences

| Feature | Jest (Backend) | Vitest (Frontend) |
|---------|----------------|-------------------|
| Mock function | `jest.fn()` | `vi.fn()` |
| Mock module | `jest.mock()` | `vi.mock()` |
| Clear mocks | `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| Mock type | `jest.Mocked<T>` | `vi.Mocked<T>` or `any` |
| Spy on | `jest.spyOn()` | `vi.spyOn()` |

**Everything else is identical**: `describe`, `it`, `expect`, `beforeEach`, `afterEach`, etc.

---

## Test Execution

### Backend (Jest)

```bash
# Run all tests
cd backend
npm test

# Run specific test file
npm test -- ComponentName.test.ts

# Run tests matching pattern
npm test -- Course

# Run with coverage
npm test -- --coverage
```

### Frontend (Vitest)

```bash
# Run all tests
cd frontend
npm test

# Run specific test file
npm test -- ComponentName.test.tsx

# Run tests matching pattern
npm test -- Course

# Run with coverage
npm test -- --coverage
```

### Task-Specific Testing (Development)

Run ONLY relevant tests during task implementation:
- Focus on the specific component/feature being developed
- Faster feedback loop
- Easier debugging

### Full Test Suite (Before Commit)

Run full suite ONLY:
- Before committing code
- Before deployment
- In CI/CD pipeline
- After completing all tasks

---

## Database Migration for Tests (Backend Only)

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

## Property-Based Testing (Backend Only)

### Configuration

```typescript
import fc from 'fast-check';

fc.assert(
  fc.asyncProperty(
    fc.string(),
    fc.integer({ min: 0, max: 100 }),
    async (input1, input2) => {
      // Test implementation
    }
  ),
  { numRuns: 100, timeout: 5000 }
);
```

---

## Test Organization

### File Naming
- Unit tests: `ComponentName.test.ts` (backend) or `ComponentName.test.tsx` (frontend)
- Property tests: `ComponentName.properties.test.ts` (backend only)
- Integration tests: `ComponentName.integration.test.ts` (backend only)

### Directory Structure
```
backend/src/
  domain/entities/__tests__/
  application/use-cases/course/__tests__/
  infrastructure/persistence/repositories/__tests__/
  presentation/api/controllers/__tests__/

frontend/src/
  presentation/web/components/course/__tests__/
  presentation/web/services/__tests__/
  presentation/web/utils/__tests__/
```
