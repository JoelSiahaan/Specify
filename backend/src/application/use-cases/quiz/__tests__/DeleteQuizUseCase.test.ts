/**
 * DeleteQuizUseCase Unit Tests
 * 
 * Tests the DeleteQuizUseCase with mocked dependencies.
 * Validates authorization and quiz deletion logic.
 * 
 * Requirements:
 * - 11.13: Allow teachers to delete entire quizzes at any time
 * - 2.1: Role-based access control (only teachers)
 * - 2.2: Resource ownership validation
 */

import { DeleteQuizUseCase } from '../DeleteQuizUseCase.js';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz.js';
import { ApplicationError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('DeleteQuizUseCase', () => {
  let useCase: DeleteQuizUseCase;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let teacherId: string;
  let courseId: string;
  let quizId: string;
  let teacher: User;
  let course: Course;
  let quiz: Quiz;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize test data
    teacherId = randomUUID();
    courseId = randomUUID();
    quizId = randomUUID();

    teacher = User.create({
      id: teacherId,
      email: 'teacher@example.com',
      name: 'Test Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    course = Course.create({
      id: courseId,
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: teacherId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    quiz = Quiz.create({
      id: quizId,
      courseId: courseId,
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timeLimit: 60,
      questions: [
        {
          type: QuestionType.MCQ,
          questionText: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock repositories
    mockQuizRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByCourseId: jest.fn(),
      hasSubmissions: jest.fn()
    } as jest.Mocked<IQuizRepository>;

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTeacherId: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as jest.Mocked<ICourseRepository>;

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

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(teacher);
    mockCourseRepository.findById.mockResolvedValue(course);
    mockQuizRepository.findById.mockResolvedValue(quiz);
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);

    // Create use case with mocked dependencies
    useCase = new DeleteQuizUseCase(
      mockQuizRepository,
      mockUserRepository,
      mockCourseRepository,
      mockAuthPolicy
    );
  });

  describe('Successful quiz deletion', () => {
    it('should delete quiz when user is authorized (Requirement 11.13)', async () => {
      // Arrange
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockQuizRepository.delete).toHaveBeenCalledWith(quizId);
      expect(mockQuizRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should delete quiz even if it has submissions (Requirement 11.13)', async () => {
      // Arrange
      mockQuizRepository.hasSubmissions.mockResolvedValue(true);
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockQuizRepository.delete).toHaveBeenCalledWith(quizId);
      expect(mockQuizRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should delete quiz regardless of due date status (Requirement 11.13)', async () => {
      // Arrange
      // Note: We use the existing quiz which has a future due date
      // The key point is that deletion is allowed at any time, regardless of due date
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockQuizRepository.delete).toHaveBeenCalledWith(quizId);
      expect(mockQuizRepository.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });

      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when quiz not found', async () => {
      // Arrange
      mockQuizRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Quiz not found',
        statusCode: 404
      });

      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when course not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Course not found',
        statusCode: 404
      });

      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when user is not course owner (Requirement 2.2)', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, teacherId)
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        message: 'You do not have permission to delete this quiz',
        statusCode: 403
      });

      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when user is a student (Requirement 2.1)', async () => {
      // Arrange
      const student = User.create({
        id: randomUUID(),
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.STUDENT,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findById.mockResolvedValue(student);
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(quizId, student.getId())
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, student.getId())
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });

      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Authorization policy integration', () => {
    it('should call authorization policy with correct parameters', async () => {
      // Arrange
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockAuthPolicy.canManageAssignments).toHaveBeenCalledWith(teacher, course);
      expect(mockAuthPolicy.canManageAssignments).toHaveBeenCalledTimes(1);
    });
  });

  describe('Repository integration', () => {
    it('should load user from repository', async () => {
      // Arrange
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(teacherId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should load quiz from repository', async () => {
      // Arrange
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockQuizRepository.findById).toHaveBeenCalledWith(quizId);
      expect(mockQuizRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should load course from repository', async () => {
      // Arrange
      mockQuizRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(quizId, teacherId);

      // Assert
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockCourseRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
