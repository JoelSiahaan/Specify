/**
 * GradeSubmissionUseCase Property-Based Tests
 * 
 * Property-based tests for grading assignment submissions using fast-check.
 * Tests universal properties that should hold for all valid inputs.
 * 
 * Requirements:
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 */

import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { GradeSubmissionUseCase } from '../GradeSubmissionUseCase.js';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository.js';
import { IAssignmentSubmissionRepository } from '../../../../domain/repositories/IAssignmentSubmissionRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment.js';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '../../../../domain/entities/AssignmentSubmission.js';
import { GradeAssignmentSubmissionDTO } from '../../../dtos/AssignmentDTO.js';
import { ApplicationError } from '../../../errors/ApplicationErrors.js';

describe('GradeSubmissionUseCase - Property-Based Tests', () => {
  /**
   * Property 22: Optimistic locking prevents concurrent grading
   * 
   * **Validates: Requirements 21.5**
   * 
   * For any submission, concurrent grading attempts with stale version numbers
   * should be detected and rejected to prevent data corruption.
   * 
   * This property ensures that:
   * 1. Grading with the correct version succeeds
   * 2. Grading with a stale version (version mismatch) fails
   * 3. The error message clearly indicates the conflict
   */
  describe('Property 22: Optimistic locking prevents concurrent grading', () => {
    it('should reject grading attempts with stale version numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // First grade
          fc.integer({ min: 0, max: 100 }), // Second grade (concurrent attempt)
          fc.integer({ min: 0, max: 10 }),  // Initial version
          fc.option(fc.string(), { nil: undefined }), // First feedback
          fc.option(fc.string(), { nil: undefined }), // Second feedback
          async (firstGrade, secondGrade, initialVersion, firstFeedback, secondFeedback) => {
            // Arrange: Create test entities
            const teacherId = randomUUID();
            const studentId = randomUUID();
            const courseId = randomUUID();
            const assignmentId = randomUUID();
            const submissionId = randomUUID();

            const teacher = User.create({
              id: teacherId,
              email: 'teacher@example.com',
              name: 'Test Teacher',
              role: Role.TEACHER,
              passwordHash: 'hashed_password',
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const course = Course.create({
              id: courseId,
              name: 'Test Course',
              description: 'Test Description',
              courseCode: 'TEST123',
              teacherId: teacherId,
              status: CourseStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const assignment = Assignment.create({
              id: assignmentId,
              courseId: courseId,
              title: 'Test Assignment',
              description: 'Test Description',
              dueDate: futureDate,
              submissionType: SubmissionType.TEXT,
              acceptedFileFormats: [],
              gradingStarted: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const submission = AssignmentSubmission.create({
              id: submissionId,
              assignmentId: assignmentId,
              studentId: studentId,
              content: 'Test submission content',
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: initialVersion,
              submittedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Create mocks
            const mockUserRepo = {
              findById: jest.fn().mockResolvedValue(teacher),
              findByEmail: jest.fn(),
              save: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<IUserRepository>;

            const mockSubmissionRepo = {
              findById: jest.fn().mockResolvedValue(submission),
              findByAssignmentAndStudent: jest.fn(),
              findByAssignmentId: jest.fn(),
              findByStudentId: jest.fn(),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(submission),
              delete: jest.fn(),
              countByAssignmentIdAndStatus: jest.fn(),
              findGradedByStudentAndCourse: jest.fn()
            } as jest.Mocked<IAssignmentSubmissionRepository>;

            const mockAssignmentRepo = {
              findById: jest.fn().mockResolvedValue(assignment),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(assignment),
              delete: jest.fn(),
              findByCourseIdWithSubmissionCounts: jest.fn(),
              closeAllByCourseId: jest.fn()
            } as jest.Mocked<IAssignmentRepository>;

            const mockCourseRepo = {
              findById: jest.fn().mockResolvedValue(course),
              findByTeacherId: jest.fn(),
              findByCode: jest.fn(),
              findAll: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<ICourseRepository>;

            const mockAuthPolicy = {
              canAccessCourse: jest.fn(),
              canModifyCourse: jest.fn(),
              canArchiveCourse: jest.fn(),
              canDeleteCourse: jest.fn(),
              canCreateCourse: jest.fn(),
              canEnrollInCourse: jest.fn(),
              canViewMaterials: jest.fn(),
              canManageMaterials: jest.fn(),
              canViewAssignments: jest.fn(),
              canManageAssignments: jest.fn(),
              canSubmitAssignment: jest.fn(),
              canGradeSubmissions: jest.fn().mockReturnValue(true),
              canViewSubmission: jest.fn(),
              canExportGrades: jest.fn(),
              canViewProgress: jest.fn()
            } as jest.Mocked<IAuthorizationPolicy>;

            const useCase = new GradeSubmissionUseCase(
              mockAssignmentRepo,
              mockSubmissionRepo,
              mockCourseRepo,
              mockUserRepo,
              mockAuthPolicy
            );

            // Act: First grading attempt with correct version
            const firstGradeDTO: GradeAssignmentSubmissionDTO = {
              grade: firstGrade,
              feedback: firstFeedback,
              version: initialVersion
            };

            const firstResult = await useCase.execute(firstGradeDTO, submissionId, teacherId);

            // Assert: First grading should succeed
            expect(firstResult.grade).toBe(firstGrade);
            expect(firstResult.version).toBe(initialVersion + 1);

            // Act: Second grading attempt with stale version (concurrent attempt)
            const secondGradeDTO: GradeAssignmentSubmissionDTO = {
              grade: secondGrade,
              feedback: secondFeedback,
              version: initialVersion // Stale version (should be initialVersion + 1)
            };

            // Reset mocks to simulate fresh state
            mockSubmissionRepo.findById.mockResolvedValue(submission);

            // Assert: Second grading with stale version should fail
            await expect(
              useCase.execute(secondGradeDTO, submissionId, teacherId)
            ).rejects.toThrow(ApplicationError);

            await expect(
              useCase.execute(secondGradeDTO, submissionId, teacherId)
            ).rejects.toThrow('This submission has been modified by another user');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow grading with correct version after previous grade', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // First grade
          fc.integer({ min: 0, max: 100 }), // Second grade (valid update)
          fc.integer({ min: 0, max: 10 }),  // Initial version
          async (firstGrade, secondGrade, initialVersion) => {
            // Arrange: Create test entities
            const teacherId = randomUUID();
            const studentId = randomUUID();
            const courseId = randomUUID();
            const assignmentId = randomUUID();
            const submissionId = randomUUID();

            const teacher = User.create({
              id: teacherId,
              email: 'teacher@example.com',
              name: 'Test Teacher',
              role: Role.TEACHER,
              passwordHash: 'hashed_password',
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const course = Course.create({
              id: courseId,
              name: 'Test Course',
              description: 'Test Description',
              courseCode: 'TEST123',
              teacherId: teacherId,
              status: CourseStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const assignment = Assignment.create({
              id: assignmentId,
              courseId: courseId,
              title: 'Test Assignment',
              description: 'Test Description',
              dueDate: futureDate,
              submissionType: SubmissionType.TEXT,
              acceptedFileFormats: [],
              gradingStarted: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const submission = AssignmentSubmission.create({
              id: submissionId,
              assignmentId: assignmentId,
              studentId: studentId,
              content: 'Test submission content',
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: initialVersion,
              submittedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Create mocks
            const mockUserRepo = {
              findById: jest.fn().mockResolvedValue(teacher),
              findByEmail: jest.fn(),
              save: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<IUserRepository>;

            const mockSubmissionRepo = {
              findById: jest.fn().mockResolvedValue(submission),
              findByAssignmentAndStudent: jest.fn(),
              findByAssignmentId: jest.fn(),
              findByStudentId: jest.fn(),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(submission),
              delete: jest.fn(),
              countByAssignmentIdAndStatus: jest.fn(),
              findGradedByStudentAndCourse: jest.fn()
            } as jest.Mocked<IAssignmentRepository>;

            const mockAssignmentRepo = {
              findById: jest.fn().mockResolvedValue(assignment),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(assignment),
              delete: jest.fn(),
              findByCourseIdWithSubmissionCounts: jest.fn(),
              closeAllByCourseId: jest.fn()
            } as jest.Mocked<IAssignmentRepository>;

            const mockCourseRepo = {
              findById: jest.fn().mockResolvedValue(course),
              findByTeacherId: jest.fn(),
              findByCode: jest.fn(),
              findAll: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<ICourseRepository>;

            const mockAuthPolicy = {
              canAccessCourse: jest.fn(),
              canModifyCourse: jest.fn(),
              canArchiveCourse: jest.fn(),
              canDeleteCourse: jest.fn(),
              canCreateCourse: jest.fn(),
              canEnrollInCourse: jest.fn(),
              canViewMaterials: jest.fn(),
              canManageMaterials: jest.fn(),
              canViewAssignments: jest.fn(),
              canManageAssignments: jest.fn(),
              canSubmitAssignment: jest.fn(),
              canGradeSubmissions: jest.fn().mockReturnValue(true),
              canViewSubmission: jest.fn(),
              canExportGrades: jest.fn(),
              canViewProgress: jest.fn()
            } as jest.Mocked<IAuthorizationPolicy>;

            const useCase = new GradeSubmissionUseCase(
              mockAssignmentRepo,
              mockSubmissionRepo,
              mockCourseRepo,
              mockUserRepo,
              mockAuthPolicy
            );

            // Act: First grading attempt
            const firstGradeDTO: GradeAssignmentSubmissionDTO = {
              grade: firstGrade,
              version: initialVersion
            };

            const firstResult = await useCase.execute(firstGradeDTO, submissionId, teacherId);

            // Assert: First grading should succeed
            expect(firstResult.grade).toBe(firstGrade);
            expect(firstResult.version).toBe(initialVersion + 1);

            // Act: Second grading attempt with correct version (valid update)
            const secondGradeDTO: GradeAssignmentSubmissionDTO = {
              grade: secondGrade,
              version: initialVersion + 1 // Correct version
            };

            // Reset mocks to simulate fresh state
            mockSubmissionRepo.findById.mockResolvedValue(submission);

            const secondResult = await useCase.execute(secondGradeDTO, submissionId, teacherId);

            // Assert: Second grading with correct version should succeed
            expect(secondResult.grade).toBe(secondGrade);
            expect(secondResult.version).toBe(initialVersion + 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment version number on each successful grade', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }), // Multiple grades
          fc.integer({ min: 0, max: 10 }), // Initial version
          async (grades, initialVersion) => {
            // Arrange: Create test entities
            const teacherId = randomUUID();
            const studentId = randomUUID();
            const courseId = randomUUID();
            const assignmentId = randomUUID();
            const submissionId = randomUUID();

            const teacher = User.create({
              id: teacherId,
              email: 'teacher@example.com',
              name: 'Test Teacher',
              role: Role.TEACHER,
              passwordHash: 'hashed_password',
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const course = Course.create({
              id: courseId,
              name: 'Test Course',
              description: 'Test Description',
              courseCode: 'TEST123',
              teacherId: teacherId,
              status: CourseStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const assignment = Assignment.create({
              id: assignmentId,
              courseId: courseId,
              title: 'Test Assignment',
              description: 'Test Description',
              dueDate: futureDate,
              submissionType: SubmissionType.TEXT,
              acceptedFileFormats: [],
              gradingStarted: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const submission = AssignmentSubmission.create({
              id: submissionId,
              assignmentId: assignmentId,
              studentId: studentId,
              content: 'Test submission content',
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: initialVersion,
              submittedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Create mocks
            const mockUserRepo = {
              findById: jest.fn().mockResolvedValue(teacher),
              findByEmail: jest.fn(),
              save: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<IUserRepository>;

            const mockSubmissionRepo = {
              findById: jest.fn().mockResolvedValue(submission),
              findByAssignmentAndStudent: jest.fn(),
              findByAssignmentId: jest.fn(),
              findByStudentId: jest.fn(),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(submission),
              delete: jest.fn(),
              countByAssignmentIdAndStatus: jest.fn(),
              findGradedByStudentAndCourse: jest.fn()
            } as jest.Mocked<IAssignmentSubmissionRepository>;

            const mockAssignmentRepo = {
              findById: jest.fn().mockResolvedValue(assignment),
              findByCourseId: jest.fn(),
              save: jest.fn(),
              update: jest.fn().mockResolvedValue(assignment),
              delete: jest.fn(),
              findByCourseIdWithSubmissionCounts: jest.fn(),
              closeAllByCourseId: jest.fn()
            } as jest.Mocked<IAssignmentRepository>;

            const mockCourseRepo = {
              findById: jest.fn().mockResolvedValue(course),
              findByTeacherId: jest.fn(),
              findByCode: jest.fn(),
              findAll: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            } as jest.Mocked<ICourseRepository>;

            const mockAuthPolicy = {
              canAccessCourse: jest.fn(),
              canModifyCourse: jest.fn(),
              canArchiveCourse: jest.fn(),
              canDeleteCourse: jest.fn(),
              canCreateCourse: jest.fn(),
              canEnrollInCourse: jest.fn(),
              canViewMaterials: jest.fn(),
              canManageMaterials: jest.fn(),
              canViewAssignments: jest.fn(),
              canManageAssignments: jest.fn(),
              canSubmitAssignment: jest.fn(),
              canGradeSubmissions: jest.fn().mockReturnValue(true),
              canViewSubmission: jest.fn(),
              canExportGrades: jest.fn(),
              canViewProgress: jest.fn()
            } as jest.Mocked<IAuthorizationPolicy>;

            const useCase = new GradeSubmissionUseCase(
              mockAssignmentRepo,
              mockSubmissionRepo,
              mockCourseRepo,
              mockUserRepo,
              mockAuthPolicy
            );

            // Act & Assert: Grade multiple times with correct versions
            let currentVersion = initialVersion;
            for (const grade of grades) {
              const gradeDTO: GradeAssignmentSubmissionDTO = {
                grade,
                version: currentVersion
              };

              // Reset mocks
              mockSubmissionRepo.findById.mockResolvedValue(submission);

              const result = await useCase.execute(gradeDTO, submissionId, teacherId);

              // Assert: Version should increment
              expect(result.version).toBe(currentVersion + 1);
              currentVersion = result.version;
            }

            // Final version should be initial + number of grades
            expect(currentVersion).toBe(initialVersion + grades.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
