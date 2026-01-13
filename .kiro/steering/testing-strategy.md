# Testing Strategy

## Purpose

This document defines the testing standards that ALL features must follow. Consistent testing ensures code quality, correctness, and maintainability across the entire codebase.

---

## Testing Philosophy

The LMS uses a **dual testing approach** combining unit tests for specific examples and property-based tests for universal correctness properties. This ensures both concrete functionality and general correctness across all inputs.

**Key Principles:**
1. **Unit Tests**: Validate specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Validate universal properties across all inputs
3. **Complementary**: Both types are necessary for comprehensive coverage
4. **Test Early**: Write tests alongside implementation, not after

---

## Testing Framework

### Unit Testing
- **Framework**: Jest with React Testing Library
- **API Testing**: Supertest for HTTP endpoint testing
- **Database Testing**: In-memory PostgreSQL or dedicated test database
- **Mocking**: Minimize mocking, prefer integration testing where possible

### Property-Based Testing
- **Framework**: fast-check (JavaScript/TypeScript PBT library)
- **Minimum Iterations**: 100 iterations per property test (due to randomization)
- **Generator Strategy**: Write smart generators that constrain to valid input space

---

## Test Configuration

### General Configuration
- **Test Isolation**: Each test uses fresh database state (no shared state between tests)
- **Mock Strategy**: Minimize mocking, prefer integration testing
- **Coverage Target**: 80% code coverage minimum
- **Parallel Execution**: Tests run in parallel for speed (Jest default)

### Property Test Configuration
- **Minimum Iterations**: 100 runs per property test
- **Timeout**: Increase timeout for property tests (default: 5000ms)
- **Shrinking**: Enable automatic shrinking to find minimal failing examples
- **Seed**: Use deterministic seed for reproducible failures

**Example Configuration:**
```typescript
fc.assert(
  fc.asyncProperty(
    // generators
    async (input) => {
      // test implementation
    }
  ),
  { numRuns: 100, timeout: 5000 }
)
```

---

## Testing by Clean Architecture Layer

### Domain Layer Testing
**Focus**: Pure business logic without external dependencies

**Approach**:
- Unit tests for Domain Entities (business rule enforcement)
- Test Value Objects (validation, immutability)
- Test Domain Services (complex operations)
- **No mocks needed** - domain layer has no external dependencies

**What to Test**:
- Business rule enforcement (e.g., `course.archive()` validates state)
- Entity state transitions (e.g., assignment grading lock)
- Value object validation (e.g., Email format, CourseCode generation)
- Domain service logic (e.g., unique code generation with retry)

**Example Test Scenarios**:
- Course entity: Archive active course succeeds, archive archived course fails
- Assignment entity: Start grading sets lock, cannot accept submission after lock
- Value object: Generate valid format, reject invalid format
- Domain service: Generate unique value with collision retry logic

---

### Application Layer Testing
**Focus**: Use Case orchestration and business workflows

**Approach**:
- Test Use Cases with mocked repositories and policies
- Verify correct repository method calls
- Test authorization policy enforcement
- Test transaction boundaries (Unit of Work)
- Mock infrastructure dependencies (repositories, file storage)

**What to Test**:
- Use case orchestration (load data → check authorization → execute logic)
- Repository method calls with correct parameters
- Authorization policy enforcement before business logic
- Transaction commit/rollback behavior
- Error handling and error propagation

**Example Test Scenarios**:
- CreateCourseUseCase: Calls repository.save with correct entity
- ArchiveCourseUseCase: Loads course, calls archive(), saves in transaction
- GradeSubmissionUseCase: Checks authorization, locks assignment, saves grade
- SubmitAssignmentUseCase: Validates grading lock before accepting submission

---

### Infrastructure Layer Testing
**Focus**: Integration with external systems

**Approach**:
- Integration tests with real database (test database or in-memory)
- Test repository implementations (Prisma repositories)
- Test file storage implementations (local or S3)
- Verify database transactions and constraints
- Test error handling for external failures

