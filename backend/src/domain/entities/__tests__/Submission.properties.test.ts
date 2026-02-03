/**
 * AssignmentSubmission Entity Property-Based Tests
 * 
 * Property-based tests for AssignmentSubmission domain entity using fast-check.
 * Tests universal properties that should hold for all valid inputs.
 * 
 * Requirements:
 * - 13.3: Grade validation (0-100 range)
 * - 10.8: Late submission marking
 * - 10.9: Submissions after grading are rejected
 * - 10.11: Resubmissions after grading are rejected
 */

import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { AssignmentSubmission, AssignmentSubmissionStatus, type AssignmentAssignmentSubmissionProps } from '../AssignmentSubmission.js';

describe('AssignmentSubmission Entity - Property-Based Tests', () => {
  /**
   * Property 5: Grade range validation
   * 
   * **Validates: Requirements 13.3**
   * 
   * For any grade value, the system should accept grades in the range 0-100 (inclusive)
   * and reject grades outside this range with a validation error.
   */
  describe('Property 5: Grade range validation', () => {
    it('should accept any valid grade between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.option(fc.string(), { nil: undefined }),
          (grade, feedback) => {
            // Arrange: Create a submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Assign grade
            submission.assignGrade(grade, feedback);

            // Assert: Grade should be stored correctly
            expect(submission.getGrade()).toBe(grade);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.GRADED);
            expect(submission.isGraded()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any grade below 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          (invalidGrade) => {
            // Arrange: Create a submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act & Assert: Should throw error
            expect(() => submission.assignGrade(invalidGrade)).toThrow('Grade must be between 0 and 100');
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
            expect(submission.isGraded()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any grade above 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101 }),
          (invalidGrade) => {
            // Arrange: Create a submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act & Assert: Should throw error
            expect(() => submission.assignGrade(invalidGrade)).toThrow('Grade must be between 0 and 100');
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
            expect(submission.isGraded()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate grade range when creating submission with grade', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (validGrade) => {
            // Arrange & Act: Create submission with valid grade
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.GRADED,
              version: 0,
              grade: validGrade
            };
            const submission = AssignmentSubmission.create(props);

            // Assert: Grade should be stored correctly
            expect(submission.getGrade()).toBe(validGrade);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.GRADED);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid grades when creating submission', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: -1 }),
            fc.integer({ min: 101 })
          ),
          (invalidGrade) => {
            // Arrange & Act & Assert: Should throw error
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.GRADED,
              version: 0,
              grade: invalidGrade
            };

            expect(() => AssignmentSubmission.create(props)).toThrow('Grade must be between 0 and 100');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate grade range when updating grade', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (initialGrade, newGrade) => {
            // Arrange: Create graded submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.GRADED,
              version: 1,
              grade: initialGrade
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Update grade
            submission.updateGrade(newGrade);

            // Assert: New grade should be stored
            expect(submission.getGrade()).toBe(newGrade);
            expect(submission.getVersion()).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Late submission marking
   * 
   * **Validates: Requirements 10.8**
   * 
   * For any submission made after the due date but before grading starts,
   * the submission should be accepted and marked with isLate = true.
   */
  describe('Property 18: Late submission marking', () => {
    it('should mark submission as late when submitted with isLate=true', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isLate) => {
            // Arrange: Create not-submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.NOT_SUBMITTED,
              version: 0
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Submit with late flag
            submission.submit(isLate);

            // Assert: Late flag should match input
            expect(submission.getIsLate()).toBe(isLate);
            expect(submission.isLateSubmission()).toBe(isLate);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
            expect(submission.getSubmittedAt()).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve late flag when resubmitting', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          (initialLate, resubmitLate) => {
            // Arrange: Create submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: initialLate,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Resubmit with new late flag
            submission.resubmit(resubmitLate);

            // Assert: Late flag should be updated to new value
            expect(submission.getIsLate()).toBe(resubmitLate);
            expect(submission.isLateSubmission()).toBe(resubmitLate);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow marking submission as late explicitly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (initialLate) => {
            // Arrange: Create submission with any late status
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: initialLate,
              status: AssignmentSubmissionStatus.NOT_SUBMITTED,
              version: 0
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Mark as late
            submission.markAsLate();

            // Assert: Should always be late after marking
            expect(submission.getIsLate()).toBe(true);
            expect(submission.isLateSubmission()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain late flag through grading process', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: 0, max: 100 }),
          (isLate, grade) => {
            // Arrange: Create submitted submission with late flag
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: isLate,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Grade the submission
            submission.assignGrade(grade);

            // Assert: Late flag should be preserved
            expect(submission.getIsLate()).toBe(isLate);
            expect(submission.isLateSubmission()).toBe(isLate);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.GRADED);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 19: Grading lock prevents submissions
   * 
   * **Validates: Requirements 10.9, 10.11**
   * 
   * For any assignment where grading has started (submission is graded),
   * new submissions and resubmissions should be rejected with an error.
   */
  describe('Property 19: Grading lock prevents submissions', () => {
    it('should prevent resubmission after grading', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (grade, attemptLate) => {
            // Arrange: Create graded submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.GRADED,
              version: 1,
              grade: grade,
              submittedAt: new Date(),
              gradedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act & Assert: Resubmission should be rejected
            expect(() => submission.resubmit(attemptLate)).toThrow('Cannot resubmit after grading has started');
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.GRADED);
            expect(submission.getGrade()).toBe(grade);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent content updates after grading', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.string(), { nil: undefined }),
          (grade, newContent, newFilePath, newFileName) => {
            // Arrange: Create graded submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.GRADED,
              version: 1,
              grade: grade,
              content: 'Original content',
              submittedAt: new Date(),
              gradedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act & Assert: Content update should be rejected
            expect(() => submission.updateContent(newContent, newFilePath, newFileName))
              .toThrow('Cannot update content after grading has started');
            expect(submission.getContent()).toBe('Original content');
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.GRADED);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow resubmission before grading', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          (initialLate, resubmitLate) => {
            // Arrange: Create submitted but not graded submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: initialLate,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Resubmit before grading
            submission.resubmit(resubmitLate);

            // Assert: Resubmission should succeed
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
            expect(submission.getIsLate()).toBe(resubmitLate);
            expect(submission.isGraded()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow content updates before grading', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.string(), { nil: undefined }),
          (newContent, newFilePath, newFileName) => {
            // Arrange: Create submitted but not graded submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.SUBMITTED,
              version: 0,
              content: 'Original content',
              submittedAt: new Date()
            };
            const submission = AssignmentSubmission.create(props);

            // Act: Update content before grading
            submission.updateContent(newContent, newFilePath, newFileName);

            // Assert: Content should be updated
            expect(submission.getContent()).toBe(newContent);
            expect(submission.getFilePath()).toBe(newFilePath);
            expect(submission.getFileName()).toBe(newFileName);
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.SUBMITTED);
            expect(submission.isGraded()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent grading of not-submitted submissions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (grade) => {
            // Arrange: Create not-submitted submission
            const props: AssignmentSubmissionProps = {
              id: randomUUID(),
              assignmentId: randomUUID(),
              studentId: randomUUID(),
              isLate: false,
              status: AssignmentSubmissionStatus.NOT_SUBMITTED,
              version: 0
            };
            const submission = AssignmentSubmission.create(props);

            // Act & Assert: Grading should be rejected
            expect(() => submission.assignGrade(grade)).toThrow('Cannot grade submission that has not been submitted');
            expect(submission.getStatus()).toBe(AssignmentSubmissionStatus.NOT_SUBMITTED);
            expect(submission.isGraded()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
