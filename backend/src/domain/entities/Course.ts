/**
 * Course Domain Entity
 * 
 * Represents a course in the LMS system with lifecycle management.
 * Supports course lifecycle: Active → Archived → Deleted
 * 
 * Requirements:
 * - 5.1: Course creation with name, description, and unique course code
 * - 5.4: Course archiving (prevents new enrollments, closes assignments/quizzes)
 * - 5.6: Course deletion (only archived courses can be deleted)
 * - 5.7: Cascade deletion of related data
 */

export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface CourseProps {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Course {
  private readonly id: string;
  private name: string;
  private description: string;
  private readonly courseCode: string;
  private status: CourseStatus;
  private readonly teacherId: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: CourseProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.courseCode = props.courseCode;
    this.status = props.status;
    this.teacherId = props.teacherId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new Course entity
   * 
   * @param props - Course properties
   * @returns Course instance
   * @throws Error if validation fails
   */
  public static create(props: CourseProps): Course {
    return new Course(props);
  }

  /**
   * Reconstitute Course from persistence
   * 
   * @param props - Course properties from database
   * @returns Course instance
   */
  public static reconstitute(props: CourseProps): Course {
    return new Course(props);
  }

  /**
   * Validate Course entity invariants
   * 
   * Requirements:
   * - 5.1: Name is required
   * - 5.4: Status must be Active or Archived
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    // Requirement 5.1: Course name is required
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Course name is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Course description is required');
    }

    if (!this.courseCode || this.courseCode.trim().length === 0) {
      throw new Error('Course code is required');
    }

    // Requirement 5.4: Status validation (Active or Archived)
    if (!Object.values(CourseStatus).includes(this.status)) {
      throw new Error(`Invalid course status: ${this.status}. Must be ACTIVE or ARCHIVED`);
    }

    if (!this.teacherId || this.teacherId.trim().length === 0) {
      throw new Error('Teacher ID is required');
    }
  }

  /**
   * Archive the course
   * 
   * Requirements:
   * - 5.4: Archive course (hide from active lists, prevent new enrollments)
   * - 5.5: Automatically close all open assignments and quizzes
   * 
   * Business Rules:
   * - Only active courses can be archived
   * - Archived courses cannot be archived again
   * 
   * @throws Error if course is already archived
   */
  public archive(): void {
    // Requirement 5.4: Cannot archive already archived course
    if (this.status === CourseStatus.ARCHIVED) {
      throw new Error('Course is already archived');
    }

    this.status = CourseStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * Validate that course can be deleted
   * 
   * Requirements:
   * - 5.6: Only archived courses can be deleted
   * - 5.7: Deletion will cascade to all related data
   * 
   * Business Rules:
   * - Active courses must be archived before deletion
   * - This method only validates, actual deletion happens in repository
   * 
   * @throws Error if course is not archived
   */
  public validateCanDelete(): void {
    // Requirement 5.6: Active courses cannot be deleted
    if (this.status === CourseStatus.ACTIVE) {
      throw new Error('Cannot delete active course. Archive the course first');
    }
  }

  /**
   * Update course name
   * 
   * Requirements:
   * - 5.3: Update active course
   * 
   * @param name - New course name
   * @throws Error if name is empty or course is archived
   */
  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Course name is required');
    }

    // Only active courses can be updated
    if (this.status === CourseStatus.ARCHIVED) {
      throw new Error('Cannot update archived course');
    }

    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * Update course description
   * 
   * Requirements:
   * - 5.3: Update active course
   * 
   * @param description - New course description
   * @throws Error if description is empty or course is archived
   */
  public updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Course description is required');
    }

    // Only active courses can be updated
    if (this.status === CourseStatus.ARCHIVED) {
      throw new Error('Cannot update archived course');
    }

    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Check if course is active
   * 
   * @returns true if course status is ACTIVE
   */
  public isActive(): boolean {
    return this.status === CourseStatus.ACTIVE;
  }

  /**
   * Check if course is archived
   * 
   * @returns true if course status is ARCHIVED
   */
  public isArchived(): boolean {
    return this.status === CourseStatus.ARCHIVED;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCourseCode(): string {
    return this.courseCode;
  }

  public getStatus(): CourseStatus {
    return this.status;
  }

  public getTeacherId(): string {
    return this.teacherId;
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
  public toObject(): CourseProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      courseCode: this.courseCode,
      status: this.status,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
