# Testing Infrastructure

This directory contains test utilities and helpers for the LMS backend.

## Overview

The LMS uses a **dual testing approach** combining:
- **Unit Tests**: Validate specific examples and edge cases
- **Property-Based Tests**: Validate universal properties across all inputs

## Testing Framework

- **Unit Testing**: Jest with TypeScript support
- **Property-Based Testing**: fast-check (minimum 100 iterations per test)
- **API Testing**: Supertest for HTTP endpoint testing
- **Database Testing**: Prisma with test database

## Directory Structure

```
src/test/
├── __tests__/           # Test files for utilities
├── test-utils.ts        # General test utilities
├── property-test-utils.ts  # Property-based testing generators
├── api-test-utils.ts    # API testing helpers
├── index.ts             # Central export point
└── README.md            # This file
```

## Test Utilities

### test-utils.ts

General utilities for testing:
- `createTestPrismaClient()`: Create test database client
- `cleanupDatabase()`: Clean database after tests
- `generateTestToken()`: Generate JWT tokens for testing
- Mock data: `mockUser`, `mockTeacher`, `mockCourse`, `mockAssignment`

### property-test-utils.ts

Custom generators for property-based testing:
- `emailArbitrary()`: Valid email addresses
- `passwordArbitrary()`: Valid passwords
- `courseCodeArbitrary()`: 6-character course codes
- `gradeArbitrary()`: Grades (0-100)
- `futureDateArbitrary()`: Future dates for due dates
- `userArbitrary()`: Complete user objects
- `courseArbitrary()`: Complete course objects

### api-test-utils.ts

Helpers for API integration tests:
- `createAuthenticatedRequest()`: Create authenticated Supertest requests
- `assertErrorResponse()`: Assert error response format
- `assertValidationError()`: Assert validation errors
- `assertAuthenticationError()`: Assert 401 errors
- `assertAuthorizationError()`: Assert 403 errors

## Usage Examples

### Unit Test

```typescript
import { describe, it, expect } from '@jest/globals';
import { mockUser } from '../test/test-utils.js';

describe('User Entity', () => {
  it('should create user with valid data', () => {
    const user = User.create(mockUser);
    expect(user.getEmail()).toBe(mockUser.email);
  });
});
```

### Property-Based Test

```typescript
import * as fc from 'fast-check';
import { emailArbitrary, propertyTestConfig } from '../test/property-test-utils.js';

describe('Email Validation', () => {
  it('Property 1: All valid emails contain @', async () => {
    await fc.assert(
      fc.property(emailArbitrary(), (email) => {
        return email.includes('@');
      }),
      propertyTestConfig
    );
  });
});
```

### API Integration Test

```typescript
import request from 'supertest';
import { createAuthenticatedRequest, testTokens } from '../test/api-test-utils.js';

describe('POST /api/courses', () => {
  it('should create course with valid data', async () => {
    const authRequest = createAuthenticatedRequest(app, testTokens.teacher);
    
    const response = await authRequest
      .post('/api/courses')
      .send({ name: 'Test Course', description: 'Test' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

## Configuration

### jest.config.js

- TypeScript support with ts-jest
- ESM module support
- Test timeout: 10 seconds
- Coverage collection from src/**/*.ts
- Setup file: jest.setup.js

### jest.setup.js

- Imports reflect-metadata for dependency injection
- Sets test environment variables
- Configures test timeout

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Database**: Use `cleanupDatabase()` after tests
3. **Mock Data**: Use provided mock data for consistency
4. **Property Tests**: Minimum 100 iterations per test
5. **Descriptive Names**: Use clear test descriptions
6. **Arrange-Act-Assert**: Follow AAA pattern

## Property Test Configuration

All property tests must use:
```typescript
{
  numRuns: 100,  // Minimum iterations
  timeout: 5000  // 5 second timeout
}
```

## References

- [Jest Documentation](https://jestjs.io/)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Strategy](../../../../.kiro/steering/testing-strategy.md)