**What to Test**:
- Repository CRUD operations (save, find, update, delete)
- Domain entity ↔ Database model mapping
- Database constraints (unique, foreign key, not null)
- Transaction commit and rollback
- File storage operations (upload, download, delete)
- External service integrations

**Example Test Scenarios**:
- PrismaCourseRepository: Save and retrieve course entity correctly
- Repository mapping: Domain entity ↔ Database model conversion preserves data
- File storage: Upload, retrieve, delete files successfully
- Transaction rollback on error restores previous state

---

### Presentation Layer Testing
**Focus**: API endpoints and request/response handling

**Approach**:
- API integration tests with Supertest
- Test request validation and error responses
- Test authentication and authorization middleware
- Verify correct HTTP status codes
- Test with valid and invalid inputs

**What to Test**:
- Request validation (valid and invalid inputs)
- Authentication middleware (valid, expired, missing tokens)
- Authorization middleware (role-based access control)
- HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Response format (JSON structure, error format)
- Error handling (validation errors, business logic errors)

**Example Test Scenarios**:
- POST /api/courses: Returns 201 with course data for valid input
- PUT /api/courses/:id: Returns 403 for non-owner teacher
- POST /api/assignments/:id/submit: Returns 400 if grading started
- GET /api/courses: Returns only active courses for students

---

## Unit Testing Guidelines

### What to Test with Unit Tests

1. **Specific Examples**: Concrete scenarios that demonstrate correct behavior
2. **Edge Cases**: Boundary values, empty inputs, maximum values
3. **Error Conditions**: Invalid inputs, constraint violations, business rule violations
4. **Integration Points**: Component interactions, API contracts

