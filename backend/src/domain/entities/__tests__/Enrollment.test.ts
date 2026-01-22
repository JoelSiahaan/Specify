/**
 * Enrollment Entity Unit Tests
 * 
 * Tests for Enrollment domain entity business logic and validation.
 * 
 * Requirements tested:
 * - 6.5: Enroll student in active course
 * - 6.8: Prevent duplicate enrollment
 */

import { Enrollment, type EnrollmentProps } from '../Enrollment';

describe('Enrollment Entity', () => {
  const validEnrollmentProps: EnrollmentProps = {
    id: 'enrollment-123',
    courseId: 'course-456',
    studentId: 'student-789'
  };

  describe('create', () => {
    // Requirement 6.5: Enroll student in course
    it('should create a valid enrollment with all required fields', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      expect(enrollment.getId()).toBe(validEnrollmentProps.id);
      expect(enrollment.getCourseId()).toBe(validEnrollmentProps.courseId);
      expect(enrollment.getStudentId()).toBe(validEnrollmentProps.studentId);
      expect(enrollment.getEnrolledAt()).toBeInstanceOf(Date);
    });

    it('should create enrollment with current timestamp when enrolledAt not provided', () => {
      const beforeCreate = new Date();
      const enrollment = Enrollment.create(validEnrollmentProps);
      const afterCreate = new Date();

      const enrolledAt = enrollment.getEnrolledAt();
      expect(enrolledAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(enrolledAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create enrollment with provided enrolledAt timestamp', () => {
      const enrolledAt = new Date('2025-01-01T10:00:00Z');
      const props = { ...validEnrollmentProps, enrolledAt };

      const enrollment = Enrollment.create(props);

      expect(enrollment.getEnrolledAt()).toEqual(enrolledAt);
    });

    it('should throw error when id is missing', () => {
      const props = { ...validEnrollmentProps, id: '' };

      expect(() => Enrollment.create(props)).toThrow('Enrollment ID is required');
    });

    it('should throw error when id is whitespace only', () => {
      const props = { ...validEnrollmentProps, id: '   ' };

      expect(() => Enrollment.create(props)).toThrow('Enrollment ID is required');
    });

    it('should throw error when courseId is missing', () => {
      const props = { ...validEnrollmentProps, courseId: '' };

      expect(() => Enrollment.create(props)).toThrow('Course ID is required');
    });

    it('should throw error when courseId is whitespace only', () => {
      const props = { ...validEnrollmentProps, courseId: '   ' };

      expect(() => Enrollment.create(props)).toThrow('Course ID is required');
    });

    it('should throw error when studentId is missing', () => {
      const props = { ...validEnrollmentProps, studentId: '' };

      expect(() => Enrollment.create(props)).toThrow('Student ID is required');
    });

    it('should throw error when studentId is whitespace only', () => {
      const props = { ...validEnrollmentProps, studentId: '   ' };

      expect(() => Enrollment.create(props)).toThrow('Student ID is required');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute enrollment from persistence with timestamp', () => {
      const enrolledAt = new Date('2025-01-01T10:00:00Z');
      const props = { ...validEnrollmentProps, enrolledAt };

      const enrollment = Enrollment.reconstitute(props);

      expect(enrollment.getId()).toBe(props.id);
      expect(enrollment.getCourseId()).toBe(props.courseId);
      expect(enrollment.getStudentId()).toBe(props.studentId);
      expect(enrollment.getEnrolledAt()).toEqual(enrolledAt);
    });
  });

  describe('matches', () => {
    // Requirement 6.8: Prevent duplicate enrollment
    it('should return true when both courseId and studentId match', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      const result = enrollment.matches(
        validEnrollmentProps.courseId,
        validEnrollmentProps.studentId
      );

      expect(result).toBe(true);
    });

    it('should return false when courseId does not match', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      const result = enrollment.matches(
        'different-course-id',
        validEnrollmentProps.studentId
      );

      expect(result).toBe(false);
    });

    it('should return false when studentId does not match', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      const result = enrollment.matches(
        validEnrollmentProps.courseId,
        'different-student-id'
      );

      expect(result).toBe(false);
    });

    it('should return false when both courseId and studentId do not match', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      const result = enrollment.matches(
        'different-course-id',
        'different-student-id'
      );

      expect(result).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return correct id', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      expect(enrollment.getId()).toBe(validEnrollmentProps.id);
    });

    it('should return correct courseId', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      expect(enrollment.getCourseId()).toBe(validEnrollmentProps.courseId);
    });

    it('should return correct studentId', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      expect(enrollment.getStudentId()).toBe(validEnrollmentProps.studentId);
    });

    it('should return correct enrolledAt', () => {
      const enrolledAt = new Date('2025-01-01T10:00:00Z');
      const props = { ...validEnrollmentProps, enrolledAt };
      const enrollment = Enrollment.create(props);

      expect(enrollment.getEnrolledAt()).toEqual(enrolledAt);
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const enrolledAt = new Date('2025-01-01T10:00:00Z');
      const props = { ...validEnrollmentProps, enrolledAt };
      const enrollment = Enrollment.create(props);

      const obj = enrollment.toObject();

      expect(obj.id).toBe(validEnrollmentProps.id);
      expect(obj.courseId).toBe(validEnrollmentProps.courseId);
      expect(obj.studentId).toBe(validEnrollmentProps.studentId);
      expect(obj.enrolledAt).toEqual(enrolledAt);
    });

    it('should include auto-generated enrolledAt in plain object', () => {
      const enrollment = Enrollment.create(validEnrollmentProps);

      const obj = enrollment.toObject();

      expect(obj.enrolledAt).toBeInstanceOf(Date);
    });
  });
});
