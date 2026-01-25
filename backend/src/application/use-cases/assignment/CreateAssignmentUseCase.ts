/**
 * Create Assignment Use Case
 * 
 * Handles assignment creation with teacher ownership validation, due date validation,
 * submission type validation, and assignment entity persistence.
 * 
 * Requirements:
 * - 9.1: Assignment creation with title, description, and due date
 * - 9.2: Due date validation (must be in future)
 * - 9.4: Specify submission types (file upload, text submission, or both)
 * - 9.5: Specify accepted file formats when file upload is enabled
 * - 9.7: Validate that title, description, and due date are provided
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { CreateAssignmentDTO, AssignmentDTO } from '../../dtos/AssignmentDTO';
import { AssignmentMapper } from '../../mappers/AssignmentMapper';
import { ApplicationError, NotFoundError } from '../../errors/ApplicationErrors';

@injectable()
export class CreateAssignmentUseCase {
  constructor(
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment creation
   * 
   * @param dto - CreateAssignmentDTO with assignment data
   * @param courseId - ID of the course this assignment belongs to
   * @param userId - ID of the user creating the assignment
   * @returns AssignmentDTO of the created assignment
   * @throws NotFoundError if user or course not found
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if validation fails
   */
  async execute(dto: CreateAssignmentDTO, courseId: string, userId: string): Promise<AssignmentDTO> {
    // Load user and course to check authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(courseId);

    // Validate teacher ownership (Requirement 9.1)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_ROLE',
        'Only the course teacher can create assignments',
        403
      );
    }

    // Validate required fields (Requirement 9.7)
    this.validateRequiredFields(dto);

    // Validate due date is in future (Requirement 9.2)
    this.validateDueDate(dto.dueDate);

    // Validate submission type (Requirement 9.4)
    this.validateSubmissionType(dto);

    // Create assignment entity
    const assignment = AssignmentMapper.toDomain(dto, courseId);

    // Save assignment to repository
    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Return assignment DTO
    return AssignmentMapper.toDTO(savedAssignment);
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws NotFoundError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError(
        'USER_NOT_FOUND',
        'User not found'
      );
    }
    
    return user;
  }

  /**
   * Load course from repository
   * 
   * @param courseId - Course ID
   * @returns Course entity
   * @throws NotFoundError if course not found
   * @private
   */
  private async loadCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Course not found'
      );
    }
    
    return course;
  }

  /**
   * Validate required fields
   * 
   * Requirements:
   * - 9.7: Validate that title, description, and due date are provided
   * 
   * @param dto - CreateAssignmentDTO
   * @throws ApplicationError if validation fails
   * @private
   */
  private validateRequiredFields(dto: CreateAssignmentDTO): void {
    const errors: Record<string, string> = {};

    // Validate title
    if (!dto.title || dto.title.trim().length === 0) {
      errors.title = 'Assignment title is required';
    }

    // Validate description
    if (!dto.description || dto.description.trim().length === 0) {
      errors.description = 'Assignment description is required';
    }

    // Validate due date
    if (!dto.dueDate) {
      errors.dueDate = 'Assignment due date is required';
    }

    if (Object.keys(errors).length > 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Input validation failed',
        400
      );
    }
  }

  /**
   * Validate due date is in the future
   * 
   * Requirements:
   * - 9.2: Due date must be in the future
   * 
   * @param dueDate - Due date to validate
   * @throws ApplicationError if due date is in the past
   * @private
   */
  private validateDueDate(dueDate: Date): void {
    const now = new Date();
    
    if (dueDate <= now) {
      throw new ApplicationError(
        'INVALID_DATE',
        'Assignment due date must be in the future',
        400
      );
    }
  }

  /**
   * Validate submission type and accepted file formats
   * 
   * Requirements:
   * - 9.4: Specify submission types (file upload, text submission, or both)
   * - 9.5: Specify accepted file formats when file upload is enabled
   * 
   * @param dto - CreateAssignmentDTO
   * @throws ApplicationError if validation fails
   * @private
   */
  private validateSubmissionType(dto: CreateAssignmentDTO): void {
    const validSubmissionTypes = ['FILE', 'TEXT', 'BOTH'];
    
    if (!validSubmissionTypes.includes(dto.submissionType)) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        `Invalid submission type. Must be one of: ${validSubmissionTypes.join(', ')}`,
        400
      );
    }

    // Requirement 9.5: If file upload is enabled, accepted file formats should be specified
    // Note: This is optional validation - we allow empty array if teacher wants to accept all formats
    if ((dto.submissionType === 'FILE' || dto.submissionType === 'BOTH') && 
        dto.acceptedFileFormats && 
        dto.acceptedFileFormats.length > 0) {
      // Validate file formats are not empty strings
      const invalidFormats = dto.acceptedFileFormats.filter(format => !format || format.trim().length === 0);
      if (invalidFormats.length > 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Accepted file formats cannot be empty',
          400
        );
      }
    }
  }
}
