/**
 * Create Course Use Case
 * 
 * Handles course creation with teacher role validation, unique course code generation,
 * and course entity persistence.
 * 
 * Requirements:
 * - 5.1: Create course with name, description, and unique course code
 * - 5.2: Generate unique course code with retry logic (max 5 attempts)
 * - 5.9: Validate that course name is provided
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { CourseCodeGenerator, ICourseCodeChecker } from '../../../domain/services/CourseCodeGenerator';
import { CourseCode } from '../../../domain/value-objects/CourseCode';
import { CreateCourseDTO, CourseDTO } from '../../dtos/CourseDTO';
import { CourseMapper } from '../../mappers/CourseMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

/**
 * Course Code Checker Implementation
 * Checks if a course code is unique by querying the repository
 */
class CourseCodeChecker implements ICourseCodeChecker {
  constructor(private courseRepository: ICourseRepository) {}

  async isUnique(code: CourseCode): Promise<boolean> {
    const existingCourse = await this.courseRepository.findByCode(code.getValue());
    return existingCourse === null;
  }
}

@injectable()
export class CreateCourseUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute course creation
   * 
   * @param dto - CreateCourseDTO with course data
   * @param userId - ID of the user creating the course
   * @returns CourseDTO of the created course
   * @throws ApplicationError if user is not a teacher
   * @throws ApplicationError if course name or description is missing
   * @throws ApplicationError if unable to generate unique course code
   */
  async execute(dto: CreateCourseDTO, userId: string): Promise<CourseDTO> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Validate teacher role (Requirement 5.1)
    if (!this.authPolicy.canCreateCourse(user)) {
      throw new ApplicationError(
        'FORBIDDEN_ROLE',
        'Only teachers can create courses',
        403
      );
    }

    // Validate course name is provided (Requirement 5.9)
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Course name is required',
        400
      );
    }

    // Validate course description is provided
    if (!dto.description || dto.description.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Course description is required',
        400
      );
    }

    // Generate unique course code with retry logic (Requirement 5.2)
    const courseCode = await this.generateUniqueCourseCode();

    // Create course entity
    const course = CourseMapper.toDomain(dto, courseCode.getValue(), userId);

    // Save course to repository
    const savedCourse = await this.courseRepository.save(course);

    // Return course DTO
    return CourseMapper.toDTO(savedCourse);
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws ApplicationError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
    
    return user;
  }

  /**
   * Generate unique course code with retry logic
   * 
   * @returns Unique CourseCode
   * @throws ApplicationError if unable to generate unique code after max retries
   * @private
   */
  private async generateUniqueCourseCode(): Promise<CourseCode> {
    const codeChecker = new CourseCodeChecker(this.courseRepository);
    const generator = new CourseCodeGenerator(codeChecker);

    try {
      return await generator.generate();
    } catch (error) {
      throw new ApplicationError(
        'INTERNAL_ERROR',
        'Failed to generate unique course code. Please try again.',
        500
      );
    }
  }
}
