/**
 * QuizSubmission Domain Entity
 * 
 * Represents a student's quiz submission with timer validation and auto-submit logic.
 * Supports quiz submission lifecycle: Not Started → Started → Submitted → Graded
 * 
 * Requirements:
 * - 12.1: Display quiz info before starting
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time
 * - 12.4: Auto-submit when time expires
 * - 12.5: Accept submission before time limit
 * - 12.6: Prevent access after due date
 * - 12.7: Prevent multiple submissions
 */

import { randomUUID } from 'crypto';

export enum QuizSubmissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED'
}

export interface QuizAnswer {
  questionIndex: number;
  answer: string | number; // string for essay, number for MCQ (option index)
}

export interface QuizSubmissionProps {
  id: string;
  quizId: string;
  studentId: string;
  answers: QuizAnswer[];
  startedAt?: Date | null;
  submittedAt?: Date | null;
  grade?: number | null;
  feedback?: string | null;
  status: QuizSubmissionStatus;
  version: number; // For optimistic locking
  createdAt?: Date;
  updatedAt?: Date;
}

export class QuizSubmission {
  private readonly id: string;
  private readonly quizId: string;
  private readonly studentId: string;
  private answers: QuizAnswer[];
  private startedAt: Date | null;
  private submittedAt: Date | null;
  private grade: number | null;
  private feedback: string | null;
  private status: QuizSubmissionStatus;
  private version: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: QuizSubmissionProps) {
    this.id = props.id;
    this.quizId = props.quizId;
    this.studentId = props.studentId;
    this.answers = props.answers;
    this.startedAt = props.startedAt || null;
    this.submittedAt = props.submittedAt || null;
    this.grade = props.grade || null;
    this.feedback = props.feedback || null;
    this.status = props.status;
    this.version = props.version;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new QuizSubmission entity (not started)
   * 
   * Requirement 12.7: Prevent multiple submissions
   * 
   * @param quizId - Quiz ID
   * @param studentId - Student ID
   * @returns QuizSubmission instance
   */
  public static create(quizId: string, studentId: string): QuizSubmission {
    return new QuizSubmission({
      id: randomUUID(),
      quizId,
      studentId,
      answers: [],
      startedAt: null,
      submittedAt: null,
      grade: null,
      feedback: null,
      status: QuizSubmissionStatus.NOT_STARTED,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Reconstitute QuizSubmission from persistence
   * 
   * @param props - QuizSubmission properties from database
   * @returns QuizSubmission instance
   */
  public static reconstitute(props: QuizSubmissionProps): QuizSubmission {
    return new QuizSubmission(props);
  }

  /**
   * Validate QuizSubmission entity invariants
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('QuizSubmission ID is required');
    }

    if (!this.quizId || this.quizId.trim().length === 0) {
      throw new Error('Quiz ID is required');
    }

    if (!this.studentId || this.studentId.trim().length === 0) {
      throw new Error('Student ID is required');
    }

    if (!Number.isInteger(this.version) || this.version < 1) {
      throw new Error('Version must be a positive integer');
    }

    // Validate status transitions
    if (this.status === QuizSubmissionStatus.IN_PROGRESS && !this.startedAt) {
      throw new Error('Started date is required for in-progress submissions');
    }

    if (this.status === QuizSubmissionStatus.SUBMITTED && !this.submittedAt) {
      throw new Error('Submitted date is required for submitted submissions');
    }

    if (this.status === QuizSubmissionStatus.GRADED && this.grade === null) {
      throw new Error('Grade is required for graded submissions');
    }

    // Validate grade range
    if (this.grade !== null && (this.grade < 0 || this.grade > 100)) {
      throw new Error('Grade must be between 0 and 100');
    }
  }

  /**
   * Start the quiz
   * 
   * Requirements:
   * - 12.2: Start quiz and countdown timer
   * - 12.6: Prevent access after due date
   * - 12.7: Prevent multiple submissions
   * 
   * @param quizDueDate - Quiz due date
   * @throws Error if quiz cannot be started
   */
  public start(quizDueDate: Date): void {
    // Requirement 12.7: Prevent multiple submissions
    if (this.status !== QuizSubmissionStatus.NOT_STARTED) {
      throw new Error('Quiz has already been started or submitted');
    }

    // Requirement 12.6: Prevent access after due date
    if (new Date() >= quizDueDate) {
      throw new Error('Cannot start quiz after due date');
    }

    this.startedAt = new Date();
    this.status = QuizSubmissionStatus.IN_PROGRESS;
    this.updatedAt = new Date();
  }

  /**
   * Check if quiz time has expired
   * 
   * Requirement 12.4: Auto-submit when time expires
   * 
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @returns true if time has expired
   */
  public isTimeExpired(timeLimitMinutes: number): boolean {
    if (!this.startedAt) {
      return false;
    }

    const now = new Date();
    const elapsedMinutes = (now.getTime() - this.startedAt.getTime()) / (1000 * 60);
    return elapsedMinutes >= timeLimitMinutes;
  }

  /**
   * Get remaining time in seconds
   * 
   * Requirement 12.3: Display remaining time
   * 
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @returns Remaining time in seconds (0 if expired)
   */
  public getRemainingTimeSeconds(timeLimitMinutes: number): number {
    if (!this.startedAt) {
      return timeLimitMinutes * 60;
    }

    const now = new Date();
    const elapsedSeconds = (now.getTime() - this.startedAt.getTime()) / 1000;
    const totalSeconds = timeLimitMinutes * 60;
    const remainingSeconds = totalSeconds - elapsedSeconds;

    return Math.max(0, Math.floor(remainingSeconds));
  }

  /**
   * Update answers (auto-save during quiz)
   * 
   * @param answers - Updated answers
   * @throws Error if quiz is not in progress
   */
  public updateAnswers(answers: QuizAnswer[]): void {
    if (this.status !== QuizSubmissionStatus.IN_PROGRESS) {
      throw new Error('Cannot update answers when quiz is not in progress');
    }

    this.answers = answers;
    this.updatedAt = new Date();
  }

  /**
   * Submit the quiz
   * 
   * Requirements:
   * - 12.4: Auto-submit when time expires
   * - 12.5: Accept submission before time limit
   * 
   * @param answers - Final answers
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @param isAutoSubmit - Whether this is an auto-submit (time expired)
   * @throws Error if quiz cannot be submitted
   */
  public submit(answers: QuizAnswer[], timeLimitMinutes: number, isAutoSubmit: boolean = false): void {
    if (this.status !== QuizSubmissionStatus.IN_PROGRESS) {
      throw new Error('Quiz must be in progress to submit');
    }

    // Requirement 12.5: Accept submission before time limit
    // Requirement 12.4: Auto-submit when time expires
    if (!isAutoSubmit && this.isTimeExpired(timeLimitMinutes)) {
      throw new Error('Quiz time has expired');
    }

    this.answers = answers;
    this.submittedAt = new Date();
    this.status = QuizSubmissionStatus.SUBMITTED;
    this.updatedAt = new Date();
  }

  /**
   * Auto-submit the quiz when time expires
   * 
   * Requirement 12.4: Auto-submit when time expires
   * 
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @throws Error if quiz cannot be auto-submitted
   */
  public autoSubmit(timeLimitMinutes: number): void {
    if (this.status !== QuizSubmissionStatus.IN_PROGRESS) {
      throw new Error('Quiz must be in progress to auto-submit');
    }

    if (!this.isTimeExpired(timeLimitMinutes)) {
      throw new Error('Cannot auto-submit before time expires');
    }

    // Submit with current answers
    this.submittedAt = new Date();
    this.status = QuizSubmissionStatus.SUBMITTED;
    this.updatedAt = new Date();
  }

  /**
   * Grade the quiz submission
   * 
   * Requirement 13.3: Validate grade is between 0 and 100
   * 
   * @param gradeValue - Grade (0-100)
   * @param feedback - Optional feedback
   * @throws Error if grade is invalid or submission is not submitted
   */
  public setGrade(gradeValue: number, feedback?: string): void {
    if (this.status !== QuizSubmissionStatus.SUBMITTED) {
      throw new Error('Can only grade submitted submissions');
    }

    // Requirement 13.3: Validate grade is between 0 and 100
    if (gradeValue < 0 || gradeValue > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    this.grade = gradeValue;
    this.feedback = feedback || null;
    this.status = QuizSubmissionStatus.GRADED;
    this.version += 1; // Increment version for optimistic locking
    this.updatedAt = new Date();
  }

  /**
   * Update grade (after initial grading)
   * 
   * Requirement 13.5: Allow teachers to edit grades after saving
   * 
   * @param gradeValue - Updated grade (0-100)
   * @param feedback - Updated feedback
   * @throws Error if grade is invalid or submission is not graded
   */
  public updateGrade(gradeValue: number, feedback?: string): void {
    if (this.status !== QuizSubmissionStatus.GRADED) {
      throw new Error('Can only update grade for graded submissions');
    }

    if (gradeValue < 0 || gradeValue > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    this.grade = gradeValue;
    this.feedback = feedback || null;
    this.version += 1; // Increment version for optimistic locking
    this.updatedAt = new Date();
  }

  /**
   * Check if submission is late (submitted after due date)
   * 
   * Note: For quizzes, late submissions are not allowed (Requirement 12.6)
   * This method always returns false for quiz submissions
   * 
   * @returns false (quizzes cannot be submitted late)
   */
  public isLate(): boolean {
    return false; // Quizzes cannot be submitted after due date
  }

  /**
   * Check if submission has been graded
   * 
   * @returns true if submission has been graded
   */
  public isGraded(): boolean {
    return this.status === QuizSubmissionStatus.GRADED;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getQuizId(): string {
    return this.quizId;
  }

  public getStudentId(): string {
    return this.studentId;
  }

  public getAnswers(): QuizAnswer[] {
    return this.answers;
  }

  public getStartedAt(): Date | null {
    return this.startedAt;
  }

  public getSubmittedAt(): Date | null {
    return this.submittedAt;
  }

  public getGrade(): number | null {
    return this.grade;
  }

  public getFeedback(): string | null {
    return this.feedback;
  }

  public getStatus(): QuizSubmissionStatus {
    return this.status;
  }

  public getVersion(): number {
    return this.version;
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
  public toObject(): QuizSubmissionProps {
    return {
      id: this.id,
      quizId: this.quizId,
      studentId: this.studentId,
      answers: this.answers,
      startedAt: this.startedAt,
      submittedAt: this.submittedAt,
      grade: this.grade,
      feedback: this.feedback,
      status: this.status,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
