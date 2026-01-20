# Dependency Injection with TSyringe

This directory contains the dependency injection configuration for the LMS backend using TSyringe.

## Overview

TSyringe is a lightweight dependency injection container for TypeScript that supports:
- Constructor injection
- Interface-based programming
- Singleton and transient lifecycles
- Decorator-based configuration

## Files

- **container.ts**: Main DI container configuration
- **index.ts**: Public exports for the DI module
- **examples.ts**: Comprehensive examples of DI patterns (documentation only)
- **README.md**: This file

## Quick Start

### 1. Mark Classes as Injectable

Use the `@injectable()` decorator on classes that need dependency injection:

```typescript
import { injectable } from 'tsyringe';

@injectable()
class PrismaUserRepository implements IUserRepository {
  // Implementation
}
```

### 2. Inject Dependencies

Use the `@inject()` decorator for interface dependencies:

```typescript
import { injectable, inject } from 'tsyringe';

@injectable()
class CreateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}
}
```

For concrete class dependencies, no decorator is needed:

```typescript
@injectable()
class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase  // No @inject needed
  ) {}
}
```

### 3. Register Dependencies

In `container.ts`, register your dependencies:

```typescript
// Singleton (shared instance)
container.registerSingleton<IUserRepository>(
  'IUserRepository',
  PrismaUserRepository
);

// Transient (new instance per request)
container.register(CreateUserUseCase, {
  useClass: CreateUserUseCase
});
```

### 4. Resolve Dependencies

```typescript
import { resolve } from './infrastructure/di';

// Resolve by interface token
const userRepo = resolve<IUserRepository>('IUserRepository');

// Resolve by class
const useCase = resolve(CreateUserUseCase);
```

## Lifecycle Management

### Singleton

Use for:
- Repositories (share database connection pool)
- External services (JWT, password hashing)
- File storage implementations
- Stateless services

```typescript
container.registerSingleton<IUserRepository>(
  'IUserRepository',
  PrismaUserRepository
);
```

### Transient

Use for:
- Use cases (stateless, created per request)
- Controllers (created per request)
- Request-specific services

```typescript
container.register(CreateUserUseCase, {
  useClass: CreateUserUseCase
});
```

## Testing

### Create Child Container

For isolated testing:

```typescript
import { container } from 'tsyringe';

describe('CreateUserUseCase', () => {
  let testContainer: DependencyContainer;
  
  beforeEach(() => {
    testContainer = container.createChildContainer();
    
    // Register mocks
    testContainer.registerSingleton<IUserRepository>(
      'IUserRepository',
      MockUserRepository
    );
  });
  
  it('should create user', async () => {
    const useCase = testContainer.resolve(CreateUserUseCase);
    // Test implementation
  });
});
```

### Reset Container

Clear all instances between tests:

```typescript
import { resetContainer } from './infrastructure/di';

afterEach(() => {
  resetContainer();
});
```

## Registration Patterns

### Pattern 1: Interface-based (Repositories)

```typescript
// Domain layer - Interface
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// Infrastructure layer - Implementation
@injectable()
class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Prisma implementation
  }
}

// Registration
container.registerSingleton<IUserRepository>(
  'IUserRepository',
  PrismaUserRepository
);
```

### Pattern 2: Concrete Class (Use Cases)

```typescript
@injectable()
class CreateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}
}

// Registration
container.register(CreateUserUseCase, {
  useClass: CreateUserUseCase
});
```

### Pattern 3: Conditional Registration

```typescript
const storageType = process.env.STORAGE_TYPE ?? 'local';

if (storageType === 's3') {
  container.registerSingleton<IFileStorage>('IFileStorage', S3FileStorage);
} else {
  container.registerSingleton<IFileStorage>('IFileStorage', LocalFileStorage);
}
```

## Best Practices

1. **Use @injectable() on all DI classes**: Mark classes that need dependency injection
2. **Use @inject() for interfaces**: Interfaces need string tokens
3. **Singleton for stateless services**: Repositories, external services
4. **Transient for request-scoped**: Use cases, controllers
5. **String tokens for interfaces**: TypeScript interfaces don't exist at runtime
6. **Class tokens for concrete classes**: No string token needed
7. **Child containers for testing**: Isolate test dependencies
8. **Configure once at startup**: Call `configureContainer()` in main.ts
9. **Constructor injection only**: Avoid property injection
10. **Clear documentation**: Comment registration purpose

## Common Issues

### Issue 1: "Cannot resolve dependency"

**Cause**: Dependency not registered or wrong token used

**Solution**: Ensure dependency is registered in `container.ts` with correct token

### Issue 2: "Circular dependency detected"

**Cause**: Two classes depend on each other

**Solution**: Refactor to break circular dependency (use events, interfaces, or mediator pattern)

### Issue 3: "reflect-metadata not imported"

**Cause**: Missing `import 'reflect-metadata'` at application entry point

**Solution**: Add `import 'reflect-metadata'` as first line in `main.ts`

### Issue 4: "Singleton returns different instances"

**Cause**: Using `register()` instead of `registerSingleton()`

**Solution**: Use `registerSingleton()` for shared instances

## Architecture Integration

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│ Presentation Layer (Controllers)        │
│ - Transient registration                │
└──────────────┬──────────────────────────┘
               │ depends on
┌──────────────▼──────────────────────────┐
│ Application Layer (Use Cases)           │
│ - Transient registration                │
└──────────────┬──────────────────────────┘
               │ depends on
┌──────────────▼──────────────────────────┐
│ Domain Layer (Entities, Interfaces)     │
│ - No DI registration (pure domain)      │
└──────────────┬──────────────────────────┘
               │ implemented by
┌──────────────▼──────────────────────────┐
│ Infrastructure Layer (Repositories)     │
│ - Singleton registration                │
└─────────────────────────────────────────┘
```

### Dependency Flow

1. **Infrastructure** implements **Domain** interfaces
2. **Application** depends on **Domain** interfaces
3. **Presentation** depends on **Application** use cases
4. **DI Container** wires everything together

## References

- [TSyringe Documentation](https://github.com/microsoft/tsyringe)
- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## Next Steps

As you implement features, add registrations to `container.ts`:

1. **Authentication Feature**: Register `IUserRepository`, `IJWTService`, `IPasswordService`
2. **Course Feature**: Register `ICourseRepository`, `CreateCourseUseCase`, `CourseController`
3. **Assignment Feature**: Register `IAssignmentRepository`, `SubmitAssignmentUseCase`
4. **Quiz Feature**: Register `IQuizRepository`, `StartQuizUseCase`
5. **Grading Feature**: Register `GradeSubmissionUseCase`

See `examples.ts` for detailed implementation patterns.
