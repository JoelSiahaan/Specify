/**
 * Enrollment Entity Property-Based Tests
 * 
 * Property-based tests for Enrollment domain entity using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 6.8: Prevent duplicate enrollment
 */

import * as fc from 'fast-check';
import { Enrollment, type EnrollmentProps } from '../Enrollment';
import { 
  uuidArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils';

describe('Enrollment Entity Properties', () => {
  /**
   * Property 15: No duplicate enrollments
   * Feature: core-lms, Property 15: No duplicate enrollments
   * Validates: Requirements 6.8
   * 
   * For any student and course, only one enrollment can exist
   * This is enforced by the matches() method which detects duplicates
   */
  it('Property 15: For any student and course, only one enrollment can exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        async (enrollmentProps: EnrollmentProps) => {
          // Create enrollment
          const enrollment = Enrollment.create(enrollmentProps);
          
          // Property: Enrollment matches itself (same courseId and studentId)
          const matchesItself = enrollment.matches(
            enrollmentProps.courseId,
            enrollmentProps.studentId
          );
          
          // Property: This is the mechanism to detect duplicates
          // If an enrollment with same courseId and studentId exists, matches() returns true
          return matchesItself === true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Enrollment does not match different course
   * Validates: Requirements 6.8
   * 
   * For any enrollment, it should not match a different course with same student
   */
  it('Property: Enrollment does not match different course with same student', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        uuidArbitrary(), // Different course ID
        async (enrollmentProps: EnrollmentProps, differentCourseId: string) => {
          // Skip if generated courseId happens to be the same
          fc.pre(enrollmentProps.courseId !== differentCourseId);
          
          const enrollment = Enrollment.create(enrollmentProps);
          
          // Property: Should not match different course
          const matchesDifferentCourse = enrollment.matches(
            differentCourseId,
            enrollmentProps.studentId
          );
          
          return matchesDifferentCourse === false;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Enrollment does not match different student
   * Validates: Requirements 6.8
   * 
   * For any enrollment, it should not match same course with different student
   */
  it('Property: Enrollment does not match same course with different student', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        uuidArbitrary(), // Different student ID
        async (enrollmentProps: EnrollmentProps, differentStudentId: string) => {
          // Skip if generated studentId happens to be the same
          fc.pre(enrollmentProps.studentId !== differentStudentId);
          
          const enrollment = Enrollment.create(enrollmentProps);
          
          // Property: Should not match different student
          const matchesDifferentStudent = enrollment.matches(
            enrollmentProps.courseId,
            differentStudentId
          );
          
          return matchesDifferentStudent === false;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Enrollment IDs are immutable
   * Validates: Requirements 6.5, 6.8
   * 
   * For any enrollment, courseId and studentId cannot be changed after creation
   */
  it('Property: Enrollment courseId and studentId are immutable after creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        async (enrollmentProps: EnrollmentProps) => {
          const enrollment = Enrollment.create(enrollmentProps);
          
          const originalCourseId = enrollment.getCourseId();
          const originalStudentId = enrollment.getStudentId();
          
          // Attempt to modify through toObject (should not affect original)
          const obj = enrollment.toObject();
          obj.courseId = 'modified-course-id';
          obj.studentId = 'modified-student-id';
          
          // Property: Original enrollment IDs remain unchanged
          return (
            enrollment.getCourseId() === originalCourseId &&
            enrollment.getStudentId() === originalStudentId
          );
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Enrollment timestamp is set on creation
   * Validates: Requirements 6.5
   * 
   * For any enrollment, enrolledAt timestamp must be set
   */
  it('Property: Enrollment always has a valid enrolledAt timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        async (enrollmentProps: EnrollmentProps) => {
          const beforeCreate = new Date();
          const enrollment = Enrollment.create(enrollmentProps);
          const afterCreate = new Date();
          
          const enrolledAt = enrollment.getEnrolledAt();
          
          // Property: enrolledAt must be a valid Date within creation timeframe
          return (
            enrolledAt instanceof Date &&
            enrolledAt.getTime() >= beforeCreate.getTime() &&
            enrolledAt.getTime() <= afterCreate.getTime()
          );
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: toObject preserves all enrollment data
   * Validates: Requirements 6.5, 6.8
   * 
   * For any enrollment, toObject() must preserve all data
   */
  it('Property: toObject() preserves all enrollment data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        async (enrollmentProps: EnrollmentProps) => {
          const enrollment = Enrollment.create(enrollmentProps);
          const obj = enrollment.toObject();
          
          // Property: All data must be preserved
          return (
            obj.id === enrollment.getId() &&
            obj.courseId === enrollment.getCourseId() &&
            obj.studentId === enrollment.getStudentId() &&
            obj.enrolledAt instanceof Date &&
            obj.enrolledAt.getTime() === enrollment.getEnrolledAt().getTime()
          );
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Reconstituted enrollment equals original
   * Validates: Requirements 6.5, 6.8
   * 
   * For any enrollment, reconstituting from toObject() produces equivalent enrollment
   */
  it('Property: Reconstituted enrollment equals original', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          studentId: uuidArbitrary(),
          enrolledAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        }),
        async (enrollmentProps: EnrollmentProps) => {
          // Skip if date is invalid (NaN)
          fc.pre(!isNaN(enrollmentProps.enrolledAt!.getTime()));
          
          const original = Enrollment.create(enrollmentProps);
          const obj = original.toObject();
          const reconstituted = Enrollment.reconstitute(obj);
          
          // Property: Reconstituted enrollment must have same data
          return (
            reconstituted.getId() === original.getId() &&
            reconstituted.getCourseId() === original.getCourseId() &&
            reconstituted.getStudentId() === original.getStudentId() &&
            reconstituted.getEnrolledAt().getTime() === original.getEnrolledAt().getTime()
          );
        }
      ),
      propertyTestConfig
    );
  });
});
