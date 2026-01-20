/**
 * Dependency Injection Examples
 * 
 * This file demonstrates the different registration patterns and usage
 * of TSyringe in the LMS application. These examples follow Clean Architecture
 * principles and show best practices for dependency injection.
 * 
 * NOTE: This file is for documentation purposes and should not be imported
 * in production code. It serves as a reference for implementing DI patterns.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck - This file is for documentation purposes only

import { container, injectable, inject } from 'tsyringe';

// ========================================
// Example 1: Interface-based Registration (Singleton)
// ========================================

/**
 * Domain Layer - Repository Interface (Port)
 * 
 * Interfaces define contracts in the domain layer.
 * They are framework-independent and represent business concepts.
 */
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

/**
 * Domain Layer - Entity
 */
class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string
  ) {}
}

/**
 * Infrastructure Layer - Repository Implementation (Adapter)
 * 
 * The @injectable() decorator marks this class for dependency injection.
 * This implementation will be registered as a singleton.
 */
@injectable()
class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Implementation would use Prisma client
    return null;
  }

  async save(user: User): Promise<User> {
    // Implementation would use Prisma client
    return user;
  }
}

/**
 * Registration Pattern for Repositories (Singleton)
 * 
 * Repositories are registered as singletons because they:
 * - Share database connection pool
 * - Are stateless (no per-request state)
 * - Can be safely reused across requests
 */
function registerRepositoryExample() {
  container.registerSingleton<IUserRepository>(
    'IUserRepository',  // String token (interfaces don't exist at runtime)
    PrismaUserRepository
  );
}

// ========================================
// Example 2: Use Case Registration (Transient)
// ========================================

/**
 * Application Layer - Use Case
 * 
 * Use cases orchestrate business logic and are created per request.
 * The @inject() decorator specifies which dependencies to inject.
 */
@injectable()
class CreateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async execute(email: string, name: string): Promise<User> {
    const user = new User(
      crypto.randomUUID(),
      email,
      name
    );
    return await this.userRepository.save(user);
  }
}

/**
 * Registration Pattern for Use Cases (Transient)
 * 
 * Use cases are registered as transient because they:
 * - Are stateless (no shared state between requests)
 * - Should be created fresh for each request
 * - May have request-specific context
 */
function registerUseCaseExample() {
  container.register(CreateUserUseCase, {
    useClass: CreateUserUseCase
  });
}

// ========================================
// Example 3: Service Registration (Singleton)
// ========================================

/**
 * Infrastructure Layer - External Service Interface
 */
interface IJWTService {
  generateToken(userId: string): string;
  verifyToken(token: string): { userId: string } | null;
}

/**
 * Infrastructure Layer - Service Implementation
 * 
 * External services are typically singletons.
 */
@injectable()
class JWTService implements IJWTService {
  generateToken(userId: string): string {
    // Implementation would use jsonwebtoken
    return 'token';
  }

  verifyToken(token: string): { userId: string } | null {
    // Implementation would use jsonwebtoken
    return null;
  }
}

/**
 * Registration Pattern for Services (Singleton)
 */
function registerServiceExample() {
  container.registerSingleton<IJWTService>(
    'IJWTService',
    JWTService
  );
}

// ========================================
// Example 4: Controller Registration (Transient)
// ========================================

/**
 * Presentation Layer - Controller
 * 
 * Controllers handle HTTP requests and delegate to use cases.
 */
@injectable()
class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase
  ) {}

  async createUser(req: any, res: any): Promise<void> {
    const { email, name } = req.body;
    const user = await this.createUserUseCase.execute(email, name);
    res.status(201).json(user);
  }
}

/**
 * Registration Pattern for Controllers (Transient)
 */
function registerControllerExample() {
  container.register(UserController, {
    useClass: UserController
  });
}

// ========================================
// Example 5: Resolving Dependencies
// ========================================

/**
 * Manual Resolution (for testing or special cases)
 */
function resolutionExamples() {
  // Resolve by interface token
  const userRepo = container.resolve<IUserRepository>('IUserRepository');
  
  // Resolve by class
  const useCase = container.resolve(CreateUserUseCase);
  
  // Resolve controller (dependencies auto-injected)
  const controller = container.resolve(UserController);
}

// ========================================
// Example 6: Testing with DI
// ========================================

/**
 * Mock Repository for Testing
 */
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }
}

/**
 * Test Setup Example
 */
function testSetupExample() {
  // Create a child container for testing (isolated from main container)
  const testContainer = container.createChildContainer();
  
  // Register mock implementation
  testContainer.registerSingleton<IUserRepository>(
    'IUserRepository',
    MockUserRepository
  );
  
  // Resolve use case with mock repository
  const useCase = testContainer.resolve(CreateUserUseCase);
  
  // Test the use case
  // ...
}

// ========================================
// Example 7: Lifecycle Management
// ========================================

/**
 * Singleton vs Transient Lifecycle
 */
function lifecycleExamples() {
  // Singleton: Same instance returned every time
  container.registerSingleton('IUserRepository', PrismaUserRepository);
  const repo1 = container.resolve<IUserRepository>('IUserRepository');
  const repo2 = container.resolve<IUserRepository>('IUserRepository');
  console.log(repo1 === repo2); // true
  
  // Transient: New instance returned every time
  container.register(CreateUserUseCase, { useClass: CreateUserUseCase });
  const useCase1 = container.resolve(CreateUserUseCase);
  const useCase2 = container.resolve(CreateUserUseCase);
  console.log(useCase1 === useCase2); // false
}

// ========================================
// Example 8: Multiple Implementations
// ========================================

/**
 * Storage Interface with Multiple Implementations
 */
interface IFileStorage {
  upload(file: Buffer, path: string): Promise<string>;
}

@injectable()
class LocalFileStorage implements IFileStorage {
  async upload(file: Buffer, path: string): Promise<string> {
    // Local filesystem implementation
    return path;
  }
}

@injectable()
class S3FileStorage implements IFileStorage {
  async upload(file: Buffer, path: string): Promise<string> {
    // AWS S3 implementation
    return path;
  }
}

/**
 * Conditional Registration Based on Environment
 */
function registerStorageExample() {
  const storageType = process.env.STORAGE_TYPE ?? 'local';
  
  if (storageType === 's3') {
    container.registerSingleton<IFileStorage>(
      'IFileStorage',
      S3FileStorage
    );
  } else {
    container.registerSingleton<IFileStorage>(
      'IFileStorage',
      LocalFileStorage
    );
  }
}

// ========================================
// Best Practices Summary
// ========================================

/**
 * 1. Use @injectable() decorator on all classes that need DI
 * 2. Use @inject() decorator for interface dependencies
 * 3. Register repositories and services as singletons
 * 4. Register use cases and controllers as transient
 * 5. Use string tokens for interfaces (they don't exist at runtime)
 * 6. Use class tokens for concrete classes
 * 7. Create child containers for testing
 * 8. Clear container between tests (container.clearInstances())
 * 9. Configure container once at application startup
 * 10. Resolve dependencies through constructor injection
 */

export {
  // Export examples for documentation purposes
  registerRepositoryExample,
  registerUseCaseExample,
  registerServiceExample,
  registerControllerExample,
  resolutionExamples,
  testSetupExample,
  lifecycleExamples,
  registerStorageExample,
};
