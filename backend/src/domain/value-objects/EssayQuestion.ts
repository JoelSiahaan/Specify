/**
 * EssayQuestion Value Object
 * 
 * Represents an Essay Question with validation.
 * Immutable value object for quiz questions.
 * 
 * Requirements:
 * - 11.4: Essay questions require question text
 */

export class EssayQuestion {
  private readonly questionText: string;

  private constructor(questionText: string) {
    this.questionText = questionText;
  }

  /**
   * Create a new EssayQuestion value object
   * 
   * @param questionText - The question text
   * @returns EssayQuestion instance
   * @throws Error if validation fails
   */
  public static create(questionText: string): EssayQuestion {
    // Validate question text
    if (!questionText || questionText.trim().length === 0) {
      throw new Error('Question text is required');
    }

    return new EssayQuestion(questionText);
  }

  /**
   * Get question text
   */
  public getQuestionText(): string {
    return this.questionText;
  }

  /**
   * Convert to plain object for persistence
   */
  public toObject(): {
    type: 'ESSAY';
    questionText: string;
  } {
    return {
      type: 'ESSAY',
      questionText: this.questionText,
    };
  }

  /**
   * Value object equality comparison
   * Two EssayQuestions are equal if their question texts are equal
   */
  public equals(other: EssayQuestion): boolean {
    if (!(other instanceof EssayQuestion)) {
      return false;
    }

    return this.questionText === other.questionText;
  }
}
