/**
 * Update Assignment Use Case
 * 
 * Handles assignment updates with teacher ownership validation, due date validation,
 * and ensures assignment is not past due date or grading has not started.
 * 
 * Requirements:
 * - 9.8: Prevent editing after due date
 * - 9.9: Allow editing before due date
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository.js';
import { PrismaAssignmentRepository } from '../../../infrastructure/persistence/repositories/PrismaAssignmentRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { Course } from '../../../domain/entities/Course.js';
import { Assignment } from '../../../domain/entities/Assignment.js';
import { UpdateAssignmentDTO, AssignmentDTO } from '../../dtos/AssignmentDTO.js';
import { AssignmentMapper } from '../../mappers/AssignmentMapper.js';
import { ApplicationError, NotFoundError } from '../../errors/ApplicationErrors.js';

@injectable()
export class UpdateAssignmentUseCase {
  constructor(
    @inject(PrismaAssignmentRepository) private assignmentRepository: IAssignmentRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment update
   * 
   * @param dto - UpdateAssignmentDTO with fields to update
   * @param assignmentId - ID of the assignment to update
   * @param userId - ID of the user updating the assignment
   * @returns AssignmentDTO of the updated assignment
   * @throws NotFoundError if user, course, or assignment not found
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if validation fails
   * @throws ApplicationError if assignment is past due date or grading has started
   */
  async execute(dto: UpdateAssignmentDTO, assignmentId: string, userId: string): Promise<AssignmentDTO> {
    // Load user, assignment, and course to check authorization
    const user = await this.loadUser(userId);
    const assignment = await this.loadAssignment(assignmentId);
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate teacher ownership (Requirement 9.8, 9.9)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_ROLE',
        'Only the course teacher can update assignments',
        403
      );
    }

    // Validate assignment is not past due date (Requirement 9.8)
    if (assignment.isPastDueDate()) {
      throw new ApplicationError(
        'ASSIGNMENT_PAST_DUE',
        'Cannot edit assignment after due date',
        400
      );
    }

    // Validate grading has not started
    if (assignment.hasGradingStarted()) {
      throw new ApplicationError(
        'ASSIGNMENT_CLOSED',
        'Cannot edit assignment after grading has started',
        400
      );
    }

    // Validate update data
    this.validateUpdateData(dto);

    // Apply updates to assignment entity
    // The entity methods will validate business rules (e.g., due date in future)
    try {
      AssignmentMapper.applyUpdate(assignment, dto);
    } catch (error) {
      // Domain validation errors are thrown by entity methods
      if (error instanceof Error) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          error.message,
          400
        );
      }
      throw error;
    }

    // Save updated assignment to repository
    const updatedAssignment = await this.assignmentRepository.update(assignment);

    // Return assignment DTO
    return AssignmentMapper.toDTO(updatedAssignment);
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
   * Load assignment from repository
   * 
   * @param assignmentId - Assignment ID
   * @returns Assignment entity
   * @throws NotFoundError if assignment not found
   * @private
   */
  private async loadAssignment(assignmentId: string): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Assignment not found'
      );
    }
    
    return assignment;
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
   * Validate update data
   * 
   * Ensures at least one field is provided and validates field formats
   * 
   * @param dto - UpdateAssignmentDTO
   * @throws ApplicationError if validation fails
   * @private
   */
  private validateUpdateData(dto: UpdateAssignmentDTO): void {
    // Ensure at least one field is provided
    if (dto.title === undefined && dto.description === undefined && dto.dueDate === undefined) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'At least one field must be provided for update',
        400
      );
    }

    const errors: Record<string, string> = {};

    // Validate title if provided
    if (dto.title !== undefined && (!dto.title || dto.title.trim().length === 0)) {
      errors.title = 'Assignment title cannot be empty';
    }

    // Validate description if provided
    if (dto.description !== undefined && (!dto.description || dto.description.trim().length === 0)) {
      errors.description = 'Assignment description cannot be empty';
    }

    // Validate due date if provided (must be in future)
    if (dto.dueDate !== undefined) {
      const now = new Date();
      if (dto.dueDate <= now) {
        errors.dueDate = 'Assignment due date must be in the future';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Input validation failed',
        400
      );
    }
  }
}
