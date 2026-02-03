/**
 * QuizTimingService Domain Service Unit Tests
 * 
 * Tests for quiz timing calculations and validation
 */

import { QuizTimingService } from '../QuizTimingService.js';

describe('QuizTimingService Domain Service', () => {
  describe('calculateRemainingTime', () => {
    it('should return full time limit when quiz has not started', () => {
      const timeLimitMinutes = 30;
      const remainingTime = QuizTimingService.calculateRemainingTime(null, timeLimitMinutes);

      expect(remainingTime).toBe(30 * 60); // 1800 seconds
    });

    it('should calculate remaining time correctly when quiz just started', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:00:01Z'); // 1 second later
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(1799); // 30 minutes - 1 second
    });

    it('should calculate remaining time correctly when halfway through', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:15:00Z'); // 15 minutes later
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(15 * 60); // 15 minutes = 900 seconds
    });

    it('should return 0 when time has expired', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:30:00Z'); // 30 minutes later
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(0);
    });

    it('should return 0 when time has exceeded limit', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:35:00Z'); // 35 minutes later
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(0);
    });

    it('should floor remaining time to nearest second', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:00:00.999Z'); // 999 milliseconds later
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(1799); // Floored to 1799 seconds
    });

    it('should handle short time limits (1 minute)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:00:30Z'); // 30 seconds later
      const timeLimitMinutes = 1;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(30); // 30 seconds remaining
    });

    it('should handle long time limits (120 minutes)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T11:00:00Z'); // 60 minutes later
      const timeLimitMinutes = 120;

      const remainingTime = QuizTimingService.calculateRemainingTime(
        startedAt,
        timeLimitMinutes,
        currentTime
      );

      expect(remainingTime).toBe(60 * 60); // 60 minutes = 3600 seconds
    });

    it('should throw error for invalid time limit (zero)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 0;

      expect(() => {
        QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (negative)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = -10;

      expect(() => {
        QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (non-integer)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30.5;

      expect(() => {
        QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should use current time when not provided', () => {
      const startedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const timeLimitMinutes = 30;

      const remainingTime = QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes);

      // Should be approximately 25 minutes (allowing for small time differences)
      expect(remainingTime).toBeGreaterThan(24 * 60);
      expect(remainingTime).toBeLessThanOrEqual(25 * 60);
    });
  });

  describe('isExpired', () => {
    it('should return false when quiz has not started', () => {
      const timeLimitMinutes = 30;
      const isExpired = QuizTimingService.isExpired(null, timeLimitMinutes);

      expect(isExpired).toBe(false);
    });

    it('should return false when time has not expired', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:15:00Z'); // 15 minutes later
      const timeLimitMinutes = 30;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(false);
    });

    it('should return true when time has exactly expired', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:30:00Z'); // Exactly 30 minutes later
      const timeLimitMinutes = 30;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(true);
    });

    it('should return true when time has exceeded limit', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:35:00Z'); // 35 minutes later
      const timeLimitMinutes = 30;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(true);
    });

    it('should return false when 1 second before expiration', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:29:59Z'); // 29 minutes 59 seconds later
      const timeLimitMinutes = 30;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(false);
    });

    it('should handle short time limits (1 minute)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T10:01:00Z'); // 1 minute later
      const timeLimitMinutes = 1;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(true);
    });

    it('should handle long time limits (120 minutes)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const currentTime = new Date('2025-01-13T12:00:00Z'); // 120 minutes later
      const timeLimitMinutes = 120;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime);

      expect(isExpired).toBe(true);
    });

    it('should throw error for invalid time limit (zero)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 0;

      expect(() => {
        QuizTimingService.isExpired(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (negative)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = -10;

      expect(() => {
        QuizTimingService.isExpired(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (non-integer)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30.5;

      expect(() => {
        QuizTimingService.isExpired(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should use current time when not provided', () => {
      const startedAt = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
      const timeLimitMinutes = 30;

      const isExpired = QuizTimingService.isExpired(startedAt, timeLimitMinutes);

      expect(isExpired).toBe(true);
    });
  });

  describe('calculateExpirationTime', () => {
    it('should return null when quiz has not started', () => {
      const timeLimitMinutes = 30;
      const expirationTime = QuizTimingService.calculateExpirationTime(null, timeLimitMinutes);

      expect(expirationTime).toBeNull();
    });

    it('should calculate correct expiration time', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30;

      const expirationTime = QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);

      expect(expirationTime).toEqual(new Date('2025-01-13T10:30:00Z'));
    });

    it('should handle short time limits (1 minute)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 1;

      const expirationTime = QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);

      expect(expirationTime).toEqual(new Date('2025-01-13T10:01:00Z'));
    });

    it('should handle long time limits (120 minutes)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 120;

      const expirationTime = QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);

      expect(expirationTime).toEqual(new Date('2025-01-13T12:00:00Z'));
    });

    it('should throw error for invalid time limit (zero)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 0;

      expect(() => {
        QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (negative)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = -10;

      expect(() => {
        QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });

    it('should throw error for invalid time limit (non-integer)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30.5;

      expect(() => {
        QuizTimingService.calculateExpirationTime(startedAt, timeLimitMinutes);
      }).toThrow('Time limit must be a positive integer (in minutes)');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly for full minutes', () => {
      expect(QuizTimingService.formatTime(60)).toBe('01:00');
      expect(QuizTimingService.formatTime(120)).toBe('02:00');
      expect(QuizTimingService.formatTime(600)).toBe('10:00');
    });

    it('should format time correctly with seconds', () => {
      expect(QuizTimingService.formatTime(65)).toBe('01:05');
      expect(QuizTimingService.formatTime(125)).toBe('02:05');
      expect(QuizTimingService.formatTime(605)).toBe('10:05');
    });

    it('should format time correctly for less than 1 minute', () => {
      expect(QuizTimingService.formatTime(0)).toBe('00:00');
      expect(QuizTimingService.formatTime(1)).toBe('00:01');
      expect(QuizTimingService.formatTime(30)).toBe('00:30');
      expect(QuizTimingService.formatTime(59)).toBe('00:59');
    });

    it('should pad single digits with zeros', () => {
      expect(QuizTimingService.formatTime(5)).toBe('00:05');
      expect(QuizTimingService.formatTime(65)).toBe('01:05');
      expect(QuizTimingService.formatTime(305)).toBe('05:05');
    });

    it('should handle large time values', () => {
      expect(QuizTimingService.formatTime(3600)).toBe('60:00'); // 1 hour
      expect(QuizTimingService.formatTime(7200)).toBe('120:00'); // 2 hours
    });

    it('should handle edge cases', () => {
      expect(QuizTimingService.formatTime(0)).toBe('00:00');
      expect(QuizTimingService.formatTime(1799)).toBe('29:59'); // 30 minutes - 1 second
      expect(QuizTimingService.formatTime(1800)).toBe('30:00'); // Exactly 30 minutes
    });
  });

  describe('integration scenarios', () => {
    it('should correctly handle quiz lifecycle from start to expiration', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30;

      // Just started
      let currentTime = new Date('2025-01-13T10:00:00Z');
      expect(QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime)).toBe(false);
      expect(QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime)).toBe(1800);

      // 15 minutes in
      currentTime = new Date('2025-01-13T10:15:00Z');
      expect(QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime)).toBe(false);
      expect(QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime)).toBe(900);

      // 29 minutes 59 seconds in
      currentTime = new Date('2025-01-13T10:29:59Z');
      expect(QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime)).toBe(false);
      expect(QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime)).toBe(1);

      // Exactly at expiration
      currentTime = new Date('2025-01-13T10:30:00Z');
      expect(QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime)).toBe(true);
      expect(QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime)).toBe(0);

      // After expiration
      currentTime = new Date('2025-01-13T10:35:00Z');
      expect(QuizTimingService.isExpired(startedAt, timeLimitMinutes, currentTime)).toBe(true);
      expect(QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime)).toBe(0);
    });

    it('should handle warning thresholds (5 minutes, 2 minutes)', () => {
      const startedAt = new Date('2025-01-13T10:00:00Z');
      const timeLimitMinutes = 30;

      // 5 minutes remaining (warning threshold)
      let currentTime = new Date('2025-01-13T10:25:00Z');
      let remainingTime = QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime);
      expect(remainingTime).toBe(5 * 60);
      expect(QuizTimingService.formatTime(remainingTime)).toBe('05:00');

      // 2 minutes remaining (critical threshold)
      currentTime = new Date('2025-01-13T10:28:00Z');
      remainingTime = QuizTimingService.calculateRemainingTime(startedAt, timeLimitMinutes, currentTime);
      expect(remainingTime).toBe(2 * 60);
      expect(QuizTimingService.formatTime(remainingTime)).toBe('02:00');
    });
  });
});
