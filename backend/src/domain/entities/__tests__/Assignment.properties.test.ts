/**
 * Assignment Entity Property-Based Tests
 * 
 * Property-based tests for Assignment domain entity using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 10.9: Reject submissions after grading starts
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 */

import * as fc from 'fast-check';
import { Assignment, SubmissionType, type AssignmentProps } from '../Assignment.js';
import { 
  uuidArbitrary,
  futureDateArbitrary,
  submissionTypeArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils.js';

describe('Assignment Entity Properties', () => {
  /**
   * Property 3: Grading lock prevents submissions
   * Feature: core-lms, Property 3: Grading lock prevents submissions
   * Validates: Requirements 10.9, 13.1
   * 
   * For any assignment, once grading starts, submissions cannot be accepted
   * 
   * This property tests:
   * 1. Before grading starts, assignment can accept submissions
   * 2. After grading starts, assignment cannot accept submissions
   * 3. Starting grading is irreversible (cannot undo grading lock)
   * 4. Grading lock prevents all update operations
   */
  it('Property 3: For any assignment, once grading starts, submissions cannot be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          dueDate: futureDateArbitrary(),
          submissionType: submissionTypeArbitrary(),
          acceptedFileFormats: fc.array(fc.constantFrom('pdf', 'docx', 'jpg', 'png'), { minLength: 0, maxLength: 4 }),
        }),
        async (assignmentData) => {
          // Test 1: Before grading starts, assignment can accept submissions
          const assignment = Assignment.create({
            ...assignmentData,
            gradingStarted: false,
          });
          
          // Assignment should accept submissions before grading
          if (!assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Grading should not have started
          if (assignment.hasGradingStarted()) {
            return false;
          }
          
          // Test 2: After grading starts, assignment cannot accept submissions
          assignment.startGrading();
          
          // Assignment should not accept submissions after grading
          if (assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Grading should have started
          if (!assignment.hasGradingStarted()) {
            return false;
          }
          
          // Test 3: Starting grading is irreversible (cannot undo grading lock)
          try {
            assignment.startGrading();
            // Should not reach here - starting grading twice should throw
            return false;
          } catch (error) {
            // Expected: Cannot start grading if already started
            if (!(error instanceof Error) || !error.message.includes('already started')) {
              return false;
            }
          }
          
          // Test 4: Grading lock prevents all update operations
          const newTitle = 'Updated Title';
          const newDescription = 'Updated Description';
          const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
          
          // Try to update title after grading started
          try {
            assignment.updateTitle(newTitle);
            // Should not reach here - updating after grading should throw
            return false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('after grading has started')) {
              return false;
            }
          }
          
          // Try to update description after grading started
          try {
            assignment.updateDescription(newDescription);
            // Should not reach here - updating after grading should throw
            return false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('after grading has started')) {
              return false;
            }
          }
          
          // Try to update due date after grading started
          try {
            assignment.updateDueDate(newDueDate);
            // Should not reach here - updating after grading should throw
            return false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('after grading has started')) {
              return false;
            }
          }
          
          // All grading lock rules validated
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Grading lock is consistent across all submission types
   * Validates: Requirements 10.9, 13.1
   * 
   * For any assignment with any submission type (FILE, TEXT, BOTH),
   * the grading lock behavior is consistent
   */
  it('Property: Grading lock works consistently for all submission types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          dueDate: futureDateArbitrary(),
          submissionType: submissionTypeArbitrary(),
        }),
        async (assignmentData) => {
          const assignment = Assignment.create({
            ...assignmentData,
            gradingStarted: false,
          });
          
          // Before grading: can accept submissions regardless of submission type
          if (!assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Start grading
          assignment.startGrading();
          
          // After grading: cannot accept submissions regardless of submission type
          if (assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Submission type should not affect grading lock behavior
          const submissionType = assignment.getSubmissionType();
          const hasGradingStarted = assignment.hasGradingStarted();
          
          // All submission types should have grading started
          if (!hasGradingStarted) {
            return false;
          }
          
          // Verify submission type is one of the valid types
          if (![SubmissionType.FILE, SubmissionType.TEXT, SubmissionType.BOTH].includes(submissionType)) {
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Grading lock is independent of due date
   * Validates: Requirements 10.9, 13.1
   * 
   * For any assignment, grading lock prevents submissions regardless of
   * whether the due date has passed or not
   */
  it('Property: Grading lock prevents submissions regardless of due date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          dueDate: futureDateArbitrary(),
          submissionType: submissionTypeArbitrary(),
        }),
        async (assignmentData) => {
          const assignment = Assignment.create({
            ...assignmentData,
            gradingStarted: false,
          });
          
          // Check if submission would be late (due date passed)
          const isLate = assignment.isSubmissionLate();
          
          // Before grading: can accept submissions (even if late)
          if (!assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Start grading
          assignment.startGrading();
          
          // After grading: cannot accept submissions (regardless of late status)
          if (assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Late status should not affect grading lock
          // (grading lock is independent of due date)
          const stillLate = assignment.isSubmissionLate();
          if (isLate !== stillLate) {
            // Late status should not change when starting grading
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Grading lock state is persistent
   * Validates: Requirements 10.9, 13.1
   * 
   * For any assignment, once grading starts, the lock state persists
   * and cannot be changed through any operation
   */
  it('Property: Grading lock state is persistent and immutable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          dueDate: futureDateArbitrary(),
          submissionType: submissionTypeArbitrary(),
        }),
        async (assignmentData) => {
          const assignment = Assignment.create({
            ...assignmentData,
            gradingStarted: false,
          });
          
          // Start grading
          assignment.startGrading();
          
          // Verify grading started
          if (!assignment.hasGradingStarted()) {
            return false;
          }
          
          // Try multiple operations that should not affect grading lock
          const operations = [
            () => assignment.canAcceptSubmissions(),
            () => assignment.isSubmissionLate(),
            () => assignment.isPastDueDate(),
            () => assignment.hasGradingStarted(),
            () => assignment.getGradingStarted(),
          ];
          
          // Execute all operations
          for (const operation of operations) {
            operation();
          }
          
          // Grading lock should still be active after all operations
          if (!assignment.hasGradingStarted()) {
            return false;
          }
          
          if (assignment.canAcceptSubmissions()) {
            return false;
          }
          
          // Convert to object and verify grading started is true
          const obj = assignment.toObject();
          if (!obj.gradingStarted) {
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 17: Due date validation
   * Feature: core-lms, Property 17: Due date validation
   * Validates: Requirements 9.2
   * 
   * For any assignment, the due date must be in the future when created
   * 
   * This property tests:
   * 1. Creating assignment with future due date succeeds
   * 2. Creating assignment with past due date fails
   * 3. Creating assignment with current time (now) fails
   * 4. Updating due date to future value succeeds (before original due date)
   * 5. Updating due date to past value fails
   */
  it('Property 17: For any assignment, the due date must be in the future when created', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          submissionType: submissionTypeArbitrary(),
        }),
        fc.uuid(), // Additional UUID for test 2
        fc.uuid(), // Additional UUID for test 3
        async (assignmentData, testId2, testId3) => {
          // Test 1: Creating assignment with future due date succeeds
          // Use a far future date to avoid timing issues (30 days from now)
          const futureDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          
          let assignment: Assignment;
          try {
            assignment = Assignment.create({
              ...assignmentData,
              dueDate: futureDueDate,
              gradingStarted: false,
            });
          } catch (error) {
            // Should not throw for future due date
            return false;
          }
          
          // Verify assignment was created with correct due date
          const createdDueDate = assignment.getDueDate();
          if (Math.abs(createdDueDate.getTime() - futureDueDate.getTime()) > 1000) {
            // Allow 1 second tolerance for timing
            return false;
          }
          
          // Test 2: Creating assignment with past due date fails
          const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
          
          try {
            Assignment.create({
              ...assignmentData,
              id: testId2, // Different ID
              dueDate: pastDueDate,
              gradingStarted: false,
            });
            // Should not reach here - past due date should throw
            return false;
          } catch (error) {
            // Expected: Due date must be in the future
            if (!(error instanceof Error) || !error.message.includes('must be in the future')) {
              return false;
            }
          }
          
          // Test 3: Creating assignment with current time (now) fails
          const nowDueDate = new Date();
          
          try {
            Assignment.create({
              ...assignmentData,
              id: testId3, // Different ID
              dueDate: nowDueDate,
              gradingStarted: false,
            });
            // Should not reach here - current time should throw
            return false;
          } catch (error) {
            // Expected: Due date must be in the future
            if (!(error instanceof Error) || !error.message.includes('must be in the future')) {
              return false;
            }
          }
          
          // Test 4: Updating due date to future value succeeds (before original due date)
          // Use an even further future date (60 days from now)
          const newFutureDueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
          
          try {
            assignment.updateDueDate(newFutureDueDate);
          } catch (error) {
            // Should not throw for future due date
            return false;
          }
          
          // Verify due date was updated
          const updatedDueDate = assignment.getDueDate();
          if (Math.abs(updatedDueDate.getTime() - newFutureDueDate.getTime()) > 1000) {
            // Allow 1 second tolerance for timing
            return false;
          }
          
          // Test 5: Updating due date to past value fails
          const newPastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
          
          try {
            assignment.updateDueDate(newPastDueDate);
            // Should not reach here - past due date should throw
            return false;
          } catch (error) {
            // Expected: Due date must be in the future
            if (!(error instanceof Error) || !error.message.includes('must be in the future')) {
              return false;
            }
          }
          
          // All due date validation rules validated
          return true;
        }
      ),
      propertyTestConfig
    );
  });
});
