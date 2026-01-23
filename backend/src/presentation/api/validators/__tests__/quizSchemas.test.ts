/**
 * Quiz Schemas Unit Tests
 * 
 * Tests for Zod validation schemas for quiz-related requests.
 * Validates that schemas correctly accept valid input and reject invalid input.
 */

import {
  QuestionTypeSchema,
  MCQQuestionSchema,
  EssayQuestionSchema,
  QuestionSchema,
  AnswerSchema,
  CreateQuizRequestSchema,
  UpdateQuizRequestSchema,
  AutoSaveQuizRequestSchema,
  SubmitQuizRequestSchema
} from '../quizSchemas';

describe('Quiz Validation Schemas', () => {
  describe('QuestionTypeSchema', () => {
    it('should accept MCQ type', () => {
      const result = QuestionTypeSchema.safeParse('MCQ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('MCQ');
      }
    });

    it('should accept ESSAY type', () => {
      const result = QuestionTypeSchema.safeParse('ESSAY');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ESSAY');
      }
    });

    it('should reject invalid type', () => {
      const result = QuestionTypeSchema.safeParse('TRUE_FALSE');
      expect(result.success).toBe(false);
    });
  });

  describe('MCQQuestionSchema', () => {
    const validMCQ = {
      type: 'MCQ' as const,
      questionText: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: 1
    };

    it('should accept valid MCQ question', () => {
      const result = MCQQuestionSchema.safeParse(validMCQ);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('MCQ');
        expect(result.data.questionText).toBe('What is 2+2?');
        expect(result.data.options).toEqual(['3', '4', '5']);
        expect(result.data.correctAnswer).toBe(1);
      }
    });

    it('should trim whitespace from question text', () => {
      const mcq = { ...validMCQ, questionText: '  What is 2+2?  ' };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionText).toBe('What is 2+2?');
      }
    });

    it('should trim whitespace from options', () => {
      const mcq = { ...validMCQ, options: ['  3  ', '  4  ', '  5  '] };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual(['3', '4', '5']);
      }
    });

    it('should reject empty question text', () => {
      const mcq = { ...validMCQ, questionText: '' };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
    });

    it('should reject question text exceeding 2000 characters', () => {
      const mcq = { ...validMCQ, questionText: 'a'.repeat(2001) };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
    });

    it('should reject less than 2 options', () => {
      const mcq = { ...validMCQ, options: ['4'] };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 options');
      }
    });

    it('should reject more than 10 options', () => {
      const mcq = { ...validMCQ, options: Array(11).fill('option') };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not have more than 10 options');
      }
    });

    it('should reject negative correctAnswer', () => {
      const mcq = { ...validMCQ, correctAnswer: -1 };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
    });

    it('should reject correctAnswer >= options.length', () => {
      const mcq = { ...validMCQ, correctAnswer: 3 };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be valid');
      }
    });

    it('should reject non-integer correctAnswer', () => {
      const mcq = { ...validMCQ, correctAnswer: 1.5 };
      const result = MCQQuestionSchema.safeParse(mcq);
      expect(result.success).toBe(false);
    });
  });

  describe('EssayQuestionSchema', () => {
    const validEssay = {
      type: 'ESSAY' as const,
      questionText: 'Explain the concept of Clean Architecture.'
    };

    it('should accept valid essay question', () => {
      const result = EssayQuestionSchema.safeParse(validEssay);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('ESSAY');
        expect(result.data.questionText).toBe('Explain the concept of Clean Architecture.');
      }
    });

    it('should trim whitespace from question text', () => {
      const essay = { ...validEssay, questionText: '  Explain Clean Architecture.  ' };
      const result = EssayQuestionSchema.safeParse(essay);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionText).toBe('Explain Clean Architecture.');
      }
    });

    it('should reject empty question text', () => {
      const essay = { ...validEssay, questionText: '' };
      const result = EssayQuestionSchema.safeParse(essay);
      expect(result.success).toBe(false);
    });

    it('should reject question text exceeding 2000 characters', () => {
      const essay = { ...validEssay, questionText: 'a'.repeat(2001) };
      const result = EssayQuestionSchema.safeParse(essay);
      expect(result.success).toBe(false);
    });
  });

  describe('QuestionSchema', () => {
    it('should accept MCQ question', () => {
      const mcq = {
        type: 'MCQ' as const,
        questionText: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: 1
      };
      const result = QuestionSchema.safeParse(mcq);
      expect(result.success).toBe(true);
    });

    it('should accept Essay question', () => {
      const essay = {
        type: 'ESSAY' as const,
        questionText: 'Explain Clean Architecture.'
      };
      const result = QuestionSchema.safeParse(essay);
      expect(result.success).toBe(true);
    });

    it('should reject invalid question type', () => {
      const invalid = {
        type: 'TRUE_FALSE',
        questionText: 'Is this valid?'
      };
      const result = QuestionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('AnswerSchema', () => {
    it('should accept MCQ answer (number)', () => {
      const answer = {
        questionIndex: 0,
        answer: 2
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionIndex).toBe(0);
        expect(result.data.answer).toBe(2);
      }
    });

    it('should accept Essay answer (string)', () => {
      const answer = {
        questionIndex: 1,
        answer: 'This is my essay answer.'
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionIndex).toBe(1);
        expect(result.data.answer).toBe('This is my essay answer.');
      }
    });

    it('should trim whitespace from essay answer', () => {
      const answer = {
        questionIndex: 0,
        answer: '  My answer  '
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answer).toBe('My answer');
      }
    });

    it('should reject negative questionIndex', () => {
      const answer = {
        questionIndex: -1,
        answer: 2
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer questionIndex', () => {
      const answer = {
        questionIndex: 1.5,
        answer: 2
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(false);
    });

    it('should reject empty string essay answer', () => {
      const answer = {
        questionIndex: 0,
        answer: ''
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(false);
    });

    it('should reject negative MCQ answer', () => {
      const answer = {
        questionIndex: 0,
        answer: -1
      };
      const result = AnswerSchema.safeParse(answer);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateQuizRequestSchema', () => {
    const validRequest = {
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination covering chapters 1-5.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      timeLimit: 60,
      questions: [
        {
          type: 'MCQ' as const,
          questionText: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        },
        {
          type: 'ESSAY' as const,
          questionText: 'Explain Clean Architecture.'
        }
      ]
    };

    it('should accept valid create quiz request', () => {
      const result = CreateQuizRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Midterm Exam');
        expect(result.data.description).toBe('Comprehensive midterm examination covering chapters 1-5.');
        expect(result.data.timeLimit).toBe(60);
        expect(result.data.questions).toHaveLength(2);
      }
    });

    it('should trim whitespace from title', () => {
      const request = { ...validRequest, title: '  Midterm Exam  ' };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Midterm Exam');
      }
    });

    it('should reject empty title', () => {
      const request = { ...validRequest, title: '' };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 200 characters', () => {
      const request = { ...validRequest, title: 'a'.repeat(201) };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const request = { ...validRequest, description: '' };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 5000 characters', () => {
      const request = { ...validRequest, description: 'a'.repeat(5001) };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject past due date', () => {
      const request = {
        ...validRequest,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be in the future');
      }
    });

    it('should reject invalid date format', () => {
      const request = { ...validRequest, dueDate: 'not-a-date' };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject zero time limit', () => {
      const request = { ...validRequest, timeLimit: 0 };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject negative time limit', () => {
      const request = { ...validRequest, timeLimit: -10 };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject time limit exceeding 480 minutes', () => {
      const request = { ...validRequest, timeLimit: 481 };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer time limit', () => {
      const request = { ...validRequest, timeLimit: 60.5 };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty questions array', () => {
      const request = { ...validRequest, questions: [] };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one question');
      }
    });

    it('should reject more than 100 questions', () => {
      const request = {
        ...validRequest,
        questions: Array(101).fill({
          type: 'ESSAY' as const,
          questionText: 'Question'
        })
      };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not have more than 100 questions');
      }
    });

    it('should reject missing required fields', () => {
      const request = { title: 'Test' };
      const result = CreateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateQuizRequestSchema', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    it('should accept partial update with title only', () => {
      const request = { title: 'Updated Title' };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
      }
    });

    it('should accept partial update with description only', () => {
      const request = { description: 'Updated description' };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with dueDate only', () => {
      const request = { dueDate: futureDate };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with timeLimit only', () => {
      const request = { timeLimit: 90 };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with questions only', () => {
      const request = {
        questions: [
          {
            type: 'MCQ' as const,
            questionText: 'What is 2+2?',
            options: ['3', '4', '5'],
            correctAnswer: 1
          }
        ]
      };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept update with multiple fields', () => {
      const request = {
        title: 'Updated Title',
        description: 'Updated description',
        timeLimit: 90
      };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject empty update (no fields provided)', () => {
      const request = {};
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field must be provided');
      }
    });

    it('should reject invalid title', () => {
      const request = { title: '' };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject past due date', () => {
      const request = {
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time limit', () => {
      const request = { timeLimit: -10 };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty questions array', () => {
      const request = { questions: [] };
      const result = UpdateQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('AutoSaveQuizRequestSchema', () => {
    it('should accept empty answers array', () => {
      const request = { answers: [] };
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answers).toEqual([]);
      }
    });

    it('should accept answers array with MCQ answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 2 },
          { questionIndex: 1, answer: 0 }
        ]
      };
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answers).toHaveLength(2);
      }
    });

    it('should accept answers array with Essay answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 'My essay answer' }
        ]
      };
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept mixed MCQ and Essay answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 2 },
          { questionIndex: 1, answer: 'Essay answer' }
        ]
      };
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject invalid answer format', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: null }
        ]
      };
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing answers field', () => {
      const request = {};
      const result = AutoSaveQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('SubmitQuizRequestSchema', () => {
    it('should accept empty answers array', () => {
      const request = { answers: [] };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answers).toEqual([]);
      }
    });

    it('should accept answers array with MCQ answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 2 },
          { questionIndex: 1, answer: 0 },
          { questionIndex: 2, answer: 1 }
        ]
      };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answers).toHaveLength(3);
      }
    });

    it('should accept answers array with Essay answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 'My detailed essay answer explaining the concept.' }
        ]
      };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept mixed MCQ and Essay answers', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: 2 },
          { questionIndex: 1, answer: 'Essay answer for question 2' },
          { questionIndex: 2, answer: 0 }
        ]
      };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject invalid answer format', () => {
      const request = {
        answers: [
          { questionIndex: 0, answer: null }
        ]
      };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing answers field', () => {
      const request = {};
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid questionIndex', () => {
      const request = {
        answers: [
          { questionIndex: -1, answer: 2 }
        ]
      };
      const result = SubmitQuizRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });
});
