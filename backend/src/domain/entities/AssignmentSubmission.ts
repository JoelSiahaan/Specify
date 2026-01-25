/**
 * AssignmentSubmission Domain Entity
 * 
 * Represents a student's submission for an assignment with grading and late submission tracking.
 * Supports optimistic locking for concurrent grading prevention.
 * 
 * Requirements:
 * - 10.6: Record submission timestamp
 * - 10.8: Mark submissions after due date as late
 * - 10.10: Allow resubmission before grading starts
 * - 10.11: Reject resubmission after grading starts
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 */

export enum AssignmentSubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED'
}

export interface AssignmentSubmissionProps {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;           // Text submission content
  filePath?: string;          // File submission path
  fileName?: string;          // Original file name
  grade?: number;             // Grade (0-100)
  feedback?: string;          // Teacher feedback
  isLate: boolean;            // Late submission flag
  status: AssignmentSubmissionStatus;   // Submission status
  version: number;            // Optimistic locking version
  submittedAt?: Date;         // Submission timestamp
  gradedAt?: Date;            // Grading timestamp
  createdAt?: Date;
  updatedAt?: Date;
}

export class AssignmentSubmission {
  private readonly id: string;
  private readonly assignmentId: string;
  private readonly studentId: string;
  private content?: string;
  private filePath?: string;
  private fileName?: string;
  private grade?: number;
  private feedback?: string;
  private isLate: boolean;
  private status: AssignmentSubmissionStatus;
  private version: number;
  private submittedAt?: Date;
  private gradedAt?: Date;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: AssignmentSubmissionProps) {
    this.id = props.id;
    this.assignmentId = props.assignmentId;
    this.studentId = props.studentId;
    this.content = props.content;
    this.filePath = props.filePath;
    this.fileName = props.fileName;
    this.grade = props.grade;
    this.feedback = props.feedback;
    this.isLate = props.isLate;
    this.status = props.status;
    this.version = props.version;
    this.submittedAt = props.submittedAt;
    this.gradedAt = props.gradedAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new AssignmentSubmission entity
   * 
   * @param props - AssignmentSubmission properties
   * @returns AssignmentSubmission instance
   * @throws Error if validation fails
   */
  public static create(props: AssignmentSubmissionProps): AssignmentSubmission {
    return new AssignmentSubmission(props);
  }

  /**
   * Reconstitute AssignmentSubmission from persistence
   * 
   * @param props - AssignmentSubmission properties from database
   * @returns AssignmentSubmission instance
   */
  public static reconstitute(props: AssignmentSubmissionProps): AssignmentSubmission {
    return new AssignmentSubmission(props);
  }

  /**
   * Validate AssignmentSubmission entity invariants
   * 
   * Requirements:
   * - 10.6: Submission must have assignment and student IDs
   * - 13.3: Grade must be between 0 and 100
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('AssignmentSubmission ID is required');
    }

    if (!this.assignmentId || this.assignmentId.trim().length === 0) {
      throw new Error('Assignment ID is required');
    }

    if (!this.studentId || this.studentId.trim().length === 0) {
      throw new Error('Student ID is required');
    }

    // Status validation
    if (!Object.values(AssignmentSubmissionStatus).includes(this.status)) {
      throw new Error(`Invalid submission status: ${this.status}. Must be NOT_SUBMITTED, SUBMITTED, or GRADED`);
    }

    // Requirement 13.3: Grade validation (0-100 range)
    if (this.grade !== undefined && this.grade !== null) {
      if (typeof this.grade !== 'number' || isNaN(this.grade)) {
        throw new Error('Grade must be a valid number');
      }
      if (this.grade < 0 || this.grade > 100) {
        throw new Error('Grade must be between 0 and 100');
      }
    }

    // Version must be non-negative
    if (this.version < 0) {
      throw new Error('Version must be non-negative');
    }

    // If graded, grade must be present
    if (this.status === AssignmentSubmissionStatus.GRADED && (this.grade === undefined || this.grade === null)) {
      throw new Error('Graded submission must have a grade');
    }
  }

  /**
   * Mark submission as late
   * 
   * Requirements:
   * - 10.8: Mark submissions after due date as late
   * 
   * Business Rules:
   * - Late flag is set when submission is created after due date
   * - Once set, late flag cannot be changed
   */
  public markAsLate(): void {
    this.isLate = true;
    this.updatedAt = new Date();
  }

  /**
   * Submit the assignment
   * 
   * Requirements:
   * - 10.6: Record submission timestamp
   * 
   * @param isLate - Whether submission is late
   * @throws Error if already submitted
   */
  public submit(isLate: boolean): void {
    if (this.status !== AssignmentSubmissionStatus.NOT_SUBMITTED) {
      throw new Error('Submission has already been submitted');
    }

    this.status = AssignmentSubmissionStatus.SUBMITTED;
    this.isLate = isLate;
    this.submittedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Resubmit the assignment (before grading starts)
   * 
   * Requirements:
   * - 10.10: Allow resubmission before grading starts
   * - 10.11: Reject resubmission after grading starts
   * - 21.5: Optimistic locking for concurrent updates
   * 
   * @param isLate - Whether resubmission is late
   * @throws Error if already graded
   */
  public resubmit(isLate: boolean): void {
    if (this.status === AssignmentSubmissionStatus.GRADED) {
      throw new Error('Cannot resubmit after grading has started');
    }

    this.status = AssignmentSubmissionStatus.SUBMITTED;
    this.isLate = isLate;
    this.submittedAt = new Date();
    this.version += 1; // Increment version for optimistic locking
    this.updatedAt = new Date();
  }

  /**
   * Grade the submission
   * 
   * Requirements:
   * - 13.3: Validate grade is between 0 and 100
   * - 13.4: Store grade with submission
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param grade - Grade value (0-100)
   * @param feedback - Optional teacher feedback
   * @param currentVersion - Current version for optimistic locking
   * @throws Error if grade is invalid or version mismatch
   */
  public assignGrade(grade: number, feedback?: string, currentVersion?: number): void {
    // Requirement 21.5: Optimistic locking check
    if (currentVersion !== undefined && this.version !== currentVersion) {
      throw new Error('Submission has been modified by another user. Please refresh and try again');
    }

    // Requirement 13.3: Grade validation
    if (typeof grade !== 'number' || isNaN(grade)) {
      throw new Error('Grade must be a valid number');
    }
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    // Can only grade submitted submissions
    if (this.status === AssignmentSubmissionStatus.NOT_SUBMITTED) {
      throw new Error('Cannot grade submission that has not been submitted');
    }

    // Requirement 13.4: Store grade with submission
    this.grade = grade;
    this.feedback = feedback;
    this.status = AssignmentSubmissionStatus.GRADED;
    this.gradedAt = new Date();
    this.version += 1; // Increment version for optimistic locking
    this.updatedAt = new Date();
  }

  /**
   * Update grade (edit existing grade)
   * 
   * Requirements:
   * - 13.5: Allow teachers to edit grades after saving
   * - 21.5: Optimistic locking for concurrent updates
   * 
   * @param grade - New grade value (0-100)
   * @param feedback - Optional updated feedback
   * @param currentVersion - Current version for optimistic locking
   * @throws Error if grade is invalid, not graded yet, or version mismatch
   */
  public updateGrade(grade: number, feedback?: string, currentVersion?: number): void {
    // Requirement 21.5: Optimistic locking check
    if (currentVersion !== undefined && this.version !== currentVersion) {
      throw new Error('Submission has been modified by another user. Please refresh and try again');
    }

    // Can only update grade if already graded
    if (this.status !== AssignmentSubmissionStatus.GRADED) {
      throw new Error('Cannot update grade for submission that has not been graded');
    }

    // Grade validation
    if (typeof grade !== 'number' || isNaN(grade)) {
      throw new Error('Grade must be a valid number');
    }
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    this.grade = grade;
    this.feedback = feedback;
    this.version += 1; // Increment version for optimistic locking
    this.updatedAt = new Date();
  }

  /**
   * Update submission content (for resubmission)
   * 
   * @param content - Text content
   * @param filePath - File path
   * @param fileName - Original file name
   */
  public updateContent(content?: string, filePath?: string, fileName?: string): void {
    if (this.status === AssignmentSubmissionStatus.GRADED) {
      throw new Error('Cannot update content after grading has started');
    }

    this.content = content;
    this.filePath = filePath;
    this.fileName = fileName;
    this.updatedAt = new Date();
  }

  /**
   * Check if submission is graded
   * 
   * @returns true if submission has been graded
   */
  public isGraded(): boolean {
    return this.status === AssignmentSubmissionStatus.GRADED;
  }

  /**
   * Check if submission is submitted
   * 
   * @returns true if submission has been submitted
   */
  public isSubmitted(): boolean {
    return this.status === AssignmentSubmissionStatus.SUBMITTED || this.status === AssignmentSubmissionStatus.GRADED;
  }

  /**
   * Check if submission is late
   * 
   * Requirements:
   * - 10.8: Late submission detection
   * 
   * @returns true if submission is late
   */
  public isLateSubmission(): boolean {
    return this.isLate;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getAssignmentId(): string {
    return this.assignmentId;
  }

  public getStudentId(): string {
    return this.studentId;
  }

  public getContent(): string | undefined {
    return this.content;
  }

  public getFilePath(): string | undefined {
    return this.filePath;
  }

  public getFileName(): string | undefined {
    return this.fileName;
  }

  public getGrade(): number | undefined {
    return this.grade;
  }

  public getFeedback(): string | undefined {
    return this.feedback;
  }

  public getIsLate(): boolean {
    return this.isLate;
  }

  public getStatus(): AssignmentSubmissionStatus {
    return this.status;
  }

  public getVersion(): number {
    return this.version;
  }

  public getSubmittedAt(): Date | undefined {
    return this.submittedAt;
  }

  public getGradedAt(): Date | undefined {
    return this.gradedAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Convert entity to plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): AssignmentSubmissionProps {
    return {
      id: this.id,
      assignmentId: this.assignmentId,
      studentId: this.studentId,
      content: this.content,
      filePath: this.filePath,
      fileName: this.fileName,
      grade: this.grade,
      feedback: this.feedback,
      isLate: this.isLate,
      status: this.status,
      version: this.version,
      submittedAt: this.submittedAt,
      gradedAt: this.gradedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
