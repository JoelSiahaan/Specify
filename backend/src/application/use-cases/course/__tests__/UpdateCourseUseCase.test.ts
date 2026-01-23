/**
 * UpdateCourseUseCase Unit Tests
 * 
 * Tests the update course use case with various scenarios including
 * valid course updates, authorization checks, and validation errors.
 * 
 * Requirements:
 * - 5.3: Update course details (name and description)
 */

import { UpdateCourseUseCase } from '../UpdateCourseUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { UpdateCourseDTO } from '../../../dtos/CourseDTO';
import { ApplicationError } from '../../../errors/ApplicationErrors';

describe('UpdateCourseUseCase', () => {
  let updateCourseUseCase: UpdateCourseUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;
  let mockTeacher: User;
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

    // Create mock user repository
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

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

    // Create mock course
    mockCourse = Course.create({
      id: 'course-id',
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: 'teacher-id'
    });

    // Mock user repository to return mock teacher
    mockUserRepository.findById.mockResolvedValue(mockTeacher);

    // Create use case with mocks
    updateCourseUseCase = new UpdateCourseUseCase(
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    const validUpdateCourseDTO: UpdateCourseDTO = {
      name: 'Advanced Programming',
      description: 'Learn advanced programming concepts'
    };

    it('should successfully update course with valid data', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);
      
      const updatedCourse = Course.create({
        id: 'course-id',
        name: validUpdateCourseDTO.name!,
        description: validUpdateCourseDTO.description!,
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.update.mockResolvedValue(updatedCourse);

      // Act
      const result = await updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'teacher-id');

      // Assert
      expect(mockCourseRepository.findById).toHaveBeenCalledWith('course-id');
      expect(mockAuthPolicy.canModifyCourse).toHaveBeenCalledWith(mockTeacher, mockCourse);
      expect(mockCourseRepository.update).toHaveBeenCalled();
      expect(result.name).toBe(validUpdateCourseDTO.name);
      expect(result.description).toBe(validUpdateCourseDTO.description);
    });

    it('should throw error if course not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is not the course owner', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(false);

      // Act & Assert
      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'other-teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'other-teacher-id')
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if course is archived', async () => {
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
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);

      // Act & Assert
      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        updateCourseUseCase.execute('course-id', validUpdateCourseDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'RESOURCE_ARCHIVED',
        statusCode: 400
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if course name is empty', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);
      
      const invalidDTO: UpdateCourseDTO = {
        name: '',
        description: 'Valid description'
      };

      // Act & Assert
      await expect(
        updateCourseUseCase.execute('course-id', invalidDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        updateCourseUseCase.execute('course-id', invalidDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Course name cannot be empty',
        statusCode: 400
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if course description is empty', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);
      
      const invalidDTO: UpdateCourseDTO = {
        name: 'Valid Name',
        description: ''
      };

      // Act & Assert
      await expect(
        updateCourseUseCase.execute('course-id', invalidDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        updateCourseUseCase.execute('course-id', invalidDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Course description cannot be empty',
        statusCode: 400
      });

      expect(mockCourseRepository.update).not.toHaveBeenCalled();
    });

    it('should update only name if description not provided', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);
      
      const partialDTO: UpdateCourseDTO = {
        name: 'Updated Name'
      };
      
      const updatedCourse = Course.create({
        id: 'course-id',
        name: partialDTO.name!,
        description: mockCourse.getDescription(),
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.update.mockResolvedValue(updatedCourse);

      // Act
      const result = await updateCourseUseCase.execute('course-id', partialDTO, 'teacher-id');

      // Assert
      expect(result.name).toBe(partialDTO.name);
      expect(result.description).toBe(mockCourse.getDescription());
      expect(mockCourseRepository.update).toHaveBeenCalled();
    });

    it('should update only description if name not provided', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(mockCourse);
      mockAuthPolicy.canModifyCourse.mockReturnValue(true);
      
      const partialDTO: UpdateCourseDTO = {
        description: 'Updated Description'
      };
      
      const updatedCourse = Course.create({
        id: 'course-id',
        name: mockCourse.getName(),
        description: partialDTO.description!,
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.update.mockResolvedValue(updatedCourse);

      // Act
      const result = await updateCourseUseCase.execute('course-id', partialDTO, 'teacher-id');

      // Assert
      expect(result.name).toBe(mockCourse.getName());
      expect(result.description).toBe(partialDTO.description);
      expect(mockCourseRepository.update).toHaveBeenCalled();
    });
  });
});
