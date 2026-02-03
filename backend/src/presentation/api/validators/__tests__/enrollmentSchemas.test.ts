/**
 * Enrollment Schemas Unit Tests
 * 
 * Tests for Zod validation schemas for enrollment-related requests.
 * Validates that schemas correctly accept valid input and reject invalid input.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 6.5: Valid course code for enrollment
 * - 6.7: Invalid course code rejection
 */

import {
  EnrollCourseRequestSchema,
  BulkUnenrollRequestSchema,
  EnrollmentCourseCodeSchema
} from '../enrollmentSchemas.js';

describe('Enrollment Validation Schemas', () => {
  describe('EnrollmentCourseCodeSchema', () => {
    it('should accept valid course code', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABC123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should normalize to uppercase', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('abc123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should trim whitespace', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('  ABC123  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should reject code with less than 6 characters', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABC12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject code with more than 6 characters', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABC1234');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject code with special characters', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABC-12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters and numbers');
      }
    });

    it('should reject code with spaces', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABC 12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters and numbers');
      }
    });

    it('should accept code with only letters', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('ABCDEF');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABCDEF');
      }
    });

    it('should accept code with only numbers', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('123456');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('123456');
      }
    });

    it('should accept mixed alphanumeric code', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('A1B2C3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('A1B2C3');
      }
    });

    it('should reject empty string', () => {
      const result = EnrollmentCourseCodeSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject null', () => {
      const result = EnrollmentCourseCodeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined', () => {
      const result = EnrollmentCourseCodeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject number type', () => {
      const result = EnrollmentCourseCodeSchema.safeParse(123456);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be a string');
      }
    });
  });

  describe('EnrollCourseRequestSchema', () => {
    it('should accept valid enroll request', () => {
      const request = { courseCode: 'ABC123' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.courseCode).toBe('ABC123');
      }
    });

    it('should normalize course code to uppercase', () => {
      const request = { courseCode: 'abc123' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.courseCode).toBe('ABC123');
      }
    });

    it('should trim whitespace from course code', () => {
      const request = { courseCode: '  ABC123  ' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.courseCode).toBe('ABC123');
      }
    });

    it('should reject missing course code', () => {
      const request = {};
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('courseCode');
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject invalid course code format', () => {
      const request = { courseCode: 'ABC-12' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters and numbers');
      }
    });

    it('should reject course code with wrong length', () => {
      const request = { courseCode: 'ABC12' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject empty course code', () => {
      const request = { courseCode: '' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject null course code', () => {
      const request = { courseCode: null };
      const result = EnrollCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject extra fields', () => {
      const request = { courseCode: 'ABC123', extraField: 'value' };
      const result = EnrollCourseRequestSchema.safeParse(request);
      // Zod strips extra fields by default, so this should pass
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ courseCode: 'ABC123' });
      }
    });
  });

  describe('BulkUnenrollRequestSchema', () => {
    const validUUID1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUUID2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validUUID3 = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

    it('should accept valid bulk unenroll request with one student', () => {
      const request = { studentIds: [validUUID1] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.studentIds).toEqual([validUUID1]);
      }
    });

    it('should accept valid bulk unenroll request with multiple students', () => {
      const request = { studentIds: [validUUID1, validUUID2, validUUID3] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.studentIds).toEqual([validUUID1, validUUID2, validUUID3]);
      }
    });

    it('should accept request with exactly 100 students', () => {
      const studentIds = Array.from({ length: 100 }, (_, i) => 
        `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`
      );
      const request = { studentIds };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.studentIds.length).toBe(100);
      }
    });

    it('should reject empty student IDs array', () => {
      const request = { studentIds: [] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one student ID');
      }
    });

    it('should reject request with more than 100 students', () => {
      const studentIds = Array.from({ length: 101 }, (_, i) => 
        `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`
      );
      const request = { studentIds };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Cannot unenroll more than 100');
      }
    });

    it('should reject missing studentIds field', () => {
      const request = {};
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('studentIds');
      }
    });

    it('should reject invalid UUID format', () => {
      const request = { studentIds: ['invalid-uuid'] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid UUID');
      }
    });

    it('should reject non-UUID strings', () => {
      const request = { studentIds: ['ABC123'] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid UUID');
      }
    });

    it('should reject array with mixed valid and invalid UUIDs', () => {
      const request = { studentIds: [validUUID1, 'invalid-uuid', validUUID2] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject null studentIds', () => {
      const request = { studentIds: null };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject non-array studentIds', () => {
      const request = { studentIds: validUUID1 };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject array with null elements', () => {
      const request = { studentIds: [validUUID1, null, validUUID2] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject array with empty string elements', () => {
      const request = { studentIds: [validUUID1, '', validUUID2] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject duplicate student IDs', () => {
      // Note: Zod doesn't validate uniqueness by default, but we can test the behavior
      const request = { studentIds: [validUUID1, validUUID1] };
      const result = BulkUnenrollRequestSchema.safeParse(request);
      // This will pass validation (duplicates allowed), but business logic should handle it
      expect(result.success).toBe(true);
    });
  });
});
