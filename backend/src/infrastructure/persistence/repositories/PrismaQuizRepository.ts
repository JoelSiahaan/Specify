/**
 * PrismaQuizRepository Implementation (Adapter)
 * 
 * Concrete implementation of IQuizRepository using Prisma ORM.
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
 * - Handles JSON serialization for questions array
 * - Handles database-specific errors (foreign key constraints, etc.)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import { Quiz, Question } from '../../../domain/entities/Quiz';

@injectable()
export class PrismaQuizRepository implements IQuizRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save a quiz entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * Serializes questions array to JSON for storage.
   * 
   * Requirements:
   * - 11.1: Store quiz with title, description, due date, and time limit
   * - 11.4: Store MCQ and essay questions
   * 
   * @param quiz - Quiz entity to save
   * @returns Promise resolving to saved Quiz entity
   * @throws Error if foreign key constraint violated (invalid courseId)
   */
  async save(quiz: Quiz): Promise<Quiz> {
    try {
      const dbQuiz = await this.prisma.quiz.upsert({
        where: { id: quiz.getId() },
        create: {
          id: quiz.getId(),
          courseId: quiz.getCourseId(),
          title: quiz.getTitle(),
          description: quiz.getDescription(),
          dueDate: quiz.getDueDate(),
          timeLimit: quiz.getTimeLimit(),
          questions: quiz.getQuestions() as any, // Prisma handles JSON serialization
          createdAt: quiz.getCreatedAt(),
          updatedAt: quiz.getUpdatedAt()
        },
        update: {
          title: quiz.getTitle(),
          description: quiz.getDescription(),
          dueDate: quiz.getDueDate(),
          timeLimit: quiz.getTimeLimit(),
          questions: quiz.getQuestions() as any, // Prisma handles JSON serialization
          updatedAt: quiz.getUpdatedAt()
        }
      });

      return this.toDomain(dbQuiz);
    } catch (error: any) {
      // Handle Prisma foreign key constraint violation (P2003)
      if (error.code === 'P2003') {
        throw new Error('Course not found');
      }
      throw new Error(`Failed to save quiz: ${error.message}`);
    }
  }

  /**
   * Find a quiz by ID
   * 
   * Requirements:
   * - 12.1: Display quiz info before starting
   * - 11.14: View all quizzes for a course
   * 
   * @param id - Quiz ID (UUID)
   * @returns Promise resolving to Quiz entity or null if not found
   */
  async findById(id: string): Promise<Quiz | null> {
    const dbQuiz = await this.prisma.quiz.findUnique({
      where: { id }
    });

    return dbQuiz ? this.toDomain(dbQuiz) : null;
  }

  /**
   * Find all quizzes for a course
   * 
   * Requirements:
   * - 11.14: View all quizzes for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Quiz entities
   */
  async findByCourseId(courseId: string): Promise<Quiz[]> {
    const dbQuizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' }
    });

    return dbQuizzes.map(dbQuiz => this.toDomain(dbQuiz));
  }

  /**
   * Update a quiz entity
   * 
   * Requirements:
   * - 11.12: Edit quizzes before due date and before any submissions
   * 
   * @param quiz - Quiz entity to update
   * @returns Promise resolving to updated Quiz entity
   * @throws Error if quiz not found or update operation fails
   */
  async update(quiz: Quiz): Promise<Quiz> {
    try {
      const dbQuiz = await this.prisma.quiz.update({
        where: { id: quiz.getId() },
        data: {
          title: quiz.getTitle(),
          description: quiz.getDescription(),
          dueDate: quiz.getDueDate(),
          timeLimit: quiz.getTimeLimit(),
          questions: quiz.getQuestions() as any, // Prisma handles JSON serialization
          updatedAt: quiz.getUpdatedAt()
        }
      });

      return this.toDomain(dbQuiz);
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Quiz with ID ${quiz.getId()} not found`);
      }
      throw new Error(`Failed to update quiz: ${error.message}`);
    }
  }

  /**
   * Delete a quiz by ID
   * 
   * Requirements:
   * - 11.13: Delete entire quizzes at any time
   * 
   * Note: Cascade deletion of quiz submissions is handled by Prisma schema (onDelete: Cascade)
   * 
   * @param id - Quiz ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if quiz not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.quiz.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Quiz with ID ${id} not found`);
      }
      throw new Error(`Failed to delete quiz: ${error.message}`);
    }
  }

  /**
   * Delete all quizzes for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete when course is deleted
   * 
   * Note: Cascade deletion of quiz submissions is handled by Prisma schema (onDelete: Cascade)
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to number of deleted quizzes
   */
  async deleteByCourseId(courseId: string): Promise<number> {
    const result = await this.prisma.quiz.deleteMany({
      where: { courseId }
    });

    return result.count;
  }

  /**
   * Check if a quiz has any submissions
   * 
   * Requirements:
   * - 11.10: Prevent editing or deleting questions when quiz has submissions
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to true if quiz has submissions, false otherwise
   */
  async hasSubmissions(quizId: string): Promise<boolean> {
    const count = await this.prisma.quizSubmission.count({
      where: { quizId }
    });

    return count > 0;
  }

  /**
   * Map Prisma Quiz model to domain Quiz entity
   * 
   * Deserializes questions from JSON to Question array.
   * 
   * @param dbQuiz - Prisma Quiz model
   * @returns Domain Quiz entity
   */
  private toDomain(dbQuiz: any): Quiz {
    // Parse questions if they're stored as JSON string
    let questions: Question[];
    if (typeof dbQuiz.questions === 'string') {
      questions = JSON.parse(dbQuiz.questions);
    } else {
      questions = dbQuiz.questions as Question[];
    }

    return Quiz.reconstitute({
      id: dbQuiz.id,
      courseId: dbQuiz.courseId,
      title: dbQuiz.title,
      description: dbQuiz.description,
      dueDate: dbQuiz.dueDate,
      timeLimit: dbQuiz.timeLimit,
      questions: questions,
      createdAt: dbQuiz.createdAt,
      updatedAt: dbQuiz.updatedAt
    });
  }
}
