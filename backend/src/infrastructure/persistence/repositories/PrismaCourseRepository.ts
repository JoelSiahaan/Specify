/**
 * PrismaCourseRepository Implementation (Adapter)
 * 
 * Concrete implementation of ICourseRepository using Prisma ORM.
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

import { PrismaClient, CourseStatus as PrismaCourseStatus } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { Course, CourseStatus } from '../../../domain/entities/Course.js';

@injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save a course entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * 
   * @param course - Course entity to save
   * @returns Promise resolving to saved Course entity
   * @throws Error if unique constraint violated (duplicate courseCode)
   */
  async save(course: Course): Promise<Course> {
    try {
      const dbCourse = await this.prisma.course.upsert({
        where: { id: course.getId() },
        create: {
          id: course.getId(),
          name: course.getName(),
          description: course.getDescription(),
          courseCode: course.getCourseCode(),
          status: this.mapStatusToPrisma(course.getStatus()),
          teacherId: course.getTeacherId(),
          createdAt: course.getCreatedAt(),
          updatedAt: course.getUpdatedAt()
        },
        update: {
          name: course.getName(),
          description: course.getDescription(),
          status: this.mapStatusToPrisma(course.getStatus()),
          updatedAt: course.getUpdatedAt()
        }
      });

      return this.toDomain(dbCourse);
    } catch (error: any) {
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new Error('A course with this course code already exists');
      }
      throw new Error(`Failed to save course: ${error.message}`);
    }
  }

  /**
   * Find a course by ID
   * 
   * @param id - Course ID (UUID)
   * @returns Promise resolving to Course entity or null if not found
   */
  async findById(id: string): Promise<Course | null> {
    const dbCourse = await this.prisma.course.findUnique({
      where: { id }
    });

    return dbCourse ? this.toDomain(dbCourse) : null;
  }

  /**
   * Find all courses by teacher ID
   * 
   * @param teacherId - Teacher ID (UUID)
   * @returns Promise resolving to array of Course entities
   */
  async findByTeacherId(teacherId: string): Promise<Course[]> {
    const dbCourses = await this.prisma.course.findMany({
      where: { teacherId }
    });

    return dbCourses.map(dbCourse => this.toDomain(dbCourse));
  }

  /**
   * Find a course by course code
   * 
   * @param code - Course code (6-character alphanumeric)
   * @returns Promise resolving to Course entity or null if not found
   */
  async findByCode(code: string): Promise<Course | null> {
    const dbCourse = await this.prisma.course.findUnique({
      where: { courseCode: code }
    });

    return dbCourse ? this.toDomain(dbCourse) : null;
  }

  /**
   * Update a course entity
   * 
   * @param course - Course entity to update
   * @returns Promise resolving to updated Course entity
   * @throws Error if course not found or update operation fails
   */
  async update(course: Course): Promise<Course> {
    try {
      const dbCourse = await this.prisma.course.update({
        where: { id: course.getId() },
        data: {
          name: course.getName(),
          description: course.getDescription(),
          status: this.mapStatusToPrisma(course.getStatus()),
          updatedAt: course.getUpdatedAt()
        }
      });

      return this.toDomain(dbCourse);
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Course with ID ${course.getId()} not found`);
      }
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  /**
   * Delete a course by ID
   * 
   * Requirements:
   * - 5.6: Only archived courses can be deleted
   * - 5.7: Cascade delete all related data (materials, assignments, quizzes, submissions, enrollments)
   * 
   * Note: Cascade deletion is handled by Prisma schema (onDelete: Cascade)
   * Business rule validation (archived status) is handled in domain layer
   * 
   * @param id - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if course not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.course.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Course with ID ${id} not found`);
      }
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  /**
   * Find all courses (optionally filtered by status)
   * 
   * Requirements:
   * - 5.10: Allow teachers to view all their created courses
   * - 6.1: Students view active courses
   * 
   * @param status - Optional status filter (ACTIVE or ARCHIVED)
   * @returns Promise resolving to array of Course entities
   */
  async findAll(status?: string): Promise<Course[]> {
    const where = status ? { status: this.mapStatusToPrisma(status as CourseStatus) } : {};
    
    const dbCourses = await this.prisma.course.findMany({
      where
    });

    return dbCourses.map(dbCourse => this.toDomain(dbCourse));
  }

  /**
   * Map Prisma Course model to domain Course entity
   * 
   * @param dbCourse - Prisma Course model
   * @returns Domain Course entity
   */
  private toDomain(dbCourse: any): Course {
    return Course.reconstitute({
      id: dbCourse.id,
      name: dbCourse.name,
      description: dbCourse.description,
      courseCode: dbCourse.courseCode,
      status: this.mapStatusToDomain(dbCourse.status),
      teacherId: dbCourse.teacherId,
      createdAt: dbCourse.createdAt,
      updatedAt: dbCourse.updatedAt
    });
  }

  /**
   * Map domain CourseStatus to Prisma CourseStatus enum
   * 
   * @param status - Domain CourseStatus
   * @returns Prisma CourseStatus enum
   */
  private mapStatusToPrisma(status: CourseStatus): PrismaCourseStatus {
    return status as unknown as PrismaCourseStatus;
  }

  /**
   * Map Prisma CourseStatus enum to domain CourseStatus
   * 
   * @param status - Prisma CourseStatus enum
   * @returns Domain CourseStatus
   */
  private mapStatusToDomain(status: PrismaCourseStatus): CourseStatus {
    return status as unknown as CourseStatus;
  }
}
