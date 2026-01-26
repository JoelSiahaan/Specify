/**
 * Quiz Validation Schemas
 * 
 * Zod schemas for validating quiz-related requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 11.1: Quiz creation validation
 * - 11.2: Due date validation (must be in future)
 * - 11.3: Time limit validation (positive integer)
 * - 11.4: Question validation (MCQ and Essay)
 * - 11.5: At least one question required
 * - 11.6: MCQ must have at least 2 options
 * - 11.7: MCQ must have valid correctAnswer index
 */

import { z } from 'zod';

/**
 * Question type enum schema
 * 
 * Validates question type is either MCQ or ESSAY
 */
export const QuestionTypeSchema = z.enum(['MCQ', 'ESSAY'], {
  errorMap: () => ({ message: 'Question type must be either MCQ or ESSAY' })
});

/**
 * Quiz title schema
 * 
 * Validates quiz title is provided and within length limits
 * Requirement 11.1: Quiz title validation
 */
export const QuizTitleSchema = z
  .string({
    required_error: 'Quiz title is required',
    invalid_type_error: 'Quiz title must be a string'
  })
  .trim()
  .min(1, 'Quiz title is required')
  .max(200, 'Quiz title must not exceed 200 characters');

/**
 * Quiz description schema
 * 
 * Validates quiz description
 * Requirement 11.1: Quiz description validation
 */
export const QuizDescriptionSchema = z
  .string({
    required_error: 'Quiz description is required',
    invalid_type_error: 'Quiz description must be a string'
  })
  .trim()
  .min(1, 'Quiz description is required')
  .max(5000, 'Quiz description must not exceed 5000 characters');

/**
 * Quiz due date schema
 * 
 * Validates due date is in the future
 * Requirement 11.2: Due date must be in the future
 */
export const QuizDueDateSchema = z
  .string({
    required_error: 'Quiz due date is required',
    invalid_type_error: 'Quiz due date must be a string'
  })
  .datetime({ message: 'Quiz due date must be a valid ISO 8601 datetime' })
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return date > new Date();
    },
    {
      message: 'Quiz due date must be in the future'
    }
  );

/**
 * Quiz time limit schema
 * 
 * Validates time limit is a positive integer (in minutes)
 * Requirement 11.3: Time limit must be positive integer
 */
export const QuizTimeLimitSchema = z
  .number({
    required_error: 'Quiz time limit is required',
    invalid_type_error: 'Quiz time limit must be a number'
  })
  .int('Quiz time limit must be an integer')
  .positive('Quiz time limit must be a positive number')
  .min(1, 'Quiz time limit must be at least 1 minute')
  .max(480, 'Quiz time limit must not exceed 480 minutes (8 hours)');

/**
 * Question text schema
 * 
 * Validates question text is provided
 */
export const QuestionTextSchema = z
  .string({
    required_error: 'Question text is required',
    invalid_type_error: 'Question text must be a string'
  })
  .trim()
  .min(1, 'Question text is required')
  .max(2000, 'Question text must not exceed 2000 characters');

/**
 * MCQ option schema
 * 
 * Validates MCQ option text
 */
export const MCQOptionSchema = z
  .string({
    required_error: 'MCQ option is required',
    invalid_type_error: 'MCQ option must be a string'
  })
  .trim()
  .min(1, 'MCQ option cannot be empty')
  .max(500, 'MCQ option must not exceed 500 characters');

/**
 * MCQ question base schema (without refinement)
 * 
 * Validates MCQ question with options and correct answer
 * Requirements:
 * - 11.4: MCQ question validation
 * - 11.6: MCQ must have at least 2 options
 * - 11.7: MCQ must have valid correctAnswer index
 */
const MCQQuestionBaseSchema = z.object({
  type: z.literal('MCQ'),
  questionText: QuestionTextSchema,
  options: z
    .array(MCQOptionSchema, {
      required_error: 'MCQ options are required',
      invalid_type_error: 'MCQ options must be an array'
    })
    .min(2, 'MCQ must have at least 2 options')
    .max(10, 'MCQ must not have more than 10 options'),
  correctAnswer: z
    .number({
      required_error: 'MCQ correct answer is required',
      invalid_type_error: 'MCQ correct answer must be a number'
    })
    .int('MCQ correct answer must be an integer')
    .nonnegative('MCQ correct answer must be non-negative')
});

/**
 * MCQ question schema with validation
 * Exported for use in tests and validation
 */
export const MCQQuestionSchema = MCQQuestionBaseSchema.refine(
  (data) => data.correctAnswer < data.options.length,
  {
    message: 'MCQ correct answer index must be valid (less than number of options)',
    path: ['correctAnswer']
  }
);

/**
 * Essay question schema
 * 
 * Validates essay question
 * Requirement 11.4: Essay question validation
 */
export const EssayQuestionSchema = z.object({
  type: z.literal('ESSAY'),
  questionText: QuestionTextSchema
});

