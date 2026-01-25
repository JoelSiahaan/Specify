/**
 * Enrollment Types
 * 
 * TypeScript types for enrollment-related data.
 */

/**
 * Enrollment with student details (teacher view)
 */
export interface EnrollmentWithStudent {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date | string;
  studentName?: string;
  studentEmail?: string;
}

/**
 * List enrollments response
 */
export interface ListEnrollmentsResponse {
  data: EnrollmentWithStudent[];
}
