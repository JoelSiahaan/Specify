/**
 * GradeQuizSubmissionUseCase Unit Tests
 * 
 * Tests the grading of quiz submissions with manual point assignment per question.
 * 
 * Requirements:
 * - 13.7: Mark submission as graded
 * - 13.8: Allow teachers to manually assign points per question
 * - 13.9: Display warning if sum of assigned points does not equal 100
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 13.5: Allow teachers to edit grades after saving
 * - 13.6: Allow teachers to add text feedback
 */

import { GradeQuizSubmissionUseCase } from '../GradeQuizSubmissionUseCase.js';
import { IQuizRepository } from '../../../../domain/repositories/IQuizRepository.js';
import { IQuizSubmissionRepository } from '../../../../domain/repositories/IQuizSubmissionRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz.js';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission.js';
import { NotFoundError, ForbiddenError, ApplicationError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('GradeQuizSubmissionUseCase', () => {
  let useCase: GradeQuizSubmissionUseCase;
  let mockQuizRepo: jest.Mocked<IQuizRepository>;
  let mockSubmissionRepo: jest.Mocked<IQuizSubmissionRepository>;
  let mockCourseRepo: jest.Mocked<ICourseRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let teacher: User;
  let student: User;
  let course: Course;
  let quiz: Quiz;
  let submission: QuizSubmission;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
    mockQuizRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByCourseId: jest.fn(),
      hasSubmissions: jest.fn()
    } as jest.Mocked<IQuizRepository>;

    mockSubmissionRepo = {
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

    mockCourseRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTeacherId: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ICourseRepository>;

    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    mockAuthPolicy = {
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
    } as jest.Mocked<IAuthorizationPolicy>;

    // Create use case with mocks
    useCase = new GradeQuizSubmissionUseCase(
      mockQuizRepo,
      mockSubmissionRepo,
      mockCourseRepo,
      mockUserRepo,
      mockAuthPolicy
    );

    // Create test data
    teacher = User.create({
      id: randomUUID(),
      email: 'teacher@example.com',
      name: 'Teacher User',
      role: Role.TEACHER,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    student = User.create({
      id: randomUUID(),
      email: 'student@example.com',
      name: 'Student User',
      role: Role.STUDENT,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    course = Course.create({
      id: randomUUID(),
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'TEST123',
      status: CourseStatus.ACTIVE,
      teacherId: teacher.getId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    quiz = Quiz.create({
      id: randomUUID(),
      courseId: course.getId(),
      title: 'Test Quiz',
      description: 'Test Description',
      dueDate: futureDate,
      timeLimit: 60,
      questions: [
        {
          type: QuestionType.MCQ,
          questionText: 'Question 1',
          options: ['A', 'B', 'C'],
          correctAnswer: 0
        },
        {
          type: QuestionType.ESSAY,
          questionText: 'Question 2'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    submission = QuizSubmission.create(quiz.getId(), student.getId());
    submission.start(futureDate);
    submission.submit(
      [
        { questionIndex: 0, answer: 0 },
        { questionIndex: 1, answer: 'Essay answer' }
      ],
      60,
      false
    );
  });

  describe('Successful grading', () => {
    it('should grade quiz submission with manual points per question', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50],
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(dto, submission.getId(), teacher.getId());

      // Assert
      expect(result.submission.grade).toBe(100);
      expect(result.submission.feedback).toBe('Good work!');
      expect(result.submission.status).toBe(QuizSubmissionStatus.GRADED);
      expect(result.warning).toBeUndefined();
      expect(mockSubmissionRepo.update).toHaveBeenCalledWith(submission);
    });

    it('should display warning when points do not sum to 100', async () => {
      // Arrange
      const dto = {
        questionPoints: [40, 50], // Total = 90
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(dto, submission.getId(), teacher.getId());

      // Assert
      expect(result.submission.grade).toBe(90);
      expect(result.warning).toBe('Warning: The total points (90) do not equal 100. Please verify the point distribution.');
      expect(mockSubmissionRepo.update).toHaveBeenCalledWith(submission);
    });

    it('should allow updating existing grade', async () => {
      // Arrange
      submission.setGrade(80, 'Initial feedback');
      
      const dto = {
        questionPoints: [60, 40],
        feedback: 'Updated feedback'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(dto, submission.getId(), teacher.getId());

      // Assert
      expect(result.submission.grade).toBe(100);
      expect(result.submission.feedback).toBe('Updated feedback');
      expect(mockSubmissionRepo.update).toHaveBeenCalledWith(submission);
    });

    it('should allow grading without feedback', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(dto, submission.getId(), teacher.getId());

      // Assert
      expect(result.submission.grade).toBe(100);
      expect(result.submission.feedback).toBeNull();
      expect(mockSubmissionRepo.update).toHaveBeenCalledWith(submission);
    });
  });

  describe('Validation errors', () => {
    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), 'invalid-user-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when submission not found', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(dto, 'invalid-submission-id', teacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when quiz not found', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when course not found', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not authorized', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 50]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ApplicationError when question points is not an array', async () => {
      // Arrange
      const dto = {
        questionPoints: 'not-an-array' as any
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw ApplicationError when question points array length does not match quiz questions', async () => {
      // Arrange
      const dto = {
        questionPoints: [50] // Only 1 point, but quiz has 2 questions
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw ApplicationError when question points contain non-numeric values', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, 'invalid' as any]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw ApplicationError when question points contain negative values', async () => {
      // Arrange
      const dto = {
        questionPoints: [50, -10]
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw ApplicationError when total grade exceeds 100', async () => {
      // Arrange
      const dto = {
        questionPoints: [60, 50] // Total = 110
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockQuizRepo.findById.mockResolvedValue(quiz);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(dto, submission.getId(), teacher.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });
});
