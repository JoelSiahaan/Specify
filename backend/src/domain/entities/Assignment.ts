/**
 * Assignment Domain Entity
 * 
 * Represents an assignment in the LMS system with submission and grading management.
 * Supports assignment lifecycle: Created → Open for Submissions → Grading Started (Locked)
 * 
 * Requirements:
 * - 9.1: Assignment creation with title, description, and due date
 * - 9.2: Due date validation (must be in future)
 * - 9.8: Prevent editing after due date
 * - 10.9: Reject submissions after grading starts
 */

export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  BOTH = 'BOTH'
}

export interface AssignmentProps {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType;
  acceptedFileFormats?: string[];
  gradingStarted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Assignment {
  private readonly id: string;
  private readonly courseId: string;
  private title: string;
  private description: string;
  private dueDate: Date;
  private submissionType: SubmissionType;
  private acceptedFileFormats: string[];
  private gradingStarted: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: AssignmentProps) {
    const now = new Date(); // Single timestamp for both createdAt and updatedAt
    
    this.id = props.id;
    this.courseId = props.courseId;
    this.title = props.title;
    this.description = props.description;
    this.dueDate = props.dueDate;
    this.submissionType = props.submissionType;
    this.acceptedFileFormats = props.acceptedFileFormats || [];
    this.gradingStarted = props.gradingStarted;
    this.createdAt = props.createdAt || now;
    this.updatedAt = props.updatedAt || now;

    this.validate();
  }

  /**
   * Create a new Assignment entity
   * 
   * @param props - Assignment properties
   * @returns Assignment instance
   * @throws Error if validation fails
   */
  public static create(props: AssignmentProps): Assignment {
    return new Assignment(props);
  }

  /**
   * Reconstitute Assignment from persistence
   * 
   * @param props - Assignment properties from database
   * @returns Assignment instance
   */
  public static reconstitute(props: AssignmentProps): Assignment {
    // Create instance without due date validation (assignment already exists in DB)
    const assignment = Object.create(Assignment.prototype);
    Object.assign(assignment, props);
    
    // Validate other invariants (but skip due date future check)
    assignment.validateBasicInvariants();
    
    return assignment;
  }

