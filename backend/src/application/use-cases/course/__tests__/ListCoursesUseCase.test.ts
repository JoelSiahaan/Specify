/**
 * ListCoursesUseCase Unit Tests
 * 
 * Tests the ListCoursesUseCase with mocked dependencies.
 * Validates role-based filtering and status filtering.
 * 
 * Requirements:
 * - 5.10: Teachers view all their created courses (active and archived separately)
 * - 6.1: Students view only active courses
 */

import { ListCoursesUseCase, ListCoursesFilter } from '../ListCoursesUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
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

// Mock container for user loading
jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => (target: any, propertyKey: string, parameterIndex: number) => {},
  container: {
    resolve: jest.fn()
  }
}));

describe('ListCoursesUseCase', () => {
  let useCase: ListCoursesUseCase;
  let mockTeacher: User;
  let mockStudent: User;
  let mockActiveCourse1: Course;
  let mockActiveCourse2: Course;
  let mockArchivedCourse: Course;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new ListCoursesUseCase(mockCourseRepository);

    // Create mock users
    mockTeacher = User.create({
      id: 'teacher-id',
      email: 'teacher@example.com',
      name: 'Teacher Name',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    mockStudent = User.create({
      id: 'student-id',
      email: 'student@example.com',
      name: 'Student Name',
      role: Role.STUDENT,
      passwordHash: 'hashed-password'
    });

    // Create mock courses
    mockActiveCourse1 = Course.create({
      id: 'course-1',
      name: 'Active Course 1',
      description: 'Description 1',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: 'teacher-id'
    });

    mockActiveCourse2 = Course.create({
      id: 'course-2',
      name: 'Active Course 2',
      description: 'Description 2',
      courseCode: 'DEF456',
      status: CourseStatus.ACTIVE,
      teacherId: 'teacher-id'
    });

    mockArchivedCourse = Course.create({
      id: 'course-3',
      name: 'Archived Course',
      description: 'Description 3',
      courseCode: 'GHI789',
      status: CourseStatus.ARCHIVED,
      teacherId: 'teacher-id'
    });
  });

  describe('execute - Teacher role', () => {
    beforeEach(() => {
      // Mock container resolve for teacher
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockTeacher)
      });
    });

    it('should return all teacher courses when no filter provided', async () => {
      // Arrange
      mockCourseRepository.findByTeacherId.mockResolvedValue([
        mockActiveCourse1,
        mockActiveCourse2,
        mockArchivedCourse
      ]);

      // Act
      const result = await useCase.execute('teacher-id');

      // Assert
      expect(mockCourseRepository.findByTeacherId).toHaveBeenCalledWith('teacher-id');
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('course-1');
      expect(result[1].id).toBe('course-2');
      expect(result[2].id).toBe('course-3');
    });

    it('should filter teacher courses by ACTIVE status', async () => {
      // Arrange
      mockCourseRepository.findByTeacherId.mockResolvedValue([
        mockActiveCourse1,
        mockActiveCourse2,
        mockArchivedCourse
      ]);

      const filter: ListCoursesFilter = { status: CourseStatus.ACTIVE };

      // Act
      const result = await useCase.execute('teacher-id', filter);

      // Assert
      expect(mockCourseRepository.findByTeacherId).toHaveBeenCalledWith('teacher-id');
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(CourseStatus.ACTIVE);
      expect(result[1].status).toBe(CourseStatus.ACTIVE);
    });

    it('should filter teacher courses by ARCHIVED status', async () => {
      // Arrange
      mockCourseRepository.findByTeacherId.mockResolvedValue([
        mockActiveCourse1,
        mockActiveCourse2,
        mockArchivedCourse
      ]);

      const filter: ListCoursesFilter = { status: CourseStatus.ARCHIVED };

      // Act
      const result = await useCase.execute('teacher-id', filter);

      // Assert
      expect(mockCourseRepository.findByTeacherId).toHaveBeenCalledWith('teacher-id');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(CourseStatus.ARCHIVED);
      expect(result[0].id).toBe('course-3');
    });

    it('should return empty array when teacher has no courses', async () => {
      // Arrange
      mockCourseRepository.findByTeacherId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute('teacher-id');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return CourseListDTO with all required fields', async () => {
      // Arrange
      mockCourseRepository.findByTeacherId.mockResolvedValue([mockActiveCourse1]);

      // Act
      const result = await useCase.execute('teacher-id');

      // Assert
      expect(result[0]).toMatchObject({
        id: 'course-1',
        name: 'Active Course 1',
        description: 'Description 1',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-id'
      });
      expect(result[0].createdAt).toBeDefined();
      expect(result[0].updatedAt).toBeDefined();
    });
  });

  describe('execute - Student role', () => {
    beforeEach(() => {
      // Mock container resolve for student
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockStudent)
      });
    });

    it('should return only active courses for students', async () => {
      // Arrange
      mockCourseRepository.findAll.mockResolvedValue([
        mockActiveCourse1,
        mockActiveCourse2
      ]);

      // Act
      const result = await useCase.execute('student-id');

      // Assert
      expect(mockCourseRepository.findAll).toHaveBeenCalledWith(CourseStatus.ACTIVE);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(CourseStatus.ACTIVE);
      expect(result[1].status).toBe(CourseStatus.ACTIVE);
    });

    it('should return empty array when student requests archived courses', async () => {
      // Arrange
      const filter: ListCoursesFilter = { status: CourseStatus.ARCHIVED };

      // Act
      const result = await useCase.execute('student-id', filter);

      // Assert
      expect(mockCourseRepository.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should use ACTIVE status filter when student provides ACTIVE filter', async () => {
      // Arrange
      mockCourseRepository.findAll.mockResolvedValue([mockActiveCourse1]);
      const filter: ListCoursesFilter = { status: CourseStatus.ACTIVE };

      // Act
      const result = await useCase.execute('student-id', filter);

      // Assert
      expect(mockCourseRepository.findAll).toHaveBeenCalledWith(CourseStatus.ACTIVE);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no active courses exist', async () => {
      // Arrange
      mockCourseRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute('student-id');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('business rules', () => {
    it('should enforce requirement 5.10: teachers see their own courses', async () => {
      // Arrange
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockTeacher)
      });
      mockCourseRepository.findByTeacherId.mockResolvedValue([mockActiveCourse1]);

      // Act
      await useCase.execute('teacher-id');

      // Assert
      expect(mockCourseRepository.findByTeacherId).toHaveBeenCalledWith('teacher-id');
      expect(mockCourseRepository.findAll).not.toHaveBeenCalled();
    });

    it('should enforce requirement 6.1: students see only active courses', async () => {
      // Arrange
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockStudent)
      });
      mockCourseRepository.findAll.mockResolvedValue([mockActiveCourse1]);

      // Act
      await useCase.execute('student-id');

      // Assert
      expect(mockCourseRepository.findAll).toHaveBeenCalledWith(CourseStatus.ACTIVE);
      expect(mockCourseRepository.findByTeacherId).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(null)
      });

      // Act & Assert
      await expect(
        useCase.execute('non-existent-user')
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute('non-existent-user')
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const { container } = require('tsyringe');
      container.resolve.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockTeacher)
      });
      mockCourseRepository.findByTeacherId.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        useCase.execute('teacher-id')
      ).rejects.toThrow('Database error');
    });
  });
});
