/**
 * Dependency Injection Container Configuration
 * 
 * This file configures TSyringe for dependency injection across the application.
 * It follows Clean Architecture principles with clear separation of concerns.
 * 
 * Lifecycle Management:
 * - Singleton: Repositories, database connections, external services (shared state)
 * - Transient: Use cases, controllers (stateless, created per request)
 * 
 * Registration Pattern:
 * 1. Register interface → implementation bindings
 * 2. Use string tokens for interfaces (TypeScript interfaces don't exist at runtime)
 * 3. Register concrete classes directly (no token needed)
 */

import { container } from 'tsyringe';
import { prisma } from '../persistence/prisma/client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PrismaUserRepository } from '../persistence/repositories/PrismaUserRepository';
import { ICourseRepository } from '../../domain/repositories/ICourseRepository';
import { PrismaCourseRepository } from '../persistence/repositories/PrismaCourseRepository';
import { JWTService } from '../auth/JWTService';
import { PasswordService } from '../auth/PasswordService';
import { RegisterUserUseCase } from '../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/auth/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/auth/LogoutUserUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/GetCurrentUserUseCase';
import { IAuthorizationPolicy } from '../../application/policies/IAuthorizationPolicy';
import { AuthorizationPolicy } from '../../application/policies/AuthorizationPolicy';
import { CreateCourseUseCase } from '../../application/use-cases/course/CreateCourseUseCase';
import { UpdateCourseUseCase } from '../../application/use-cases/course/UpdateCourseUseCase';
import { ArchiveCourseUseCase } from '../../application/use-cases/course/ArchiveCourseUseCase';
import { DeleteCourseUseCase } from '../../application/use-cases/course/DeleteCourseUseCase';
import { ListCoursesUseCase } from '../../application/use-cases/course/ListCoursesUseCase';

/**
 * Initialize the DI container with all application dependencies
 * 
 * This function should be called once at application startup (in main.ts)
 * before any other code that depends on the container.
 * 
 * Registration Order:
 * 1. Infrastructure Layer (repositories, external services)
 * 2. Application Layer (use cases, policies)
 * 3. Presentation Layer (controllers)
 */
export function configureContainer(): void {
  // ========================================
  // Infrastructure Layer - Database
  // ========================================
  
  // Register Prisma Client instance as singleton
  container.registerInstance('PrismaClient', prisma);
  
  // ========================================
  // Infrastructure Layer - Repositories
  // ========================================
  
  // Register User Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IUserRepository>('IUserRepository', PrismaUserRepository);
  
  // Register Course Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<ICourseRepository>('ICourseRepository', PrismaCourseRepository);
  
  // Repository implementations will be registered here as they are created
  // Example pattern (to be implemented in future tasks):
  // container.registerSingleton<ICourseRepository>(
  //   'ICourseRepository',
  //   PrismaCourseRepository
  // );
  
  // ========================================
  // Infrastructure Layer - External Services
  // ========================================
  
  // Register JWT Service as singleton
  container.registerSingleton(JWTService);
  
  // Register Password Service as singleton
  container.registerSingleton(PasswordService);
  
  // ========================================
  // Infrastructure Layer - Storage
  // ========================================
  
  // File storage implementations will be registered here
  // Example pattern (to be implemented in future tasks):
  // container.registerSingleton<IFileStorage>(
  //   'IFileStorage',
  //   LocalFileStorage
  // );
  
  // ========================================
  // Application Layer - Use Cases
  // ========================================
  
  // Use cases are registered as transient (stateless, created per request)
  
  // Register RegisterUserUseCase as transient
  container.register(RegisterUserUseCase, {
    useClass: RegisterUserUseCase
  });
  
  // Register LoginUserUseCase as transient
  container.register(LoginUserUseCase, {
    useClass: LoginUserUseCase
  });
  
  // Register RefreshTokenUseCase as transient
  container.register(RefreshTokenUseCase, {
    useClass: RefreshTokenUseCase
  });
  
  // Register LogoutUserUseCase as transient
  container.register(LogoutUserUseCase, {
    useClass: LogoutUserUseCase
  });
  
  // Register GetCurrentUserUseCase as transient
  container.register(GetCurrentUserUseCase, {
    useClass: GetCurrentUserUseCase
  });
  
  // Register CreateCourseUseCase as transient
  container.register(CreateCourseUseCase, {
    useClass: CreateCourseUseCase
  });
  
  // Register UpdateCourseUseCase as transient
  console.log('[DI] Registering UpdateCourseUseCase');
  container.register(UpdateCourseUseCase, {
    useClass: UpdateCourseUseCase
  });
  console.log('[DI] UpdateCourseUseCase registered');
  
  // Register ArchiveCourseUseCase as transient
  console.log('[DI] Registering ArchiveCourseUseCase');
  container.register(ArchiveCourseUseCase, {
    useClass: ArchiveCourseUseCase
  });
  console.log('[DI] ArchiveCourseUseCase registered');
  
  // Register DeleteCourseUseCase as transient
  console.log('[DI] Registering DeleteCourseUseCase');
  container.register(DeleteCourseUseCase, {
    useClass: DeleteCourseUseCase
  });
  console.log('[DI] DeleteCourseUseCase registered');
  
  // Register ListCoursesUseCase as transient
  console.log('[DI] Registering ListCoursesUseCase');
  container.register(ListCoursesUseCase, {
    useClass: ListCoursesUseCase
  });
  console.log('[DI] ListCoursesUseCase registered');
  
  // Example pattern (to be implemented in future tasks):
  // container.register(CreateCourseUseCase, {
  //   useClass: CreateCourseUseCase
  // });
  
  // ========================================
  // Application Layer - Policies
  // ========================================
  
  // Authorization policies are registered as singletons (stateless, reusable)
  console.log('[DI] Registering AuthorizationPolicy');
  container.registerSingleton<IAuthorizationPolicy>(
    'IAuthorizationPolicy',
    AuthorizationPolicy
  );
  console.log('[DI] IAuthorizationPolicy registered');
  
  // ========================================
  // Presentation Layer - Controllers
  // ========================================
  
  // Controllers are registered as transient (created per request)
  // Example pattern (to be implemented in future tasks):
  // container.register(AuthController, {
  //   useClass: AuthController
  // });
}

/**
 * Reset the container (useful for testing)
 * 
 * This clears all registrations and allows for fresh container setup.
 * Should only be used in test environments.
 */
export function resetContainer(): void {
  container.clearInstances();
}

/**
 * Get the configured container instance
 * 
 * @returns The TSyringe container instance
 */
export function getContainer() {
  return container;
}

/**
 * Resolve a dependency from the container
 * 
 * @param token - The token (string or class) to resolve
 * @returns The resolved instance
 * 
 * @example
 * // Resolve by interface token
 * const courseRepo = resolve<ICourseRepository>('ICourseRepository');
 * 
 * @example
 * // Resolve by class
 * const useCase = resolve(CreateCourseUseCase);
 */
export function resolve<T>(token: string | { new (...args: any[]): T }): T {
  return container.resolve(token as any);
}
