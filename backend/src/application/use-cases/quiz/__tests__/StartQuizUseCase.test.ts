/**
 * StartQuizUseCase Unit Tests
 * 
 * Tests the StartQuizUseCase with mocked dependencies.
 * Validates student enrollment, due date validation, and prevention of multiple attempts.
 * 
 * Requirements:
 * - 12.1: Display quiz info before starting
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time
 * - 12.9: Prevent multiple submissions
 */

import { StartQuizUseCase } from '../StartQuizUseCase.js';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository.js';
import { IQuizSubmissionRepository } from '../../../../domain/repositories/IQuizSubmissionRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz.js';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission.js';
import { Enrollment } from '../../../../domain/entities/Enrollment.js';
import { ApplicationError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('StartQuizUseCase', () => {
  let useCase: StartQuizUseCase;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockQuizSubmissionRepository: jest.Mocked<IQuizSubmissionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let studentId: string;
  let teacherId: string;
  let courseId: string;
  let quizId: string;
  let student: User;
  let teacher: User;
  let course: Course;
  let quiz: Quiz;
  let enrollment: Enrollment;

  beforeEach(() => {
    jest.clearAllMocks();

    // Generate test IDs
    studentId = randomUUID();
    teacherId = randomUUID();
    courseId = randomUUID();
    quizId = randomUUID();

    // Create test entities
    student = User.create({
      id: studentId,
      email: 'student@example.com',
      name: 'Test Student',
      role: Role.STUDENT,
      passwordHash: 'hashed_password'
    });

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

    // Create quiz with future due date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    quiz = Quiz.create({
      id: quizId,
      courseId: courseId,
      title: 'Test Quiz',
      description: 'Test Description',
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

    enrollment = Enrollment.create({
      id: randomUUID(),
      studentId: studentId,
      courseId: courseId
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

    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByTeacherId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ICourseRepository>;

    mockEnrollmentRepository = {
      save: jest.fn(),
      findByStudentAndCourse: jest.fn(),
      findByCourse: jest.fn(),
      findByStudentId: jest.fn(),
      deleteAllByCourse: jest.fn()
    } as jest.Mocked<IEnrollmentRepository>;

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
    mockUserRepository.findById.mockResolvedValue(student);
    mockQuizRepository.findById.mockResolvedValue(quiz);
    mockCourseRepository.findById.mockResolvedValue(course);
    mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
    mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(null);
    mockAuthPolicy.canSubmitAssignment.mockReturnValue(true);

    // Create use case with mocked dependencies
    useCase = new StartQuizUseCase(
      mockQuizRepository,
      mockQuizSubmissionRepository,
      mockUserRepository,
      mockCourseRepository,
      mockEnrollmentRepository,
      mockAuthPolicy
    );
  });

  describe('Successful quiz start', () => {
    it('should start quiz for enrolled student with valid quiz', async () => {
      // Arrange
      const savedSubmission = QuizSubmission.create(quizId, studentId);
      savedSubmission.start(quiz.getDueDate());
      mockQuizSubmissionRepository.save.mockResolvedValue(savedSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.quizId).toBe(quizId);
      expect(result.submissionId).toBe(savedSubmission.getId());
      expect(result.title).toBe('Test Quiz');
      expect(result.timeLimit).toBe(60);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].questionText).toBe('What is 2+2?');
      expect(result.questions[0].options).toEqual(['3', '4', '5']);
      // Verify correct answer is NOT included in response
      expect((result.questions[0] as any).correctAnswer).toBeUndefined();
      expect(result.startedAt).toBeDefined();
      expect(result.remainingTimeSeconds).toBeGreaterThan(0);
      expect(result.currentAnswers).toEqual([]);

      // Verify repository calls
      expect(mockUserRepository.findById).toHaveBeenCalledWith(studentId);
      expect(mockQuizRepository.findById).toHaveBeenCalledWith(quizId);
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockEnrollmentRepository.findByStudentAndCourse).toHaveBeenCalledWith(studentId, courseId);
      expect(mockQuizSubmissionRepository.findByQuizAndStudent).toHaveBeenCalledWith(quizId, studentId);
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled();
    });

    it('should create submission with IN_PROGRESS status', async () => {
      // Arrange
      const savedSubmission = QuizSubmission.create(quizId, studentId);
      savedSubmission.start(quiz.getDueDate());
      mockQuizSubmissionRepository.save.mockResolvedValue(savedSubmission);

      // Act
      await useCase.execute(quizId, studentId);

      // Assert
      const saveCall = mockQuizSubmissionRepository.save.mock.calls[0][0];
      expect(saveCall.getStatus()).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(saveCall.getStartedAt()).toBeDefined();
      expect(saveCall.getSubmittedAt()).toBeNull();
    });
  });

  describe('Authorization validation', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('AUTH_REQUIRED', 'User not found', 401)
      );
    });

    it('should throw error when student not enrolled in course', async () => {
      // Arrange
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockAuthPolicy.canSubmitAssignment.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('NOT_ENROLLED', 'You must be enrolled in the course to start this quiz', 403)
      );
    });

    it('should throw error when teacher tries to start quiz', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAuthPolicy.canSubmitAssignment.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(quizId, teacherId)).rejects.toThrow(
        new ApplicationError('NOT_ENROLLED', 'You must be enrolled in the course to start this quiz', 403)
      );
    });
  });

  describe('Quiz validation', () => {
    it('should throw error when quiz not found', async () => {
      // Arrange
      mockQuizRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('RESOURCE_NOT_FOUND', 'Quiz not found', 404)
      );
    });

    it('should throw error when course not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('RESOURCE_NOT_FOUND', 'Course not found', 404)
      );
    });

    it('should throw error when quiz is past due date', async () => {
      // Arrange
      // Mock the quiz's isPastDueDate method to return true
      const pastQuiz = quiz;
      jest.spyOn(pastQuiz, 'isPastDueDate').mockReturnValue(true);
      mockQuizRepository.findById.mockResolvedValue(pastQuiz);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('RESOURCE_CLOSED', 'Cannot start quiz after due date', 400)
      );
    });
  });

  describe('Multiple submission prevention and resume functionality', () => {
    it('should allow student to resume in-progress quiz (browser crash recovery)', async () => {
      // Arrange
      const existingSubmission = QuizSubmission.create(quizId, studentId);
      existingSubmission.start(quiz.getDueDate());
      // Add some saved answers to simulate auto-save
      existingSubmission.updateAnswers([
        { questionIndex: 0, answer: 1 }
      ]);
      mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(existingSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.quizId).toBe(quizId);
      expect(result.submissionId).toBe(existingSubmission.getId());
      expect(result.currentAnswers).toHaveLength(1);
      expect(result.currentAnswers[0].answer).toBe(1);
      expect(result.startedAt).toBeDefined();
      expect(result.remainingTimeSeconds).toBeGreaterThan(0);

      // Verify repository was NOT called to save (resume, not create)
      expect(mockQuizSubmissionRepository.save).not.toHaveBeenCalled();
    });

    it('should auto-submit quiz when time expired on resume', async () => {
      // Arrange
      const existingSubmission = QuizSubmission.create(quizId, studentId);
      existingSubmission.start(quiz.getDueDate());
      
      // Add some saved answers to simulate auto-save
      existingSubmission.updateAnswers([
        { questionIndex: 0, answer: 1 }
      ]);
      
      // Mock isTimeExpired to return true (time has expired)
      jest.spyOn(existingSubmission, 'isTimeExpired').mockReturnValue(true);
      
      // Mock autoSubmit to change status to SUBMITTED
      const autoSubmitSpy = jest.spyOn(existingSubmission, 'autoSubmit').mockImplementation(() => {
        // Simulate what autoSubmit does - change status to SUBMITTED
        (existingSubmission as any).status = QuizSubmissionStatus.SUBMITTED;
        (existingSubmission as any).submittedAt = new Date();
        (existingSubmission as any).completedAt = new Date();
      });
      
      mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(existingSubmission);
      mockQuizSubmissionRepository.save.mockResolvedValue(existingSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.timeExpired).toBe(true); // Flag indicating auto-submit
      expect(result.remainingTimeSeconds).toBe(0); // Time expired
      expect(result.questions).toEqual([]); // Empty questions since quiz is already submitted
      expect(result.currentAnswers).toHaveLength(1); // Saved answers returned
      expect(result.currentAnswers[0].answer).toBe(1);
      expect(autoSubmitSpy).toHaveBeenCalledWith(quiz.getTimeLimit());
      expect(mockQuizSubmissionRepository.save).toHaveBeenCalled(); // Auto-submit saves
    });

    it('should throw error when student has already submitted quiz', async () => {
      // Arrange
      const existingSubmission = QuizSubmission.create(quizId, studentId);
      existingSubmission.start(quiz.getDueDate());
      existingSubmission.submit([], quiz.getTimeLimit(), false);
      mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(existingSubmission);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('QUIZ_ALREADY_SUBMITTED', 'You have already submitted this quiz', 409)
      );
    });

    it('should throw error when student tries to start graded quiz', async () => {
      // Arrange
      const existingSubmission = QuizSubmission.create(quizId, studentId);
      existingSubmission.start(quiz.getDueDate());
      existingSubmission.submit([], quiz.getTimeLimit(), false);
      existingSubmission.setGrade(85, 'Good work');
      mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(existingSubmission);

      // Act & Assert
      await expect(useCase.execute(quizId, studentId)).rejects.toThrow(
        new ApplicationError('QUIZ_ALREADY_SUBMITTED', 'You have already submitted this quiz', 409)
      );
    });
  });

  describe('Quiz attempt DTO', () => {
    it('should return quiz with questions but without correct answers', async () => {
      // Arrange
      const savedSubmission = QuizSubmission.create(quizId, studentId);
      savedSubmission.start(quiz.getDueDate());
      mockQuizSubmissionRepository.save.mockResolvedValue(savedSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].type).toBe('MCQ');
      expect(result.questions[0].questionText).toBe('What is 2+2?');
      expect(result.questions[0].options).toEqual(['3', '4', '5']);
      // Verify correct answer is NOT included
      expect((result.questions[0] as any).correctAnswer).toBeUndefined();
    });

    it('should return remaining time in seconds', async () => {
      // Arrange
      const savedSubmission = QuizSubmission.create(quizId, studentId);
      savedSubmission.start(quiz.getDueDate());
      mockQuizSubmissionRepository.save.mockResolvedValue(savedSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert - Allow 1 second tolerance for test execution time
      expect(result.remainingTimeSeconds).toBeGreaterThanOrEqual(3599);
      expect(result.remainingTimeSeconds).toBeLessThanOrEqual(3600);
      expect(result.timeLimit).toBe(60);
    });

    it('should return empty current answers for new submission', async () => {
      // Arrange
      const savedSubmission = QuizSubmission.create(quizId, studentId);
      savedSubmission.start(quiz.getDueDate());
      mockQuizSubmissionRepository.save.mockResolvedValue(savedSubmission);

      // Act
      const result = await useCase.execute(quizId, studentId);

      // Assert
      expect(result.currentAnswers).toEqual([]);
    });
  });
});
