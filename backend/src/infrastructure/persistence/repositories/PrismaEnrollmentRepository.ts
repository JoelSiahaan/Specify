/**
 * PrismaEnrollmentRepository Implementation (Adapter)
 * 
 * Concrete implementation of IEnrollmentRepository using Prisma ORM.
 * This is an Adapter in Clean Architecture - implements the Port defined in domain layer.
 * 
 * Requirements:
 * - 17.1: Data persistence with PostgreSQL
 * - 17.2: Repository pattern implementation
 * - 17.3: Infrastructure layer implements domain interfaces
 * 
 * Design Decisions:
 * - Uses Prisma Client for database operations
 * - Maps between Prisma models and domain entities
 * - Handles database-specific errors (unique constraints, etc.)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { Enrollment } from '../../../domain/entities/Enrollment.js';

@injectable()
export class PrismaEnrollmentRepository implements IEnrollmentRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save an enrollment entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * 
   * Requirements:
   * - 6.5: Enroll student in course
   * 
   * @param enrollment - Enrollment entity to save
   * @returns Promise resolving to saved Enrollment entity
   * @throws Error if unique constraint violated (duplicate enrollment)
   */
  async save(enrollment: Enrollment): Promise<Enrollment> {
    try {
      const dbEnrollment = await this.prisma.enrollment.upsert({
        where: { id: enrollment.getId() },
        create: {
          id: enrollment.getId(),
          studentId: enrollment.getStudentId(),
          courseId: enrollment.getCourseId(),
          enrolledAt: enrollment.getEnrolledAt()
        },
        update: {
          enrolledAt: enrollment.getEnrolledAt()
        }
      });

      return this.toDomain(dbEnrollment);
    } catch (error: any) {
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new Error('Student is already enrolled in this course');
      }
      throw new Error(`Failed to save enrollment: ${error.message}`);
    }
  }

  /**
   * Find an enrollment by student ID and course ID
   * 
   * Requirements:
   * - 6.8: Prevent duplicate enrollment (check if enrollment exists)
   * 
   * Used to check if a student is already enrolled in a course.
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to Enrollment entity or null if not found
   */
  async findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollment | null> {
    const dbEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    return dbEnrollment ? this.toDomain(dbEnrollment) : null;
  }

  /**
   * Find all enrollments for a course
   * 
   * Requirements:
   * - 5.10: View enrollment counts for courses
   * - 5.8: Bulk unenroll students from archived courses
   * 
   * Used to get all students enrolled in a course.
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Enrollment entities
   */
  async findByCourse(courseId: string): Promise<Enrollment[]> {
    const dbEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId }
    });

    return dbEnrollments.map(dbEnrollment => this.toDomain(dbEnrollment));
  }

  /**
   * Find all enrollments for a student
   * 
   * Requirements:
   * - 3.1: Students view enrolled courses on dashboard
   * 
   * Used to get all courses a student is enrolled in.
   * 
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to array of Enrollment entities
   */
  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    const dbEnrollments = await this.prisma.enrollment.findMany({
      where: { studentId }
    });

    return dbEnrollments.map(dbEnrollment => this.toDomain(dbEnrollment));
  }

  /**
   * Delete all enrollments for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete enrollments when course is deleted
   * - 5.8: Bulk unenroll students from archived courses
   * 
   * Used when deleting a course or bulk unenrolling students.
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if delete operation fails
   */
  async deleteAllByCourse(courseId: string): Promise<void> {
    try {
      await this.prisma.enrollment.deleteMany({
        where: { courseId }
      });
    } catch (error: any) {
      throw new Error(`Failed to delete enrollments for course: ${error.message}`);
    }
  }

  /**
   * Map Prisma Enrollment model to domain Enrollment entity
   * 
   * @param dbEnrollment - Prisma Enrollment model
   * @returns Domain Enrollment entity
   */
  private toDomain(dbEnrollment: any): Enrollment {
    return Enrollment.reconstitute({
      id: dbEnrollment.id,
      studentId: dbEnrollment.studentId,
      courseId: dbEnrollment.courseId,
      enrolledAt: dbEnrollment.enrolledAt
    });
  }
}
