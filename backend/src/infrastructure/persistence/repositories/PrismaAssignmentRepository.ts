/**
 * PrismaAssignmentRepository Implementation (Adapter)
 * 
 * Concrete implementation of IAssignmentRepository using Prisma ORM.
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

import { PrismaClient, SubmissionType as PrismaSubmissionType } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import { Assignment, SubmissionType } from '../../../domain/entities/Assignment';

@injectable()
export class PrismaAssignmentRepository implements IAssignmentRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save an assignment entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * 
   * @param assignment - Assignment entity to save
   * @returns Promise resolving to saved Assignment entity
   * @throws Error if save operation fails
   */
  async save(assignment: Assignment): Promise<Assignment> {
    try {
      const dbAssignment = await this.prisma.assignment.upsert({
        where: { id: assignment.getId() },
        create: {
          id: assignment.getId(),
          courseId: assignment.getCourseId(),
          title: assignment.getTitle(),
          description: assignment.getDescription(),
          dueDate: assignment.getDueDate(),
          submissionType: this.mapSubmissionTypeToPrisma(assignment.getSubmissionType()),
          acceptedFileFormats: assignment.getAcceptedFileFormats(),
          gradingStarted: assignment.getGradingStarted(),
          createdAt: assignment.getCreatedAt(),
          updatedAt: assignment.getUpdatedAt()
        },
        update: {
          title: assignment.getTitle(),
          description: assignment.getDescription(),
          dueDate: assignment.getDueDate(),
          submissionType: this.mapSubmissionTypeToPrisma(assignment.getSubmissionType()),
          acceptedFileFormats: assignment.getAcceptedFileFormats(),
          gradingStarted: assignment.getGradingStarted(),
          updatedAt: assignment.getUpdatedAt()
        }
      });

      return this.toDomain(dbAssignment);
    } catch (error: any) {
      throw new Error(`Failed to save assignment: ${error.message}`);
    }
  }

  /**
   * Find an assignment by ID
   * 
   * @param id - Assignment ID (UUID)
   * @returns Promise resolving to Assignment entity or null if not found
   */
  async findById(id: string): Promise<Assignment | null> {
    const dbAssignment = await this.prisma.assignment.findUnique({
      where: { id }
    });

    return dbAssignment ? this.toDomain(dbAssignment) : null;
  }

  /**
   * Find all assignments by course ID
   * 
   * Requirements:
   * - 9.11: Allow teachers to view all assignments for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Assignment entities
   */
  async findByCourseId(courseId: string): Promise<Assignment[]> {
    const dbAssignments = await this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: { dueDate: 'asc' }
    });

    return dbAssignments.map(dbAssignment => this.toDomain(dbAssignment));
  }

  /**
   * Update an assignment entity
   * 
   * Requirements:
   * - 9.8: Prevent editing after due date
   * - 9.9: Allow editing before due date
   * 
   * @param assignment - Assignment entity to update
   * @returns Promise resolving to updated Assignment entity
   * @throws Error if assignment not found or update operation fails
   */
  async update(assignment: Assignment): Promise<Assignment> {
    try {
      const dbAssignment = await this.prisma.assignment.update({
        where: { id: assignment.getId() },
        data: {
          title: assignment.getTitle(),
          description: assignment.getDescription(),
          dueDate: assignment.getDueDate(),
          submissionType: this.mapSubmissionTypeToPrisma(assignment.getSubmissionType()),
          acceptedFileFormats: assignment.getAcceptedFileFormats(),
          gradingStarted: assignment.getGradingStarted(),
          updatedAt: assignment.getUpdatedAt()
        }
      });

      return this.toDomain(dbAssignment);
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Assignment with ID ${assignment.getId()} not found`);
      }
      throw new Error(`Failed to update assignment: ${error.message}`);
    }
  }

  /**
   * Delete an assignment by ID
   * 
   * Requirements:
   * - 9.10: Allow teachers to delete assignments at any time
   * 
   * Note: Cascade deletion is handled by Prisma schema (onDelete: Cascade)
   * 
   * @param id - Assignment ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if assignment not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.assignment.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Assignment with ID ${id} not found`);
      }
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  }

  /**
   * Find all assignments for a course with submission counts
   * 
   * Requirements:
   * - 14.1: Display all student submissions for an assignment
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Assignment entities with submission metadata
   */
  async findByCourseIdWithSubmissionCounts(courseId: string): Promise<Assignment[]> {
    const dbAssignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { assignmentSubmissions: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Note: Submission counts are included in the query but not mapped to domain entity
    // as Assignment entity doesn't have submission count property.
    // This method returns the same as findByCourseId for now.
    // Use case layer can query submissions separately if needed.
    return dbAssignments.map(dbAssignment => this.toDomain(dbAssignment));
  }

  /**
   * Close all assignments for a course (set gradingStarted = true)
   * 
   * Requirements:
   * - 5.5: When course is archived, automatically close all assignments
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if operation fails
   */
  async closeAllByCourseId(courseId: string): Promise<void> {
    try {
      await this.prisma.assignment.updateMany({
        where: { courseId },
        data: {
          gradingStarted: true,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to close assignments for course ${courseId}: ${error.message}`);
    }
  }

  /**
   * Map Prisma Assignment model to domain Assignment entity
   * 
   * @param dbAssignment - Prisma Assignment model
   * @returns Domain Assignment entity
   */
  private toDomain(dbAssignment: any): Assignment {
    return Assignment.reconstitute({
      id: dbAssignment.id,
      courseId: dbAssignment.courseId,
      title: dbAssignment.title,
      description: dbAssignment.description,
      dueDate: dbAssignment.dueDate,
      submissionType: this.mapSubmissionTypeToDomain(dbAssignment.submissionType),
      acceptedFileFormats: dbAssignment.acceptedFileFormats,
      gradingStarted: dbAssignment.gradingStarted,
      createdAt: dbAssignment.createdAt,
      updatedAt: dbAssignment.updatedAt
    });
  }

  /**
   * Map domain SubmissionType to Prisma SubmissionType enum
   * 
   * @param type - Domain SubmissionType
   * @returns Prisma SubmissionType enum
   */
  private mapSubmissionTypeToPrisma(type: SubmissionType): PrismaSubmissionType {
    return type as unknown as PrismaSubmissionType;
  }

  /**
   * Map Prisma SubmissionType enum to domain SubmissionType
   * 
   * @param type - Prisma SubmissionType enum
   * @returns Domain SubmissionType
   */
  private mapSubmissionTypeToDomain(type: PrismaSubmissionType): SubmissionType {
    return type as unknown as SubmissionType;
  }
}
