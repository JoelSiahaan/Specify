/**
 * CreateAssignmentUseCase Unit Tests
 * 
 * Tests for assignment creation use case with authorization and validation.
 * 
 * Requirements:
 * - 9.1: Assignment creation with title, description, and due date
 * - 9.2: Due date validation (must be in future)
 * - 9.4: Specify submission types
 * - 9.5: Specify accepted file formats
 * - 9.7: Validate required fields
 */

import { CreateAssignmentUseCase } from '../CreateAssignmentUseCase.js';
import { IAssignmentRepository } from '../../../../domain/repositories/IAssignmentRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment.js';
import { CreateAssignmentDTO } from '../../../dtos/AssignmentDTO.js';
import { ApplicationError, NotFoundError } from '../../../errors/ApplicationErrors.js';
import { randomUUID } from 'crypto';

describe('CreateAssignmentUseCase', () => {
  let useCase: CreateAssignmentUseCase;
  let mockAssignmentRepository: jest.Mocked<IAssignmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthPolicy: jest.Mocked<IAuthorizationPolicy>;

  let mockTeacher: User;
  let mockStudent: User;
  let mockCourse: Course;
  let validDTO: CreateAssignmentDTO;

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

    // Valid DTO
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    validDTO = {
      title: 'Assignment 1',
      description: 'Complete the exercises',
      dueDate: futureDate,
      submissionType: SubmissionType.BOTH,
      acceptedFileFormats: ['pdf', 'docx']
    };

    // Mock return values
    mockUserRepository.findById.mockResolvedValue(mockTeacher);
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockAuthPolicy.canManageAssignments.mockReturnValue(true);

    // Create use case instance
    useCase = new CreateAssignmentUseCase(
      mockAssignmentRepository,
      mockCourseRepository,
      mockUserRepository,
      mockAuthPolicy
    );
  });

  describe('Successful Assignment Creation', () => {
    it('should create assignment with valid data', async () => {
      // Arrange
      const mockAssignment = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: validDTO.title,
        description: validDTO.description,
        dueDate: validDTO.dueDate,
        submissionType: validDTO.submissionType,
        acceptedFileFormats: validDTO.acceptedFileFormats,
        gradingStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.save.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(validDTO, mockCourse.getId(), mockTeacher.getId());

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(validDTO.title);
      expect(result.description).toBe(validDTO.description);
      expect(result.courseId).toBe(mockCourse.getId());
      expect(result.submissionType).toBe(validDTO.submissionType);
      expect(mockAssignmentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create assignment with FILE submission type', async () => {
      // Arrange
      const fileDTO: CreateAssignmentDTO = {
        ...validDTO,
        submissionType: SubmissionType.FILE,
        acceptedFileFormats: ['pdf']
      };

      const mockAssignment = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: fileDTO.title,
        description: fileDTO.description,
        dueDate: fileDTO.dueDate,
        submissionType: fileDTO.submissionType,
        acceptedFileFormats: fileDTO.acceptedFileFormats,
        gradingStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.save.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(fileDTO, mockCourse.getId(), mockTeacher.getId());

      // Assert
      expect(result.submissionType).toBe(SubmissionType.FILE);
      expect(result.acceptedFileFormats).toEqual(['pdf']);
    });

    it('should create assignment with TEXT submission type', async () => {
      // Arrange
      const textDTO: CreateAssignmentDTO = {
        ...validDTO,
        submissionType: SubmissionType.TEXT,
        acceptedFileFormats: []
      };

      const mockAssignment = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: textDTO.title,
        description: textDTO.description,
        dueDate: textDTO.dueDate,
        submissionType: textDTO.submissionType,
        acceptedFileFormats: [],
        gradingStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.save.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(textDTO, mockCourse.getId(), mockTeacher.getId());

      // Assert
      expect(result.submissionType).toBe(SubmissionType.TEXT);
    });
  });

  describe('Authorization', () => {
    it('should throw error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockCourse.getId(), 'invalid-user-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when course is not found', async () => {
      // Arrange
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, 'invalid-course-id', mockTeacher.getId())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when user is not authorized to manage assignments', async () => {
      // Arrange
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(validDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow('Only the course teacher can create assignments');
    });

    it('should throw error when student tries to create assignment', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockStudent);
      mockAuthPolicy.canManageAssignments.mockReturnValue(false);

      // Act & Assert
      await expect(
        useCase.execute(validDTO, mockCourse.getId(), mockStudent.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - Required Fields', () => {
    it('should throw error when title is missing', async () => {
      // Arrange
      const invalidDTO = { ...validDTO, title: '' };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw error when description is missing', async () => {
      // Arrange
      const invalidDTO = { ...validDTO, description: '' };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });

    it('should throw error when due date is missing', async () => {
      // Arrange
      const invalidDTO = { ...validDTO, dueDate: null as any };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - Due Date', () => {
    it('should throw error when due date is in the past', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      const invalidDTO = { ...validDTO, dueDate: pastDate };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow('Assignment due date must be in the future');
    });

    it('should throw error when due date is current time', async () => {
      // Arrange
      const now = new Date();
      const invalidDTO = { ...validDTO, dueDate: now };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('Validation - Submission Type', () => {
    it('should throw error when submission type is invalid', async () => {
      // Arrange
      const invalidDTO = { ...validDTO, submissionType: 'INVALID' as any };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow('Invalid submission type');
    });

    it('should throw error when accepted file formats contain empty strings', async () => {
      // Arrange
      const invalidDTO = { 
        ...validDTO, 
        submissionType: SubmissionType.FILE,
        acceptedFileFormats: ['pdf', '', 'docx'] 
      };

      // Act & Assert
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow(ApplicationError);
      
      await expect(
        useCase.execute(invalidDTO, mockCourse.getId(), mockTeacher.getId())
      ).rejects.toThrow('Accepted file formats cannot be empty');
    });

    it('should accept empty accepted file formats array', async () => {
      // Arrange
      const validDTOWithEmptyFormats = { 
        ...validDTO, 
        submissionType: SubmissionType.FILE,
        acceptedFileFormats: [] 
      };

      const mockAssignment = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: validDTOWithEmptyFormats.title,
        description: validDTOWithEmptyFormats.description,
        dueDate: validDTOWithEmptyFormats.dueDate,
        submissionType: validDTOWithEmptyFormats.submissionType,
        acceptedFileFormats: [],
        gradingStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.save.mockResolvedValue(mockAssignment);

      // Act
      const result = await useCase.execute(
        validDTOWithEmptyFormats, 
        mockCourse.getId(), 
        mockTeacher.getId()
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.acceptedFileFormats).toEqual([]);
    });
  });

  describe('Repository Interaction', () => {
    it('should call repositories with correct parameters', async () => {
      // Arrange
      const mockAssignment = Assignment.create({
        id: randomUUID(),
        courseId: mockCourse.getId(),
        title: validDTO.title,
        description: validDTO.description,
        dueDate: validDTO.dueDate,
        submissionType: validDTO.submissionType,
        acceptedFileFormats: validDTO.acceptedFileFormats,
        gradingStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAssignmentRepository.save.mockResolvedValue(mockAssignment);

      // Act
      await useCase.execute(validDTO, mockCourse.getId(), mockTeacher.getId());

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockTeacher.getId());
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(mockCourse.getId());
      expect(mockAuthPolicy.canManageAssignments).toHaveBeenCalledWith(mockTeacher, mockCourse);
      expect(mockAssignmentRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
