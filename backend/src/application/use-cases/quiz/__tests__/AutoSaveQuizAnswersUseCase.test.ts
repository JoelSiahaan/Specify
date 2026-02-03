/**
 * AutoSaveQuizAnswersUseCase Unit Tests
 * 
 * Tests the auto-save quiz answers use case with various scenarios.
 * 
 * Requirements:
 * - 12.4: Auto-save during quiz taking
 * - 12.5: Display remaining time
 */

import { AutoSaveQuizAnswersUseCase } from '../AutoSaveQuizAnswersUseCase.js';
import type { IQuizRepository } from '../../../../domain/repositories/IQuizRepository.js';
import type { IQuizSubmissionRepository } from '../../../../domain/repositories/IQuizSubmissionRepository.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Quiz } from '../../../../domain/entities/Quiz.js';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission.js';
import { MCQQuestion } from '../../../../domain/value-objects/MCQQuestion.js';
import { AutoSaveQuizDTO } from '../../../dtos/QuizSubmissionDTO.js';
import { ApplicationError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('AutoSaveQuizAnswersUseCase', () => {
  let useCase: AutoSaveQuizAnswersUseCase;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockQuizSubmissionRepository: jest.Mocked<IQuizSubmissionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  // Test data
  let mockUser: User;
  let mockQuiz: Quiz;
  let mockSubmission: QuizSubmission;
  let autoSaveDTO: AutoSaveQuizDTO;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repositories
    mockQuizRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IQuizRepository>;

    mockQuizSubmissionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByQuizAndStudent: jest.fn(),
      findByQuizId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IQuizSubmissionRepository>;

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    // Create test data
    mockUser = User.create({
      id: randomUUID(),
      email: 'student@example.com',
      name: 'Test Student',
      role: Role.STUDENT,
      passwordHash: 'hashed_password'
    });

    const question = MCQQuestion.create(
      'What is 2+2?',
      ['3', '4', '5', '6'],
      1
    );

    mockQuiz = Quiz.create({
      id: randomUUID(),
      courseId: randomUUID(),
      title: 'Test Quiz',
      description: 'Test quiz description',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeLimit: 60,
      questions: [question]
    });

    mockSubmission = QuizSubmission.create(mockQuiz.getId(), mockUser.getId());
    mockSubmission.start(mockQuiz.getDueDate());

    autoSaveDTO = {
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
    useCase = new AutoSaveQuizAnswersUseCase(
      mockQuizRepository,
      mockQuizSubmissionRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should auto-save quiz answers successfully', async () => {
      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        autoSaveDTO
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubmission.getId());
      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].questionIndex).toBe(0);
      expect(result.answers[0].answer).toBe(1);
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalledWith(mockSubmission);
    });

    it('should throw AUTH_REQUIRED when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
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
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw FORBIDDEN_RESOURCE when user does not own submission', async () => {
      // Arrange
      const otherUserId = randomUUID();

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), otherUserId, autoSaveDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), otherUserId, autoSaveDTO)
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
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(mockSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw RESOURCE_CLOSED when quiz time has expired', async () => {
      // Arrange
      // Create a quiz with very short time limit
      const expiredQuiz = Quiz.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Expired Quiz',
        description: 'Test quiz',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeLimit: 1, // 1 minute
        questions: [MCQQuestion.create('Q1', ['A', 'B'], 0)]
      });

      const expiredSubmission = QuizSubmission.create(expiredQuiz.getId(), mockUser.getId());
      expiredSubmission.start(expiredQuiz.getDueDate());

      // Manually set startedAt to 2 minutes ago to simulate expired time
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      (expiredSubmission as any).startedAt = twoMinutesAgo;

      mockQuizRepository.findById.mockResolvedValue(expiredQuiz);
      mockQuizSubmissionRepository.findById.mockResolvedValue(expiredSubmission);

      // Act & Assert
      await expect(
        useCase.execute(expiredSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toThrow(ApplicationError);

      await expect(
        useCase.execute(expiredSubmission.getId(), mockUser.getId(), autoSaveDTO)
      ).rejects.toMatchObject({
        code: 'RESOURCE_CLOSED',
        statusCode: 400
      });
    });

    it('should update answers with multiple questions', async () => {
      // Arrange
      const multiAnswerDTO: AutoSaveQuizDTO = {
        answers: [
          { questionIndex: 0, answer: 1 },
          { questionIndex: 1, answer: 'Essay answer text' }
        ]
      };

      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        multiAnswerDTO
      );

      // Assert
      expect(result.answers).toHaveLength(2);
      expect(result.answers[0].questionIndex).toBe(0);
      expect(result.answers[0].answer).toBe(1);
      expect(result.answers[1].questionIndex).toBe(1);
      expect(result.answers[1].answer).toBe('Essay answer text');
    });

    it('should allow auto-save with empty answers', async () => {
      // Arrange
      const emptyAnswersDTO: AutoSaveQuizDTO = {
        answers: []
      };

      // Act
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        emptyAnswersDTO
      );

      // Assert
      expect(result.answers).toHaveLength(0);
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled();
    });

    it('should allow auto-save multiple times', async () => {
      // Act - First auto-save
      await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        { answers: [{ questionIndex: 0, answer: 1 }] }
      );

      // Act - Second auto-save with updated answer
      const result = await useCase.execute(
        mockSubmission.getId(),
        mockUser.getId(),
        { answers: [{ questionIndex: 0, answer: 2 }] }
      );

      // Assert
      expect(result.answers[0].answer).toBe(2);
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
