/**
 * ArchiveCourseUseCase Unit Tests
 * 
 * Tests the archive course use case with various scenarios including
 * valid course archiving, authorization checks, and validation errors.
 * 
 * Requirements:
 * - 5.4: Archive course (hide from active lists, prevent new enrollments)
 * - 5.5: Automatically close all open assignments and quizzes
 */

import { ArchiveCourseUseCase } from '../ArchiveCourseUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { ApplicationError } from '../../../errors/ApplicationErrors';

// Mock tsyringe container
jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => (target: any, propertyKey: string, parameterIndex: number) => {},
  container: {
    resolve: jest.fn()
  }
}));

describe('ArchiveCourseUseCase', () => {
  let archiveCourseUseCase: ArchiveCourseUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;
  let mockTeacher: User;
  let mockOtherTeacher: User;
  let mockCourse: Course;

  beforeEach(() => {
    // Create mock repository
    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByTeacherId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ICourseRepository>;

    // Create mock authorization policy
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

    // Create mock users
    mockTeacher = User.create({
      id: 'teacher-id',
      email: 'teacher@example.com',
      name: 'Teacher User',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    mockOtherTeacher = User.create({
      id: 'other-teacher-id',
      email: 'other@example.com',
      name: 'Other Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    // Create mock course
    mockCourse = Course.create({
      id: 'course-id',
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: 'teacher-id'
    });

    // Mock container.resolve to return mock user repository
    const { container } = require('tsyringe');
    container.resolve.mockImplementation((token: string) => {
      if (token === 'IUserRepository') {
        return {
          findById: jest.fn().mockResolvedValue(mockTeacher)
        };
      }
      return null;
    });

    // Create use case with mocks
    archiveCourseUseCase = new ArchiveCourseUseCase(
      mockCourseRepository,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    it('should successfully archive course', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canArchiveCourse.mockReturnValue(true);
      
      const archivedCourse = Course.create({
        id: 'course-id',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ARCHIVED,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.update.mockResolvedValue(archivedCourse);

      // Act
      const result = await archiveCourseUseCase.execute('course-id', 'teacher-id');

      // Assert
      expect(mockCourseRepository.findById).toHaveBeenCalledWith('course-id');
      expect(mockAuthPolicy.canArchiveCourse).toHaveBeenCalledWith(mockTeacher, mockCourse);
      expect(mockCourseRepository.update).toHaveBeenCalled();
      expect(result.status).toBe(CourseStatus.ARCHIVED);
    });

    it('should throw error if course not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        archiveCourseUseCase.execute('course-id', 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        archiveCourseUseCase.execute('course-id', 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is not the course owner', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canArchiveCourse.mockReturnValue(false);

      // Act & Assert
      await expect(
        archiveCourseUseCase.execute('course-id', 'other-teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        archiveCourseUseCase.execute('course-id', 'other-teacher-id')
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if course is already archived', async () => {
      // Arrange
      const archivedCourse = Course.create({
        id: 'course-id',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ARCHIVED,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.findById.mockResolvedValue(archivedCourse);
      mockAuthPolicy.canArchiveCourse.mockReturnValue(true);

      // Act & Assert
      await expect(
        archiveCourseUseCase.execute('course-id', 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        archiveCourseUseCase.execute('course-id', 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_ARCHIVED',
        message: 'Course is already archived',
        statusCode: 400
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should update course status to ARCHIVED', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canArchiveCourse.mockReturnValue(true);
      
      // Capture the course passed to update
      let updatedCourse: Course | null = null;
      mockCourseRepository.update.mockImplementation(async (course: Course) => {
        updatedCourse = course;
        return course;
      });

      // Act
      await archiveCourseUseCase.execute('course-id', 'teacher-id');

      // Assert
      expect(updatedCourse).not.toBeNull();
      expect(updatedCourse!.getStatus()).toBe(CourseStatus.ARCHIVED);
      expect(updatedCourse!.isArchived()).toBe(true);
      expect(updatedCourse!.isActive()).toBe(false);
    });
  });
});
