/**
 * Quiz Mapper
 * 
 * Maps between Quiz domain entity and QuizDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 * - 11.1: Quiz creation with title, description, due date, and time limit
 * - 11.4: Questions (MCQ and Essay)
 */

import { Quiz, Question, QuestionType } from '../../domain/entities/Quiz';
import { 
  QuizDTO, 
  CreateQuizDTO, 
  UpdateQuizDTO, 
  QuizListDTO,
  QuizPreviewDTO,
  QuestionDTO
} from '../dtos/QuizDTO';
import { randomUUID } from 'crypto';

export class QuizMapper {
  /**
   * Convert Quiz entity to QuizDTO
   * 
   * @param quiz - Quiz domain entity
   * @returns QuizDTO for API response
   */
  static toDTO(quiz: Quiz): QuizDTO {
    return {
      id: quiz.getId(),
      courseId: quiz.getCourseId(),
      title: quiz.getTitle(),
      description: quiz.getDescription(),
      dueDate: quiz.getDueDate(),
      timeLimit: quiz.getTimeLimit(),
      questions: this.questionsToDTO(quiz.getQuestions()),
      createdAt: quiz.getCreatedAt(),
      updatedAt: quiz.getUpdatedAt()
    };
  }

  /**
   * Convert CreateQuizDTO to Quiz entity
   * Used for quiz creation
   * 
   * Requirements:
   * - 11.1: Quiz creation with all required fields
   * - 11.4: Questions validation
   * 
   * @param dto - CreateQuizDTO from API request
   * @param courseId - ID of the course
   * @returns Quiz domain entity
   */
  static toDomain(dto: CreateQuizDTO, courseId: string): Quiz {
    return Quiz.create({
      id: randomUUID(),
      courseId: courseId,
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      timeLimit: dto.timeLimit,
      questions: this.questionsToDomain(dto.questions),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple Quiz entities to QuizDTOs
   * 
   * @param quizzes - Array of Quiz domain entities
   * @returns Array of QuizDTOs
   */
  static toDTOList(quizzes: Quiz[]): QuizDTO[] {
    return quizzes.map(quiz => this.toDTO(quiz));
  }

  /**
   * Convert Quiz entity to QuizListDTO
   * Used for listing quizzes with simplified information
   * 
   * @param quiz - Quiz domain entity
   * @returns QuizListDTO for API response
   */
  static toListDTO(quiz: Quiz): QuizListDTO {
    return {
      id: quiz.getId(),
      courseId: quiz.getCourseId(),
      title: quiz.getTitle(),
      description: quiz.getDescription(),
      dueDate: quiz.getDueDate(),
      timeLimit: quiz.getTimeLimit(),
      questionCount: quiz.getQuestions().length,
      createdAt: quiz.getCreatedAt(),
      updatedAt: quiz.getUpdatedAt()
    };
  }

  /**
   * Convert multiple Quiz entities to QuizListDTOs
   * 
   * @param quizzes - Array of Quiz domain entities
   * @returns Array of QuizListDTOs
   */
  static toListDTOList(quizzes: Quiz[]): QuizListDTO[] {
    return quizzes.map(quiz => this.toListDTO(quiz));
  }

  /**
   * Convert Quiz entity to QuizPreviewDTO
   * Used for displaying quiz information before starting
   * 
   * Requirements:
   * - 12.1: Display quiz info before starting
   * 
   * @param quiz - Quiz domain entity
   * @returns QuizPreviewDTO for API response
   */
  static toPreviewDTO(quiz: Quiz): QuizPreviewDTO {
    return {
      id: quiz.getId(),
      courseId: quiz.getCourseId(),
      title: quiz.getTitle(),
      description: quiz.getDescription(),
      dueDate: quiz.getDueDate(),
      timeLimit: quiz.getTimeLimit(),
      questionCount: quiz.getQuestions().length,
      isPastDueDate: quiz.isPastDueDate()
    };
  }

  /**
   * Apply UpdateQuizDTO to existing Quiz entity
   * Updates only the fields provided in the DTO
   * 
   * Requirements:
   * - 11.6: Editing only allowed before due date
   * - 11.7: Editing only allowed before any submissions
   * 
   * @param quiz - Existing Quiz domain entity
   * @param dto - UpdateQuizDTO with fields to update
   * @param hasSubmissions - Whether quiz has any submissions
   * @returns Updated Quiz entity
   */
  static applyUpdate(quiz: Quiz, dto: UpdateQuizDTO, hasSubmissions: boolean): Quiz {
    if (dto.title !== undefined) {
      quiz.updateTitle(dto.title, hasSubmissions);
    }

    if (dto.description !== undefined) {
      quiz.updateDescription(dto.description, hasSubmissions);
    }

    if (dto.dueDate !== undefined) {
      quiz.updateDueDate(dto.dueDate, hasSubmissions);
    }

    if (dto.timeLimit !== undefined) {
      quiz.updateTimeLimit(dto.timeLimit, hasSubmissions);
    }

    if (dto.questions !== undefined) {
      quiz.updateQuestions(this.questionsToDomain(dto.questions), hasSubmissions);
    }

    return quiz;
  }

  /**
   * Convert domain Questions to QuestionDTOs
   * 
   * @param questions - Array of domain Question objects
   * @returns Array of QuestionDTOs
   */
  private static questionsToDTO(questions: Question[]): QuestionDTO[] {
    return questions.map(question => {
      if (question.type === QuestionType.MCQ) {
        return {
          type: question.type,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer
        };
      } else {
        // Essay question
        return {
          type: question.type,
          questionText: question.questionText
        };
      }
    });
  }

  /**
   * Convert QuestionDTOs to domain Questions
   * 
   * @param dtos - Array of QuestionDTOs
   * @returns Array of domain Question objects
   */
  private static questionsToDomain(dtos: QuestionDTO[]): Question[] {
    return dtos.map(dto => {
      if (dto.type === QuestionType.MCQ) {
        if (!dto.options || dto.correctAnswer === undefined) {
          throw new Error('MCQ questions must have options and correctAnswer');
        }
        return {
          type: QuestionType.MCQ,
          questionText: dto.questionText,
          options: dto.options,
          correctAnswer: dto.correctAnswer
        };
      } else {
        // Essay question
        return {
          type: QuestionType.ESSAY,
          questionText: dto.questionText
        };
      }
    });
  }
}
