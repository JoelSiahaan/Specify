/**
 * CreateCourseUseCase Unit Tests
 * 
 * Tests the create course use case with various scenarios including
 * valid course creation, authorization checks, and validation errors.
 * 
 * Requirements:
 * - 5.1: Create course with name, description, and unique course code
 * - 5.2: Generate unique course code with retry logic
 * - 5.9: Validate that course name is provided
 */

import { CreateCourseUseCase } from '../CreateCourseUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { CreateCourseDTO } from '../../../dtos/CourseDTO';
import { ApplicationError } from '../../../errors/ApplicationErrors';

// Mock tsyringe container
jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => (target: any, propertyKey: string, parameterIndex: number) => {},
  container: {
    resolve: jest.fn()
  }
}));

describe('CreateCourseUseCase', () => {
  let createCourseUseCase: CreateCourseUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;
  let mockTeacher: User;
  let mockStudent: User;

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

    mockStudent = User.create({
      id: 'student-id',
      email: 'student@example.com',
      name: 'Student User',
      role: Role.STUDENT,
      passwordHash: 'hashed-password'
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
    createCourseUseCase = new CreateCourseUseCase(
      mockCourseRepository,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    const validCreateCourseDTO: CreateCourseDTO = {
      name: 'Introduction to Programming',
      description: 'Learn programming basics with Python'
    };

    it('should successfully create course with valid data', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(true);
      mockCourseRepository.findByCode.mockResolvedValue(null); // Code is unique
      
      const mockSavedCourse = Course.create({
        id: 'course-id',
        name: validCreateCourseDTO.name,
        description: validCreateCourseDTO.description,
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.save.mockResolvedValue(mockSavedCourse);

      // Act
      const result = await createCourseUseCase.execute(validCreateCourseDTO, 'teacher-id');

      // Assert
      expect(mockAuthPolicy.canCreateCourse).toHaveBeenCalled();
      expect(mockCourseRepository.findByCode).toHaveBeenCalled();
      expect(mockCourseRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'course-id',
        name: validCreateCourseDTO.name,
        description: validCreateCourseDTO.description,
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id',
        createdAt: mockSavedCourse.getCreatedAt(),
        updatedAt: mockSavedCourse.getUpdatedAt()
      });
    });

    it('should throw error if user is not a teacher', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(false);

      // Act & Assert
      await expect(
        createCourseUseCase.execute(validCreateCourseDTO, 'student-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        createCourseUseCase.execute(validCreateCourseDTO, 'student-id')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN_ROLE',
        statusCode: 403
      });

      expect(mockAuthPolicy.canCreateCourse).toHaveBeenCalled();
      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if course name is missing', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(true);
      const invalidDTO: CreateCourseDTO = {
        name: '',
        description: 'Valid description'
      };

      // Act & Assert
      await expect(
        createCourseUseCase.execute(invalidDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        createCourseUseCase.execute(invalidDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Course name is required',
        statusCode: 400
      });

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if course description is missing', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(true);
      const invalidDTO: CreateCourseDTO = {
        name: 'Valid Name',
        description: ''
      };

      // Act & Assert
      await expect(
        createCourseUseCase.execute(invalidDTO, 'teacher-id')
      ).rejects.toThrow(ApplicationError);

      await expect(
        createCourseUseCase.execute(invalidDTO, 'teacher-id')
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Course description is required',
        statusCode: 400
      });

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('should retry course code generation on collision', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(true);
      
      // First call returns existing course (collision), second call returns null (unique)
      mockCourseRepository.findByCode
        .mockResolvedValueOnce(Course.create({
          id: 'existing-course-id',
          name: 'Existing Course',
          description: 'Existing description',
          courseCode: 'ABC123',
          status: CourseStatus.ACTIVE,
          teacherId: 'other-teacher-id'
        }))
        .mockResolvedValueOnce(null);
      
      const mockSavedCourse = Course.create({
        id: 'course-id',
        name: validCreateCourseDTO.name,
        description: validCreateCourseDTO.description,
        courseCode: 'DEF456',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      
      mockCourseRepository.save.mockResolvedValue(mockSavedCourse);

      // Act
      const result = await createCourseUseCase.execute(validCreateCourseDTO, 'teacher-id');

      // Assert
      expect(mockCourseRepository.findByCode).toHaveBeenCalledTimes(2);
      expect(mockCourseRepository.save).toHaveBeenCalled();
      expect(result.courseCode).toBeDefined();
    });

    it('should throw error if unable to generate unique code after max retries', async () => {
      // Arrange
      mockAuthPolicy.canCreateCourse.mockReturnValue(true);
      
      // Always return existing course (collision on every attempt)
      mockCourseRepository.findByCode.mockResolvedValue(Course.create({
        id: 'existing-course-id',
        name: 'Existing Course',
        description: 'Existing description',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'other-teacher-id'
      }));

      // Act & Assert
      try {
        await createCourseUseCase.execute(validCreateCourseDTO, 'teacher-id');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).code).toBe('INTERNAL_ERROR');
        expect((error as ApplicationError).statusCode).toBe(500);
      }

      // Should have tried 5 times (max retries)
      expect(mockCourseRepository.findByCode).toHaveBeenCalledTimes(5);
      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });
  });
});
