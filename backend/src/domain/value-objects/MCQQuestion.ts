/**
 * MCQQuestion Value Object
 * 
 * Represents a Multiple Choice Question with validation.
 * Immutable value object for quiz questions.
 * 
 * Requirements:
 * - 11.4: MCQ must have at least 2 options
 * - 11.4: MCQ must have valid correctAnswer index
 */

export class MCQQuestion {
  private readonly questionText: string;
  private readonly options: readonly string[];
  private readonly correctAnswer: number;

  private constructor(questionText: string, options: string[], correctAnswer: number) {
    this.questionText = questionText;
    this.options = Object.freeze([...options]); // Make immutable
    this.correctAnswer = correctAnswer;
  }

  /**
   * Create a new MCQQuestion value object
   * 
   * @param questionText - The question text
   * @param options - Array of answer options (minimum 2)
   * @param correctAnswer - Index of correct option (0-based)
   * @returns MCQQuestion instance
   * @throws Error if validation fails
   */
  public static create(
    questionText: string,
    options: string[],
    correctAnswer: number
  ): MCQQuestion {
    // Validate question text
    if (!questionText || questionText.trim().length === 0) {
      throw new Error('Question text is required');
    }

    // Requirement 11.4: MCQ must have at least 2 options
    if (!options || options.length < 2) {
      throw new Error('MCQ must have at least 2 options');
    }

    // Validate each option is not empty
    options.forEach((option, index) => {
      if (!option || option.trim().length === 0) {
        throw new Error(`Option ${index + 1}: Option text is required`);
      }
    });

    // Requirement 11.4: MCQ must have valid correctAnswer index
    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) {
      throw new Error(
        `MCQ correctAnswer must be a valid option index (0-${options.length - 1})`
      );
    }

    return new MCQQuestion(questionText, options, correctAnswer);
  }

  /**
   * Get question text
   */
  public getQuestionText(): string {
    return this.questionText;
  }

  /**
   * Get options array (immutable)
   */
  public getOptions(): readonly string[] {
    return this.options;
  }

  /**
   * Get correct answer index
   */
  public getCorrectAnswer(): number {
    return this.correctAnswer;
  }

  /**
   * Check if an answer is correct
   * 
   * @param answerIndex - The index of the selected answer
   * @returns true if answer is correct
   */
  public isCorrectAnswer(answerIndex: number): boolean {
    return answerIndex === this.correctAnswer;
  }

  /**
   * Get the correct answer text
   */
  public getCorrectAnswerText(): string {
    return this.options[this.correctAnswer]!;
  }

  /**
   * Convert to plain object for persistence
   */
  public toObject(): {
    type: 'MCQ';
    questionText: string;
    options: string[];
    correctAnswer: number;
  } {
    return {
      type: 'MCQ',
      questionText: this.questionText,
      options: [...this.options],
      correctAnswer: this.correctAnswer,
    };
  }

  /**
   * Value object equality comparison
   * Two MCQQuestions are equal if all their properties are equal
   */
  public equals(other: MCQQuestion): boolean {
    if (!(other instanceof MCQQuestion)) {
      return false;
    }

    return (
      this.questionText === other.questionText &&
      this.correctAnswer === other.correctAnswer &&
      this.options.length === other.options.length &&
      this.options.every((option, index) => option === other.options[index])
    );
  }
}
