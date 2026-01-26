/**
 * ListSubmissionsUseCase Unit Tests
 * 
 * Tests the ListSubmissionsUseCase for listing all submissions for an assignment.
 * 
 * Requirements:
 * - 14.1: Display all student submissions for an assignment
 * - 14.2: Show submission status (not submitted, submitted, graded, late)
 */

import { ListSubmissionsUseCase } from '../ListSubmissionsUseCase';
import type { IAssignmentSubmissionRepository } from '../../../../domain/repositories/IAssignmentSubmissionRepository';
import type { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '../../../../domain/entities/AssignmentSubmission';
import { ForbiddenError, NotFoundError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('ListSubmissionsUseCase', () => {
  let useCase: ListSubmissionsUseCase;
  let mockSubmissionRepository: jest.Mocked<IAssignmentSubmissionRepository>;
  let mockAssignmentRepository: jest.Mocked<IAssignmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  let teacherId: string;
  let courseId: string;
  let assignmentId: string;
  let studentId: string;

  let teacher: User;
  let course: Course;
  let assignment: Assignment;
  let submission: AssignmentSubmission;

  beforeEach(() => {
    jest.clearAllMocks();

    // Generate IDs
    teacherId = randomUUID();
    courseId = randomUUID();
    assignmentId = randomUUID();
    studentId = randomUUID();

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

    assignment = Assignment.create({
      id: assignmentId,
      courseId: courseId,
      title: 'Test Assignment',
      description: 'Test Description',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      submissionType: SubmissionType.FILE,
      acceptedFileFormats: ['pdf'],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    submission = AssignmentSubmission.create({
      id: randomUUID(),
      assignmentId: assignmentId,
      studentId: studentId,
      content: undefined,
      filePath: 'uploads/test.pdf',
      fileName: 'test.pdf',
      grade: undefined,
      feedback: undefined,
      isLate: false,
      status: AssignmentSubmissionStatus.SUBMITTED,
      version: 1,
      submittedAt: new Date(),
      gradedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock repositories
    mockSubmissionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAssignmentAndStudent: jest.fn(),
      findByAssignmentId: jest.fn(),
      findByStudentId: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByAssignmentIdAndStatus: jest.fn(),
      findGradedByStudentAndCourse: jest.fn()
    } as jest.Mocked<IAssignmentSubmissionRepository>;

    mockAssignmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCourseIdWithSubmissionCounts: jest.fn(),
      closeAllByCourseId: jest.fn()
    } as jest.Mocked<IAssignmentRepository>;

    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTeacherId: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findActiveBySearchTerm: jest.fn()
    } as jest.Mocked<ICourseRepository>;

    mockUserRepository = {
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

    // Create use case with mocked dependencies
    useCase = new ListSubmissionsUseCase(
      mockSubmissionRepository,
      mockAssignmentRepository,
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('execute', () => {
    it('should list all submissions for an assignment when teacher is authorized', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepository.findByAssignmentId.mockResolvedValue([submission]);

      // Act
      const result = await useCase.execute(assignmentId, teacherId);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(submission.getId());
      expect(result.data[0].assignmentId).toBe(assignmentId);
      expect(result.data[0].studentId).toBe(studentId);
      expect(result.data[0].status).toBe(AssignmentSubmissionStatus.SUBMITTED);
      expect(result.data[0].isLate).toBe(false);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(teacherId);
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(assignmentId);
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockAuthPolicy.canGradeSubmissions).toHaveBeenCalledWith(teacher, course);
      expect(mockSubmissionRepository.findByAssignmentId).toHaveBeenCalledWith(assignmentId);
    });

    it('should return empty array when no submissions exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepository.findByAssignmentId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(assignmentId, teacherId);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(mockSubmissionRepository.findByAssignmentId).toHaveBeenCalledWith(assignmentId);
    });

    it('should return multiple submissions with different statuses', async () => {
      // Arrange
      const submission1 = AssignmentSubmission.create({
        id: randomUUID(),
        assignmentId: assignmentId,
        studentId: randomUUID(),
        content: undefined,
        filePath: 'uploads/test1.pdf',
        fileName: 'test1.pdf',
        grade: undefined,
        feedback: undefined,
        isLate: false,
        status: AssignmentSubmissionStatus.SUBMITTED,
        version: 1,
        submittedAt: new Date(),
        gradedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const submission2 = AssignmentSubmission.create({
        id: randomUUID(),
        assignmentId: assignmentId,
        studentId: randomUUID(),
        content: undefined,
        filePath: 'uploads/test2.pdf',
        fileName: 'test2.pdf',
        grade: 85,
        feedback: 'Good work',
        isLate: false,
        status: AssignmentSubmissionStatus.GRADED,
        version: 1,
        submittedAt: new Date(),
        gradedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const submission3 = AssignmentSubmission.create({
        id: randomUUID(),
        assignmentId: assignmentId,
        studentId: randomUUID(),
        content: undefined,
        filePath: 'uploads/test3.pdf',
        fileName: 'test3.pdf',
        grade: undefined,
        feedback: undefined,
        isLate: true,
        status: AssignmentSubmissionStatus.SUBMITTED,
        version: 1,
        submittedAt: new Date(),
        gradedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(true);
      mockSubmissionRepository.findByAssignmentId.mockResolvedValue([
        submission1,
        submission2,
        submission3
      ]);

      // Act
      const result = await useCase.execute(assignmentId, teacherId);

      // Assert
      expect(result.data).toHaveLength(3);
      
      // Check submitted submission
      expect(result.data[0].status).toBe(AssignmentSubmissionStatus.SUBMITTED);
      expect(result.data[0].isLate).toBe(false);
      expect(result.data[0].grade).toBeUndefined();
      
      // Check graded submission
      expect(result.data[1].status).toBe(AssignmentSubmissionStatus.GRADED);
      expect(result.data[1].grade).toBe(85);
      expect(result.data[1].feedback).toBe('Good work');
      
      // Check late submission
      expect(result.data[2].status).toBe(AssignmentSubmissionStatus.SUBMITTED);
      expect(result.data[2].isLate).toBe(true);
    });

    it('should throw ForbiddenError when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(assignmentId, teacherId))
        .rejects.toThrow(ForbiddenError);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(teacherId);
    });

    it('should throw NotFoundError when assignment not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(assignmentId, teacherId))
        .rejects.toThrow(NotFoundError);
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(assignmentId);
    });

    it('should throw NotFoundError when course not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(assignmentId, teacherId))
        .rejects.toThrow(NotFoundError);
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
    });

    it('should throw ForbiddenError when teacher does not own the course', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(assignmentId, teacherId))
        .rejects.toThrow(ForbiddenError);
      expect(mockAuthPolicy.canGradeSubmissions).toHaveBeenCalledWith(teacher, course);
    });

    it('should throw ForbiddenError when user is a student', async () => {
      // Arrange
      const student = User.create({
        id: studentId,
        email: 'student@example.com',
        name: 'Student User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findById.mockResolvedValue(student);
      mockAssignmentRepository.findById.mockResolvedValue(assignment);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthPolicy.canGradeSubmissions.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(assignmentId, studentId))
        .rejects.toThrow(ForbiddenError);
      expect(mockAuthPolicy.canGradeSubmissions).toHaveBeenCalledWith(student, course);
    });
  });
});
