/**
 * GetSubmissionUseCase Unit Tests
 * 
 * Tests for retrieving submission with authorization validation.
 * 
 * Requirements:
 * - 10.12: Allow students to view their own submissions
 */

import { GetSubmissionUseCase } from '../GetSubmissionUseCase';
import { ISubmissionRepository } from '../../../../domain/repositories/ISubmissionRepository';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment';
import { Submission, SubmissionStatus } from '../../../../domain/entities/Submission';
import { NotFoundError, ForbiddenError } from '../../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';

describe('GetSubmissionUseCase', () => {
  let useCase: GetSubmissionUseCase;
  let mockSubmissionRepository: jest.Mocked<ISubmissionRepository>;
  let mockAssignmentRepository: jest.Mocked<IAssignmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  let mockTeacher: User;
  let mockStudent: User;
  let mockOtherStudent: User;
  let mockCourse: Course;
  let mockAssignment: Assignment;
  let mockSubmission: Submission;

  beforeEach(() => {
    jest.clearAllMocks();

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
    } as jest.Mocked<ISubmissionRepository>;

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
      findAll: jest.fn()
    } as jest.Mocked<ICourseRepository>;

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

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

    // Create mock entities
    mockTeacher = User.create({
      id: randomUUID(),
      email: 'teacher@example.com',
      name: 'Teacher User',
      role: Role.TEACHER,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockStudent = User.create({
      id: randomUUID(),
      email: 'student@example.com',
      name: 'Student User',
      role: Role.STUDENT,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockOtherStudent = User.create({
      id: randomUUID(),
      email: 'other@example.com',
      name: 'Other Student',
      role: Role.STUDENT,
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockCourse = Course.create({
      id: randomUUID(),
      name: 'Test Course',
      description: 'Test Description',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: mockTeacher.getId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    mockAssignment = Assignment.create({
      id: randomUUID(),
      courseId: mockCourse.getId(),
      title: 'Assignment 1',
      description: 'Complete the exercises',
      dueDate: futureDate,
      submissionType: SubmissionType.TEXT,
      acceptedFileFormats: [],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockSubmission = Submission.create({
      id: randomUUID(),
      assignmentId: mockAssignment.getId(),
      studentId: mockStudent.getId(),
      content: 'My submission content',
      isLate: false,
      status: SubmissionStatus.SUBMITTED,
      version: 0,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockStudent);
    mockSubmissionRepository.findById.mockResolvedValue(mockSubmission);
    mockAssignmentRepository.findById.mockResolvedValue(mockAssignment);
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockAuthPolicy.canViewSubmission.mockReturnValue(true);

    // Create use case instance
    useCase = new GetSubmissionUseCase(
      mockSubmissionRepository,
      mockAssignmentRepository,
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('Successful Submission Retrieval', () => {
    it('should retrieve submission when student views their own submission', async () => {
      // Act
      const result = await useCase.execute(mockSubmission.getId(), mockStudent.getId());

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubmission.getId());
      expect(result.assignmentId).toBe(mockAssignment.getId());
      expect(result.studentId).toBe(mockStudent.getId());
      expect(result.content).toBe('My submission content');
      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
    });

    it('should retrieve submission when teacher views student submission', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockTeacher);

      // Act
      const result = await useCase.execute(mockSubmission.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubmission.getId());
      expect(result.studentId).toBe(mockStudent.getId());
      expect(mockAuthPolicy.canViewSubmission).toHaveBeenCalledWith(
        mockTeacher,
        mockStudent.getId(),
        mockCourse
      );
    });

    it('should retrieve graded submission with grade and feedback', async () => {
      // Arrange
      const gradedSubmission = Submission.create({
        id: randomUUID(),
        assignmentId: mockAssignment.getId(),
        studentId: mockStudent.getId(),
        content: 'My submission content',
        grade: 85,
        feedback: 'Good work!',
        isLate: false,
        status: SubmissionStatus.GRADED,
        version: 1,
        submittedAt: new Date(),
        gradedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubmissionRepository.findById.mockResolvedValue(gradedSubmission);

      // Act
      const result = await useCase.execute(gradedSubmission.getId(), mockStudent.getId());

      // Assert
      expect(result.grade).toBe(85);
      expect(result.feedback).toBe('Good work!');
      expect(result.status).toBe(SubmissionStatus.GRADED);
      expect(result.gradedAt).toBeDefined();
    });

    it('should retrieve late submission', async () => {
      // Arrange
      const lateSubmission = Submission.create({
        id: randomUUID(),
        assignmentId: mockAssignment.getId(),
        studentId: mockStudent.getId(),
        content: 'My late submission',
        isLate: true,
        status: SubmissionStatus.SUBMITTED,
        version: 0,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubmissionRepository.findById.mockResolvedValue(lateSubmission);

      // Act
      const result = await useCase.execute(lateSubmission.getId(), mockStudent.getId());

      // Assert
      expect(result.isLate).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), 'invalid-user-id')
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute(mockSubmission.getId(), 'invalid-user-id')
      ).rejects.toThrow('User not found');
    });

    it('should throw error when submission is not found', async () => {
      // Arrange
      mockSubmissionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('invalid-submission-id', mockStudent.getId())
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute('invalid-submission-id', mockStudent.getId())
      ).rejects.toThrow('Submission not found');
    });

    it('should throw error when assignment is not found', async () => {
      // Arrange
      mockAssignmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockStudent.getId())
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute(mockSubmission.getId(), mockStudent.getId())
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error when course is not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockStudent.getId())
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute(mockSubmission.getId(), mockStudent.getId())
      ).rejects.toThrow('Course not found');
    });

    it('should throw error when student tries to view another student submission', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockOtherStudent);
      mockAuthPolicy.canViewSubmission.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockOtherStudent.getId())
      ).rejects.toThrow(ForbiddenError);
      
      await expect(
        useCase.execute(mockSubmission.getId(), mockOtherStudent.getId())
      ).rejects.toThrow('You do not have permission to view this submission');
    });

    it('should throw error when user is not authorized to view submission', async () => {
      // Arrange
      mockAuthPolicy.canViewSubmission.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockSubmission.getId(), mockStudent.getId())
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Repository Interaction', () => {
    it('should call repositories with correct parameters', async () => {
      // Act
      await useCase.execute(mockSubmission.getId(), mockStudent.getId());

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockStudent.getId());
      expect(mockSubmissionRepository.findById).toHaveBeenCalledWith(mockSubmission.getId());
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(mockAssignment.getId());
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(mockCourse.getId());
      expect(mockAuthPolicy.canViewSubmission).toHaveBeenCalledWith(
        mockStudent,
        mockStudent.getId(),
        mockCourse
      );
    });

    it('should load entities in correct order', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockUserRepository.findById.mockImplementation(async () => {
        callOrder.push('user');
        return mockStudent;
      });
      
      mockSubmissionRepository.findById.mockImplementation(async () => {
        callOrder.push('submission');
        return mockSubmission;
      });
      
      mockAssignmentRepository.findById.mockImplementation(async () => {
        callOrder.push('assignment');
        return mockAssignment;
      });
      
      mockCourseRepository.findById.mockImplementation(async () => {
        callOrder.push('course');
        return mockCourse;
      });

      // Act
      await useCase.execute(mockSubmission.getId(), mockStudent.getId());

      // Assert
      expect(callOrder).toEqual(['user', 'submission', 'assignment', 'course']);
    });
  });
});
