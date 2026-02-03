/**
 * QuizSubmission Mapper
 * 
 * Maps between QuizSubmission domain entity and QuizSubmissionDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 * - 12.2: Start quiz and countdown timer
 * - 12.5: Accept submission before time limit
 */

import { QuizSubmission, QuizAnswer, QuizSubmissionStatus } from '../../domain/entities/QuizSubmission.js';
import { Quiz, Question, QuestionType } from '../../domain/entities/Quiz.js';
import { 
  QuizSubmissionDTO,
  QuizSubmissionListDTO,
  QuizAttemptDTO,
  QuizQuestionDTO,
  AnswerDTO
} from '../dtos/QuizSubmissionDTO.js';

export class QuizSubmissionMapper {
  /**
   * Convert QuizSubmission entity to QuizSubmissionDTO
   * 
   * @param submission - QuizSubmission domain entity
   * @returns QuizSubmissionDTO for API response
   */
  static toDTO(submission: QuizSubmission): QuizSubmissionDTO {
    return {
      id: submission.getId(),
      quizId: submission.getQuizId(),
      studentId: submission.getStudentId(),
      answers: this.answersToDTO(submission.getAnswers()),
      startedAt: submission.getStartedAt(),
      submittedAt: submission.getSubmittedAt(),
      grade: submission.getGrade(),
      feedback: submission.getFeedback(),
      status: submission.getStatus(),
      createdAt: submission.getCreatedAt(),
      updatedAt: submission.getUpdatedAt()
    };
  }

  /**
   * Convert multiple QuizSubmission entities to QuizSubmissionDTOs
   * 
   * @param submissions - Array of QuizSubmission domain entities
   * @returns Array of QuizSubmissionDTOs
   */
  static toDTOList(submissions: QuizSubmission[]): QuizSubmissionDTO[] {
    return submissions.map(submission => this.toDTO(submission));
  }

  /**
   * Convert QuizSubmission entity to QuizSubmissionListDTO
   * Used for listing submissions in teacher grading view
   * 
   * Requirements:
   * - 14.1: Display all student submissions
   * - 14.2: Show submission status
   * 
   * @param submission - QuizSubmission domain entity
   * @param studentName - Student's name
   * @param studentEmail - Student's email
   * @returns QuizSubmissionListDTO for API response
   */
  static toListDTO(
    submission: QuizSubmission,
    studentName: string,
    studentEmail: string
  ): QuizSubmissionListDTO {
    return {
      id: submission.getId(),
      quizId: submission.getQuizId(),
      studentId: submission.getStudentId(),
      studentName: studentName,
      studentEmail: studentEmail,
      status: submission.getStatus(),
      startedAt: submission.getStartedAt(),
      submittedAt: submission.getSubmittedAt(),
      grade: submission.getGrade(),
      createdAt: submission.getCreatedAt(),
      updatedAt: submission.getUpdatedAt()
    };
  }

  /**
   * Convert multiple QuizSubmission entities to QuizSubmissionListDTOs
   * 
   * @param submissions - Array of QuizSubmission domain entities
   * @param studentInfo - Map of student IDs to {name, email}
   * @returns Array of QuizSubmissionListDTOs
   */
  static toListDTOList(
    submissions: QuizSubmission[],
    studentInfo: Map<string, { name: string; email: string }>
  ): QuizSubmissionListDTO[] {
    return submissions.map(submission => {
      const info = studentInfo.get(submission.getStudentId());
      return this.toListDTO(
        submission,
        info?.name || 'Unknown',
        info?.email || 'Unknown'
      );
    });
  }

  /**
   * Convert QuizSubmission and Quiz to QuizAttemptDTO
   * Used for active quiz taking with countdown timer
   * 
   * Requirements:
   * - 12.2: Display all questions and start countdown timer
   * - 12.3: Display remaining time
   * 
   * @param submission - QuizSubmission domain entity (in progress)
   * @param quiz - Quiz domain entity
   * @returns QuizAttemptDTO for API response
   */
  static toAttemptDTO(submission: QuizSubmission, quiz: Quiz): QuizAttemptDTO {
    if (submission.getStatus() !== QuizSubmissionStatus.IN_PROGRESS) {
      throw new Error('Can only create attempt DTO for in-progress submissions');
    }

    if (!submission.getStartedAt()) {
      throw new Error('Submission must have started date');
    }

    return {
      quizId: quiz.getId(),
      submissionId: submission.getId(),
      title: quiz.getTitle(),
      description: quiz.getDescription(),
      timeLimit: quiz.getTimeLimit(),
      questions: this.questionsToQuizQuestionDTO(quiz.getQuestions()),
      startedAt: submission.getStartedAt()!,
      remainingTimeSeconds: submission.getRemainingTimeSeconds(quiz.getTimeLimit()),
      currentAnswers: this.answersToDTO(submission.getAnswers())
    };
  }

  /**
   * Convert domain QuizAnswers to AnswerDTOs
   * 
   * @param answers - Array of domain QuizAnswer objects
   * @returns Array of AnswerDTOs
   */
  private static answersToDTO(answers: QuizAnswer[]): AnswerDTO[] {
    return answers.map(answer => ({
      questionIndex: answer.questionIndex,
      answer: answer.answer
    }));
  }

  /**
   * Convert AnswerDTOs to domain QuizAnswers
   * 
   * @param dtos - Array of AnswerDTOs
   * @returns Array of domain QuizAnswer objects
   */
  static answersToDomain(dtos: AnswerDTO[]): QuizAnswer[] {
    return dtos.map(dto => ({
      questionIndex: dto.questionIndex,
      answer: dto.answer
    }));
  }

  /**
   * Convert domain Questions to QuizQuestionDTOs
   * Hides correct answers for MCQ questions
   * 
   * Requirements:
   * - 12.2: Display all questions (without revealing correct answers)
   * 
   * @param questions - Array of domain Question objects
   * @returns Array of QuizQuestionDTOs
   */
  private static questionsToQuizQuestionDTO(questions: Question[]): QuizQuestionDTO[] {
    return questions.map((question, index) => {
      if (question.type === QuestionType.MCQ) {
        return {
          questionIndex: index,
          type: 'MCQ',
          questionText: question.questionText,
          options: question.options
          // Note: correctAnswer is NOT included (hidden from students)
        };
      } else {
        // Essay question
        return {
          questionIndex: index,
          type: 'ESSAY',
          questionText: question.questionText
        };
      }
    });
  }
}
