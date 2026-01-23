/**
 * Enrollment Domain Entity
 * 
 * Represents a student's enrollment in a course.
 * Manages enrollment lifecycle and duplicate prevention.
 * 
 * Requirements:
 * - 6.5: Enroll student in active course
 * - 6.8: Prevent duplicate enrollment
 */

export interface EnrollmentProps {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt?: Date;
}

export class Enrollment {
  private readonly id: string;
  private readonly courseId: string;
  private readonly studentId: string;
  private readonly enrolledAt: Date;

  private constructor(props: EnrollmentProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.studentId = props.studentId;
    this.enrolledAt = props.enrolledAt || new Date();

    this.validate();
  }

  /**
   * Create a new Enrollment entity
   * 
   * Requirements:
   * - 6.5: Enroll student in course
   * 
   * @param props - Enrollment properties
   * @returns Enrollment instance
   * @throws Error if validation fails
   */
  public static create(props: EnrollmentProps): Enrollment {
    return new Enrollment(props);
  }

  /**
   * Reconstitute Enrollment from persistence
   * 
   * @param props - Enrollment properties from database
   * @returns Enrollment instance
   */
  public static reconstitute(props: EnrollmentProps): Enrollment {
    return new Enrollment(props);
  }

  /**
   * Validate Enrollment entity invariants
   * 
   * Requirements:
   * - 6.5: Valid courseId and studentId required
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Enrollment ID is required');
    }

    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    if (!this.studentId || this.studentId.trim().length === 0) {
      throw new Error('Student ID is required');
    }
  }

  /**
   * Check if this enrollment matches a course and student
   * 
   * Requirements:
   * - 6.8: Prevent duplicate enrollment
   * 
   * Used to detect duplicate enrollments before creation.
   * 
   * @param courseId - Course ID to check
   * @param studentId - Student ID to check
   * @returns true if enrollment matches both IDs
   */
  public matches(courseId: string, studentId: string): boolean {
    return this.courseId === courseId && this.studentId === studentId;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getCourseId(): string {
    return this.courseId;
  }

  public getStudentId(): string {
    return this.studentId;
  }

  public getEnrolledAt(): Date {
    return this.enrolledAt;
  }

  /**
   * Convert entity to plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): EnrollmentProps {
    return {
      id: this.id,
      courseId: this.courseId,
      studentId: this.studentId,
      enrolledAt: this.enrolledAt
    };
  }
}
