/**
 * Enrollment Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring enrollment data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

/**
 * Enrollment DTO for API responses
 * Contains all enrollment information for display
 */
export interface EnrollmentDTO {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
}

/**
 * Create Enrollment DTO for enrollment creation
 * Used when a student enrolls in a course
 */
export interface CreateEnrollmentDTO {
  courseCode: string;
}

/**
 * Enrollment with Course Details DTO
 * Used for displaying enrollments with course information
 */
export interface EnrollmentWithCourseDTO {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
}

/**
 * Enrollment with Student Details DTO
 * Used for displaying enrollments with student information (teacher view)
 */
export interface EnrollmentWithStudentDTO {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
  studentName?: string;
  studentEmail?: string;
}
