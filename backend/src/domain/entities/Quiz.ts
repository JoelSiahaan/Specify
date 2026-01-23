/**
 * Quiz Domain Entity
 * 
 * Represents a quiz in the LMS system with timed assessments.
 * Supports quiz lifecycle: Creation → Editing (before due date and no submissions) → Locked
 * 
 * Requirements:
 * - 11.1: Quiz creation with title, description, due date, and time limit
 * - 11.2: Due date validation (must be in future)
 * - 11.3: Time limit validation (positive integer in minutes)
 * - 11.4: Questions (MCQ and Essay)
 * - 11.5: At least one question required
 * - 11.6: Editing only allowed before due date
 * - 11.7: Editing only allowed before any submissions
 */

export enum QuestionType {
  MCQ = 'MCQ',
  ESSAY = 'ESSAY'
}

export interface MCQQuestion {
  type: QuestionType.MCQ;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-based)
}

export interface EssayQuestion {
  type: QuestionType.ESSAY;
  questionText: string;
}

export type Question = MCQQuestion | EssayQuestion;

export interface QuizProps {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number; // in minutes
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Quiz {
  private readonly id: string;
  private readonly courseId: string;
  private title: string;
  private description: string;
  private dueDate: Date;
  private timeLimit: number;
  private questions: Question[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: QuizProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.title = props.title;
    this.description = props.description;
    this.dueDate = props.dueDate;
    this.timeLimit = props.timeLimit;
    this.questions = props.questions;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new Quiz entity
   * 
   * @param props - Quiz properties
   * @returns Quiz instance
   * @throws Error if validation fails
   */
  public static create(props: QuizProps): Quiz {
    return new Quiz(props);
  }

  /**
   * Reconstitute Quiz from persistence
   * 
   * @param props - Quiz properties from database
   * @returns Quiz instance
   */
  public static reconstitute(props: QuizProps): Quiz {
    return new Quiz(props);
  }

  /**
   * Validate Quiz entity invariants
   * 
   * Requirements:
   * - 11.1: Title, description, due date, time limit are required
   * - 11.2: Due date must be in the future
   * - 11.3: Time limit must be positive integer
   * - 11.5: At least one question required
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Quiz ID is required');
    }

    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    // Requirement 11.1: Title is required
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Quiz title is required');
    }

    // Requirement 11.1: Description is required
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Quiz description is required');
    }

    // Requirement 11.2: Due date must be in the future
    if (this.dueDate <= new Date()) {
      throw new Error('Quiz due date must be in the future');
    }

    // Requirement 11.3: Time limit must be positive integer
    if (!Number.isInteger(this.timeLimit) || this.timeLimit <= 0) {
      throw new Error('Quiz time limit must be a positive integer (in minutes)');
    }

    // Requirement 11.5: At least one question required
    if (!this.questions || this.questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    // Validate each question
    this.questions.forEach((question, index) => {
      this.validateQuestion(question, index);
    });
  }

  /**
   * Validate individual question
   * 
   * Requirements:
   * - 11.4: MCQ must have at least 2 options
   * - 11.4: MCQ must have valid correctAnswer index
   * 
   * @param question - Question to validate
   * @param index - Question index (for error messages)
   * @throws Error if validation fails
   */
  private validateQuestion(question: Question, index: number): void {
    if (!question.questionText || question.questionText.trim().length === 0) {
      throw new Error(`Question ${index + 1}: Question text is required`);
    }

    if (question.type === QuestionType.MCQ) {
      // Requirement 11.4: MCQ must have at least 2 options
      if (!question.options || question.options.length < 2) {
        throw new Error(`Question ${index + 1}: MCQ must have at least 2 options`);
      }

      // Requirement 11.4: MCQ must have valid correctAnswer index
      if (
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        throw new Error(
          `Question ${index + 1}: MCQ correctAnswer must be a valid option index (0-${question.options.length - 1})`
        );
      }

      // Validate each option is not empty
      question.options.forEach((option, optionIndex) => {
        if (!option || option.trim().length === 0) {
          throw new Error(`Question ${index + 1}, Option ${optionIndex + 1}: Option text is required`);
        }
      });
    }
  }

  /**
   * Check if quiz can be edited
   * 
   * Requirements:
   * - 11.6: Editing only allowed before due date
   * - 11.7: Editing only allowed before any submissions
   * 
   * Business Rules:
   * - Quiz can only be edited if:
   *   1. Current time is before due date
   *   2. No submissions exist (checked by caller)
   * 
   * @param hasSubmissions - Whether quiz has any submissions
   * @returns true if quiz can be edited
   */
  public canEdit(hasSubmissions: boolean): boolean {
    // Requirement 11.6: Cannot edit after due date
    if (new Date() >= this.dueDate) {
      return false;
    }

    // Requirement 11.7: Cannot edit if submissions exist
    if (hasSubmissions) {
      return false;
    }

    return true;
  }

  /**
   * Update quiz title
   * 
   * Requirements:
   * - 11.6: Update only before due date
   * - 11.7: Update only before any submissions
   * 
   * @param title - New quiz title
   * @param hasSubmissions - Whether quiz has any submissions
   * @throws Error if title is empty or quiz cannot be edited
   */
  public updateTitle(title: string, hasSubmissions: boolean): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Quiz title is required');
    }

    if (!this.canEdit(hasSubmissions)) {
      throw new Error('Cannot update quiz after due date or after submissions exist');
    }

    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * Update quiz description
   * 
   * Requirements:
   * - 11.6: Update only before due date
   * - 11.7: Update only before any submissions
   * 
   * @param description - New quiz description
   * @param hasSubmissions - Whether quiz has any submissions
   * @throws Error if description is empty or quiz cannot be edited
   */
  public updateDescription(description: string, hasSubmissions: boolean): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Quiz description is required');
    }

