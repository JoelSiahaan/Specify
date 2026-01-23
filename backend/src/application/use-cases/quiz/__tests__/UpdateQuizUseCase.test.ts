/**
 * UpdateQuizUseCase Unit Tests
 * 
 * Tests quiz update functionality with ownership validation and edit restrictions.
 * 
 * Requirements:
 * - 11.6: Editing only allowed before due date
 * - 11.7: Editing only allowed before any submissions
 */

import { UpdateQuizUseCase } from '../UpdateQuizUseCase';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz';
import { UpdateQuizDTO } from '../../../dtos/QuizDTO';
import { ApplicationError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('UpdateQuizUseCase', () => {
  let useCase: UpdateQuizUseCase;
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
  let updateDTO: UpdateQuizDTO;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize IDs
    teacherId = randomUUID();
    courseId = randomUUID();
    quizId = randomUUID();

    // Create mock repositories
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
      findByCode: jest.fn(),
      findByTeacherId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
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

    // Create test entities
    teacher = User.create({
      id: teacherId,
      email: 'teacher@example.com',
      name: 'Test Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed_password'
    });

    course = Course.create({
      id: courseId,
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: teacherId
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    quiz = Quiz.create({
      id: quizId,
      courseId: courseId,
      title: 'Original Quiz',
      description: 'Original Description',
      dueDate: futureDate,
      timeLimit: 60,
      questions: [
        {
          type: QuestionType.MCQ,
          questionText: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        }
      ]
    });

    updateDTO = {
      title: 'Updated Quiz',
      description: 'Updated Description'
    };

    // Setup default mock return values
    mockUserRepository.findById.mockResolvedValue(teacher);
    mockCourseRepository.findById.mockResolvedValue(course);
    mockQuizRepository.findById.mockResolvedValue(quiz);
    mockQuizRepository.hasSubmissions.mockResolvedValue(false);
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);

    // Create use case instance
    useCase = new UpdateQuizUseCase(
      mockQuizRepository,
      mockUserRepository,
      mockCourseRepository,
      mockAuthPolicy
    );
  });

  describe('Successful quiz update', () => {
    it('should update quiz title successfully', async () => {
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        title: updateDTO.title!
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, updateDTO, teacherId);

      expect(result.title).toBe(updateDTO.title);
      expect(mockQuizRepository.update).toHaveBeenCalledWith(expect.any(Quiz));
    });

    it('should update quiz description successfully', async () => {
      const dto: UpdateQuizDTO = { description: 'New Description' };
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        description: dto.description!
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, dto, teacherId);

      expect(result.description).toBe(dto.description);
      expect(mockQuizRepository.update).toHaveBeenCalled();
    });

    it('should update quiz due date successfully', async () => {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 14);
      const dto: UpdateQuizDTO = { dueDate: newDueDate };
      
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        dueDate: newDueDate
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, dto, teacherId);

      expect(result.dueDate).toEqual(newDueDate);
      expect(mockQuizRepository.update).toHaveBeenCalled();
    });

    it('should update quiz time limit successfully', async () => {
      const dto: UpdateQuizDTO = { timeLimit: 90 };
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        timeLimit: dto.timeLimit!
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, dto, teacherId);

      expect(result.timeLimit).toBe(dto.timeLimit);
      expect(mockQuizRepository.update).toHaveBeenCalled();
    });

    it('should update quiz questions successfully', async () => {
      const dto: UpdateQuizDTO = {
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'What is 3+3?',
            options: ['5', '6', '7'],
            correctAnswer: 1
          },
          {
            type: QuestionType.ESSAY,
            questionText: 'Explain your answer'
          }
        ]
      };
      
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        questions: dto.questions as any
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, dto, teacherId);

      expect(result.questions).toHaveLength(2);
      expect(mockQuizRepository.update).toHaveBeenCalled();
    });

    it('should update multiple fields at once', async () => {
      const dto: UpdateQuizDTO = {
        title: 'New Title',
        description: 'New Description',
        timeLimit: 120
      };
      
      const updatedQuiz = Quiz.reconstitute({
        ...quiz.toObject(),
        title: dto.title!,
        description: dto.description!,
        timeLimit: dto.timeLimit!
      });
      mockQuizRepository.update.mockResolvedValue(updatedQuiz);

      const result = await useCase.execute(quizId, dto, teacherId);

      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
      expect(result.timeLimit).toBe(dto.timeLimit);
      expect(mockQuizRepository.update).toHaveBeenCalled();
    });
  });

  describe('Authorization checks', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });
    });

    it('should throw NotFoundError when quiz not found', async () => {
      mockQuizRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw NotFoundError when course not found', async () => {
      mockCourseRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw ForbiddenError when user is not course owner', async () => {
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'NOT_OWNER',
        statusCode: 403
      });
    });
  });

  describe('Edit restrictions - Requirement 11.6, 11.7', () => {
    it('should throw error when quiz is past due date', async () => {
      // Create a quiz that will be past due date when we try to update it
      // We need to wait a moment or use a date that's very close to now
      const almostNowDate = new Date(Date.now() + 100); // 100ms in the future
      
      const almostExpiredQuiz = Quiz.create({
        id: quizId,
        courseId: courseId,
        title: 'Original Quiz',
        description: 'Original Description',
        dueDate: almostNowDate,
        timeLimit: 60,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'What is 2+2?',
            options: ['3', '4', '5'],
            correctAnswer: 1
          }
        ]
      });
      
      mockQuizRepository.findById.mockResolvedValue(almostExpiredQuiz);
      
      // Wait for the quiz to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_CLOSED',
        message: 'Cannot update quiz after due date',
        statusCode: 400
      });
    });

    it('should throw error when quiz has submissions', async () => {
      mockQuizRepository.hasSubmissions.mockResolvedValue(true);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, updateDTO, teacherId)
      ).rejects.toMatchObject({
        code: 'RESOURCE_CLOSED',
        message: 'Cannot update quiz after submissions exist',
        statusCode: 400
      });
    });

    it('should check hasSubmissions before allowing update', async () => {
      mockQuizRepository.hasSubmissions.mockResolvedValue(false);
      mockQuizRepository.update.mockResolvedValue(quiz);

      await useCase.execute(quizId, updateDTO, teacherId);

      expect(mockQuizRepository.hasSubmissions).toHaveBeenCalledWith(quizId);
    });
  });

  describe('Validation errors', () => {
    it('should throw error for empty title', async () => {
      const dto: UpdateQuizDTO = { title: '' };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz title cannot be empty',
        statusCode: 400
      });
    });

    it('should throw error for empty description', async () => {
      const dto: UpdateQuizDTO = { description: '   ' };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz description cannot be empty',
        statusCode: 400
      });
    });

    it('should throw error for due date in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dto: UpdateQuizDTO = { dueDate: pastDate };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'INVALID_DATE',
        message: 'Quiz due date must be in the future',
        statusCode: 400
      });
    });

    it('should throw error for non-positive time limit', async () => {
      const dto: UpdateQuizDTO = { timeLimit: 0 };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'INVALID_RANGE',
        message: 'Quiz time limit must be a positive integer (in minutes)',
        statusCode: 400
      });
    });

    it('should throw error for non-integer time limit', async () => {
      const dto: UpdateQuizDTO = { timeLimit: 45.5 };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'INVALID_RANGE',
        statusCode: 400
      });
    });

    it('should throw error for empty questions array', async () => {
      const dto: UpdateQuizDTO = { questions: [] };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Quiz must have at least one question',
        statusCode: 400
      });
    });

    it('should throw error for MCQ with less than 2 options', async () => {
      const dto: UpdateQuizDTO = {
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['Only one'],
            correctAnswer: 0
          }
        ]
      };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: expect.stringContaining('MCQ must have at least 2 options'),
        statusCode: 400
      });
    });

    it('should throw error for MCQ with invalid correctAnswer index', async () => {
      const dto: UpdateQuizDTO = {
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: 'Question?',
            options: ['A', 'B'],
            correctAnswer: 5
          }
        ]
      };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: expect.stringContaining('valid correctAnswer index'),
        statusCode: 400
      });
    });

    it('should throw error for empty question text', async () => {
      const dto: UpdateQuizDTO = {
        questions: [
          {
            type: QuestionType.ESSAY,
            questionText: ''
          }
        ]
      };

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(quizId, dto, teacherId)
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        message: expect.stringContaining('Question text is required'),
        statusCode: 400
      });
    });
  });

  describe('Repository interactions', () => {
    it('should call repositories in correct order', async () => {
      mockQuizRepository.update.mockResolvedValue(quiz);

      await useCase.execute(quizId, updateDTO, teacherId);

      // Verify call order
      expect(mockUserRepository.findById).toHaveBeenCalledWith(teacherId);
      expect(mockQuizRepository.findById).toHaveBeenCalledWith(quizId);
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockQuizRepository.hasSubmissions).toHaveBeenCalledWith(quizId);
      expect(mockQuizRepository.update).toHaveBeenCalledWith(expect.any(Quiz));
    });

    it('should pass updated quiz entity to repository', async () => {
      mockQuizRepository.update.mockResolvedValue(quiz);

      await useCase.execute(quizId, updateDTO, teacherId);

      expect(mockQuizRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          getTitle: expect.any(Function),
          getDescription: expect.any(Function)
        })
      );
    });
  });
});
