/**
 * UpdateAssignmentUseCase Unit Tests
 * 
 * Tests for assignment update use case with authorization and validation.
 * 
 * Requirements:
 * - 9.8: Prevent editing after due date
 * - 9.9: Allow editing before due date
 */

import { UpdateAssignmentUseCase } from '../UpdateAssignmentUseCase.js';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment.js';
import { UpdateAssignmentDTO } from '../../../dtos/AssignmentDTO.js';
import { ApplicationError, NotFoundError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('UpdateAssignmentUseCase', () => {
  let useCase: UpdateAssignmentUseCase;
  let mockAssignmentRepository: jest.Mocked<IAssignmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  let mockTeacher: User;
  let mockStudent: User;
  let mockCourse: Course;
  let mockAssignment: Assignment;
  let validDTO: UpdateAssignmentDTO;

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

    // Create assignment with future due date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    mockAssignment = Assignment.create({
      id: randomUUID(),
      courseId: mockCourse.getId(),
      title: 'Original Assignment',
      description: 'Original Description',
      dueDate: futureDate,
      submissionType: SubmissionType.BOTH,
      acceptedFileFormats: ['pdf', 'docx'],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Valid update DTO
    const newFutureDate = new Date();
    newFutureDate.setDate(newFutureDate.getDate() + 14); // 14 days from now

    validDTO = {
      title: 'Updated Assignment',
      description: 'Updated Description',
      dueDate: newFutureDate
    };

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockTeacher);
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockAssignmentRepository.findById.mockResolvedValue(mockAssignment);
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);

    // Create use case instance
    useCase = new UpdateAssignmentUseCase(
      mockAssignmentRepository,
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('Successful Assignment Update', () => {
    it('should update assignment with all fields', async () => {
      // Arrange
      mockAssignmentRepository.update.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(validDTO, mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(mockAssignmentRepository.update).toHaveBeenCalledTimes(1);
      expect(mockAssignmentRepository.update).toHaveBeenCalledWith(mockAssignment);
    });

    it('should update only title', async () => {
      // Arrange
      const partialDTO: UpdateAssignmentDTO = {
        title: 'New Title Only'
      };
      mockAssignmentRepository.update.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(partialDTO, mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(mockAssignmentRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update only description', async () => {
      // Arrange
      const partialDTO: UpdateAssignmentDTO = {
        description: 'New Description Only'
      };
      mockAssignmentRepository.update.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(partialDTO, mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(mockAssignmentRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update only due date', async () => {
      // Arrange
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 10);
      const partialDTO: UpdateAssignmentDTO = {
        dueDate: newDate
      };
      mockAssignmentRepository.update.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(partialDTO, mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(mockAssignmentRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockAssignment.getId(), 'invalid-user-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when assignment is not found', async () => {
      // Arrange
      mockAssignmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, 'invalid-assignment-id', mockTeacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when course is not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when user is not authorized to manage assignments', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(validDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Only the course teacher can update assignments');
    });

    it('should throw error when student tries to update assignment', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockAssignment.getId(), mockStudent.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - Due Date Restriction (Requirement 9.8)', () => {
    it('should throw error when assignment is past due date', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      // Create assignment with future date first, then manually set past date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const pastDueAssignment = Assignment.reconstitute({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: 'Past Due Assignment',
        description: 'Description',
        dueDate: pastDate,
        submissionType: SubmissionType.TEXT,
        acceptedFileFormats: [],
        gradingStarted: false,
        createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago (different from updatedAt)
        updatedAt: new Date(Date.now() - 86400000 * 2) // 2 days ago (different from createdAt)
      });

      mockAssignmentRepository.findById.mockResolvedValue(pastDueAssignment);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, pastDueAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(validDTO, pastDueAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Cannot edit assignment after due date');
    });

    it('should throw error when grading has started', async () => {
      // Arrange
      const assignmentWithGrading = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: 'Grading Started Assignment',
        description: 'Description',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        submissionType: SubmissionType.TEXT,
        acceptedFileFormats: [],
        gradingStarted: true, // Grading started
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.findById.mockResolvedValue(assignmentWithGrading);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, assignmentWithGrading.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(validDTO, assignmentWithGrading.getId(), mockTeacher.getId())
      ).rejects.toThrow('Cannot edit assignment after grading has started');
    });
  });

  describe('Validation - Update Data', () => {
    it('should throw error when no fields are provided', async () => {
      // Arrange
      const emptyDTO: UpdateAssignmentDTO = {};

      // Act & Assert
      await expect(
        useCase.execute(emptyDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(emptyDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('At least one field must be provided for update');
    });

    it('should throw error when title is empty string', async () => {
      // Arrange
      const invalidDTO: UpdateAssignmentDTO = {
        title: ''
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Input validation failed');
    });

    it('should throw error when description is empty string', async () => {
      // Arrange
      const invalidDTO: UpdateAssignmentDTO = {
        description: ''
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Input validation failed');
    });

    it('should throw error when new due date is in the past', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidDTO: UpdateAssignmentDTO = {
        dueDate: pastDate
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow('Input validation failed');
    });

    it('should throw error when new due date is current time', async () => {
      // Arrange
      const now = new Date();
      const invalidDTO: UpdateAssignmentDTO = {
        dueDate: now
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockAssignment.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Repository Interaction', () => {
    it('should call repositories with correct parameters', async () => {
      // Arrange
      mockAssignmentRepository.update.mockResolvedValue(mockAssignment);

      // Act
      await useCase.execute(validDTO, mockAssignment.getId(), mockTeacher.getId());

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockTeacher.getId());
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(mockAssignment.getId());
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(mockCourse.getId());
      expect(mockAuthPolicy.canManageAssignments).toHaveBeenCalledWith(mockTeacher, mockCourse);
      expect(mockAssignmentRepository.update).toHaveBeenCalledTimes(1);
      expect(mockAssignmentRepository.update).toHaveBeenCalledWith(mockAssignment);
    });
  });
});
