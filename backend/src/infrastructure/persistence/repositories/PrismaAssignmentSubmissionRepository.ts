/**
 * PrismaAssignmentSubmissionRepository Implementation (Adapter)
 * 
 * Concrete implementation of IAssignmentSubmissionRepository using Prisma ORM.
 * This is an Adapter in Clean Architecture - implements the Port defined in domain layer.
 * 
 * Requirements:
 * - 17.1: Data persistence with PostgreSQL
 * - 17.2: Repository pattern implementation
 * - 17.3: Infrastructure layer implements domain interfaces
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 * 
 * Design Decisions:
 * - Uses Prisma Client for database operations
 * - Maps between Prisma models and domain entities
 * - Implements optimistic locking with version field
 * - Handles database-specific errors (unique constraints, version conflicts)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { PrismaClient, AssignmentSubmissionStatus as PrismaAssignmentSubmissionStatus } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository.js';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '../../../domain/entities/AssignmentSubmission.js';

@injectable()
export class PrismaAssignmentSubmissionRepository implements IAssignmentSubmissionRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save an assignment submission entity (create or update)
   * 
   * Requirements:
   * - 10.6: Record submission timestamp
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - AssignmentSubmission entity to save
   * @returns Promise resolving to saved AssignmentSubmission entity
   * @throws Error if save operation fails or version conflict (optimistic locking)
   */
  async save(submission: AssignmentSubmission): Promise<AssignmentSubmission> {
    try {
      const dbSubmission = await this.prisma.assignmentSubmission.upsert({
        where: { id: submission.getId() },
        create: {
          id: submission.getId(),
          assignmentId: submission.getAssignmentId(),
          studentId: submission.getStudentId(),
          content: submission.getContent(),
          filePath: submission.getFilePath(),
          fileName: submission.getFileName(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          isLate: submission.getIsLate(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(),
          submittedAt: submission.getSubmittedAt(),
          gradedAt: submission.getGradedAt(),
          createdAt: submission.getCreatedAt(),
          updatedAt: submission.getUpdatedAt()
        },
        update: {
          content: submission.getContent(),
          filePath: submission.getFilePath(),
          fileName: submission.getFileName(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          isLate: submission.getIsLate(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(),
          submittedAt: submission.getSubmittedAt(),
          gradedAt: submission.getGradedAt(),
          updatedAt: submission.getUpdatedAt()
        }
      });

      return this.toDomain(dbSubmission);
    } catch (error: any) {
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new Error('A submission for this assignment and student already exists');
      }
      throw new Error(`Failed to save assignment submission: ${error.message}`);
    }
  }

  /**
   * Find an assignment submission by ID
   * 
   * @param id - AssignmentSubmission ID (UUID)
   * @returns Promise resolving to AssignmentSubmission entity or null if not found
   */
  async findById(id: string): Promise<AssignmentSubmission | null> {
    const dbSubmission = await this.prisma.assignmentSubmission.findUnique({
      where: { id }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find an assignment submission by assignment ID and student ID
   * 
   * Requirements:
   * - 10.12: Allow students to view their own submissions
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to AssignmentSubmission entity or null if not found
   */
  async findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const dbSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId
      }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find all assignment submissions for an assignment
   * 
   * Requirements:
   * - 14.1: Display all student submissions for an assignment
   * - 14.2: Show submission status (not submitted, submitted, graded, late)
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @returns Promise resolving to array of AssignmentSubmission entities
   */
  async findByAssignmentId(assignmentId: string): Promise<AssignmentSubmission[]> {
    const dbSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'asc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Find all assignment submissions by student ID
   * 
   * Requirements:
   * - 16.1: Display all assignments with their status for a student
   * 
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to array of AssignmentSubmission entities
   */
  async findByStudentId(studentId: string): Promise<AssignmentSubmission[]> {
    const dbSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Find all assignment submissions for a course (across all assignments)
   * 
   * Requirements:
   * - 15.1: Generate CSV file with all student grades for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of AssignmentSubmission entities
   */
  async findByCourseId(courseId: string): Promise<AssignmentSubmission[]> {
    const dbSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          courseId
        }
      },
      include: {
        assignment: true,
        student: true
      },
      orderBy: [
        { assignment: { title: 'asc' } },
        { student: { name: 'asc' } }
      ]
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Update an assignment submission entity with optimistic locking
   * 
   * Requirements:
   * - 13.5: Allow teachers to edit grades after saving
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - AssignmentSubmission entity to update
   * @returns Promise resolving to updated AssignmentSubmission entity
   * @throws Error if submission not found, update operation fails, or version conflict
   */
  async update(submission: AssignmentSubmission): Promise<AssignmentSubmission> {
    try {
      // Optimistic locking: Check version before update
      const currentVersion = submission.getVersion() - 1; // Entity increments version, so we check previous version
      
      const dbSubmission = await this.prisma.assignmentSubmission.updateMany({
        where: {
          id: submission.getId(),
          version: currentVersion // Optimistic locking check
        },
        data: {
          content: submission.getContent(),
          filePath: submission.getFilePath(),
          fileName: submission.getFileName(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          isLate: submission.getIsLate(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(),
          submittedAt: submission.getSubmittedAt(),
          gradedAt: submission.getGradedAt(),
          updatedAt: submission.getUpdatedAt()
        }
      });

      // If no rows were updated, version conflict occurred
      if (dbSubmission.count === 0) {
        // Check if submission exists
        const exists = await this.prisma.assignmentSubmission.findUnique({
          where: { id: submission.getId() }
        });
        
        if (!exists) {
          throw new Error(`Assignment submission with ID ${submission.getId()} not found`);
        }
        
        // Version conflict
        throw new Error('Submission has been modified by another user. Please refresh and try again');
      }

      // Fetch updated submission
      const updated = await this.prisma.assignmentSubmission.findUnique({
        where: { id: submission.getId() }
      });

      return this.toDomain(updated!);
    } catch (error: any) {
      // Re-throw our custom errors
      if (error.message.includes('not found') || error.message.includes('modified by another user')) {
        throw error;
      }
      throw new Error(`Failed to update assignment submission: ${error.message}`);
    }
  }

  /**
   * Delete an assignment submission by ID
   * 
   * @param id - AssignmentSubmission ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if submission not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.assignmentSubmission.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Assignment submission with ID ${id} not found`);
      }
      throw new Error(`Failed to delete assignment submission: ${error.message}`);
    }
  }

  /**
   * Count assignment submissions for an assignment by status
   * 
   * Requirements:
   * - 14.5: Separate ungraded and graded submissions
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @returns Promise resolving to object with counts by status
   */
  async countByAssignmentIdAndStatus(assignmentId: string): Promise<{
    notSubmitted: number;
    submitted: number;
    graded: number;
  }> {
    const [notSubmitted, submitted, graded] = await Promise.all([
      this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          status: PrismaAssignmentSubmissionStatus.NOT_SUBMITTED
        }
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          status: PrismaAssignmentSubmissionStatus.SUBMITTED
        }
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          status: PrismaAssignmentSubmissionStatus.GRADED
        }
      })
    ]);

    return {
      notSubmitted,
      submitted,
      graded
    };
  }

  /**
   * Find all graded assignment submissions for a student in a course
   * 
   * Requirements:
   * - 16.7: Calculate and display average grade for the course
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of graded AssignmentSubmission entities
   */
  async findGradedByStudentAndCourse(studentId: string, courseId: string): Promise<AssignmentSubmission[]> {
    const dbSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        status: PrismaAssignmentSubmissionStatus.GRADED,
        assignment: {
          courseId
        }
      },
      orderBy: { gradedAt: 'desc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Map Prisma AssignmentSubmission model to domain AssignmentSubmission entity
   * 
   * @param dbSubmission - Prisma AssignmentSubmission model
   * @returns Domain AssignmentSubmission entity
   */
  private toDomain(dbSubmission: any): AssignmentSubmission {
    return AssignmentSubmission.reconstitute({
      id: dbSubmission.id,
      assignmentId: dbSubmission.assignmentId,
      studentId: dbSubmission.studentId,
      content: dbSubmission.content,
      filePath: dbSubmission.filePath,
      fileName: dbSubmission.fileName,
      grade: dbSubmission.grade,
      feedback: dbSubmission.feedback,
      isLate: dbSubmission.isLate,
      status: this.mapStatusToDomain(dbSubmission.status),
      version: dbSubmission.version,
      submittedAt: dbSubmission.submittedAt,
      gradedAt: dbSubmission.gradedAt,
      createdAt: dbSubmission.createdAt,
      updatedAt: dbSubmission.updatedAt
    });
  }

  /**
   * Map domain AssignmentSubmissionStatus to Prisma AssignmentSubmissionStatus enum
   * 
   * @param status - Domain AssignmentSubmissionStatus
   * @returns Prisma AssignmentSubmissionStatus enum
   */
  private mapStatusToPrisma(status: AssignmentSubmissionStatus): PrismaAssignmentSubmissionStatus {
    return status as unknown as PrismaAssignmentSubmissionStatus;
  }

  /**
   * Map Prisma AssignmentSubmissionStatus enum to domain AssignmentSubmissionStatus
   * 
   * @param status - Prisma AssignmentSubmissionStatus enum
   * @returns Domain AssignmentSubmissionStatus
   */
  private mapStatusToDomain(status: PrismaAssignmentSubmissionStatus): AssignmentSubmissionStatus {
    return status as unknown as AssignmentSubmissionStatus;
  }
}
