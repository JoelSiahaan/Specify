/**
 * Password Hashing Service
 * 
 * Handles password hashing and verification using BCrypt.
 * Uses 10 salt rounds for balance between security and performance.
 * 
 * Requirements:
 * - 1.1: Secure password storage
 * - 1.2: Password verification
 * - 20.1: Password hashing with BCrypt
 */

import bcrypt from 'bcrypt';
import { injectable } from 'tsyringe';

@injectable()
export class PasswordService {
  private readonly saltRounds: number = 10;

  /**
   * Hash a plain text password
   * 
   * @param password - Plain text password to hash
   * @returns Hashed password with salt
   * 
   * @example
   * const hashedPassword = await passwordService.hash('myPassword123');
   */
  async hash(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a plain text password against a hashed password
   * 
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns True if password matches, false otherwise
   * 
   * @example
   * const isValid = await passwordService.verify('myPassword123', hashedPassword);
   */
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    if (!hashedPassword || hashedPassword.length === 0) {
      throw new Error('Hashed password cannot be empty');
    }

    return await bcrypt.compare(password, hashedPassword);
  }
}
