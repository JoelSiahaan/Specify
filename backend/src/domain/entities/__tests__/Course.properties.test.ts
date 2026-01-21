/**
 * Course Entity Property-Based Tests
 * 
 * Property-based tests for Course domain entity using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 5.4: Course archiving (prevents new enrollments, closes assignments/quizzes)
 * - 5.6: Course deletion (only archived courses can be deleted)
 * - 5.7: Cascade deletion of related data
 */

import * as fc from 'fast-check';
import { Course, CourseStatus, type CourseProps } from '../Course';
import { 
  courseNameArbitrary,
  courseDescriptionArbitrary,
  courseCodeArbitrary,
  uuidArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils';

describe('Course Entity Properties', () => {
  /**
   * Property 2: Course state transitions
   * Feature: core-lms, Property 2: Course state transitions
   * Validates: Requirements 5.4, 5.6, 5.7
   * 
   * For any course, Active → Archived → Deleted is the only valid transition path
   * 
   * This property tests:
   * 1. Active courses can be archived
   * 2. Archived courses cannot be archived again
   * 3. Active courses cannot be deleted (must be archived first)
   * 4. Archived courses can be deleted
   */
  it('Property 2: For any course, Active → Archived → Deleted is the only valid transition path', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          name: courseNameArbitrary(),
          description: courseDescriptionArbitrary(),
          courseCode: courseCodeArbitrary(),
          teacherId: uuidArbitrary(),
        }),
        async (courseData) => {
          // Test 1: Active → Archived transition is valid
          const activeCourse = Course.create({
            ...courseData,
            status: CourseStatus.ACTIVE,
          });
          
          // Active course should be active
          if (!activeCourse.isActive() || activeCourse.isArchived()) {
            return false;
          }
          
          // Active course can be archived
          activeCourse.archive();
          if (!activeCourse.isArchived() || activeCourse.isActive()) {
            return false;
          }
          
          // Test 2: Archived → Archived transition is invalid
          const archivedCourse = Course.create({
            ...courseData,
            status: CourseStatus.ARCHIVED,
          });
          
          try {
            archivedCourse.archive();
            // Should not reach here - archiving archived course should throw
            return false;
          } catch (error) {
            // Expected: Cannot archive already archived course
            if (!(error instanceof Error) || !error.message.includes('already archived')) {
              return false;
            }
          }
          
          // Test 3: Active → Deleted transition is invalid (must archive first)
          const activeCourseForDeletion = Course.create({
            ...courseData,
            status: CourseStatus.ACTIVE,
          });
          
          try {
            activeCourseForDeletion.validateCanDelete();
            // Should not reach here - deleting active course should throw
            return false;
          } catch (error) {
            // Expected: Cannot delete active course
            if (!(error instanceof Error) || !error.message.includes('Archive the course first')) {
              return false;
            }
          }
          
          // Test 4: Archived → Deleted transition is valid
          const archivedCourseForDeletion = Course.create({
            ...courseData,
            status: CourseStatus.ARCHIVED,
          });
          
          try {
            archivedCourseForDeletion.validateCanDelete();
            // Should not throw - archived courses can be deleted
          } catch (error) {
            // Should not throw error for archived course
            return false;
          }
          
          // All state transition rules validated
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Archive operation is idempotent in effect
   * Validates: Requirements 5.4
   * 
   * For any active course, archiving it once produces the same final state
   * as attempting to archive it multiple times (though subsequent attempts throw errors)
   */
  it('Property: Archive operation produces consistent final state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          name: courseNameArbitrary(),
          description: courseDescriptionArbitrary(),
          courseCode: courseCodeArbitrary(),
          teacherId: uuidArbitrary(),
        }),
        async (courseData) => {
          // Create two identical active courses
          const course1 = Course.create({
            ...courseData,
            status: CourseStatus.ACTIVE,
          });
          
          const course2 = Course.create({
            ...courseData,
            status: CourseStatus.ACTIVE,
          });
          
          // Archive first course once
          course1.archive();
          
          // Archive second course once (same as first)
          course2.archive();
          
          // Both should be in ARCHIVED state
          if (!course1.isArchived() || !course2.isArchived()) {
            return false;
          }
          
          // Both should have same status
          if (course1.getStatus() !== course2.getStatus()) {
            return false;
          }
          
          // Attempting to archive again should fail for both
          let course1ThrowsOnSecondArchive = false;
          let course2ThrowsOnSecondArchive = false;
          
          try {
            course1.archive();
          } catch (error) {
            course1ThrowsOnSecondArchive = error instanceof Error && 
              error.message.includes('already archived');
          }
          
          try {
            course2.archive();
          } catch (error) {
            course2ThrowsOnSecondArchive = error instanceof Error && 
              error.message.includes('already archived');
          }
          
          // Both should throw on second archive attempt
          return course1ThrowsOnSecondArchive && course2ThrowsOnSecondArchive;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: State transition validation is consistent
   * Validates: Requirements 5.4, 5.6
   * 
   * For any course, the validation methods (isActive, isArchived, validateCanDelete)
   * must be consistent with the actual status
   */
  it('Property: State validation methods are consistent with course status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          name: courseNameArbitrary(),
          description: courseDescriptionArbitrary(),
          courseCode: courseCodeArbitrary(),
          status: fc.constantFrom(CourseStatus.ACTIVE, CourseStatus.ARCHIVED),
          teacherId: uuidArbitrary(),
        }),
        async (courseData) => {
          const course = Course.create(courseData);
          
          const status = course.getStatus();
          const isActive = course.isActive();
          const isArchived = course.isArchived();
          
          // Property 1: isActive and isArchived are mutually exclusive
          if (isActive === isArchived) {
            return false;
          }
          
          // Property 2: Status matches helper methods
          if (status === CourseStatus.ACTIVE && (!isActive || isArchived)) {
            return false;
          }
          
          if (status === CourseStatus.ARCHIVED && (isActive || !isArchived)) {
            return false;
          }
          
          // Property 3: validateCanDelete consistency
          let canDelete = true;
          try {
            course.validateCanDelete();
          } catch (error) {
            canDelete = false;
          }
          
          // Only archived courses can be deleted
          if (status === CourseStatus.ACTIVE && canDelete) {
            return false;
          }
          
          if (status === CourseStatus.ARCHIVED && !canDelete) {
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Update operations respect course lifecycle
   * Validates: Requirements 5.3, 5.4
   * 
   * For any course, update operations (updateName, updateDescription) are only
   * allowed on ACTIVE courses, not ARCHIVED courses
   */
  it('Property: Update operations only work on ACTIVE courses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          name: courseNameArbitrary(),
          description: courseDescriptionArbitrary(),
          courseCode: courseCodeArbitrary(),
          status: fc.constantFrom(CourseStatus.ACTIVE, CourseStatus.ARCHIVED),
          teacherId: uuidArbitrary(),
        }),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        async (courseData, newName, newDescription) => {
          const course = Course.create(courseData);
          
          // Test updateName
          if (course.isActive()) {
            // Active course: update should succeed
            try {
              course.updateName(newName);
              if (course.getName() !== newName) {
                return false;
              }
            } catch (error) {
              // Should not throw for active course
              return false;
            }
          } else {
            // Archived course: update should fail
            try {
              course.updateName(newName);
              // Should not reach here
              return false;
            } catch (error) {
              if (!(error instanceof Error) || !error.message.includes('Cannot update archived course')) {
                return false;
              }
            }
          }
          
          // Test updateDescription
          const course2 = Course.create(courseData);
          
          if (course2.isActive()) {
            // Active course: update should succeed
            try {
              course2.updateDescription(newDescription);
              if (course2.getDescription() !== newDescription) {
                return false;
              }
            } catch (error) {
              // Should not throw for active course
              return false;
            }
          } else {
            // Archived course: update should fail
            try {
              course2.updateDescription(newDescription);
              // Should not reach here
              return false;
            } catch (error) {
              if (!(error instanceof Error) || !error.message.includes('Cannot update archived course')) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });
});
