/**
 * DeleteAssignmentUseCase Unit Tests
 * 
 * Tests for assignment deletion use case with authorization.
 * 
 * Requirements:
 * - 9.10: Allow teachers to delete assignments at any time
 */

import { DeleteAssignmentUseCase } from '../DeleteAssignmentUseCase.js';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment.js';
import { ApplicationError, NotFoundError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('DeleteAssignmentUseCase', () => {
  let useCase: DeleteAssignmentUseCase;
  let mockAssignmentRepository: jest.Mocked<IAssignmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  let mockTeacher: User;
  let mockStudent: User;
  let mockCourse: Course;
  let mockAssignment: Assignment;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repositories
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
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    mockAssignment = Assignment.create({
      id: randomUUID(),
      courseId: mockCourse.getId(),
      title: 'Assignment 1',
      description: 'Complete the exercises',
      dueDate: futureDate,
      submissionType: SubmissionType.BOTH,
      acceptedFileFormats: ['pdf', 'docx'],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockTeacher);
    mockAssignmentRepository.findById.mockResolvedValue(mockAssignment);
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);
    mockAssignmentRepository.delete.mockResolvedValue(undefined);

    // Create use case instance
    useCase = new DeleteAssignmentUseCase(
      mockAssignmentRepository,
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('Successful Assignment Deletion', () => {
    it('should delete assignment when teacher is authorized', async () => {
      // Act
      await useCase.execute(mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(mockAssignment.getId());
      expect(mockAssignmentRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should delete assignment before due date', async () => {
      // Arrange - assignment with future due date (already set in beforeEach)

      // Act
      await useCase.execute(mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(mockAssignment.getId());
    });

    it('should delete assignment after due date', async () => {
      // Arrange - assignment with past due date
      // Create dates that ensure createdAt !== updatedAt to bypass validation
      const createdDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
      const updatedDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000); // 13 days ago (different from createdAt)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      const pastAssignment = Assignment.reconstitute({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: 'Past Assignment',
        description: 'Past due assignment',
        dueDate: pastDate,
        submissionType: SubmissionType.BOTH,
        acceptedFileFormats: ['pdf'],
        gradingStarted: false,
        createdAt: createdDate,
        updatedAt: updatedDate
      });

      mockAssignmentRepository.findById.mockResolvedValue(pastAssignment);

      // Act
      await useCase.execute(pastAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(pastAssignment.getId());
    });

    it('should delete assignment with grading started', async () => {
      // Arrange - assignment with grading started
      // Create dates that ensure createdAt !== updatedAt to bypass validation
      const createdDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const updatedDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 6 days ago (different from createdAt)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const gradingAssignment = Assignment.reconstitute({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: 'Grading Assignment',
        description: 'Assignment with grading',
        dueDate: futureDate,
        submissionType: SubmissionType.BOTH,
        acceptedFileFormats: ['pdf'],
        gradingStarted: true,
        createdAt: createdDate,
        updatedAt: updatedDate
      });

      mockAssignmentRepository.findById.mockResolvedValue(gradingAssignment);

      // Act
      await useCase.execute(gradingAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(gradingAssignment.getId());
    });
  });

  describe('Authorization', () => {
    it('should throw error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), 'invalid-user-id')
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute(mockAssignment.getId(), 'invalid-user-id')
      ).rejects.toThrow('User not found');
    });

    it('should throw error when assignment is not found', async () => {
      // Arrange
      mockAssignmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('invalid-assignment-id', mockTeacher.getId())
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute('invalid-assignment-id', mockTeacher.getId())
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error when course is not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        useCase.execute(mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Course not found');
    });

    it('should throw error when user is not authorized to manage assignments', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Only the course teacher can delete assignments');
    });

    it('should throw error when student tries to delete assignment', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), mockStudent.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw error when teacher tries to delete another teacher\'s assignment', async () => {
      // Arrange
      const otherTeacher = User.create({
        id: randomUUID(),
        email: 'other@example.com',
        name: 'Other Teacher',
        role: Role.TEACHER,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findById.mockResolvedValue(otherTeacher);
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), otherTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Repository Interaction', () => {
    it('should call repositories with correct parameters', async () => {
      // Act
      await useCase.execute(mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockTeacher.getId());
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(mockAssignment.getId());
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(mockCourse.getId());
      expect(mockAuthPolicy.canManageAssignments).toHaveBeenCalledWith(mockTeacher, mockCourse);
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(mockAssignment.getId());
    });

    it('should not call delete when authorization fails', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);

      expect(mockAssignmentRepository.delete).not.toHaveBeenCalled();
    });
  });
});
