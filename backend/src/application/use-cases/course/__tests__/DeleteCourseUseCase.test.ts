/**
 * DeleteCourseUseCase Unit Tests
 * 
 * Tests the DeleteCourseUseCase with mocked dependencies.
 * Validates business logic, authorization, and error handling.
 * 
 * Requirements:
 * - 5.6: Only archived courses can be deleted
 * - 5.7: Cascade delete all related data
 */

import { DeleteCourseUseCase } from '../DeleteCourseUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { User, Role } from '../../../../domain/entities/User';
import { ApplicationError } from '../../../errors/ApplicationErrors';

// Mock dependencies
const mockCourseRepository: jest.Mocked<ICourseRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByTeacherId: jest.fn(),
  findByCode: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn()
};

const mockUserRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  delete: jest.fn()
};

const mockAuthPolicy: jest.Mocked<IAuthorizationPolicy> = {
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
  canGradeSubmissions: jest.fn(),
  canViewSubmission: jest.fn(),
  canExportGrades: jest.fn(),
  canViewProgress: jest.fn()
};

describe('DeleteCourseUseCase', () => {
  let useCase: DeleteCourseUseCase;
  let mockUser: User;
  let mockArchivedCourse: Course;
  let mockActiveCourse: Course;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new DeleteCourseUseCase(mockCourseRepository, mockUserRepository, mockAuthPolicy);

    // Create mock user (teacher)
    mockUser = User.create({
      id: 'teacher-id',
      email: 'teacher@example.com',
      name: 'Teacher Name',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    // Create mock archived course
    mockArchivedCourse = Course.create({
      id: 'course-id',
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'ABC123',
      status: CourseStatus.ARCHIVED,
      teacherId: 'teacher-id'
    });

    // Create mock active course
    mockActiveCourse = Course.create({
      id: 'active-course-id',
      name: 'Active Course',
      description: 'Active Description',
      courseCode: 'DEF456',
      status: CourseStatus.ACTIVE,
      teacherId: 'teacher-id'
    });

    // Mock user repository to return mock user
    mockUserRepository.findById.mockResolvedValue(mockUser);
  });

  describe('execute', () => {
    it('should delete archived course successfully', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);
      mockCourseRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('course-id', 'teacher-id');

      // Assert
      expect(mockCourseRepository.findById).toHaveBeenCalledWith('course-id');
      expect(mockAuthPolicy.canDeleteCourse).toHaveBeenCalledWith(mockUser, mockArchivedCourse);
      expect(mockCourseRepository.delete).toHaveBeenCalledWith('course-id');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('non-existent-id', 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute('non-existent-id', 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });

      expect(mockCourseRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user is not the course owner', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute('course-id', 'other-teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute('course-id', 'other-teacher-id')
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });

      expect(mockCourseRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ApplicationError when course is active (not archived)', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockActiveCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute('active-course-id', 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute('active-course-id', 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_ACTIVE',
        statusCode: 400,
        message: 'Cannot delete active course. Archive the course first'
      });

      expect(mockCourseRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('course-id', 'non-existent-user')
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute('course-id', 'non-existent-user')
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });

      expect(mockCourseRepository.delete).not.toHaveBeenCalled();
    });

    it('should validate authorization before checking course status', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockActiveCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute('active-course-id', 'other-teacher-id')
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });

      // Should fail on authorization, not on course status
      expect(mockCourseRepository.delete).not.toHaveBeenCalled();
    });

    it('should call repository delete with correct course ID', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);
      mockCourseRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('course-id', 'teacher-id');

      // Assert
      expect(mockCourseRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockCourseRepository.delete).toHaveBeenCalledWith('course-id');
    });

    it('should not return any value on successful deletion', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);
      mockCourseRepository.delete.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute('course-id', 'teacher-id');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('business rules', () => {
    it('should enforce requirement 5.6: only archived courses can be deleted', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockActiveCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute('active-course-id', 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_ACTIVE',
        message: 'Cannot delete active course. Archive the course first'
      });
    });

    it('should enforce requirement 5.7: cascade deletion handled by repository', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);
      mockCourseRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('course-id', 'teacher-id');

      // Assert
      // Repository delete is called, which should handle cascade deletion
      expect(mockCourseRepository.delete).toHaveBeenCalledWith('course-id');
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockReturnValue(true);
      mockCourseRepository.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        useCase.execute('course-id', 'teacher-id')
      ).rejects.toThrow('Database error');
    });

    it('should handle authorization policy errors', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockArchivedCourse);
      mockAuthPolicy.canDeleteCourse.mockImplementation(() => {
        throw new Error('Policy error');
      });

      // Act & Assert
      await expect(
        useCase.execute('course-id', 'teacher-id')
      ).rejects.toThrow('Policy error');
    });
  });
});
