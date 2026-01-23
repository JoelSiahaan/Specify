/**
 * PrismaQuizSubmissionRepository Implementation (Adapter)
 * 
 * Concrete implementation of IQuizSubmissionRepository using Prisma ORM.
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
 * - Handles JSON serialization for answers array
 * - Implements optimistic locking with version field
 * - Handles database-specific errors (foreign key constraints, unique constraints, etc.)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { PrismaClient, QuizSubmissionStatus as PrismaQuizSubmissionStatus } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import { QuizSubmission, QuizSubmissionStatus, QuizAnswer } from '../../../domain/entities/QuizSubmission';

@injectable()
export class PrismaQuizSubmissionRepository implements IQuizSubmissionRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save a quiz submission entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * Serializes answers array to JSON for storage.
   * 
   * Requirements:
   * - 12.2: Start quiz and create submission record
   * - 12.5: Accept submission before time limit
   * - 12.4: Auto-submit when time expires
   * 
   * @param submission - QuizSubmission entity to save
   * @returns Promise resolving to saved QuizSubmission entity
   * @throws Error if foreign key constraint violated or unique constraint violated
   */
  async save(submission: QuizSubmission): Promise<QuizSubmission> {
    try {
      const dbSubmission = await this.prisma.quizSubmission.upsert({
        where: { id: submission.getId() },
        create: {
          id: submission.getId(),
          quizId: submission.getQuizId(),
          studentId: submission.getStudentId(),
          answers: submission.getAnswers() as any, // Prisma handles JSON serialization
          startedAt: submission.getStartedAt(),
          submittedAt: submission.getSubmittedAt(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(),
          createdAt: submission.getCreatedAt(),
          updatedAt: submission.getUpdatedAt()
        },
        update: {
          answers: submission.getAnswers() as any, // Prisma handles JSON serialization
          startedAt: submission.getStartedAt(),
          submittedAt: submission.getSubmittedAt(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(),
          updatedAt: submission.getUpdatedAt()
        }
      });

      return this.toDomain(dbSubmission);
    } catch (error: any) {
      // Handle Prisma foreign key constraint violation (P2003)
      if (error.code === 'P2003') {
        throw new Error('Quiz or student not found');
      }
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new Error('A submission for this quiz and student already exists');
      }
      throw new Error(`Failed to save quiz submission: ${error.message}`);
    }
  }

  /**
   * Find a quiz submission by ID
   * 
   * Requirements:
   * - 14.1: Display submission details for grading
   * 
   * @param id - QuizSubmission ID (UUID)
   * @returns Promise resolving to QuizSubmission entity or null if not found
   */
  async findById(id: string): Promise<QuizSubmission | null> {
    const dbSubmission = await this.prisma.quizSubmission.findUnique({
      where: { id }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find a quiz submission by quiz ID and student ID
   * 
   * Requirements:
   * - 12.7: Prevent multiple submissions (check if submission exists)
   * - 12.2: Check if student has already started quiz
   * 
   * @param quizId - Quiz ID (UUID)
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to QuizSubmission entity or null if not found
   */
  async findByQuizAndStudent(quizId: string, studentId: string): Promise<QuizSubmission | null> {
    const dbSubmission = await this.prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId
        }
      }
    });

    return dbSubmission ? this.toDomain(dbSubmission) : null;
  }

  /**
   * Find all quiz submissions for a quiz
   * 
   * Requirements:
   * - 14.1: Display all student submissions for grading
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to array of QuizSubmission entities
   */
  async findByQuizId(quizId: string): Promise<QuizSubmission[]> {
    const dbSubmissions = await this.prisma.quizSubmission.findMany({
      where: { quizId },
      orderBy: { submittedAt: 'asc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Find all quiz submissions for a student in a course
   * 
   * Requirements:
   * - 16.1: Display all quizzes with status for student progress
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of QuizSubmission entities
   */
  async findByStudentAndCourse(studentId: string, courseId: string): Promise<QuizSubmission[]> {
    const dbSubmissions = await this.prisma.quizSubmission.findMany({
      where: {
        studentId,
        quiz: {
          courseId
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return dbSubmissions.map(dbSubmission => this.toDomain(dbSubmission));
  }

  /**
   * Update a quiz submission entity
   * 
   * Requirements:
   * - 12.5: Update answers during quiz (auto-save)
   * - 13.4: Save grade with submission
   * - 13.5: Edit grades after saving
   * - 21.5: Optimistic locking to prevent concurrent updates
   * 
   * Uses optimistic locking with version field to prevent concurrent updates.
   * The entity's version must match the database version for the update to succeed.
   * 
   * @param submission - QuizSubmission entity to update
   * @returns Promise resolving to updated QuizSubmission entity
   * @throws Error if submission not found, version mismatch, or update operation fails
   */
  async update(submission: QuizSubmission): Promise<QuizSubmission> {
    try {
      // Get current version from database
      const current = await this.prisma.quizSubmission.findUnique({
        where: { id: submission.getId() }
      });

      if (!current) {
        throw new Error(`Quiz submission with ID ${submission.getId()} not found`);
      }

      // Optimistic locking: Entity version should be current.version OR current.version + 1
      // - If entity version === current.version: No version increment (e.g., updateAnswers)
      // - If entity version === current.version + 1: Version incremented by domain (e.g., setGrade)
      // - Otherwise: Concurrent modification detected
      const expectedVersion = current.version;
      const entityVersion = submission.getVersion();
      
      if (entityVersion !== expectedVersion && entityVersion !== expectedVersion + 1) {
        throw new Error(
          'Concurrent update detected. The submission was modified by another process. Please refresh and try again.'
        );
      }

      // Update with version check
      // Use the entity's version (which may have been incremented by domain logic)
      const dbSubmission = await this.prisma.quizSubmission.updateMany({
        where: {
          id: submission.getId(),
          version: current.version // Ensure version still matches (optimistic lock)
        },
        data: {
          answers: submission.getAnswers() as any, // Prisma handles JSON serialization
          startedAt: submission.getStartedAt(),
          submittedAt: submission.getSubmittedAt(),
          grade: submission.getGrade(),
          feedback: submission.getFeedback(),
          status: this.mapStatusToPrisma(submission.getStatus()),
          version: submission.getVersion(), // Use entity's version (may be incremented)
          updatedAt: submission.getUpdatedAt()
        }
      });

      // Check if update was successful
      if (dbSubmission.count === 0) {
        // Version changed between our check and update (race condition)
        throw new Error(
          'Concurrent update detected. The submission was modified by another process. Please refresh and try again.'
        );
      }

      // Fetch the updated submission
      const updated = await this.prisma.quizSubmission.findUnique({
        where: { id: submission.getId() }
      });

      if (!updated) {
        throw new Error(`Failed to fetch updated quiz submission`);
      }

      return this.toDomain(updated);
    } catch (error: any) {
      // Re-throw our custom errors
      if (error.message.includes('not found') || error.message.includes('Concurrent update')) {
        throw error;
      }
      throw new Error(`Failed to update quiz submission: ${error.message}`);
    }
  }

  /**
   * Delete a quiz submission by ID
   * 
   * Note: Quiz submissions are typically not deleted individually.
   * They are cascade deleted when the quiz or course is deleted.
   * 
   * @param id - QuizSubmission ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if submission not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.quizSubmission.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Quiz submission with ID ${id} not found`);
      }
      throw new Error(`Failed to delete quiz submission: ${error.message}`);
    }
  }

  /**
   * Delete all quiz submissions for a quiz
   * 
   * Requirements:
   * - 11.13: Cascade delete when quiz is deleted
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to number of deleted submissions
   */
  async deleteByQuizId(quizId: string): Promise<number> {
    const result = await this.prisma.quizSubmission.deleteMany({
      where: { quizId }
    });

    return result.count;
  }

  /**
   * Delete all quiz submissions for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete when course is deleted
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to number of deleted submissions
   */
  async deleteByCourseId(courseId: string): Promise<number> {
    const result = await this.prisma.quizSubmission.deleteMany({
      where: {
        quiz: {
          courseId
        }
      }
    });

    return result.count;
  }

  /**
   * Count quiz submissions for a quiz
   * 
   * Requirements:
   * - 11.10: Check if quiz has submissions (for edit validation)
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to number of submissions
   */
  async countByQuizId(quizId: string): Promise<number> {
    return await this.prisma.quizSubmission.count({
      where: { quizId }
    });
  }

  /**
   * Map Prisma QuizSubmission model to domain QuizSubmission entity
   * 
   * Deserializes answers from JSON to QuizAnswer array.
   * 
   * @param dbSubmission - Prisma QuizSubmission model
   * @returns Domain QuizSubmission entity
   */
  private toDomain(dbSubmission: any): QuizSubmission {
    // Parse answers if they're stored as JSON string
    let answers: QuizAnswer[];
    if (typeof dbSubmission.answers === 'string') {
      answers = JSON.parse(dbSubmission.answers);
    } else {
      answers = dbSubmission.answers as QuizAnswer[];
    }

    return QuizSubmission.reconstitute({
      id: dbSubmission.id,
      quizId: dbSubmission.quizId,
      studentId: dbSubmission.studentId,
      answers: answers,
      startedAt: dbSubmission.startedAt,
      submittedAt: dbSubmission.submittedAt,
      grade: dbSubmission.grade,
      feedback: dbSubmission.feedback,
      status: this.mapStatusToDomain(dbSubmission.status),
      version: dbSubmission.version,
      createdAt: dbSubmission.createdAt,
      updatedAt: dbSubmission.updatedAt
    });
  }

  /**
   * Map domain QuizSubmissionStatus to Prisma QuizSubmissionStatus enum
   * 
   * @param status - Domain QuizSubmissionStatus
   * @returns Prisma QuizSubmissionStatus enum
   */
  private mapStatusToPrisma(status: QuizSubmissionStatus): PrismaQuizSubmissionStatus {
    return status as unknown as PrismaQuizSubmissionStatus;
  }

  /**
   * Map Prisma QuizSubmissionStatus enum to domain QuizSubmissionStatus
   * 
   * @param status - Prisma QuizSubmissionStatus enum
   * @returns Domain QuizSubmissionStatus
   */
  private mapStatusToDomain(status: PrismaQuizSubmissionStatus): QuizSubmissionStatus {
    return status as unknown as QuizSubmissionStatus;
  }
}
