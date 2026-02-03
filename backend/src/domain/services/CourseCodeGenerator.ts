/**
 * CourseCodeGenerator Domain Service
 * 
 * Generates unique 6-character alphanumeric course codes with collision retry logic.
 * This is a Domain Service that encapsulates complex business logic spanning multiple concerns.
 * 
 * Requirements:
 * - 5.1: Generate unique course codes (6-character alphanumeric)
 * - 5.2: Handle code collisions with retry logic (max 5 attempts)
 * 
 * Design:
 * - Format: Random alphanumeric (A-Z, 0-9)
 * - Uniqueness: Database constraint ensures no duplicates
 * - Collision Handling: Retry up to 5 times, fail if all retries exhausted
 * - Probability: 36^6 = 2.1 billion combinations (collision extremely rare)
 */

import { CourseCode } from '../value-objects/CourseCode.js';

/**
 * Interface for checking course code uniqueness
 * This allows the domain service to check uniqueness without depending on infrastructure
 */
export interface ICourseCodeChecker {
  /**
   * Check if a course code is unique (not already in use)
   * 
   * @param code - CourseCode to check
   * @returns Promise resolving to true if unique, false if already exists
   */
  isUnique(code: CourseCode): Promise<boolean>;
}

export class CourseCodeGenerator {
  private static readonly MAX_RETRIES = 5;
  private static readonly CODE_LENGTH = 6;
  private static readonly CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private readonly codeChecker: ICourseCodeChecker;

  constructor(codeChecker: ICourseCodeChecker) {
    this.codeChecker = codeChecker;
  }

  /**
   * Generate a unique course code with retry logic
   * 
   * Attempts to generate a unique code up to MAX_RETRIES times.
   * If all retries are exhausted, throws an error.
   * 
   * @returns Promise resolving to unique CourseCode
   * @throws Error if unable to generate unique code after MAX_RETRIES attempts
   */
  async generate(): Promise<CourseCode> {
    for (let attempt = 0; attempt < CourseCodeGenerator.MAX_RETRIES; attempt++) {
      const code = this.generateRandom();
      
      if (await this.codeChecker.isUnique(code)) {
        return code;
      }
      
      // Collision detected, retry
    }

    // All retries exhausted
    throw new Error(
      `Failed to generate unique course code after ${CourseCodeGenerator.MAX_RETRIES} attempts`
    );
  }

  /**
   * Generate a random 6-character alphanumeric code
   * 
   * @returns CourseCode with random alphanumeric characters
   * @private
   */
  private generateRandom(): CourseCode {
    let code = '';
    
    for (let i = 0; i < CourseCodeGenerator.CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * CourseCodeGenerator.CHARACTERS.length);
      code += CourseCodeGenerator.CHARACTERS[randomIndex];
    }
    
    return CourseCode.create(code);
  }

  /**
   * Get the maximum number of retry attempts
   * Exposed for testing purposes
   */
  static getMaxRetries(): number {
    return CourseCodeGenerator.MAX_RETRIES;
  }

  /**
   * Get the code length
   * Exposed for testing purposes
   */
  static getCodeLength(): number {
    return CourseCodeGenerator.CODE_LENGTH;
  }
}
