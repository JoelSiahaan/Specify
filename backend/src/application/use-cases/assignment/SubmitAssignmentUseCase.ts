/**
 * Submit Assignment Use Case
 * 
 * Handles assignment submission with enrollment validation, assignment status validation,
 * submission type validation, file upload, HTML sanitization, late submission detection,
 * and submission entity persistence.
 * 
 * Requirements:
 * - 10.1: Allow file upload for assignments that accept files
 * - 10.2: Allow text submission for assignments that accept text
 * - 10.3: Allow both file and text for assignments that accept both
 * - 10.4: Reject submission without required content
 * - 10.5: Reject file uploads in unsupported formats
 * - 10.6: Record submission timestamp
 * - 10.7: Accept submissions before due date
 * - 10.8: Accept late submissions after due date but before grading starts
 * - 10.9: Reject submissions after grading has started
 * - 10.10: Allow resubmission before grading starts
 * - 10.11: Reject resubmission after grading starts
 * - 10.13: Support PDF, DOCX, and image formats (JPG, PNG) for file uploads
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IFileStorage } from '../../../domain/storage/IFileStorage';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { Assignment, SubmissionType } from '../../../domain/entities/Assignment';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission';
import { CreateSubmissionDTO, SubmissionDTO } from '../../dtos/AssignmentDTO';
import { SubmissionMapper } from '../../mappers/SubmissionMapper';
import { ApplicationError, NotFoundError, ForbiddenError } from '../../errors/ApplicationErrors';
import { randomUUID } from 'crypto';
import sanitizeHtml from 'sanitize-html';

/**
 * Allowed file MIME types for assignment submissions
 * 
 * Requirements:
 * - 10.13: Support PDF, DOCX, and image formats (JPG, PNG)
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',                                                      // PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'image/jpeg',                                                           // JPEG
  'image/png'                                                             // PNG
];

/**
 * Allowed file extensions for assignment submissions
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];

/**
 * Maximum file size (10MB in bytes)
 * 
 * Requirements:
 * - 20.5: Enforce file size limits on all uploads
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@injectable()
export class SubmitAssignmentUseCase {
  constructor(
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ISubmissionRepository') private submissionRepository: ISubmissionRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IFileStorage') private fileStorage: IFileStorage,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment submission
   * 
   * @param dto - CreateSubmissionDTO with submission data
   * @param assignmentId - ID of the assignment being submitted
   * @param userId - ID of the user submitting the assignment
   * @param file - Optional file buffer for file submissions
   * @param fileName - Optional original file name
   * @param mimeType - Optional file MIME type
   * @param fileSize - Optional file size in bytes
   * @returns SubmissionDTO of the created/updated submission
   * @throws NotFoundError if user, assignment, or course not found
   * @throws ForbiddenError if user is not authorized
   * @throws ApplicationError if validation fails
   */
  async execute(
    dto: CreateSubmissionDTO,
    assignmentId: string,
    userId: string,
    file?: Buffer,
    fileName?: string,
    mimeType?: string,
    fileSize?: number
  ): Promise<SubmissionDTO> {
    // Load entities
    const user = await this.loadUser(userId);
    const assignment = await this.loadAssignment(assignmentId);
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate student enrollment (Requirement 10.1-10.3)
    await this.validateEnrollment(user, course);

    // Validate assignment can accept submissions (Requirement 10.9)
    this.validateAssignmentOpen(assignment);

    // Validate submission type matches assignment requirements (Requirement 10.1-10.3)
    this.validateSubmissionType(assignment, dto, file);

    // Validate required content is provided (Requirement 10.4)
    this.validateRequiredContent(assignment, dto, file);

    // Process file upload if provided
    let filePath: string | undefined;
    let storedFileName: string | undefined;
    if (file && fileName && mimeType && fileSize !== undefined) {
      // Validate file format (Requirement 10.5, 10.13)
      this.validateFileFormat(fileName, mimeType);

      // Validate file size (Requirement 20.5)
      this.validateFileSize(fileSize);

      // Upload file to storage
      const fileMetadata = await this.fileStorage.upload(file, {
        originalName: fileName,
        mimeType: mimeType,
        size: fileSize,
        directory: `assignments/${assignmentId}`
      });

      filePath = fileMetadata.path;
      storedFileName = fileMetadata.originalName;
    }

    // Sanitize HTML content if text submission (Requirement 20.2)
    let sanitizedContent: string | undefined;
    if (dto.content) {
      sanitizedContent = this.sanitizeHtmlContent(dto.content);
    }

    // Check if submission is late (Requirement 10.8)
    const isLate = assignment.isSubmissionLate();

    // Check if existing submission exists
    const existingSubmission = await this.submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      userId
    );

    let submission: Submission;

    if (existingSubmission) {
      // Resubmission (Requirement 10.10, 10.11)
      this.validateResubmission(existingSubmission);

      // Update existing submission
      existingSubmission.updateContent(sanitizedContent, filePath, storedFileName);
      existingSubmission.resubmit(isLate);
      submission = await this.submissionRepository.update(existingSubmission);
    } else {
      // New submission (Requirement 10.6, 10.7, 10.8)
      submission = Submission.create({
        id: randomUUID(),
        assignmentId: assignmentId,
        studentId: userId,
        content: sanitizedContent,
        filePath: filePath,
        fileName: storedFileName,
        isLate: isLate,
        status: SubmissionStatus.SUBMITTED,
        version: 0,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      submission = await this.submissionRepository.save(submission);
    }

    // Return submission DTO
    return SubmissionMapper.toDTO(submission);
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
   * Validate student enrollment in course
   * 
   * Requirements:
   * - 10.1-10.3: Student must be enrolled to submit
   * 
   * @param user - User entity
   * @param course - Course entity
   * @throws ForbiddenError if user is not enrolled
   * @private
   */
  private async validateEnrollment(user: User, course: Course): Promise<void> {
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      user.getId(),
      course.getId()
    );

    const context = { isEnrolled: enrollment !== null };

    if (!this.authPolicy.canSubmitAssignment(user, course, context)) {
      throw new ForbiddenError(
        'NOT_ENROLLED',
        'You must be enrolled in this course to submit assignments'
      );
    }
  }

  /**
   * Validate assignment can accept submissions
   * 
   * Requirements:
   * - 10.9: Reject submissions after grading has started
   * 
   * @param assignment - Assignment entity
   * @throws ApplicationError if assignment is closed
   * @private
   */
  private validateAssignmentOpen(assignment: Assignment): void {
    if (!assignment.canAcceptSubmissions()) {
      throw new ApplicationError(
        'ASSIGNMENT_CLOSED',
        'This assignment is closed and cannot accept new submissions',
        400
      );
    }
  }

  /**
   * Validate submission type matches assignment requirements
   * 
   * Requirements:
   * - 10.1: Allow file upload for assignments that accept files
   * - 10.2: Allow text submission for assignments that accept text
   * - 10.3: Allow both file and text for assignments that accept both
   * 
   * @param assignment - Assignment entity
   * @param dto - CreateSubmissionDTO
   * @param file - Optional file buffer
   * @throws ApplicationError if submission type doesn't match
   * @private
   */
  private validateSubmissionType(
    assignment: Assignment,
    dto: CreateSubmissionDTO,
    file?: Buffer
  ): void {
    const submissionType = assignment.getSubmissionType();

    if (submissionType === SubmissionType.FILE && !file) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'This assignment requires a file upload',
        400
      );
    }

    if (submissionType === SubmissionType.TEXT && !dto.content) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'This assignment requires text submission',
        400
      );
    }

    if (submissionType === SubmissionType.BOTH && !file && !dto.content) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'This assignment requires both file upload and text submission',
        400
      );
    }
  }

  /**
   * Validate required content is provided
   * 
   * Requirements:
   * - 10.4: Reject submission without required content
   * 
   * @param assignment - Assignment entity
   * @param dto - CreateSubmissionDTO
   * @param file - Optional file buffer
   * @throws ApplicationError if required content is missing
   * @private
   */
  private validateRequiredContent(
    assignment: Assignment,
    dto: CreateSubmissionDTO,
    file?: Buffer
  ): void {
    const submissionType = assignment.getSubmissionType();

    // For FILE type, file is required
    if (submissionType === SubmissionType.FILE && !file) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'File upload is required for this assignment',
        400
      );
    }

    // For TEXT type, content is required
    if (submissionType === SubmissionType.TEXT && (!dto.content || dto.content.trim().length === 0)) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Text content is required for this assignment',
        400
      );
    }

    // For BOTH type, both file and content are required
    if (submissionType === SubmissionType.BOTH) {
      if (!file) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'File upload is required for this assignment',
          400
        );
      }
      if (!dto.content || dto.content.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Text content is required for this assignment',
          400
        );
      }
    }
  }

  /**
   * Validate file format
   * 
   * Requirements:
   * - 10.5: Reject file uploads in unsupported formats
   * - 10.13: Support PDF, DOCX, and image formats (JPG, PNG)
   * 
   * @param fileName - Original file name
   * @param mimeType - File MIME type
   * @throws ApplicationError if file format is not allowed
   * @private
   */
  private validateFileFormat(fileName: string, mimeType: string): void {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ApplicationError(
        'INVALID_FILE_TYPE',
        `File type not allowed. Supported formats: PDF, DOCX, JPG, PNG`,
        400
      );
    }

    // Check file extension
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new ApplicationError(
        'INVALID_FILE_TYPE',
        `File extension not allowed. Supported extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate file size
   * 
   * Requirements:
   * - 20.5: Enforce file size limits on all uploads
   * 
   * @param fileSize - File size in bytes
   * @throws ApplicationError if file exceeds size limit
   * @private
   */
  private validateFileSize(fileSize: number): void {
    if (fileSize > MAX_FILE_SIZE) {
      throw new ApplicationError(
        'INVALID_FILE_SIZE',
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }
  }

  /**
   * Sanitize HTML content
   * 
   * Requirements:
   * - 20.2: Validate all user inputs to prevent injection attacks
   * 
   * @param content - Raw HTML content
   * @returns Sanitized HTML content
   * @private
   */
  private sanitizeHtmlContent(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
      allowedAttributes: {
        'a': ['href', 'target']
      },
      allowedSchemes: ['http', 'https']
    });
  }

  /**
   * Validate resubmission is allowed
   * 
   * Requirements:
   * - 10.10: Allow resubmission before grading starts
   * - 10.11: Reject resubmission after grading starts
   * 
   * @param submission - Existing submission entity
   * @throws ApplicationError if resubmission is not allowed
   * @private
   */
  private validateResubmission(submission: Submission): void {
    if (submission.isGraded()) {
      throw new ApplicationError(
        'SUBMISSION_GRADED',
        'Cannot resubmit after grading has started',
        400
      );
    }
  }
}
