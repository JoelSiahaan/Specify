/**
 * QuizSubmission Entity Unit Tests
 * 
 * Unit tests for QuizSubmission domain entity.
 * Tests specific examples, edge cases, and business rules.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 12.1: Display quiz info before starting
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time
 * - 12.4: Auto-submit when time expires
 * - 12.5: Accept submission before time limit
 * - 12.6: Prevent access after due date
 * - 12.7: Prevent multiple submissions
 * - 13.3: Validate grade is between 0 and 100
 * - 13.5: Allow teachers to edit grades after saving
 */

import { QuizSubmission, QuizSubmissionStatus, type QuizAnswer } from '../QuizSubmission';

describe('QuizSubmission Entity', () => {
  const quizId = 'quiz-123';
  const studentId = 'student-456';
  const futureDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  const pastDueDate = new Date(Date.now() - 1000); // 1 second ago

  describe('create', () => {
    it('should create a new quiz submission with NOT_STARTED status', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(submission.getId()).toBeDefined();
      expect(submission.getQuizId()).toBe(quizId);
      expect(submission.getStudentId()).toBe(studentId);
      expect(submission.getStatus()).toBe(QuizSubmissionStatus.NOT_STARTED);
      expect(submission.getAnswers()).toEqual([]);
      expect(submission.getStartedAt()).toBeNull();
      expect(submission.getSubmittedAt()).toBeNull();
      expect(submission.getGrade()).toBeNull();
      expect(submission.getVersion()).toBe(1);
    });

    it('should throw error if quizId is empty', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId: '',
          studentId,
          answers: [],
          status: QuizSubmissionStatus.NOT_STARTED,
          version: 1
        });
      }).toThrow('Quiz ID is required');
    });

    it('should throw error if studentId is empty', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId: '',
          answers: [],
          status: QuizSubmissionStatus.NOT_STARTED,
          version: 1
        });
      }).toThrow('Student ID is required');
    });

    it('should throw error if version is not positive integer', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          status: QuizSubmissionStatus.NOT_STARTED,
          version: 0
        });
      }).toThrow('Version must be a positive integer');
    });
  });

  describe('start', () => {
    it('should start quiz and set startedAt timestamp (Requirement 12.2)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      const beforeStart = new Date();

      submission.start(futureDueDate);

      expect(submission.getStatus()).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(submission.getStartedAt()).not.toBeNull();
      expect(submission.getStartedAt()!.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
    });

    it('should prevent starting quiz after due date (Requirement 12.6)', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(() => {
        submission.start(pastDueDate);
      }).toThrow('Cannot start quiz after due date');
    });

    it('should prevent starting quiz multiple times (Requirement 12.7)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      expect(() => {
        submission.start(futureDueDate);
      }).toThrow('Quiz has already been started or submitted');
    });

    it('should prevent starting already submitted quiz (Requirement 12.7)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      expect(() => {
        submission.start(futureDueDate);
      }).toThrow('Quiz has already been started or submitted');
    });
  });

  describe('isTimeExpired', () => {
    it('should return false if quiz not started', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(submission.isTimeExpired(60)).toBe(false);
    });

    it('should return false if time has not expired', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      expect(submission.isTimeExpired(60)).toBe(false);
    });

    it('should return true if time has expired (Requirement 12.4)', async () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      // Wait for time to expire (using very short time limit for testing)
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(submission.isTimeExpired(0.001)).toBe(true); // 0.001 minutes = 0.06 seconds
    });
  });

  describe('getRemainingTimeSeconds', () => {
    it('should return full time limit if quiz not started (Requirement 12.3)', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(submission.getRemainingTimeSeconds(60)).toBe(3600); // 60 minutes = 3600 seconds
    });

    it('should return remaining time in seconds (Requirement 12.3)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      const remainingTime = submission.getRemainingTimeSeconds(60);
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(3600);
    });

    it('should return 0 if time has expired', async () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      // Wait for time to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(submission.getRemainingTimeSeconds(0.001)).toBe(0);
    });
  });

  describe('updateAnswers', () => {
    it('should update answers during quiz (auto-save)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      const answers: QuizAnswer[] = [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 'Essay answer' }
      ];

      submission.updateAnswers(answers);

      expect(submission.getAnswers()).toEqual(answers);
    });

    it('should throw error if quiz is not in progress', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(() => {
        submission.updateAnswers([]);
      }).toThrow('Cannot update answers when quiz is not in progress');
    });
  });

  describe('submit', () => {
    it('should submit quiz before time limit (Requirement 12.5)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      const answers: QuizAnswer[] = [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 'Essay answer' }
      ];

      submission.submit(answers, 60, false);

      expect(submission.getStatus()).toBe(QuizSubmissionStatus.SUBMITTED);
      expect(submission.getAnswers()).toEqual(answers);
      expect(submission.getSubmittedAt()).not.toBeNull();
    });

    it('should throw error if quiz is not in progress', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(() => {
        submission.submit([], 60, false);
      }).toThrow('Quiz must be in progress to submit');
    });

    it('should throw error if time has expired (non-auto-submit)', async () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      // Wait for time to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(() => {
        submission.submit([], 0.001, false);
      }).toThrow('Quiz time has expired');
    });
  });

  describe('autoSubmit', () => {
    it('should auto-submit quiz when time expires (Requirement 12.4)', async () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      // Add some answers before auto-submit
      const answers: QuizAnswer[] = [{ questionIndex: 0, answer: 1 }];
      submission.updateAnswers(answers);

      // Wait for time to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      submission.autoSubmit(0.001);

      expect(submission.getStatus()).toBe(QuizSubmissionStatus.SUBMITTED);
      expect(submission.getSubmittedAt()).not.toBeNull();
      expect(submission.getAnswers()).toEqual(answers);
    });

    it('should throw error if quiz is not in progress', () => {
      const submission = QuizSubmission.create(quizId, studentId);

      expect(() => {
        submission.autoSubmit(60);
      }).toThrow('Quiz must be in progress to auto-submit');
    });

    it('should throw error if time has not expired', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      expect(() => {
        submission.autoSubmit(60);
      }).toThrow('Cannot auto-submit before time expires');
    });
  });

  describe('setGrade', () => {
    it('should grade submitted quiz (Requirement 13.3)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      submission.setGrade(85, 'Good work!');

      expect(submission.getStatus()).toBe(QuizSubmissionStatus.GRADED);
      expect(submission.getGrade()).toBe(85);
      expect(submission.getFeedback()).toBe('Good work!');
      expect(submission.getVersion()).toBe(2); // Version incremented
    });

    it('should validate grade is between 0 and 100 (Requirement 13.3)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      expect(() => {
        submission.setGrade(-1);
      }).toThrow('Grade must be between 0 and 100');

      expect(() => {
        submission.setGrade(101);
      }).toThrow('Grade must be between 0 and 100');
    });

    it('should accept grade of 0', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      submission.setGrade(0);

      expect(submission.getGrade()).toBe(0);
    });

    it('should accept grade of 100', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      submission.setGrade(100);

      expect(submission.getGrade()).toBe(100);
    });

    it('should throw error if submission is not submitted', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      expect(() => {
        submission.setGrade(85);
      }).toThrow('Can only grade submitted submissions');
    });
  });

  describe('updateGrade', () => {
    it('should update grade after initial grading (Requirement 13.5)', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);
      submission.setGrade(85, 'Good work!');

      const initialVersion = submission.getVersion();

      submission.updateGrade(90, 'Excellent work!');

      expect(submission.getGrade()).toBe(90);
      expect(submission.getFeedback()).toBe('Excellent work!');
      expect(submission.getVersion()).toBe(initialVersion + 1); // Version incremented
    });

    it('should validate grade is between 0 and 100', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);
      submission.setGrade(85);

      expect(() => {
        submission.updateGrade(-1);
      }).toThrow('Grade must be between 0 and 100');

      expect(() => {
        submission.updateGrade(101);
      }).toThrow('Grade must be between 0 and 100');
    });

    it('should throw error if submission is not graded', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      expect(() => {
        submission.updateGrade(90);
      }).toThrow('Can only update grade for graded submissions');
    });
  });

  describe('isLate', () => {
    it('should always return false for quiz submissions', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      expect(submission.isLate()).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error if IN_PROGRESS status without startedAt', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          startedAt: null,
          status: QuizSubmissionStatus.IN_PROGRESS,
          version: 1
        });
      }).toThrow('Started date is required for in-progress submissions');
    });

    it('should throw error if SUBMITTED status without submittedAt', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          startedAt: new Date(),
          submittedAt: null,
          status: QuizSubmissionStatus.SUBMITTED,
          version: 1
        });
      }).toThrow('Submitted date is required for submitted submissions');
    });

    it('should throw error if GRADED status without grade', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          startedAt: new Date(),
          submittedAt: new Date(),
          grade: null,
          status: QuizSubmissionStatus.GRADED,
          version: 1
        });
      }).toThrow('Grade is required for graded submissions');
    });

    it('should throw error if grade is out of range', () => {
      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          startedAt: new Date(),
          submittedAt: new Date(),
          grade: -1,
          status: QuizSubmissionStatus.GRADED,
          version: 1
        });
      }).toThrow('Grade must be between 0 and 100');

      expect(() => {
        QuizSubmission.reconstitute({
          id: 'sub-123',
          quizId,
          studentId,
          answers: [],
          startedAt: new Date(),
          submittedAt: new Date(),
          grade: 101,
          status: QuizSubmissionStatus.GRADED,
          version: 1
        });
      }).toThrow('Grade must be between 0 and 100');
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);

      const obj = submission.toObject();

      expect(obj.id).toBe(submission.getId());
      expect(obj.quizId).toBe(quizId);
      expect(obj.studentId).toBe(studentId);
      expect(obj.status).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(obj.version).toBe(1);
    });
  });

  describe('optimistic locking', () => {
    it('should increment version when grading', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);

      const initialVersion = submission.getVersion();
      submission.setGrade(85);

      expect(submission.getVersion()).toBe(initialVersion + 1);
    });

    it('should increment version when updating grade', () => {
      const submission = QuizSubmission.create(quizId, studentId);
      submission.start(futureDueDate);
      submission.submit([], 60, false);
      submission.setGrade(85);

      const versionAfterGrade = submission.getVersion();
      submission.updateGrade(90);

      expect(submission.getVersion()).toBe(versionAfterGrade + 1);
    });
  });
});
