/**
 * GradeSubmissionUseCase Unit Tests
 * 
 * Tests the grading of assignment submissions with teacher authorization,
 * optimistic locking, grade validation, and assignment locking.
 * 
 * Requirements:
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 * - 13.2: Display all submitted content
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 13.5: Allow teachers to edit grades after saving
 * - 21.5: Handle concurrent user requests without data corruption
 */

import { GradeSubmissionUseCase } from '../GradeSubmissionUseCase';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository';
import { IAssignmentSubmissionRepository } from '../../../../domain/repositories/IAssignmentSubmissionRepository';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '../../../../domain/entities/AssignmentSubmission';
import { GradeAssignmentSubmissionDTO } from '../../../dtos/AssignmentDTO';
import { NotFoundError, ForbiddenError, ApplicationError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('GradeSubmissionUseCase', () => {
  let useCase: GradeSubmissionUseCase;
  let mockAssignmentRepo: jest.Mocked<IAssignmentRepository>;
  let mockSubmissionRepo: jest.Mocked<IAssignmentSubmissionRepository>;
  let mockCourseRepo: jest.Mocked<ICourseRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let assignmentId: string;
  let submissionId: string;
  let teacher: User;
  let student: User;
  let course: Course;
  let assignment: Assignment;
  let submission: AssignmentSubmission;

  beforeEach(() => {
    jest.clearAllMocks();

    // Generate test IDs
    teacherId = randomUUID();
    studentId = randomUUID();
    courseId = randomUUID();
    assignmentId = randomUUID();
    submissionId = randomUUID();

    // Create test entities
    teacher = User.create({
      id: teacherId,
      email: 'teacher@example.com',
      name: 'Test Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    student = User.create({
      id: studentId,
      email: 'student@example.com',
      name: 'Test Student',
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
      teacherId: teacherId,
      status: CourseStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    assignment = Assignment.create({
      id: assignmentId,
      courseId: courseId,
      title: 'Test Assignment',
      description: 'Test Description',
      dueDate: futureDate,
      submissionType: SubmissionType.TEXT,
      acceptedFileFormats: [],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    submission = AssignmentSubmission.create({
      id: submissionId,
      assignmentId: assignmentId,
      studentId: studentId,
      content: 'Test submission content',
      isLate: false,
      status: AssignmentSubmissionStatus.SUBMITTED,
      version: 0,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create mocks
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    mockSubmissionRepo = {
      findById: jest.fn(),
      findByAssignmentAndStudent: jest.fn(),
      findByAssignmentId: jest.fn(),
      findByStudentId: jest.fn(),
      findByCourseId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByAssignmentIdAndStatus: jest.fn(),
      findGradedByStudentAndCourse: jest.fn()
    } as jest.Mocked<IAssignmentSubmissionRepository>;

    mockAssignmentRepo = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCourseIdWithSubmissionCounts: jest.fn(),
      closeAllByCourseId: jest.fn()
    } as jest.Mocked<IAssignmentRepository>;

    mockCourseRepo = {
      findById: jest.fn(),
      findByTeacherId: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ICourseRepository>;

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
    useCase = new GradeSubmissionUseCase(
      mockAssignmentRepo,
      mockSubmissionRepo,
      mockCourseRepo,
      mockUserRepo,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    it('should grade a submission successfully (Requirement 13.4)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!',
        version: 0
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(result).toBeDefined();
      expect(result.grade).toBe(85);
      expect(result.feedback).toBe('Good work!');
      expect(result.status).toBe(AssignmentSubmissionStatus.GRADED);
      expect(mockAssignmentRepo.update).toHaveBeenCalledTimes(1);
      expect(mockSubmissionRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should lock assignment on first grade (Requirement 13.1)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 90,
        feedback: 'Excellent!',
        version: 0
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(assignment.hasGradingStarted()).toBe(true);
      expect(mockAssignmentRepo.update).toHaveBeenCalledWith(assignment);
    });

    it('should not lock assignment if already locked (Requirement 13.1)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 90,
        feedback: 'Excellent!',
        version: 0
      };

      // Start grading on assignment
      assignment.startGrading();

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(mockAssignmentRepo.update).not.toHaveBeenCalled();
    });

    it('should update existing grade (Requirement 13.5)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 95,
        feedback: 'Updated feedback',
        version: 1
      };

      // Grade the submission first
      submission.assignGrade(85, 'Original feedback', 0);

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(result.grade).toBe(95);
      expect(result.feedback).toBe('Updated feedback');
      expect(result.version).toBe(2); // Version incremented
    });

    it('should throw NotFoundError if user not found', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('User not found');
    });

    it('should throw NotFoundError if submission not found', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Submission not found');
    });

    it('should throw NotFoundError if assignment not found', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw NotFoundError if course not found', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Course not found');
    });

    it('should throw ForbiddenError if user is not authorized (Requirement 2.1, 2.2)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(ForbiddenError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('You do not have permission to grade submissions in this course');
    });

    it('should throw ApplicationError if grade is invalid (Requirement 13.3)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 150, // Invalid: > 100
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(ApplicationError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Grade must be between 0 and 100');
    });

    it('should throw ApplicationError if grade is negative (Requirement 13.3)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: -10, // Invalid: < 0
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(ApplicationError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Grade must be between 0 and 100');
    });

    it('should throw ApplicationError if grade is not a number (Requirement 13.3)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: NaN,
        feedback: 'Good work!'
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(ApplicationError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('Grade must be a valid number');
    });

    it('should handle optimistic locking conflict (Requirement 21.5)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        feedback: 'Good work!',
        version: 0 // Stale version
      };

      // Simulate version mismatch by incrementing submission version
      submission.assignGrade(90, 'Another teacher graded first', 0);

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);

      // Act & Assert
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow(ApplicationError);
      await expect(
        useCase.execute(gradeDTO, submissionId, teacherId)
      ).rejects.toThrow('This submission has been modified by another user');
    });

    it('should accept grade of 0 (Requirement 13.3)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 0,
        feedback: 'Needs improvement',
        version: 0
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(result.grade).toBe(0);
    });

    it('should accept grade of 100 (Requirement 13.3)', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 100,
        feedback: 'Perfect!',
        version: 0
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(result.grade).toBe(100);
    });

    it('should allow grading without feedback', async () => {
      // Arrange
      const gradeDTO: GradeAssignmentSubmissionDTO = {
        grade: 85,
        version: 0
      };

      mockUserRepo.findById.mockResolvedValue(teacher);
      mockSubmissionRepo.findById.mockResolvedValue(submission);
      mockAssignmentRepo.findById.mockResolvedValue(assignment);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockAssignmentRepo.update.mockResolvedValue(assignment);
      mockSubmissionRepo.update.mockResolvedValue(submission);

      // Act
      const result = await useCase.execute(gradeDTO, submissionId, teacherId);

      // Assert
      expect(result.grade).toBe(85);
      expect(result.feedback).toBeUndefined();
    });
  });
});