### Unit Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do X when Y', () => {
      // Arrange: Set up test data
      const input = createTestData();
      
      // Act: Execute the operation
      const result = component.method(input);
      
      // Assert: Verify the result
      expect(result).toEqual(expectedOutput);
    });
    
    it('should throw error when invalid input', () => {
      const invalidInput = createInvalidData();
      
      expect(() => component.method(invalidInput))
        .toThrow(ExpectedError);
    });
  });
});
```

### Unit Test Best Practices

✅ **DO**:
- Use descriptive test names that explain what is being tested
- Follow Arrange-Act-Assert pattern
- Test one thing per test
- Use test data builders for complex objects
- Clean up resources after tests (database, files)

❌ **DON'T**:
- Test implementation details (test behavior, not internals)
- Write tests that depend on other tests (no shared state)
- Mock everything (prefer integration tests for external dependencies)
- Write tests that are flaky or non-deterministic

---

## Property-Based Testing Guidelines

### What to Test with Property Tests

1. **Invariants**: Properties that remain constant despite changes
2. **Round-Trip Properties**: Operations with inverses (serialize/deserialize)
3. **Idempotence**: Operations where doing it twice = doing it once
4. **Metamorphic Properties**: Relationships between inputs and outputs
5. **Error Conditions**: Invalid inputs should always be rejected

### Common Property Patterns

**1. Invariants**
- Properties that remain constant after transformation
- Examples: collection size after map, contents after sort, tree balance

**2. Round-Trip Properties**
- Combining an operation with its inverse returns to original value
- Examples: serialization/deserialization, encode/decode, parse/format
- **Critical for parsers and serializers**

**3. Idempotence**
- Operations where doing it twice = doing it once
- Examples: distinct filter, database updates, message processing
- Mathematically: f(x) = f(f(x))

**4. Metamorphic Properties**
- Relationships between components without knowing specifics
- Examples: `len(filter(x)) <= len(x)`, `sort(sort(x)) = sort(x)`

**5. Error Conditions**
- Generate invalid inputs and ensure they properly signal errors
- Examples: empty strings, negative numbers, malformed data

### Property Test Structure

```typescript
describe('ComponentName Properties', () => {
  it('Property N: Description', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generators for test inputs
        fc.string(),
        fc.integer({ min: 0, max: 100 }),
        
        async (input1, input2) => {
          // Test implementation
          const result = await component.method(input1, input2);
          
          // Assert property holds
          expect(result).toSatisfyProperty();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Property Test Best Practices

✅ **DO**:
- Write smart generators that constrain to valid input space
- Use minimum 100 iterations per property test
- Tag tests with property number from design document
- Test universal properties, not specific examples
- Enable shrinking to find minimal failing examples

❌ **DON'T**:
- Test specific examples (use unit tests for that)
- Use too few iterations (< 100)
- Write generators that produce mostly invalid inputs
- Ignore failing property tests (they reveal real bugs)

---

## Property Test Tagging

Each property test MUST reference its design document property using this format:

**Tag Format**: `Feature: {feature_name}, Property {number}: {property_text}`

**Example**:
```typescript
// Feature: core-lms, Property 1: Authentication round-trip
test('valid user credentials authenticate and create valid session', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        name: fc.string({ minLength: 1 }),
        role: fc.constantFrom('STUDENT', 'TEACHER')
      }),
      async (userData) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  )
})
```

**Purpose**: Links property tests to design document properties for traceability

---

## Test Organization

### Directory Structure

```
src/
  domain/
    entities/
      __tests__/
        Course.test.ts              # Domain entity unit tests
        Assignment.test.ts
        Course.properties.test.ts   # Property-based tests
    services/
      __tests__/
        CourseCodeGenerator.test.ts
  application/
    use-cases/
      course/
        __tests__/
          CreateCourseUseCase.test.ts    # Use case tests with mocks
          ArchiveCourseUseCase.test.ts
  infrastructure/
    persistence/
      repositories/
        __tests__/
          PrismaCourseRepository.test.ts # Integration tests
  presentation/
    api/
      controllers/
        __tests__/
          CourseController.test.ts       # API integration tests
    components/
      __tests__/
        LoginPage.test.tsx               # Component tests
        CourseList.test.tsx
```

### File Naming Conventions

- **Unit Tests**: `{ComponentName}.test.ts`
- **Property Tests**: `{ComponentName}.properties.test.ts`
- **Integration Tests**: `{ComponentName}.integration.test.ts`
- **E2E Tests**: `{Feature}.e2e.test.ts`

---

## Integration Testing

### What to Test

- **API Endpoints**: All endpoints with valid and invalid inputs
- **Database Operations**: CRUD operations and constraints
- **File Operations**: Upload, download, deletion
- **Authentication Flow**: Login, session management, logout
- **Authorization Flow**: Role-based access control

### Integration Test Approach

- Use real database (test database or in-memory)
- Use real file storage (temporary directory)
- Test complete request/response cycle
- Verify database state after operations
- Clean up test data after each test

---

## Test Maintenance

### When to Update Tests

- When requirements change
- When bugs are discovered (add regression test)
- When refactoring code (tests should still pass)
- When adding new features

### Test Quality Indicators

✅ **Good Tests**:
- Fast execution (< 1 second per test)
- Deterministic (same result every time)
- Independent (no shared state)
- Readable (clear what is being tested)
- Maintainable (easy to update)

❌ **Bad Tests**:
- Slow execution (> 5 seconds per test)
- Flaky (random failures)
- Dependent on other tests
- Unclear purpose
- Brittle (break on minor changes)

---

## Summary

**Key Takeaways:**

1. **Dual Approach**: Unit tests + Property-based tests (both required)
2. **Layer-Specific**: Different testing strategies for each Clean Architecture layer
3. **Property Tests**: Minimum 100 iterations, tagged with design property
4. **Test Organization**: Co-locate tests with source code
5. **Coverage**: 80% minimum code coverage
6. **Quality**: Fast, deterministic, independent, readable tests

**Remember**: Good tests improve code quality, catch bugs early, and enable confident refactoring. Write tests alongside implementation, not after.