  /**
   * Validate Assignment entity invariants (for reconstituted entities)
   * 
   * This validation is used when loading from database.
   * It skips the "due date must be in future" check since the assignment already exists.
   * 
   * @throws Error if validation fails
   */
  // @ts-expect-error - Method is called dynamically in reconstitute()
  private validateBasicInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Assignment ID is required');
    }

    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Assignment title is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Assignment description is required');
    }

    if (!this.dueDate) {
      throw new Error('Assignment due date is required');
    }

    if (!Object.values(SubmissionType).includes(this.submissionType)) {
      throw new Error(`Invalid submission type: ${this.submissionType}. Must be FILE, TEXT, or BOTH`);
    }
  }

  /**
   * Validate Assignment entity invariants
   * 
   * Requirements:
   * - 9.1: Title, description, and due date are required
   * - 9.2: Due date must be in the future (for new assignments)
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Assignment ID is required');
    }

    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    // Requirement 9.1: Title is required
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Assignment title is required');
    }

    // Requirement 9.1: Description is required
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Assignment description is required');
    }

    // Requirement 9.1: Due date is required
    if (!this.dueDate) {
      throw new Error('Assignment due date is required');
    }

    // Requirement 9.2: Due date must be in the future (for new assignments only)
    // This validation is only for creation via create() method
    if (this.dueDate <= new Date()) {
      throw new Error('Assignment due date must be in the future');
    }

    // Submission type validation
    if (!Object.values(SubmissionType).includes(this.submissionType)) {
      throw new Error(`Invalid submission type: ${this.submissionType}. Must be FILE, TEXT, or BOTH`);
    }
  }

  /**
   * Start grading process
   * 
   * Requirements:
   * - 10.9: Reject submissions after grading starts
   * - 13.1: Starting to grade closes assignment to prevent further submissions
   * 
   * Business Rules:
   * - Once grading starts, assignment is locked
   * - No more submissions can be accepted
   * - Assignment cannot be edited
   * 
   * @throws Error if grading already started
   */
  public startGrading(): void {
    // Requirement 13.1: Cannot start grading if already started
    if (this.gradingStarted) {
      throw new Error('Grading has already started for this assignment');
    }

    this.gradingStarted = true;
    this.updatedAt = new Date();
  }

  /**
   * Update assignment title
   * 
   * Requirements:
   * - 9.8: Prevent editing after due date
   * - 9.9: Allow editing before due date
   * 
   * @param title - New assignment title
   * @throws Error if title is empty, due date passed, or grading started
   */
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Assignment title is required');
    }

    // Requirement 9.8: Cannot edit after due date
    if (this.dueDate <= new Date()) {
      throw new Error('Cannot edit assignment after due date');
    }

    // Cannot edit after grading started
    if (this.gradingStarted) {
      throw new Error('Cannot edit assignment after grading has started');
    }

    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * Update assignment description
   * 
   * Requirements:
   * - 9.8: Prevent editing after due date
   * - 9.9: Allow editing before due date
   * 
   * @param description - New assignment description
   * @throws Error if description is empty, due date passed, or grading started
   */
  public updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Assignment description is required');
    }

    // Requirement 9.8: Cannot edit after due date
    if (this.dueDate <= new Date()) {
      throw new Error('Cannot edit assignment after due date');
    }

    // Cannot edit after grading started
    if (this.gradingStarted) {
      throw new Error('Cannot edit assignment after grading has started');
    }

    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Update assignment due date
   * 
   * Requirements:
   * - 9.2: Due date must be in the future
   * - 9.8: Prevent editing after due date
   * - 9.9: Allow editing before due date
   * 
   * @param dueDate - New due date
   * @throws Error if due date is in past, current due date passed, or grading started
   */
  public updateDueDate(dueDate: Date): void {
    if (!dueDate) {
      throw new Error('Assignment due date is required');
    }

    // Requirement 9.2: New due date must be in the future
    if (dueDate <= new Date()) {
      throw new Error('Assignment due date must be in the future');
    }

    // Requirement 9.8: Cannot edit after current due date
    if (this.dueDate <= new Date()) {
      throw new Error('Cannot edit assignment after due date');
    }

    // Cannot edit after grading started
    if (this.gradingStarted) {
      throw new Error('Cannot edit assignment after grading has started');
    }

    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * Check if assignment can accept submissions
   * 
   * Requirements:
   * - 10.7: Accept submissions before due date
   * - 10.8: Accept late submissions before grading starts
   * - 10.9: Reject submissions after grading starts
   * 
   * @returns true if assignment can accept submissions
   */
  public canAcceptSubmissions(): boolean {
    // Requirement 10.9: Cannot accept submissions after grading started
    return !this.gradingStarted;
  }

  /**
   * Check if submission would be late
   * 
   * Requirements:
   * - 10.8: Mark submissions after due date as late
   * 
   * @returns true if current time is after due date
   */
  public isSubmissionLate(): boolean {
    return new Date() > this.dueDate;
  }

  /**
   * Check if assignment is past due date
   * 
   * @returns true if current time is after due date
   */
  public isPastDueDate(): boolean {
    return new Date() > this.dueDate;
  }

  /**
   * Check if grading has started
   * 
   * @returns true if grading has started
   */
  public hasGradingStarted(): boolean {
    return this.gradingStarted;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getCourseId(): string {
    return this.courseId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getDueDate(): Date {
    return this.dueDate;
  }

  public getSubmissionType(): SubmissionType {
    return this.submissionType;
  }

  public getAcceptedFileFormats(): string[] {
    return this.acceptedFileFormats;
  }

  public getGradingStarted(): boolean {
    return this.gradingStarted;
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
  public toObject(): AssignmentProps {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      submissionType: this.submissionType,
      acceptedFileFormats: this.acceptedFileFormats,
      gradingStarted: this.gradingStarted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
