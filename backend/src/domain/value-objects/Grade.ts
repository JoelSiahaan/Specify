/**
 * Grade Value Object
 * 
 * Represents a numerical grade score with 0-100 range validation.
 * Immutable value object that ensures grade validity.
 * 
 * Requirements: 13.3 (Grade validation between 0 and 100)
 */

export class Grade {
  private readonly value: number;

  private constructor(grade: number) {
    this.value = grade;
  }

  /**
   * Create a Grade value object from a number
   * @param grade - Grade value (0-100 inclusive)
   * @returns Grade value object
   * @throws Error if grade is invalid or out of range
   */
  static create(grade: number): Grade {
    if (grade === null || grade === undefined) {
      throw new Error('Grade must be a number');
    }

    if (typeof grade !== 'number') {
      throw new Error('Grade must be a number');
    }

    if (isNaN(grade)) {
      throw new Error('Grade must be a valid number');
    }

    if (!Grade.isValid(grade)) {
      throw new Error('Grade must be between 0 and 100 (inclusive)');
    }

    return new Grade(grade);
  }

  /**
   * Validate grade range
   * Must be between 0 and 100 (inclusive)
   * 
   * @param grade - Grade value to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(grade: number): boolean {
    // Must be between 0 and 100 (inclusive)
    return grade >= 0 && grade <= 100;
  }

  /**
   * Get the grade value as a number
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Check equality with another Grade value object
   */
  equals(other: Grade): boolean {
    if (!(other instanceof Grade)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * Get letter grade representation (optional utility)
   * A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59
   */
  getLetterGrade(): string {
    if (this.value >= 90) return 'A';
    if (this.value >= 80) return 'B';
    if (this.value >= 70) return 'C';
    if (this.value >= 60) return 'D';
    return 'F';
  }

  /**
   * Check if grade is passing (>= 60)
   */
  isPassing(): boolean {
    return this.value >= 60;
  }
}