    if (!this.canEdit(hasSubmissions)) {
      throw new Error('Cannot update quiz after due date or after submissions exist');
    }

    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Update quiz due date
   * 
   * Requirements:
   * - 11.2: Due date must be in the future
   * - 11.6: Update only before due date
   * - 11.7: Update only before any submissions
   * 
   * @param dueDate - New due date
   * @param hasSubmissions - Whether quiz has any submissions
   * @throws Error if due date is invalid or quiz cannot be edited
   */
  public updateDueDate(dueDate: Date, hasSubmissions: boolean): void {
    if (dueDate <= new Date()) {
      throw new Error('Quiz due date must be in the future');
    }

    if (!this.canEdit(hasSubmissions)) {
      throw new Error('Cannot update quiz after due date or after submissions exist');
    }

    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * Update quiz time limit
   * 
   * Requirements:
   * - 11.3: Time limit must be positive integer
   * - 11.6: Update only before due date
   * - 11.7: Update only before any submissions
   * 
   * @param timeLimit - New time limit in minutes
   * @param hasSubmissions - Whether quiz has any submissions
   * @throws Error if time limit is invalid or quiz cannot be edited
   */
  public updateTimeLimit(timeLimit: number, hasSubmissions: boolean): void {
    if (!Number.isInteger(timeLimit) || timeLimit <= 0) {
      throw new Error('Quiz time limit must be a positive integer (in minutes)');
    }

    if (!this.canEdit(hasSubmissions)) {
      throw new Error('Cannot update quiz after due date or after submissions exist');
    }

    this.timeLimit = timeLimit;
    this.updatedAt = new Date();
  }

  /**
   * Update quiz questions
   * 
   * Requirements:
   * - 11.5: At least one question required
   * - 11.6: Update only before due date
   * - 11.7: Update only before any submissions
   * 
   * @param questions - New questions array
   * @param hasSubmissions - Whether quiz has any submissions
   * @throws Error if questions are invalid or quiz cannot be edited
   */
  public updateQuestions(questions: Question[], hasSubmissions: boolean): void {
    if (!questions || questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    if (!this.canEdit(hasSubmissions)) {
      throw new Error('Cannot update quiz after due date or after submissions exist');
    }

    // Validate all questions before updating
    questions.forEach((question, index) => {
      this.validateQuestion(question, index);
    });

    this.questions = questions;
    this.updatedAt = new Date();
  }

  /**
   * Check if quiz is past due date
   * 
   * @returns true if current time is past due date
   */
  public isPastDueDate(): boolean {
    return new Date() >= this.dueDate;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getCourseId(): string {
    return this.courseId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getDueDate(): Date {
    return this.dueDate;
  }

  public getTimeLimit(): number {
    return this.timeLimit;
  }

  public getQuestions(): Question[] {
    return this.questions;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Convert entity to plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): QuizProps {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      timeLimit: this.timeLimit,
      questions: this.questions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
