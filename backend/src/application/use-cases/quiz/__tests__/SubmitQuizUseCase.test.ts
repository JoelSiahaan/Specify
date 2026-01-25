/**
 * SubmitQuizUseCase Unit Tests
 * 
 * Tests the quiz submission use case with validation for:
 * - Student ownership
 * - Quiz not expired
 * - Submission before due date
 * - Final answers saved
 * - SubmittedAt timestamp set
 */

import { SubmitQuizUseCase } from '../SubmitQuizUseCase';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository';
import { IQuizSubmissionRepository } from '../../../../domain/repositories/IQuizSubmissionRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { User, Role } from '../../../../domain/entities/User';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission';
import { SubmitQuizDTO } from '../../../dtos/QuizSubmissionDTO';
import { ApplicationError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('SubmitQuizUseCase', () => {
  let useCase: SubmitQuizUseCase;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockQuizSubmissionRepository: jest.Mocked<IQuizSubmissionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  // Test data
  let mockUser: User;
  let mockQuiz: Quiz;
  let mockSubmission: QuizSubmission;
  let submitQuizDTO: SubmitQuizDTO;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repositories
    mockQuizRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByCourseId: jest.fn()
    } as jest.Mocked<IQuizRepository>;

    mockQuizSubmissionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByQuizAndStudent: jest.fn(),
      findByQuizId: jest.fn(),
      findByStudentAndCourse: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByQuizId: jest.fn(),
      deleteByCourseId: jest.fn(),
      countByQuizId: jest.fn()
    } as jest.Mocked<IQuizSubmissionRepository>;

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    // Create test user (student)
    mockUser = User.create({
      id: randomUUID(),
      email: 'student@example.com',
      name: 'Test Student',
      role: Role.STUDENT,
      passwordHash: 'hashed_password'
    });

    // Create test quiz (due date in future, 60 minute time limit)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    mockQuiz = Quiz.create({
      id: randomUUID(),
      courseId: randomUUID(),
      title: 'Test Quiz',
      description: 'Test quiz description',
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

    // Create test submission (in progress, started 10 minutes ago)
    mockSubmission = QuizSubmission.create(mockQuiz.getId(), mockUser.getId());
    mockSubmission.start(mockQuiz.getDueDate());

    // Create submit quiz DTO
    submitQuizDTO = {
      answers: [
        { questionIndex: 0, answer: 1 }
      ]
    };

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizRepository.findById.mockResolvedValue(mockQuiz);
    mockQuizSubmissionRepository.findById.mockResolvedValue(mockSubmission);
    mockQuizSubmissionRepository.save.mockResolvedValue(mockSubmission);

    // Create use case with mocked dependencies
    useCase = new SubmitQuizUseCase(
      mockQuizRepository,
      mockQuizSubmissionRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should submit quiz successfully with valid data', async () => {
      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        submitQuizDTO
      );

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.getId());
      expect(mockQuizSubmissionRepository.findById).toHaveBeenCalledWith(mockSubmission.getId());
      expect(mockQuizRepository.findById).toHaveBeenCalledWith(mockQuiz.getId());
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.status).toBe(QuizSubmissionStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });

    it('should throw AUTH_REQUIRED when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
        statusCode: 401
      });
    });

    it('should throw RESOURCE_NOT_FOUND when submission not found', async () => {
      // Arrange
      mockQuizSubmissionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw FORBIDDEN_RESOURCE when student does not own submission', async () => {
      // Arrange
      const otherUserId = randomUUID();

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), otherUserId, submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), otherUserId, submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN_RESOURCE',
        statusCode: 403
      });
    });

    it('should throw RESOURCE_NOT_FOUND when quiz not found', async () => {
      // Arrange
      mockQuizRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw RESOURCE_CLOSED when quiz is past due date', async () => {
      // Arrange - Create quiz with past due date using a workaround
      // We need to bypass validation by creating a valid quiz first, then modifying it
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      // Create a valid quiz first
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const validQuiz = Quiz.create({
        id: mockQuiz.getId(),
        courseId: mockQuiz.getCourseId(),
        title: mockQuiz.getTitle(),
        description: mockQuiz.getDescription(),
        dueDate: futureDate,
        timeLimit: mockQuiz.getTimeLimit(),
        questions: mockQuiz.getQuestions()
      });

      // Mock the quiz to return past due date when checked
      jest.spyOn(validQuiz, 'isPastDueDate').mockReturnValue(true);
      mockQuizRepository.findById.mockResolvedValue(validQuiz);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_CLOSED',
        message: 'Cannot submit quiz after due date',
        statusCode: 400
      });
    });

    it('should throw RESOURCE_CLOSED when quiz time has expired', async () => {
      // Arrange - Create submission that started 70 minutes ago (time limit is 60 minutes)
      const expiredSubmission = QuizSubmission.reconstitute({
        id: mockSubmission.getId(),
        quizId: mockSubmission.getQuizId(),
        studentId: mockSubmission.getStudentId(),
        answers: [],
        startedAt: new Date(Date.now() - 70 * 60 * 1000), // 70 minutes ago
        submittedAt: null,
        grade: null,
        feedback: null,
        status: QuizSubmissionStatus.IN_PROGRESS,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockQuizSubmissionRepository.findById.mockResolvedValue(expiredSubmission);

      // Act & Assert
      await expect(
        useCase.execute(expiredSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(expiredSubmission.getId(), mockUser.getId(), submitQuizDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_CLOSED',
        message: 'Quiz time has expired. The quiz has been auto-submitted.',
        statusCode: 400
      });
    });

    it('should save final answers when submitting quiz', async () => {
      // Arrange
      const answers = [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 'Essay answer' }
      ];

      const submitDTO: SubmitQuizDTO = { answers };

      // Act
      await useCase.execute(mockSubmission.getId(), mockUser.getId(), submitDTO);

      // Assert
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled();
      const savedSubmission = mockQuizSubmissionRepository.save.mock.calls[0][0];
      expect(savedSubmission.getAnswers()).toHaveLength(2);
      expect(savedSubmission.getAnswers()[0].questionIndex).toBe(0);
      expect(savedSubmission.getAnswers()[0].answer).toBe(1);
      expect(savedSubmission.getAnswers()[1].questionIndex).toBe(1);
      expect(savedSubmission.getAnswers()[1].answer).toBe('Essay answer');
    });

    it('should set submittedAt timestamp when submitting quiz', async () => {
      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        submitQuizDTO
      );

      // Assert
      expect(result.submittedAt).toBeDefined();
      expect(result.submittedAt).toBeInstanceOf(Date);
      expect(result.status).toBe(QuizSubmissionStatus.SUBMITTED);
    });

    it('should update submission status to SUBMITTED', async () => {
      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        submitQuizDTO
      );

      // Assert
      expect(result.status).toBe(QuizSubmissionStatus.SUBMITTED);
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled();
    });

    it('should accept submission before time limit expires', async () => {
      // Arrange - Create submission that started 30 minutes ago (time limit is 60 minutes)
      const recentSubmission = QuizSubmission.reconstitute({
        id: mockSubmission.getId(),
        quizId: mockSubmission.getQuizId(),
        studentId: mockSubmission.getStudentId(),
        answers: [],
        startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        submittedAt: null,
        grade: null,
        feedback: null,
        status: QuizSubmissionStatus.IN_PROGRESS,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockQuizSubmissionRepository.findById.mockResolvedValue(recentSubmission);
      
      // Mock save to return the submitted version
      mockQuizSubmissionRepository.save.mockImplementation(async (submission) => {
        return submission;
      });

      // Act
      const result = await useCase.execute(
        recentSubmission.getId(),
        mockUser.getId(),
        submitQuizDTO
      );

      // Assert
      expect(result.status).toBe(QuizSubmissionStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });
  });
});
