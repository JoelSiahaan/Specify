/**
 * Submission Entity Unit Tests
 * 
 * Tests for Submission domain entity business logic and validation.
 */

import { randomUUID } from 'crypto';
import { Submission, SubmissionStatus, type SubmissionProps } from '../Submission';

describe('Submission Entity', () => {
  const createValidSubmissionProps = (): SubmissionProps => ({
    id: randomUUID(),
    assignmentId: randomUUID(),
    studentId: randomUUID(),
    isLate: false,
    status: SubmissionStatus.NOT_SUBMITTED,
    version: 0
  });

  describe('create', () => {
    it('should create a valid submission', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      expect(submission.getId()).toBe(props.id);
      expect(submission.getAssignmentId()).toBe(props.assignmentId);
      expect(submission.getStudentId()).toBe(props.studentId);
      expect(submission.getIsLate()).toBe(false);
      expect(submission.getStatus()).toBe(SubmissionStatus.NOT_SUBMITTED);
      expect(submission.getVersion()).toBe(0);
    });

    it('should throw error if ID is missing', () => {
      const props = { ...createValidSubmissionProps(), id: '' };
      expect(() => Submission.create(props)).toThrow('Submission ID is required');
    });

    it('should throw error if assignment ID is missing', () => {
      const props = { ...createValidSubmissionProps(), assignmentId: '' };
      expect(() => Submission.create(props)).toThrow('Assignment ID is required');
    });

    it('should throw error if student ID is missing', () => {
      const props = { ...createValidSubmissionProps(), studentId: '' };
      expect(() => Submission.create(props)).toThrow('Student ID is required');
    });

    it('should throw error if status is invalid', () => {
      const props = { ...createValidSubmissionProps(), status: 'INVALID' as any };
      expect(() => Submission.create(props)).toThrow('Invalid submission status');
    });

    it('should throw error if version is negative', () => {
      const props = { ...createValidSubmissionProps(), version: -1 };
      expect(() => Submission.create(props)).toThrow('Version must be non-negative');
    });
  });

  describe('grade validation', () => {
    it('should accept valid grade (0-100)', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85
      };
      const submission = Submission.create(props);
      expect(submission.getGrade()).toBe(85);
    });

    it('should accept grade of 0', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 0
      };
      const submission = Submission.create(props);
      expect(submission.getGrade()).toBe(0);
    });

    it('should accept grade of 100', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 100
      };
      const submission = Submission.create(props);
      expect(submission.getGrade()).toBe(100);
    });

    it('should throw error if grade is below 0', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: -1
      };
      expect(() => Submission.create(props)).toThrow('Grade must be between 0 and 100');
    });

    it('should throw error if grade is above 100', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 101
      };
      expect(() => Submission.create(props)).toThrow('Grade must be between 0 and 100');
    });

    it('should throw error if grade is not a number', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: NaN
      };
      expect(() => Submission.create(props)).toThrow('Grade must be a valid number');
    });

    it('should throw error if graded status without grade', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED
      };
      expect(() => Submission.create(props)).toThrow('Graded submission must have a grade');
    });
  });

  describe('submit', () => {
    it('should submit a not-submitted submission', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      submission.submit(false);

      expect(submission.getStatus()).toBe(SubmissionStatus.SUBMITTED);
      expect(submission.getIsLate()).toBe(false);
      expect(submission.getSubmittedAt()).toBeDefined();
    });

    it('should mark submission as late when submitted late', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      submission.submit(true);

      expect(submission.getStatus()).toBe(SubmissionStatus.SUBMITTED);
      expect(submission.getIsLate()).toBe(true);
    });

    it('should throw error if already submitted', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED
      };
      const submission = Submission.create(props);

      expect(() => submission.submit(false)).toThrow('Submission has already been submitted');
    });
  });

  describe('resubmit', () => {
    it('should allow resubmission of submitted work', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.resubmit(false);

      expect(submission.getStatus()).toBe(SubmissionStatus.SUBMITTED);
      expect(submission.getSubmittedAt()).toBeDefined();
    });

    it('should update late flag on resubmission', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        isLate: false,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.resubmit(true);

      expect(submission.getIsLate()).toBe(true);
    });

    it('should throw error if already graded', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85
      };
      const submission = Submission.create(props);

      expect(() => submission.resubmit(false)).toThrow('Cannot resubmit after grading has started');
    });
  });

  describe('assignGrade', () => {
    it('should assign grade to submitted submission', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.assignGrade(85, 'Good work!');

      expect(submission.getGrade()).toBe(85);
      expect(submission.getFeedback()).toBe('Good work!');
      expect(submission.getStatus()).toBe(SubmissionStatus.GRADED);
      expect(submission.getGradedAt()).toBeDefined();
      expect(submission.getVersion()).toBe(1);
    });

    it('should assign grade without feedback', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.assignGrade(90);

      expect(submission.getGrade()).toBe(90);
      expect(submission.getFeedback()).toBeUndefined();
      expect(submission.getStatus()).toBe(SubmissionStatus.GRADED);
    });

    it('should throw error if grade is below 0', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      expect(() => submission.assignGrade(-1)).toThrow('Grade must be between 0 and 100');
    });

    it('should throw error if grade is above 100', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      expect(() => submission.assignGrade(101)).toThrow('Grade must be between 0 and 100');
    });

    it('should throw error if submission not submitted', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      expect(() => submission.assignGrade(85)).toThrow('Cannot grade submission that has not been submitted');
    });

    it('should throw error on version mismatch (optimistic locking)', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        version: 1
      };
      const submission = Submission.create(props);

      expect(() => submission.assignGrade(85, 'Good work!', 0)).toThrow('Submission has been modified by another user');
    });

    it('should succeed with correct version', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        version: 1
      };
      const submission = Submission.create(props);

      submission.assignGrade(85, 'Good work!', 1);

      expect(submission.getGrade()).toBe(85);
      expect(submission.getVersion()).toBe(2);
    });
  });

  describe('updateGrade', () => {
    it('should update existing grade', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85,
        feedback: 'Good work!',
        version: 1
      };
      const submission = Submission.create(props);

      submission.updateGrade(90, 'Excellent work!');

      expect(submission.getGrade()).toBe(90);
      expect(submission.getFeedback()).toBe('Excellent work!');
      expect(submission.getVersion()).toBe(2);
    });

    it('should throw error if not graded yet', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      expect(() => submission.updateGrade(90)).toThrow('Cannot update grade for submission that has not been graded');
    });

    it('should throw error on version mismatch', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85,
        version: 2
      };
      const submission = Submission.create(props);

      expect(() => submission.updateGrade(90, 'Updated', 1)).toThrow('Submission has been modified by another user');
    });

    it('should throw error if new grade is invalid', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85,
        version: 1
      };
      const submission = Submission.create(props);

      expect(() => submission.updateGrade(101)).toThrow('Grade must be between 0 and 100');
    });
  });

  describe('updateContent', () => {
    it('should update text content', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.updateContent('Updated text content');

      expect(submission.getContent()).toBe('Updated text content');
    });

    it('should update file content', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      submission.updateContent(undefined, '/uploads/file.pdf', 'file.pdf');

      expect(submission.getFilePath()).toBe('/uploads/file.pdf');
      expect(submission.getFileName()).toBe('file.pdf');
    });

    it('should throw error if already graded', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85
      };
      const submission = Submission.create(props);

      expect(() => submission.updateContent('New content')).toThrow('Cannot update content after grading has started');
    });
  });

  describe('markAsLate', () => {
    it('should mark submission as late', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      submission.markAsLate();

      expect(submission.getIsLate()).toBe(true);
    });
  });

  describe('status checks', () => {
    it('should correctly identify graded submission', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85
      };
      const submission = Submission.create(props);

      expect(submission.isGraded()).toBe(true);
      expect(submission.isSubmitted()).toBe(true);
    });

    it('should correctly identify submitted submission', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date()
      };
      const submission = Submission.create(props);

      expect(submission.isGraded()).toBe(false);
      expect(submission.isSubmitted()).toBe(true);
    });

    it('should correctly identify not submitted submission', () => {
      const props = createValidSubmissionProps();
      const submission = Submission.create(props);

      expect(submission.isGraded()).toBe(false);
      expect(submission.isSubmitted()).toBe(false);
    });

    it('should correctly identify late submission', () => {
      const props = {
        ...createValidSubmissionProps(),
        isLate: true
      };
      const submission = Submission.create(props);

      expect(submission.isLateSubmission()).toBe(true);
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const props = {
        ...createValidSubmissionProps(),
        content: 'Test content',
        filePath: '/uploads/file.pdf',
        fileName: 'file.pdf',
        grade: 85,
        feedback: 'Good work!',
        status: SubmissionStatus.GRADED,
        submittedAt: new Date(),
        gradedAt: new Date()
      };
      const submission = Submission.create(props);

      const obj = submission.toObject();

      expect(obj.id).toBe(props.id);
      expect(obj.assignmentId).toBe(props.assignmentId);
      expect(obj.studentId).toBe(props.studentId);
      expect(obj.content).toBe(props.content);
      expect(obj.filePath).toBe(props.filePath);
      expect(obj.fileName).toBe(props.fileName);
      expect(obj.grade).toBe(props.grade);
      expect(obj.feedback).toBe(props.feedback);
      expect(obj.status).toBe(props.status);
      expect(obj.version).toBe(props.version);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute submission from persistence', () => {
      const props = {
        ...createValidSubmissionProps(),
        status: SubmissionStatus.GRADED,
        grade: 85,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02')
      };

      const submission = Submission.reconstitute(props);

      expect(submission.getId()).toBe(props.id);
      expect(submission.getGrade()).toBe(85);
      expect(submission.getCreatedAt()).toEqual(props.createdAt);
      expect(submission.getUpdatedAt()).toEqual(props.updatedAt);
    });
  });
});
