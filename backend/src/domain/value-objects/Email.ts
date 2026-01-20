/**
 * Email Value Object
 * 
 * Represents an email address with RFC 5322 validation.
 * Immutable value object that ensures email format validity.
 * 
 * Requirements: 1.7 (Email validation)
 */

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Create an Email value object from a string
   * @param email - Email address string
   * @returns Email value object
   * @throws Error if email format is invalid
   */
  static create(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (!Email.isValid(trimmedEmail)) {
      throw new Error('Invalid email format');
    }

    // Normalize to lowercase for case-insensitive comparison
    const normalizedEmail = trimmedEmail.toLowerCase();
    
    return new Email(normalizedEmail);
  }

  /**
   * Validate email format according to RFC 5322
   * Simplified regex that covers most common email formats
   * 
   * @param email - Email string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(email: string): boolean {
    // RFC 5322 compliant email regex (simplified but comprehensive)
    // Matches: local-part@domain.tld
    // Local part: alphanumeric, dots, hyphens, underscores, plus signs
    // Domain: alphanumeric, dots, hyphens with required TLD
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    // Additional validation rules
    if (email.length > 254) {
      return false; // RFC 5321 maximum email length
    }

    if (!emailRegex.test(email)) {
      return false;
    }

    // Check local part length (before @)
    const parts = email.split('@');
    const localPart = parts[0];
    const domain = parts[1];
    
    if (!localPart || !domain) {
      return false;
    }
    
    if (localPart.length > 64) {
      return false; // RFC 5321 maximum local part length
    }

    // Check for consecutive dots
    if (localPart.includes('..') || domain.includes('..')) {
      return false;
    }

    // Check for leading/trailing dots
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    // Ensure domain has at least one dot (TLD requirement)
    if (!domain.includes('.')) {
      return false;
    }

    return true;
  }

  /**
   * Get the email value as a string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get the local part of the email (before @)
   */
  getLocalPart(): string {
    const parts = this.value.split('@');
    return parts[0] || '';
  }

  /**
   * Get the domain part of the email (after @)
   */
  getDomain(): string {
    const parts = this.value.split('@');
    return parts[1] || '';
  }

  /**
   * Check equality with another Email value object
   */
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
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
