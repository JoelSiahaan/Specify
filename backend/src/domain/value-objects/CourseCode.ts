/**
 * CourseCode Value Object
 * 
 * Represents a unique course identifier with 6-character alphanumeric validation.
 * Immutable value object that ensures course code format validity.
 * 
 * Requirements: 5.1 (Course code generation and validation)
 */

export class CourseCode {
  private readonly value: string;

  private constructor(code: string) {
    this.value = code;
  }

  /**
   * Create a CourseCode value object from a string
   * @param code - Course code string (6-character alphanumeric)
   * @returns CourseCode value object
   * @throws Error if course code format is invalid
   */
  static create(code: string): CourseCode {
    if (code === null || code === undefined || typeof code !== 'string') {
      throw new Error('Course code must be a non-empty string');
    }

    const trimmedCode = code.trim();
    
    if (trimmedCode.length === 0) {
      throw new Error('Course code cannot be empty');
    }

    if (!CourseCode.isValid(trimmedCode)) {
      throw new Error('Invalid course code format. Must be 6 alphanumeric characters (A-Z, 0-9)');
    }

    // Normalize to uppercase for consistency
    const normalizedCode = trimmedCode.toUpperCase();
    
    return new CourseCode(normalizedCode);
  }

  /**
   * Validate course code format
   * Must be exactly 6 alphanumeric characters (A-Z, 0-9)
   * 
   * @param code - Course code string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(code: string): boolean {
    // Must be exactly 6 characters
    if (code.length !== 6) {
      return false;
    }

    // Must contain only alphanumeric characters (A-Z, 0-9)
    // Case-insensitive check
    const alphanumericRegex = /^[A-Z0-9]{6}$/i;
    
    return alphanumericRegex.test(code);
  }

  /**
   * Get the course code value as a string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Check equality with another CourseCode value object
   */
  equals(other: CourseCode): boolean {
    if (!(other instanceof CourseCode)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }
}
