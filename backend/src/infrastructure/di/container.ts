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
import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { PrismaMaterialRepository } from '../persistence/repositories/PrismaMaterialRepository';
import { IFileStorage } from '../../domain/storage/IFileStorage';
import { LocalFileStorage } from '../storage/LocalFileStorage';
import { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository';
import { PrismaEnrollmentRepository } from '../persistence/repositories/PrismaEnrollmentRepository';
import { IQuizRepository } from '../../domain/repositories/IQuizRepository';
import { PrismaQuizRepository } from '../persistence/repositories/PrismaQuizRepository';
import { IQuizSubmissionRepository } from '../../domain/repositories/IQuizSubmissionRepository';
import { PrismaQuizSubmissionRepository } from '../persistence/repositories/PrismaQuizSubmissionRepository';
import { IAssignmentRepository } from '../../domain/repositories/IAssignmentRepository';
import { PrismaAssignmentRepository } from '../persistence/repositories/PrismaAssignmentRepository';
import { ISubmissionRepository } from '../../domain/repositories/ISubmissionRepository';
import { PrismaSubmissionRepository } from '../persistence/repositories/PrismaSubmissionRepository';
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
import { CreateMaterialUseCase } from '../../application/use-cases/material/CreateMaterialUseCase';
import { UpdateMaterialUseCase } from '../../application/use-cases/material/UpdateMaterialUseCase';
import { DeleteMaterialUseCase } from '../../application/use-cases/material/DeleteMaterialUseCase';
import { ListMaterialsUseCase } from '../../application/use-cases/material/ListMaterialsUseCase';
import { DownloadMaterialUseCase } from '../../application/use-cases/material/DownloadMaterialUseCase';
import { SearchCoursesUseCase } from '../../application/use-cases/course/SearchCoursesUseCase';
import { EnrollStudentUseCase } from '../../application/use-cases/enrollment/EnrollStudentUseCase';
import { BulkUnenrollUseCase } from '../../application/use-cases/enrollment/BulkUnenrollUseCase';
import { CreateQuizUseCase } from '../../application/use-cases/quiz/CreateQuizUseCase';
import { UpdateQuizUseCase } from '../../application/use-cases/quiz/UpdateQuizUseCase';
import { DeleteQuizUseCase } from '../../application/use-cases/quiz/DeleteQuizUseCase';
import { ListQuizzesUseCase } from '../../application/use-cases/quiz/ListQuizzesUseCase';
import { StartQuizUseCase } from '../../application/use-cases/quiz/StartQuizUseCase';
import { AutoSaveQuizAnswersUseCase } from '../../application/use-cases/quiz/AutoSaveQuizAnswersUseCase';
import { SubmitQuizUseCase } from '../../application/use-cases/quiz/SubmitQuizUseCase';
import { CreateAssignmentUseCase } from '../../application/use-cases/assignment/CreateAssignmentUseCase';
import { UpdateAssignmentUseCase } from '../../application/use-cases/assignment/UpdateAssignmentUseCase';
import { DeleteAssignmentUseCase } from '../../application/use-cases/assignment/DeleteAssignmentUseCase';
import { ListAssignmentsUseCase } from '../../application/use-cases/assignment/ListAssignmentsUseCase';
import { SubmitAssignmentUseCase } from '../../application/use-cases/assignment/SubmitAssignmentUseCase';
import { GetSubmissionUseCase } from '../../application/use-cases/assignment/GetSubmissionUseCase';
import { GetMySubmissionUseCase } from '../../application/use-cases/assignment/GetMySubmissionUseCase';
import { ListSubmissionsUseCase } from '../../application/use-cases/assignment/ListSubmissionsUseCase';

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
  
  // Register Material Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IMaterialRepository>('IMaterialRepository', PrismaMaterialRepository);
  // Register Enrollment Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IEnrollmentRepository>('IEnrollmentRepository', PrismaEnrollmentRepository);
  
  // Register Quiz Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IQuizRepository>('IQuizRepository', PrismaQuizRepository);
  
  // Register QuizSubmission Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IQuizSubmissionRepository>('IQuizSubmissionRepository', PrismaQuizSubmissionRepository);
  // Register Assignment Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<IAssignmentRepository>('IAssignmentRepository', PrismaAssignmentRepository);
  
  // Register Submission Repository as singleton (TSyringe will auto-inject PrismaClient)
  container.registerSingleton<ISubmissionRepository>('ISubmissionRepository', PrismaSubmissionRepository);
  
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
  
  // Register LocalFileStorage as singleton (file storage service)
  container.registerSingleton<IFileStorage>('IFileStorage', LocalFileStorage);
  
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
  
  // Register CreateMaterialUseCase as transient
  console.log('[DI] Registering CreateMaterialUseCase');
  container.register(CreateMaterialUseCase, {
    useClass: CreateMaterialUseCase
  });
  console.log('[DI] CreateMaterialUseCase registered');
  
  // Register UpdateMaterialUseCase as transient
  console.log('[DI] Registering UpdateMaterialUseCase');
  container.register(UpdateMaterialUseCase, {
    useClass: UpdateMaterialUseCase
  });
  console.log('[DI] UpdateMaterialUseCase registered');
  
  // Register DeleteMaterialUseCase as transient
  console.log('[DI] Registering DeleteMaterialUseCase');
  container.register(DeleteMaterialUseCase, {
    useClass: DeleteMaterialUseCase
  });
  console.log('[DI] DeleteMaterialUseCase registered');
  
  // Register ListMaterialsUseCase as transient
  console.log('[DI] Registering ListMaterialsUseCase');
  container.register(ListMaterialsUseCase, {
    useClass: ListMaterialsUseCase
  });
  console.log('[DI] ListMaterialsUseCase registered');
  
  // Register DownloadMaterialUseCase as transient
  console.log('[DI] Registering DownloadMaterialUseCase');
  container.register(DownloadMaterialUseCase, {
    useClass: DownloadMaterialUseCase
  });
  console.log('[DI] DownloadMaterialUseCase registered');
  // Register SearchCoursesUseCase as transient
  console.log('[DI] Registering SearchCoursesUseCase');
  container.register(SearchCoursesUseCase, {
    useClass: SearchCoursesUseCase
  });
  console.log('[DI] SearchCoursesUseCase registered');
  
  // Register EnrollStudentUseCase as transient
  console.log('[DI] Registering EnrollStudentUseCase');
  container.register(EnrollStudentUseCase, {
    useClass: EnrollStudentUseCase
  });
  console.log('[DI] EnrollStudentUseCase registered');
  
  // Register BulkUnenrollUseCase as transient
  console.log('[DI] Registering BulkUnenrollUseCase');
  container.register(BulkUnenrollUseCase, {
    useClass: BulkUnenrollUseCase
  });
  console.log('[DI] BulkUnenrollUseCase registered');
  
  // Register CreateQuizUseCase as transient
  console.log('[DI] Registering CreateQuizUseCase');
  container.register(CreateQuizUseCase, {
    useClass: CreateQuizUseCase
  });
  console.log('[DI] CreateQuizUseCase registered');
  
  // Register UpdateQuizUseCase as transient
  console.log('[DI] Registering UpdateQuizUseCase');
  container.register(UpdateQuizUseCase, {
    useClass: UpdateQuizUseCase
  });
  console.log('[DI] UpdateQuizUseCase registered');
  
  // Register DeleteQuizUseCase as transient
  console.log('[DI] Registering DeleteQuizUseCase');
  container.register(DeleteQuizUseCase, {
    useClass: DeleteQuizUseCase
  });
  console.log('[DI] DeleteQuizUseCase registered');
  
  // Register ListQuizzesUseCase as transient
  console.log('[DI] Registering ListQuizzesUseCase');
  container.register(ListQuizzesUseCase, {
    useClass: ListQuizzesUseCase
  });
  console.log('[DI] ListQuizzesUseCase registered');
  
  // Register StartQuizUseCase as transient
  console.log('[DI] Registering StartQuizUseCase');
  container.register(StartQuizUseCase, {
    useClass: StartQuizUseCase
  });
  console.log('[DI] StartQuizUseCase registered');
  
  // Register AutoSaveQuizAnswersUseCase as transient
  console.log('[DI] Registering AutoSaveQuizAnswersUseCase');
  container.register(AutoSaveQuizAnswersUseCase, {
    useClass: AutoSaveQuizAnswersUseCase
  });
  console.log('[DI] AutoSaveQuizAnswersUseCase registered');
  
  // Register SubmitQuizUseCase as transient
  console.log('[DI] Registering SubmitQuizUseCase');
  container.register(SubmitQuizUseCase, {
    useClass: SubmitQuizUseCase
  });
  console.log('[DI] SubmitQuizUseCase registered');
  // Register CreateAssignmentUseCase as transient
  console.log('[DI] Registering CreateAssignmentUseCase');
  container.register(CreateAssignmentUseCase, {
    useClass: CreateAssignmentUseCase
  });
  console.log('[DI] CreateAssignmentUseCase registered');
  
  // Register UpdateAssignmentUseCase as transient
  console.log('[DI] Registering UpdateAssignmentUseCase');
  container.register(UpdateAssignmentUseCase, {
    useClass: UpdateAssignmentUseCase
  });
  console.log('[DI] UpdateAssignmentUseCase registered');
  
  // Register DeleteAssignmentUseCase as transient
  console.log('[DI] Registering DeleteAssignmentUseCase');
  container.register(DeleteAssignmentUseCase, {
    useClass: DeleteAssignmentUseCase
  });
  console.log('[DI] DeleteAssignmentUseCase registered');
  
  // Register ListAssignmentsUseCase as transient
  console.log('[DI] Registering ListAssignmentsUseCase');
  container.register(ListAssignmentsUseCase, {
    useClass: ListAssignmentsUseCase
  });
  console.log('[DI] ListAssignmentsUseCase registered');
  
  // Register SubmitAssignmentUseCase as transient
  console.log('[DI] Registering SubmitAssignmentUseCase');
  container.register(SubmitAssignmentUseCase, {
    useClass: SubmitAssignmentUseCase
  });
  console.log('[DI] SubmitAssignmentUseCase registered');
  
  // Register GetSubmissionUseCase as transient
  console.log('[DI] Registering GetSubmissionUseCase');
  container.register(GetSubmissionUseCase, {
    useClass: GetSubmissionUseCase
  });
  console.log('[DI] GetSubmissionUseCase registered');
  
  // Register GetMySubmissionUseCase as transient
  console.log('[DI] Registering GetMySubmissionUseCase');
  container.register(GetMySubmissionUseCase, {
    useClass: GetMySubmissionUseCase
  });
  console.log('[DI] GetMySubmissionUseCase registered');
  
  // Register ListSubmissionsUseCase as transient
  console.log('[DI] Registering ListSubmissionsUseCase');
  container.register(ListSubmissionsUseCase, {
    useClass: ListSubmissionsUseCase
  });
  console.log('[DI] ListSubmissionsUseCase registered');
  
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
