/**
 * Enrollment Mapper
 * 
 * Maps between Enrollment domain entity and EnrollmentDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 */

import { Enrollment } from '../../domain/entities/Enrollment.js';
import { 
  EnrollmentDTO, 
  EnrollmentWithCourseDTO, 
  EnrollmentWithStudentDTO 
} from '../dtos/EnrollmentDTO.js';
import { randomUUID } from 'crypto';

export class EnrollmentMapper {
  /**
   * Convert Enrollment entity to EnrollmentDTO
   * 
   * @param enrollment - Enrollment domain entity
   * @returns EnrollmentDTO for API response
   */
  static toDTO(enrollment: Enrollment): EnrollmentDTO {
    return {
      id: enrollment.getId(),
      courseId: enrollment.getCourseId(),
      studentId: enrollment.getStudentId(),
      enrolledAt: enrollment.getEnrolledAt()
    };
  }

  /**
   * Convert Enrollment entity to domain
   * Used for enrollment creation
   * 
   * @param courseId - ID of the course to enroll in
   * @param studentId - ID of the student enrolling
   * @returns Enrollment domain entity
   */
  static toDomain(courseId: string, studentId: string): Enrollment {
    return Enrollment.create({
      id: randomUUID(),
      courseId: courseId,
      studentId: studentId,
      enrolledAt: new Date()
    });
  }

  /**
   * Convert multiple Enrollment entities to EnrollmentDTOs
   * 
   * @param enrollments - Array of Enrollment domain entities
   * @returns Array of EnrollmentDTOs
   */
  static toDTOList(enrollments: Enrollment[]): EnrollmentDTO[] {
    return enrollments.map(enrollment => this.toDTO(enrollment));
  }

  /**
   * Convert Enrollment entity to EnrollmentWithCourseDTO
   * Used for displaying enrollments with course information (student view)
   * 
   * @param enrollment - Enrollment domain entity
   * @param courseName - Optional course name
   * @param courseCode - Optional course code
   * @param teacherName - Optional teacher name
   * @returns EnrollmentWithCourseDTO for API response
   */
  static toWithCourseDTO(
    enrollment: Enrollment,
    courseName?: string,
    courseCode?: string,
    teacherName?: string
  ): EnrollmentWithCourseDTO {
    return {
      id: enrollment.getId(),
      courseId: enrollment.getCourseId(),
      studentId: enrollment.getStudentId(),
      enrolledAt: enrollment.getEnrolledAt(),
      courseName: courseName,
      courseCode: courseCode,
      teacherName: teacherName
    };
  }

  /**
   * Convert multiple Enrollment entities to EnrollmentWithCourseDTOs
   * 
   * @param enrollments - Array of Enrollment domain entities
   * @param courseNames - Optional map of course IDs to names
   * @param courseCodes - Optional map of course IDs to codes
   * @param teacherNames - Optional map of course IDs to teacher names
   * @returns Array of EnrollmentWithCourseDTOs
   */
  static toWithCourseDTOList(
    enrollments: Enrollment[],
    courseNames?: Map<string, string>,
    courseCodes?: Map<string, string>,
    teacherNames?: Map<string, string>
  ): EnrollmentWithCourseDTO[] {
    return enrollments.map(enrollment => 
      this.toWithCourseDTO(
        enrollment,
        courseNames?.get(enrollment.getCourseId()),
        courseCodes?.get(enrollment.getCourseId()),
        teacherNames?.get(enrollment.getCourseId())
      )
    );
  }

  /**
   * Convert Enrollment entity to EnrollmentWithStudentDTO
   * Used for displaying enrollments with student information (teacher view)
   * 
   * @param enrollment - Enrollment domain entity
   * @param studentName - Optional student name
   * @param studentEmail - Optional student email
   * @returns EnrollmentWithStudentDTO for API response
   */
  static toWithStudentDTO(
    enrollment: Enrollment,
    studentName?: string,
    studentEmail?: string
  ): EnrollmentWithStudentDTO {
    return {
      id: enrollment.getId(),
      courseId: enrollment.getCourseId(),
      studentId: enrollment.getStudentId(),
      enrolledAt: enrollment.getEnrolledAt(),
      studentName: studentName,
      studentEmail: studentEmail
    };
  }

  /**
   * Convert multiple Enrollment entities to EnrollmentWithStudentDTOs
   * 
   * @param enrollments - Array of Enrollment domain entities
   * @param studentNames - Optional map of student IDs to names
   * @param studentEmails - Optional map of student IDs to emails
   * @returns Array of EnrollmentWithStudentDTOs
   */
  static toWithStudentDTOList(
    enrollments: Enrollment[],
    studentNames?: Map<string, string>,
    studentEmails?: Map<string, string>
  ): EnrollmentWithStudentDTO[] {
    return enrollments.map(enrollment => 
      this.toWithStudentDTO(
        enrollment,
        studentNames?.get(enrollment.getStudentId()),
        studentEmails?.get(enrollment.getStudentId())
      )
    );
  }
}
