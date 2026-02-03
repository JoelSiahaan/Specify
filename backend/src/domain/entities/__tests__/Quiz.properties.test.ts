/**
 * Quiz Entity Property-Based Tests
 * 
 * Property-based tests for Quiz domain entity using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 11.6: Quiz editing only allowed before due date
 * - 11.7: Quiz editing only allowed before any submissions
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time
 * - 12.4: Auto-submit when time expires
 * - 12.5: Accept submission before time limit
 * - 12.6: Prevent access after due date
 * - 12.7: Prevent multiple submissions
 */

import * as fc from 'fast-check';
import { Quiz, QuestionType } from '../Quiz.js';
import { QuizSubmission, QuizSubmissionStatus } from '../QuizSubmission.js';
import { 
  uuidArbitrary,
  futureDateArbitrary,
  timeLimitArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils.js';

/**
 * Generator for valid quiz titles
 */
const quizTitleArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid quiz descriptions
 */
const quizDescriptionArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid MCQ questions
 */
const mcqQuestionArbitrary = () =>
  fc.array(
    fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    { minLength: 2, maxLength: 6 }
  ).chain(options => 
    fc.record({
      type: fc.constant(QuestionType.MCQ),
      questionText: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
      options: fc.constant(options),
      correctAnswer: fc.integer({ min: 0, max: options.length - 1 })
    })
  );

/**
 * Generator for valid Essay questions
 */
const essayQuestionArbitrary = () =>
  fc.record({
    type: fc.constant(QuestionType.ESSAY),
    questionText: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
  });

/**
 * Generator for valid questions (MCQ or Essay)
 */
const questionArbitrary = () =>
  fc.oneof(mcqQuestionArbitrary(), essayQuestionArbitrary());

/**
 * Generator for valid questions array (at least 1 question)
 */
const questionsArrayArbitrary = () =>
  fc.array(questionArbitrary(), { minLength: 1, maxLength: 10 });

describe('Quiz Entity Properties', () => {
  /**
   * Property 4: Quiz editing restrictions
   * Feature: core-lms, Property 4: Quiz editing restrictions
   * Validates: Requirements 11.6, 11.7
   * 
   * For any quiz, editing is only allowed before due date AND before any submissions
   * 
   * This property tests:
   * 1. Quiz before due date with no submissions → canEdit() returns true
   * 2. Quiz after due date → canEdit() returns false (tested via timing)
   * 3. Quiz with submissions (even before due date) → canEdit() returns false
   * 4. Update methods respect canEdit() rules
   */
  it('Property 4: For any quiz, editing is only allowed before due date AND before any submissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: quizTitleArbitrary(),
          description: quizDescriptionArbitrary(),
          timeLimit: timeLimitArbitrary(),
          questions: questionsArrayArbitrary(),
        }),
        async (baseQuizData) => {
          // Test 1: Quiz before due date with no submissions → canEdit() returns true
          const quiz1 = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 10000), // 10 seconds in future
          });
          
          if (!quiz1.canEdit(false)) {
            // Should be editable: before due date AND no submissions
            return false;
          }
          
          // Test 2: Quiz after due date → canEdit() returns false
          // Create a quiz with a very short due date
          const almostDueQuiz = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 100), // 100ms in future
          });
          
          // Wait for due date to pass
          await new Promise(resolve => setTimeout(resolve, 150));
          
          if (almostDueQuiz.canEdit(false)) {
            // Should NOT be editable: past due date
            return false;
          }
          
          if (!almostDueQuiz.isPastDueDate()) {
            // Should be past due date now
            return false;
          }
          
          // Test 3: Quiz with submissions (even before due date) → canEdit() returns false
          const quiz3 = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 10000), // 10 seconds in future
          });
          
          if (quiz3.canEdit(true)) {
            // Should NOT be editable: has submissions
            return false;
          }
          
          // Test 4: Update methods respect canEdit() rules
          const quiz4 = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 10000), // 10 seconds in future
          });
          
          // Before due date, no submissions → updates should succeed
          try {
            quiz4.updateTitle('New Title', false);
            if (quiz4.getTitle() !== 'New Title') {
              return false;
            }
          } catch (error) {
            // Should not throw for editable quiz
            return false;
          }
          
          // After due date → updates should fail
          const almostDueQuiz2 = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 100), // 100ms in future
          });
          
          // Wait for due date to pass
          await new Promise(resolve => setTimeout(resolve, 150));
          
          try {
            almostDueQuiz2.updateTitle('New Title', false);
            // Should not reach here - updating past due date should throw
            return false;
          } catch (error) {
            // Expected: Cannot update after due date
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              return false;
            }
          }
          
          // With submissions → updates should fail
          const quiz5 = Quiz.create({
            ...baseQuizData,
            dueDate: new Date(Date.now() + 10000), // 10 seconds in future
          });
          
          try {
            quiz5.updateTitle('New Title', true);
            // Should not reach here - updating with submissions should throw
            return false;
          } catch (error) {
            // Expected: Cannot update with submissions
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              return false;
            }
          }
          
          // All editing restriction rules validated
          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 } // Reduced iterations due to async delays
    );
  }, 60000); // 60 second Jest timeout

  /**
   * Property: All update methods respect editing restrictions consistently
   * Validates: Requirements 11.6, 11.7
   * 
   * For any quiz, all update methods (updateTitle, updateDescription, updateDueDate,
   * updateTimeLimit, updateQuestions) must consistently respect the same editing rules
   */
  it('Property: All update methods respect editing restrictions consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: quizTitleArbitrary(),
          description: quizDescriptionArbitrary(),
          dueDate: futureDateArbitrary(),
          timeLimit: timeLimitArbitrary(),
          questions: questionsArrayArbitrary(),
        }),
        quizTitleArbitrary(),
        quizDescriptionArbitrary(),
        futureDateArbitrary(),
        timeLimitArbitrary(),
        questionsArrayArbitrary(),
        async (quizData, newTitle, newDescription, newDueDate, newTimeLimit, newQuestions) => {
          // Test with no submissions (should succeed)
          const editableQuiz = Quiz.create(quizData);
          
          try {
            editableQuiz.updateTitle(newTitle, false);
            if (editableQuiz.getTitle() !== newTitle) {
              return false;
            }
          } catch (error) {
            // Should not throw for editable quiz
            return false;
          }
          
          const editableQuiz2 = Quiz.create(quizData);
          try {
            editableQuiz2.updateDescription(newDescription, false);
            if (editableQuiz2.getDescription() !== newDescription) {
              return false;
            }
          } catch (error) {
            return false;
          }
          
          const editableQuiz3 = Quiz.create(quizData);
          try {
            editableQuiz3.updateDueDate(newDueDate, false);
            if (editableQuiz3.getDueDate().getTime() !== newDueDate.getTime()) {
              return false;
            }
          } catch (error) {
            return false;
          }
          
          const editableQuiz4 = Quiz.create(quizData);
          try {
            editableQuiz4.updateTimeLimit(newTimeLimit, false);
            if (editableQuiz4.getTimeLimit() !== newTimeLimit) {
              return false;
            }
          } catch (error) {
            return false;
          }
          
          const editableQuiz5 = Quiz.create(quizData);
          try {
            editableQuiz5.updateQuestions(newQuestions, false);
            if (editableQuiz5.getQuestions().length !== newQuestions.length) {
              return false;
            }
          } catch (error) {
            return false;
          }
          
          // Test with submissions (should fail for all methods)
          const quizWithSubmissions = Quiz.create(quizData);
          
          let allMethodsFailWithSubmissions = true;
          
          try {
            quizWithSubmissions.updateTitle(newTitle, true);
            allMethodsFailWithSubmissions = false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              allMethodsFailWithSubmissions = false;
            }
          }
          
          const quizWithSubmissions2 = Quiz.create(quizData);
          try {
            quizWithSubmissions2.updateDescription(newDescription, true);
            allMethodsFailWithSubmissions = false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              allMethodsFailWithSubmissions = false;
            }
          }
          
          const quizWithSubmissions3 = Quiz.create(quizData);
          try {
            quizWithSubmissions3.updateDueDate(newDueDate, true);
            allMethodsFailWithSubmissions = false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              allMethodsFailWithSubmissions = false;
            }
          }
          
          const quizWithSubmissions4 = Quiz.create(quizData);
          try {
            quizWithSubmissions4.updateTimeLimit(newTimeLimit, true);
            allMethodsFailWithSubmissions = false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              allMethodsFailWithSubmissions = false;
            }
          }
          
          const quizWithSubmissions5 = Quiz.create(quizData);
          try {
            quizWithSubmissions5.updateQuestions(newQuestions, true);
            allMethodsFailWithSubmissions = false;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('Cannot update quiz')) {
              allMethodsFailWithSubmissions = false;
            }
          }
          
          return allMethodsFailWithSubmissions;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: canEdit() method is consistent with update method behavior
   * Validates: Requirements 11.6, 11.7
   * 
   * For any quiz, if canEdit(hasSubmissions) returns true, then all update methods
   * should succeed. If canEdit() returns false, all update methods should fail.
   */
  it('Property: canEdit() method is consistent with update method behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: quizTitleArbitrary(),
          description: quizDescriptionArbitrary(),
          dueDate: futureDateArbitrary(),
          timeLimit: timeLimitArbitrary(),
          questions: questionsArrayArbitrary(),
        }),
        fc.boolean(), // hasSubmissions
        quizTitleArbitrary(),
        async (quizData, hasSubmissions, newTitle) => {
          const quiz = Quiz.create(quizData);
          const canEdit = quiz.canEdit(hasSubmissions);
          
          let updateSucceeded = false;
          let updateFailed = false;
          
          try {
            quiz.updateTitle(newTitle, hasSubmissions);
            updateSucceeded = true;
          } catch (error) {
            updateFailed = true;
          }
          
          // Consistency check: canEdit() and update behavior must match
          if (canEdit && !updateSucceeded) {
            // canEdit() says yes, but update failed
            return false;
          }
          
          if (!canEdit && !updateFailed) {
            // canEdit() says no, but update succeeded
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: isPastDueDate() is consistent with canEdit() behavior
   * Validates: Requirements 11.6
   * 
   * For any quiz, if isPastDueDate() returns true, then canEdit() must return false
   * (regardless of submission status)
   */
  it('Property: isPastDueDate() is consistent with canEdit() behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          courseId: uuidArbitrary(),
          title: quizTitleArbitrary(),
          description: quizDescriptionArbitrary(),
          dueDate: futureDateArbitrary(),
          timeLimit: timeLimitArbitrary(),
          questions: questionsArrayArbitrary(),
        }),
        fc.boolean(), // hasSubmissions
        async (quizData, hasSubmissions) => {
          const quiz = Quiz.create(quizData);
          const isPastDue = quiz.isPastDueDate();
          const canEdit = quiz.canEdit(hasSubmissions);
          
          // If past due date, canEdit must be false
          if (isPastDue && canEdit) {
            return false;
          }
          
          // If not past due date and no submissions, canEdit must be true
          if (!isPastDue && !hasSubmissions && !canEdit) {
            return false;
          }
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 6: Quiz timer enforcement
   * Feature: core-lms, Property 6: Quiz timer enforcement
   * Validates: Requirements 12.2, 12.3, 12.4, 12.5
   * 
   * For any quiz submission, time limit is enforced and auto-submit occurs on timeout
   * 
   * This property tests:
   * 1. Quiz can be started before due date
   * 2. Remaining time decreases as time passes
   * 3. Time expiration is detected correctly
   * 4. Auto-submit works when time expires
   * 5. Manual submit works before time expires
   */
  it('Property 6: For any quiz submission, time limit is enforced and auto-submit occurs on timeout', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          quizId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        fc.integer({ min: 1, max: 5 }), // Short time limit for testing (1-5 minutes)
        async (submissionData, timeLimitMinutes) => {
          const quizDueDate = new Date(Date.now() + 60000); // 1 minute in future
          
          // Test 1: Quiz can be started before due date
          const submission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          
          try {
            submission.start(quizDueDate);
          } catch (error) {
            // Should not throw when starting before due date
            return false;
          }
          
          if (submission.getStatus() !== QuizSubmissionStatus.IN_PROGRESS) {
            return false;
          }
          
          if (!submission.getStartedAt()) {
            return false;
          }
          
          // Test 2: Remaining time is calculated correctly
          const initialRemainingTime = submission.getRemainingTimeSeconds(timeLimitMinutes);
          const expectedInitialTime = timeLimitMinutes * 60;
          
          // Allow 2 second tolerance for test execution time
          if (Math.abs(initialRemainingTime - expectedInitialTime) > 2) {
            return false;
          }
          
          // Test 3: Time expiration detection (short timeout for testing)
          const shortTimeSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          shortTimeSubmission.start(quizDueDate);
          
          // Wait for time to pass (use very short time limit)
          const veryShortTimeLimit = 0.01; // 0.6 seconds
          await new Promise(resolve => setTimeout(resolve, 700)); // Wait 700ms
          
          if (!shortTimeSubmission.isTimeExpired(veryShortTimeLimit)) {
            // Should be expired after waiting
            return false;
          }
          
          // Test 4: Auto-submit works when time expires
          try {
            shortTimeSubmission.autoSubmit(veryShortTimeLimit);
          } catch (error) {
            // Should not throw when auto-submitting after time expires
            return false;
          }
          
          if (shortTimeSubmission.getStatus() !== QuizSubmissionStatus.SUBMITTED) {
            return false;
          }
          
          if (!shortTimeSubmission.getSubmittedAt()) {
            return false;
          }
          
          // Test 5: Manual submit works before time expires
          const manualSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          manualSubmission.start(quizDueDate);
          
          // Submit immediately (before time expires)
          try {
            manualSubmission.submit([], timeLimitMinutes, false);
          } catch (error) {
            // Should not throw when submitting before time expires
            return false;
          }
          
          if (manualSubmission.getStatus() !== QuizSubmissionStatus.SUBMITTED) {
            return false;
          }
          
          // All timer enforcement rules validated
          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 } // Reduced iterations due to async delays
    );
  }, 60000); // 60 second Jest timeout

  /**
   * Property 20: Quiz submission deadline
   * Feature: core-lms, Property 20: Quiz submission deadline
   * Validates: Requirements 12.6, 12.7, 12.8
   * 
   * For any quiz, submissions are only allowed before due date and only once per student
   * 
   * This property tests:
   * 1. Cannot start quiz after due date
   * 2. Cannot submit after time expires (without auto-submit flag)
   * 3. Cannot start quiz twice (prevent multiple submissions)
   * 4. Cannot submit quiz that is not in progress
   */
  it('Property 20: For any quiz, submissions are only allowed before due date and only once per student', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          quizId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        fc.integer({ min: 1, max: 10 }), // Time limit in minutes
        async (submissionData, timeLimitMinutes) => {
          // Test 1: Cannot start quiz after due date
          const pastDueDate = new Date(Date.now() - 1000); // 1 second in past
          const pastDueSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          
          try {
            pastDueSubmission.start(pastDueDate);
            // Should not reach here - starting after due date should throw
            return false;
          } catch (error) {
            // Expected: Cannot start after due date
            if (!(error instanceof Error) || !error.message.includes('Cannot start quiz after due date')) {
              return false;
            }
          }
          
          // Test 2: Cannot submit after time expires (without auto-submit flag)
          const futureDueDate = new Date(Date.now() + 60000); // 1 minute in future
          const expiredSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          expiredSubmission.start(futureDueDate);
          
          // Wait for time to expire
          const veryShortTimeLimit = 0.01; // 0.6 seconds
          await new Promise(resolve => setTimeout(resolve, 700)); // Wait 700ms
          
          try {
            expiredSubmission.submit([], veryShortTimeLimit, false);
            // Should not reach here - submitting after time expires should throw
            return false;
          } catch (error) {
            // Expected: Quiz time has expired
            if (!(error instanceof Error) || !error.message.includes('Quiz time has expired')) {
              return false;
            }
          }
          
          // Test 3: Cannot start quiz twice (prevent multiple submissions)
          const multipleStartSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          multipleStartSubmission.start(futureDueDate);
          
          try {
            multipleStartSubmission.start(futureDueDate);
            // Should not reach here - starting twice should throw
            return false;
          } catch (error) {
            // Expected: Quiz has already been started
            if (!(error instanceof Error) || !error.message.includes('Quiz has already been started')) {
              return false;
            }
          }
          
          // Test 4: Cannot submit quiz that is not in progress
          const notStartedSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          
          try {
            notStartedSubmission.submit([], timeLimitMinutes, false);
            // Should not reach here - submitting without starting should throw
            return false;
          } catch (error) {
            // Expected: Quiz must be in progress to submit
            if (!(error instanceof Error) || !error.message.includes('Quiz must be in progress')) {
              return false;
            }
          }
          
          // All submission deadline rules validated
          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 } // Reduced iterations due to async delays
    );
  }, 60000); // 60 second Jest timeout

  /**
   * Property: Remaining time never goes negative
   * Validates: Requirements 12.3
   * 
   * For any quiz submission, getRemainingTimeSeconds() must always return >= 0
   */
  it('Property: Remaining time never goes negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          quizId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        fc.integer({ min: 1, max: 5 }), // Short time limit for testing
        async (submissionData, timeLimitMinutes) => {
          const quizDueDate = new Date(Date.now() + 60000); // 1 minute in future
          const submission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          submission.start(quizDueDate);
          
          // Wait for time to expire
          const veryShortTimeLimit = 0.01; // 0.6 seconds
          await new Promise(resolve => setTimeout(resolve, 700)); // Wait 700ms
          
          const remainingTime = submission.getRemainingTimeSeconds(veryShortTimeLimit);
          
          // Remaining time should be 0 (not negative) when expired
          if (remainingTime < 0) {
            return false;
          }
          
          if (remainingTime !== 0) {
            // Should be exactly 0 when expired
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 60000);

  /**
   * Property: Auto-submit only works when time is expired
   * Validates: Requirements 12.4
   * 
   * For any quiz submission, autoSubmit() should only succeed when time has expired
   */
  it('Property: Auto-submit only works when time is expired', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          quizId: uuidArbitrary(),
          studentId: uuidArbitrary(),
        }),
        fc.integer({ min: 5, max: 10 }), // Longer time limit
        async (submissionData, timeLimitMinutes) => {
          const quizDueDate = new Date(Date.now() + 60000); // 1 minute in future
          const submission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          submission.start(quizDueDate);
          
          // Try to auto-submit before time expires (should fail)
          try {
            submission.autoSubmit(timeLimitMinutes);
            // Should not reach here - auto-submit before expiry should throw
            return false;
          } catch (error) {
            // Expected: Cannot auto-submit before time expires
            if (!(error instanceof Error) || !error.message.includes('Cannot auto-submit before time expires')) {
              return false;
            }
          }
          
          // Now test with expired time
          const expiredSubmission = QuizSubmission.create(submissionData.quizId, submissionData.studentId);
          expiredSubmission.start(quizDueDate);
          
          // Wait for time to expire
          const veryShortTimeLimit = 0.01; // 0.6 seconds
          await new Promise(resolve => setTimeout(resolve, 700)); // Wait 700ms
          
          // Auto-submit should succeed now
          try {
            expiredSubmission.autoSubmit(veryShortTimeLimit);
          } catch (error) {
            // Should not throw when time is expired
            return false;
          }
          
          if (expiredSubmission.getStatus() !== QuizSubmissionStatus.SUBMITTED) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 60000);
});
