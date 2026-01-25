/**
 * QuizTimingService Domain Service
 * 
 * Handles quiz timing calculations and validation for timed assessments.
 * This is a Domain Service that encapsulates timing logic for quiz submissions.
 * 
 * Requirements:
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time to the student during the quiz
 * - 12.4: Auto-submit when time limit expires
 * - 12.5: Accept submission before time limit
 * 
 * Design:
 * - Pure functions for timing calculations
 * - No side effects or state
 * - Timezone-agnostic (works with Date objects in UTC)
 */

export class QuizTimingService {
  /**
   * Calculate remaining time in seconds for a quiz submission
   * 
   * Requirement 12.3: Display remaining time to the student during the quiz
   * 
   * @param startedAt - When the quiz was started
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @param currentTime - Current time (defaults to now, injectable for testing)
   * @returns Remaining time in seconds (0 if expired or not started)
   */
  public static calculateRemainingTime(
    startedAt: Date | null,
    timeLimitMinutes: number,
    currentTime: Date = new Date()
  ): number {
    // If quiz hasn't started, return full time limit
    if (!startedAt) {
      return timeLimitMinutes * 60;
    }

    // Validate time limit
    if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0) {
      throw new Error('Time limit must be a positive integer (in minutes)');
    }

    // Calculate elapsed time in seconds
    const elapsedSeconds = (currentTime.getTime() - startedAt.getTime()) / 1000;
    
    // Calculate total time limit in seconds
    const totalSeconds = timeLimitMinutes * 60;
    
    // Calculate remaining time
    const remainingSeconds = totalSeconds - elapsedSeconds;

    // Return 0 if time has expired, otherwise return remaining time (floored)
    return Math.max(0, Math.floor(remainingSeconds));
  }

  /**
   * Check if quiz time has expired
   * 
   * Requirements:
   * - 12.4: Auto-submit when time limit expires
   * - 12.5: Accept submission before time limit
   * 
   * @param startedAt - When the quiz was started
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @param currentTime - Current time (defaults to now, injectable for testing)
   * @returns true if time has expired, false otherwise
   */
  public static isExpired(
    startedAt: Date | null,
    timeLimitMinutes: number,
    currentTime: Date = new Date()
  ): boolean {
    // If quiz hasn't started, it's not expired
    if (!startedAt) {
      return false;
    }

    // Validate time limit
    if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0) {
      throw new Error('Time limit must be a positive integer (in minutes)');
    }

    // Calculate elapsed time in minutes
    const elapsedMinutes = (currentTime.getTime() - startedAt.getTime()) / (1000 * 60);
    
    // Check if elapsed time exceeds time limit
    return elapsedMinutes >= timeLimitMinutes;
  }

  /**
   * Calculate when the quiz will expire
   * 
   * @param startedAt - When the quiz was started
   * @param timeLimitMinutes - Quiz time limit in minutes
   * @returns Expiration time, or null if not started
   */
  public static calculateExpirationTime(
    startedAt: Date | null,
    timeLimitMinutes: number
  ): Date | null {
    if (!startedAt) {
      return null;
    }

    // Validate time limit
    if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0) {
      throw new Error('Time limit must be a positive integer (in minutes)');
    }

    // Calculate expiration time
    const expirationTime = new Date(startedAt.getTime() + timeLimitMinutes * 60 * 1000);
    return expirationTime;
  }

  /**
   * Format remaining time as MM:SS
   * 
   * Utility method for displaying time in user-friendly format
   * 
   * @param remainingSeconds - Remaining time in seconds
   * @returns Formatted time string (MM:SS)
   */
  public static formatTime(remainingSeconds: number): string {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
