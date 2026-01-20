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
import { PrismaClient } from '@prisma/client';
import { prisma } from '../persistence/prisma/client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PrismaUserRepository } from '../persistence/repositories/PrismaUserRepository';
import { JWTService } from '../auth/JWTService';
import { PasswordService } from '../auth/PasswordService';

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
  
  // Register Prisma Client as singleton
  container.registerInstance(PrismaClient, prisma);
  
  // ========================================
  // Infrastructure Layer - Repositories
  // ========================================
  
  // Register User Repository
  container.registerSingleton<IUserRepository>(
    'IUserRepository',
    PrismaUserRepository
  );
  
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
  // Example pattern (to be implemented in future tasks):
  // container.register(CreateCourseUseCase, {
  //   useClass: CreateCourseUseCase
  // });
  
  // ========================================
  // Application Layer - Policies
  // ========================================
  
  // Authorization policies are registered as singletons (stateless, reusable)
  // Example pattern (to be implemented in future tasks):
  // container.registerSingleton<IAuthorizationPolicy>(
  //   'IAuthorizationPolicy',
  //   AuthorizationPolicy
  // );
  
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