/**
 * Question schema (discriminated union)
 * 
 * Validates question based on type (MCQ or ESSAY)
 * Uses discriminated union to enforce type-specific validation
 * Note: Uses base schema for discriminated union, then applies refinement
 */
export const QuestionSchema = z.discriminatedUnion('type', [
  MCQQuestionBaseSchema,
  EssayQuestionSchema
]).superRefine((data, ctx) => {
  // Apply MCQ-specific validation for correctAnswer
  if (data.type === 'MCQ') {
    if (data.correctAnswer >= data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MCQ correct answer index must be valid (less than number of options)',
        path: ['correctAnswer']
      });
    }
  }
});

/**
 * Create quiz request schema
 * 
 * Validates quiz creation request body
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 18.4, 20.2
 */
export const CreateQuizRequestSchema = z.object({
  title: QuizTitleSchema,
  description: QuizDescriptionSchema,
  dueDate: QuizDueDateSchema,
  timeLimit: QuizTimeLimitSchema,
  questions: z
    .array(QuestionSchema, {
      required_error: 'Questions are required',
      invalid_type_error: 'Questions must be an array'
    })
    .min(1, 'Quiz must have at least one question')
    .max(100, 'Quiz must not have more than 100 questions')
});

/**
 * Update quiz request schema
 * 
 * Validates quiz update request body
 * All fields are optional (partial update)
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 18.4, 20.2
 */
export const UpdateQuizRequestSchema = z.object({
  title: QuizTitleSchema.optional(),
  description: QuizDescriptionSchema.optional(),
  dueDate: QuizDueDateSchema.optional(),
  timeLimit: QuizTimeLimitSchema.optional(),
  questions: z
    .array(QuestionSchema)
    .min(1, 'Quiz must have at least one question')
    .max(100, 'Quiz must not have more than 100 questions')
    .optional()
}).refine(
  (data) => 
    data.title !== undefined || 
    data.description !== undefined || 
    data.dueDate !== undefined || 
    data.timeLimit !== undefined || 
    data.questions !== undefined,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Answer schema for quiz submission
 * 
 * Validates answer format (supports both MCQ and Essay)
 * - MCQ: answer is a number (option index)
 * - Essay: answer is a string (text response)
 */
export const AnswerSchema = z.object({
  questionIndex: z
    .number({
      required_error: 'Question index is required',
      invalid_type_error: 'Question index must be a number'
    })
    .int('Question index must be an integer')
    .nonnegative('Question index must be non-negative'),
  answer: z.union([
    z.number().int().nonnegative(), // MCQ answer (option index)
    z.string().trim().min(1)        // Essay answer (text)
  ], {
    errorMap: () => ({ message: 'Answer must be a number (for MCQ) or non-empty string (for Essay)' })
  })
});

/**
 * Auto-save quiz answers request schema
 * 
 * Validates auto-save request during quiz taking
 * Requirement 12.4: Auto-save during quiz
 */
export const AutoSaveQuizRequestSchema = z.object({
  answers: z
    .array(AnswerSchema, {
      required_error: 'Answers are required',
      invalid_type_error: 'Answers must be an array'
    })
    .min(0, 'Answers array can be empty for auto-save')
});

/**
 * Submit quiz request schema
 * 
 * Validates quiz submission request
 * Requirements: 12.5, 12.10
 */
export const SubmitQuizRequestSchema = z.object({
  answers: z
    .array(AnswerSchema, {
      required_error: 'Answers are required',
      invalid_type_error: 'Answers must be an array'
    })
    .min(0, 'Answers array can be empty (all questions unanswered)')
});

/**
 * Grade quiz submission request schema (simple array format)
 * 
 * Validates quiz grading request body with simple array of points
 * Requirements: 13.3, 13.4, 13.6, 13.8, 13.9, 13.10, 18.4, 20.2
 * 
 * Note: The system will warn if the sum of points does not equal 100,
 * but this is a business logic check (Requirement 13.9), not a validation error.
 * The validation only ensures each question's points are between 0 and 100.
 */
export const GradeQuizSubmissionRequestSchema = z.object({
  questionPoints: z
    .array(
      z.number({
        required_error: 'Points are required',
        invalid_type_error: 'Points must be a number'
      })
      .min(0, 'Points must be between 0 and 100')
      .max(100, 'Points must be between 0 and 100'),
      {
        required_error: 'Question points are required',
        invalid_type_error: 'Question points must be an array'
      }
    )
    .min(1, 'At least one question point is required'),
  feedback: z
    .string({
      invalid_type_error: 'Feedback must be a string'
    })
    .trim()
    .max(5000, 'Feedback must not exceed 5000 characters')
    .optional()
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;
export type EssayQuestion = z.infer<typeof EssayQuestionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuizRequest = z.infer<typeof CreateQuizRequestSchema>;
export type UpdateQuizRequest = z.infer<typeof UpdateQuizRequestSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type AutoSaveQuizRequest = z.infer<typeof AutoSaveQuizRequestSchema>;
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequestSchema>;
export type GradeQuizSubmissionRequest = z.infer<typeof GradeQuizSubmissionRequestSchema>;
