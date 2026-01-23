/**
 * CreateQuizUseCase Unit Tests
 * 
 * Tests the CreateQuizUseCase with mocked dependencies.
 * Validates authorization, validation, and quiz creation logic.
 * 
 * Requirements:
 * - 11.1: Create quiz with title, description, due date, and time limit
 * - 11.2: Due date must be in the future
 * - 11.3: Time limit must be positive integer
 * - 11.4: Questions (MCQ and Essay)
 * - 11.5: At least one question required
 */

import { CreateQuizUseCase } from '../CreateQuizUseCase';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz';
import { CreateQuizDTO } from '../../../dtos/QuizDTO';
import { ApplicationError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('CreateQuizUseCase', () => {
  let useCase: CreateQuizUseCase;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let teacherId: string;
  let courseId: string;
  let teacher: User;
  let course: Course;
  let validCreateQuizDTO: CreateQuizDTO;
  let futureDate: Date;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize test data
    teacherId = randomUUID();
    courseId = randomUUID();
    futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

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

    validCreateQuizDTO = {
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination',
      dueDate: futureDate,
      timeLimit: 60,
      questions: [
        {
          type: QuestionType.MCQ,
          questionText: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        },
        {
          type: QuestionType.ESSAY,
          questionText: 'Explain the concept of Clean Architecture.'
        }
      ]
    };

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
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);

    // Create use case with mocked dependencies
    useCase = new CreateQuizUseCase(
      mockQuizRepository,
      mockUserRepository,
      mockCourseRepository,
      mockAuthPolicy
    );
  });

  describe('Successful quiz creation', () => {
    it('should create quiz with valid data', async () => {
      // Arrange
      const savedQuiz = Quiz.create({
        id: randomUUID(),
        courseId: courseId,
        title: validCreateQuizDTO.title,
        description: validCreateQuizDTO.description,
        dueDate: validCreateQuizDTO.dueDate,
        timeLimit: validCreateQuizDTO.timeLimit,
        questions: validCreateQuizDTO.questions,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockQuizRepository.save.mockResolvedValue(savedQuiz);

      // Act
      const result = await useCase.execute(validCreateQuizDTO, courseId, teacherId);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(validCreateQuizDTO.title);
      expect(result.description).toBe(validCreateQuizDTO.description);
      expect(result.timeLimit).toBe(validCreateQuizDTO.timeLimit);
      expect(result.questions).toHaveLength(2);
      expect(mockQuizRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create quiz with MCQ questions only', async () => {
      // Arrange
      const mcqOnlyDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question 1?',
            options: ['A', 'B', 'C'],
            correctAnswer: 0
          },
          {
            type: QuestionType.MCQ,
            questionText: 'Question 2?',
            options: ['X', 'Y'],
            correctAnswer: 1
          }
        ]
      };

      const savedQuiz = Quiz.create({
        id: randomUUID(),
        courseId: courseId,
        ...mcqOnlyDTO,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockQuizRepository.save.mockResolvedValue(savedQuiz);

      // Act
      const result = await useCase.execute(mcqOnlyDTO, courseId, teacherId);

      // Assert
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].type).toBe(QuestionType.MCQ);
      expect(result.questions[1].type).toBe(QuestionType.MCQ);
    });

    it('should create quiz with essay questions only', async () => {
      // Arrange
      const essayOnlyDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.ESSAY,
            questionText: 'Explain concept A.'
          },
          {
            type: QuestionType.ESSAY,
            questionText: 'Explain concept B.'
          }
        ]
      };

      const savedQuiz = Quiz.create({
        id: randomUUID(),
        courseId: courseId,
        ...essayOnlyDTO,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockQuizRepository.save.mockResolvedValue(savedQuiz);

      // Act
      const result = await useCase.execute(essayOnlyDTO, courseId, teacherId);

      // Assert
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].type).toBe(QuestionType.ESSAY);
      expect(result.questions[1].type).toBe(QuestionType.ESSAY);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });
    });

    it('should throw error when course not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw error when user is not course owner', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(validCreateQuizDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });
    });
  });

  describe('Validation - Required fields', () => {
    it('should throw error when title is missing', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, title: '' };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz title is required',
        statusCode: 400
      });
    });

    it('should throw error when description is missing', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, description: '' };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz description is required',
        statusCode: 400
      });
    });

    it('should throw error when questions array is empty', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, questions: [] };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz must have at least one question',
        statusCode: 400
      });
    });
  });

  describe('Validation - Due date (Requirement 11.2)', () => {
    it('should throw error when due date is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const invalidDTO = { ...validCreateQuizDTO, dueDate: pastDate };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'INVALID_DATE',
        message: 'Quiz due date must be in the future',
        statusCode: 400
      });
    });

    it('should throw error when due date is now', async () => {
      // Arrange
      const now = new Date();
      const invalidDTO = { ...validCreateQuizDTO, dueDate: now };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - Time limit (Requirement 11.3)', () => {
    it('should throw error when time limit is zero', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, timeLimit: 0 };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'INVALID_RANGE',
        message: 'Quiz time limit must be a positive integer (in minutes)',
        statusCode: 400
      });
    });

    it('should throw error when time limit is negative', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, timeLimit: -10 };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw error when time limit is not an integer', async () => {
      // Arrange
      const invalidDTO = { ...validCreateQuizDTO, timeLimit: 30.5 };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - MCQ questions (Requirement 11.4)', () => {
    it('should throw error when MCQ has less than 2 options', async () => {
      // Arrange
      const invalidDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['Only one option'],
            correctAnswer: 0
          }
        ]
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Question 1: MCQ must have at least 2 options',
        statusCode: 400
      });
    });

    it('should throw error when MCQ correctAnswer is invalid', async () => {
      // Arrange
      const invalidDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['A', 'B', 'C'],
            correctAnswer: 5 // Invalid index
          }
        ]
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        statusCode: 400
      });
    });

    it('should throw error when MCQ correctAnswer is negative', async () => {
      // Arrange
      const invalidDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['A', 'B'],
            correctAnswer: -1
          }
        ]
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw error when MCQ option is empty', async () => {
      // Arrange
      const invalidDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['A', '', 'C'],
            correctAnswer: 0
          }
        ]
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Question 1, Option 2: Option text is required',
        statusCode: 400
      });
    });
  });

  describe('Validation - Question text', () => {
    it('should throw error when question text is empty', async () => {
      // Arrange
      const invalidDTO: CreateQuizDTO = {
        ...validCreateQuizDTO,
        questions: [
          {
            type: QuestionType.ESSAY,
            questionText: ''
          }
        ]
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(invalidDTO, courseId, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Question 1: Question text is required',
        statusCode: 400
      });
    });
  });
});
