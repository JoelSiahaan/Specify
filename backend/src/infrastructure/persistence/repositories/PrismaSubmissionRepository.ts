/**
 * PrismaSubmissionRepository Implementation (Adapter)
 * 
 * Concrete implementation of ISubmissionRepository using Prisma ORM.
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

import { PrismaClient, SubmissionStatus as PrismaSubmissionStatus } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission';

@injectable()
export class PrismaSubmissionRepository implements ISubmissionRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save a submission entity (create or update)
   * 
   * Requirements:
   * - 10.6: Record submission timestamp
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - Submission entity to save
   * @returns Promise resolving to saved Submission entity
   * @throws Error if save operation fails or version conflict (optimistic locking)
   */
  async save(submission: Submission): Promise<Submission> {
    try {
      const dbSubmission = await this.prisma.submission.upsert({
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
      throw new Error(`Failed to save submission: ${error.message}`);
    }
  }

  /**
   * Find a submission by ID
   * 
   * @param id - Submission ID (UUID)
   * @returns Promise resolving to Submission entity or null if not found
   */
  async findById(id: string): Promise<Submission | null> {
    const dbSubmission = await this.prisma.submission.findUnique({
      where: { id }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find a submission by assignment ID and student ID
   * 
   * Requirements:
   * - 10.12: Allow students to view their own submissions
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to Submission entity or null if not found
   */
  async findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<Submission | null> {
    const dbSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find all submissions for an assignment
   * 
   * Requirements:
   * - 14.1: Display all student submissions for an assignment
   * - 14.2: Show submission status (not submitted, submitted, graded, late)
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  async findByAssignmentId(assignmentId: string): Promise<Submission[]> {
    const dbSubmissions = await this.prisma.submission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'asc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Find all submissions by student ID
   * 
   * Requirements:
   * - 16.1: Display all assignments and quizzes with their status for a student
   * 
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  async findByStudentId(studentId: string): Promise<Submission[]> {
    const dbSubmissions = await this.prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Find all submissions for a course (across all assignments)
   * 
   * Requirements:
   * - 15.1: Generate CSV file with all student grades for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  async findByCourseId(courseId: string): Promise<Submission[]> {
    const dbSubmissions = await this.prisma.submission.findMany({
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
   * Update a submission entity with optimistic locking
   * 
   * Requirements:
   * - 13.5: Allow teachers to edit grades after saving
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - Submission entity to update
   * @returns Promise resolving to updated Submission entity
   * @throws Error if submission not found, update operation fails, or version conflict
   */
  async update(submission: Submission): Promise<Submission> {
    try {
      // Optimistic locking: Check version before update
      const currentVersion = submission.getVersion() - 1; // Entity increments version, so we check previous version
      
      const dbSubmission = await this.prisma.submission.updateMany({
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
        const exists = await this.prisma.submission.findUnique({
          where: { id: submission.getId() }
        });
        
        if (!exists) {
          throw new Error(`Submission with ID ${submission.getId()} not found`);
        }
        
        // Version conflict
        throw new Error('Submission has been modified by another user. Please refresh and try again');
      }

      // Fetch updated submission
      const updated = await this.prisma.submission.findUnique({
        where: { id: submission.getId() }
      });

      return this.toDomain(updated!);
    } catch (error: any) {
      // Re-throw our custom errors
      if (error.message.includes('not found') || error.message.includes('modified by another user')) {
        throw error;
      }
      throw new Error(`Failed to update submission: ${error.message}`);
    }
  }

  /**
   * Delete a submission by ID
   * 
   * @param id - Submission ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if submission not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.submission.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Submission with ID ${id} not found`);
      }
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }

  /**
   * Count submissions for an assignment by status
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
      this.prisma.submission.count({
        where: {
          assignmentId,
          status: PrismaSubmissionStatus.NOT_SUBMITTED
        }
      }),
      this.prisma.submission.count({
        where: {
          assignmentId,
          status: PrismaSubmissionStatus.SUBMITTED
        }
      }),
      this.prisma.submission.count({
        where: {
          assignmentId,
          status: PrismaSubmissionStatus.GRADED
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
   * Find all graded submissions for a student in a course
   * 
   * Requirements:
   * - 16.7: Calculate and display average grade for the course
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of graded Submission entities
   */
  async findGradedByStudentAndCourse(studentId: string, courseId: string): Promise<Submission[]> {
    const dbSubmissions = await this.prisma.submission.findMany({
      where: {
        studentId,
        status: PrismaSubmissionStatus.GRADED,
        assignment: {
          courseId
        }
      },
      orderBy: { gradedAt: 'desc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Map Prisma Submission model to domain Submission entity
   * 
   * @param dbSubmission - Prisma Submission model
   * @returns Domain Submission entity
   */
  private toDomain(dbSubmission: any): Submission {
    return Submission.reconstitute({
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
   * Map domain SubmissionStatus to Prisma SubmissionStatus enum
   * 
   * @param status - Domain SubmissionStatus
   * @returns Prisma SubmissionStatus enum
   */
  private mapStatusToPrisma(status: SubmissionStatus): PrismaSubmissionStatus {
    return status as unknown as PrismaSubmissionStatus;
  }

  /**
   * Map Prisma SubmissionStatus enum to domain SubmissionStatus
   * 
   * @param status - Prisma SubmissionStatus enum
   * @returns Domain SubmissionStatus
   */
  private mapStatusToDomain(status: PrismaSubmissionStatus): SubmissionStatus {
    return status as unknown as SubmissionStatus;
  }
}
