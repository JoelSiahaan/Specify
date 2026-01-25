/**
 * ListQuizzesUseCase Unit Tests
 * 
 * Tests the quiz listing use case with enrollment and ownership validation.
 * 
 * Requirements:
 * - 11.14: View all quizzes for a course
 */

import { ListQuizzesUseCase } from '../ListQuizzesUseCase';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import type { IQuizRepository } from '../../../../domain/repositories/IQuizRepository';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import type { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository';
import type { IQuizSubmissionRepository } from '../../../../domain/repositories/IQuizSubmissionRepository';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Quiz, QuestionType } from '../../../../domain/entities/Quiz';
import { Enrollment } from '../../../../domain/entities/Enrollment';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission';
import { ApplicationError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('ListQuizzesUseCase', () => {
  let useCase: ListQuizzesUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockQuizRepository: jest.Mocked<IQuizRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let mockQuizSubmissionRepository: jest.Mocked<IQuizSubmissionRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let quizId1: string;
  let quizId2: string;
  let submissionId: string;
  let teacher: User;
  let student: User;
  let course: Course;
  let quiz1: Quiz;
  let quiz2: Quiz;
  let enrollment: Enrollment;
  let submission: QuizSubmission;

  beforeEach(() => {
    jest.clearAllMocks();

    // Generate test IDs
    teacherId = randomUUID();
    studentId = randomUUID();
    courseId = randomUUID();
    quizId1 = randomUUID();
    quizId2 = randomUUID();
    submissionId = randomUUID();

    // Create test entities
    teacher = User.create({
      id: teacherId,
      email: 'teacher@example.com',
      name: 'Teacher User',
      role: Role.TEACHER,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    student = User.create({
      id: studentId,
      email: 'student@example.com',
      name: 'Student User',
      role: Role.STUDENT,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    course = Course.create({
      id: courseId,
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'TEST123',
      status: CourseStatus.ACTIVE,
      teacherId: teacherId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    quiz1 = Quiz.create({
      id: quizId1,
      courseId: courseId,
      title: 'Quiz 1',
      description: 'First quiz',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
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

    quiz2 = Quiz.create({
      id: quizId2,
      courseId: courseId,
      title: 'Quiz 2',
      description: 'Second quiz',
      dueDate: new Date(Date.now() + 172800000), // 2 days from now
      timeLimit: 90,
      questions: [
        {
          type: QuestionType.ESSAY,
          questionText: 'Explain the concept'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    enrollment = Enrollment.create({
      id: randomUUID(),
      studentId: studentId,
      courseId: courseId,
      enrolledAt: new Date()
    });

    submission = QuizSubmission.reconstitute({
      id: submissionId,
      quizId: quizId1,
      studentId: studentId,
      startedAt: new Date(),
      submittedAt: new Date(),
      answers: [{ questionIndex: 0, answer: '4' }],
      grade: 85,
      feedback: 'Good work',
      status: QuizSubmissionStatus.GRADED,
      version: 1
    });

    // Mock repositories
    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByTeacherId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ICourseRepository>;

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

    mockEnrollmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByStudentAndCourse: jest.fn(),
      findByStudentId: jest.fn(),
      findByCourse: jest.fn(),
      delete: jest.fn(),
      deleteByCourseId: jest.fn(),
      deleteAllByCourse: jest.fn()
    } as jest.Mocked<IEnrollmentRepository>;

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

    // Create use case with mocked dependencies
    useCase = new ListQuizzesUseCase(
      mockCourseRepository,
      mockQuizRepository,
      mockUserRepository,
      mockEnrollmentRepository,
      mockQuizSubmissionRepository,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    it('should return quizzes for enrolled student', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      mockAuthPolicy.canViewAssignments.mockReturnValue(true);
      mockQuizRepository.findByCourseId.mockResolvedValue([quiz1, quiz2]);
      mockQuizSubmissionRepository.findByQuizAndStudent.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(courseId, studentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(quizId1);
      expect(result[0].title).toBe('Quiz 1');
      expect(result[0].hasSubmission).toBe(false);
      expect(result[1].id).toBe(quizId2);
      expect(result[1].title).toBe('Quiz 2');
      expect(result[1].hasSubmission).toBe(false);
      expect(mockAuthPolicy.canViewAssignments).toHaveBeenCalledWith(
        student,
        course,
        { isEnrolled: true }
      );
    });

    it('should return quizzes with submission status for student', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      mockAuthPolicy.canViewAssignments.mockReturnValue(true);
      mockQuizRepository.findByCourseId.mockResolvedValue([quiz1, quiz2]);
      mockQuizSubmissionRepository.findByQuizAndStudent
        .mockResolvedValueOnce(submission) // Quiz 1 has submission
        .mockResolvedValueOnce(null);       // Quiz 2 has no submission

      // Act
      const result = await useCase.execute(courseId, studentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].hasSubmission).toBe(true);
      expect(result[0].submissionId).toBe(submissionId);
      expect(result[0].isGraded).toBe(true);
      expect(result[0].grade).toBe(85);
      expect(result[1].hasSubmission).toBe(false);
    });

    it('should return quizzes for course owner (teacher)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockAuthPolicy.canViewAssignments.mockReturnValue(true);
      mockQuizRepository.findByCourseId.mockResolvedValue([quiz1, quiz2]);

      // Act
      const result = await useCase.execute(courseId, teacherId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(quizId1);
      expect(result[0].hasSubmission).toBeUndefined(); // Teachers don't see submission status
      expect(result[1].id).toBe(quizId2);
      expect(result[1].hasSubmission).toBeUndefined();
      expect(mockAuthPolicy.canViewAssignments).toHaveBeenCalledWith(
        teacher,
        course,
        { isEnrolled: false }
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(courseId, studentId)).rejects.toThrow(
        new ApplicationError('AUTH_REQUIRED', 'User not found', 401)
      );
    });

    it('should throw error if course not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(courseId, studentId)).rejects.toThrow(
        new ApplicationError('RESOURCE_NOT_FOUND', 'Course not found', 404)
      );
    });

    it('should throw error if student not enrolled', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockAuthPolicy.canViewAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(courseId, studentId)).rejects.toThrow(
        new ApplicationError(
          'FORBIDDEN_RESOURCE',
          'You do not have permission to view quizzes for this course',
          403
        )
      );
    });

    it('should throw error if teacher not owner', async () => {
      // Arrange
      const otherTeacherId = randomUUID();
      const otherTeacher = User.create({
        id: otherTeacherId,
        email: 'other@example.com',
        name: 'Other Teacher',
        role: Role.TEACHER,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findById.mockResolvedValue(otherTeacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockAuthPolicy.canViewAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(courseId, otherTeacherId)).rejects.toThrow(
        new ApplicationError(
          'FORBIDDEN_RESOURCE',
          'You do not have permission to view quizzes for this course',
          403
        )
      );
    });

    it('should return empty array if no quizzes exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      mockAuthPolicy.canViewAssignments.mockReturnValue(true);
      mockQuizRepository.findByCourseId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(courseId, studentId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
