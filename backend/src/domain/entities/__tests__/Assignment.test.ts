/**
 * Assignment Entity Unit Tests
 * 
 * Tests for Assignment domain entity business logic and validation.
 * 
 * Requirements tested:
 * - 9.1: Assignment creation with title, description, and due date
 * - 9.2: Due date validation (must be in future)
 * - 9.8: Prevent editing after due date
 * - 10.9: Reject submissions after grading starts
 */

import { Assignment, SubmissionType, type AssignmentProps } from '../Assignment.js';

describe('Assignment Entity', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const validAssignmentProps: AssignmentProps = {
    id: 'assignment-123',
    courseId: 'course-456',
    title: 'Assignment 1: Variables',
    description: 'Complete the exercises on variables and data types',
    dueDate: futureDate,
    submissionType: SubmissionType.BOTH,
    acceptedFileFormats: ['pdf', 'docx'],
    gradingStarted: false
  };

  describe('create', () => {
    it('should create a valid assignment with all required fields', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(assignment.getId()).toBe(validAssignmentProps.id);
      expect(assignment.getCourseId()).toBe(validAssignmentProps.courseId);
      expect(assignment.getTitle()).toBe(validAssignmentProps.title);
      expect(assignment.getDescription()).toBe(validAssignmentProps.description);
      expect(assignment.getDueDate()).toBe(validAssignmentProps.dueDate);
      expect(assignment.getSubmissionType()).toBe(validAssignmentProps.submissionType);
      expect(assignment.getAcceptedFileFormats()).toEqual(validAssignmentProps.acceptedFileFormats);
      expect(assignment.getGradingStarted()).toBe(false);
      expect(assignment.getCreatedAt()).toBeInstanceOf(Date);
      expect(assignment.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create assignment with FILE submission type', () => {
      const assignment = Assignment.create({
        ...validAssignmentProps,
        submissionType: SubmissionType.FILE
      });

      expect(assignment.getSubmissionType()).toBe(SubmissionType.FILE);
    });

    it('should create assignment with TEXT submission type', () => {
      const assignment = Assignment.create({
        ...validAssignmentProps,
        submissionType: SubmissionType.TEXT
      });

      expect(assignment.getSubmissionType()).toBe(SubmissionType.TEXT);
    });

    it('should create assignment with BOTH submission type', () => {
      const assignment = Assignment.create({
        ...validAssignmentProps,
        submissionType: SubmissionType.BOTH
      });

      expect(assignment.getSubmissionType()).toBe(SubmissionType.BOTH);
    });

    it('should throw error when id is missing', () => {
      const props = { ...validAssignmentProps, id: '' };

      expect(() => Assignment.create(props)).toThrow('Assignment ID is required');
    });

    it('should throw error when course ID is missing', () => {
      const props = { ...validAssignmentProps, courseId: '' };

      expect(() => Assignment.create(props)).toThrow('Course ID is required');
    });

    // Requirement 9.1: Title is required
    it('should throw error when title is missing', () => {
      const props = { ...validAssignmentProps, title: '' };

      expect(() => Assignment.create(props)).toThrow('Assignment title is required');
    });

    // Requirement 9.1: Description is required
    it('should throw error when description is missing', () => {
      const props = { ...validAssignmentProps, description: '' };

      expect(() => Assignment.create(props)).toThrow('Assignment description is required');
    });

    // Requirement 9.2: Due date must be in the future
    it('should throw error when due date is in the past', () => {
      const props = { ...validAssignmentProps, dueDate: pastDate };

      expect(() => Assignment.create(props)).toThrow('Assignment due date must be in the future');
    });

    it('should throw error for invalid submission type', () => {
      const props = { ...validAssignmentProps, submissionType: 'INVALID' as SubmissionType };

      expect(() => Assignment.create(props)).toThrow('Invalid submission type');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute assignment from persistence with timestamps', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-01-10');
      const props = { ...validAssignmentProps, createdAt, updatedAt };

      const assignment = Assignment.reconstitute(props);

      expect(assignment.getId()).toBe(props.id);
      expect(assignment.getCreatedAt()).toEqual(createdAt);
      expect(assignment.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should reconstitute assignment with past due date (from database)', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-01-10');
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt,
        updatedAt
      };

      // Should not throw error for past due date when reconstituting
      expect(() => Assignment.reconstitute(props)).not.toThrow();
    });
  });

  describe('startGrading', () => {
    // Requirement 10.9: Starting grading locks assignment
    it('should start grading successfully', () => {
      const assignment = Assignment.create(validAssignmentProps);

      assignment.startGrading();

      expect(assignment.hasGradingStarted()).toBe(true);
      expect(assignment.getGradingStarted()).toBe(true);
    });

    it('should throw error when grading already started', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(() => assignment.startGrading()).toThrow('Grading has already started for this assignment');
    });

    it('should update updatedAt timestamp when starting grading', () => {
      const assignment = Assignment.create(validAssignmentProps);
      const beforeUpdate = assignment.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        assignment.startGrading();

        expect(assignment.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('updateTitle', () => {
    // Requirement 9.9: Allow editing before due date
    it('should update title before due date successfully', () => {
      const assignment = Assignment.create(validAssignmentProps);
      const newTitle = 'Assignment 1: Updated Title';

      assignment.updateTitle(newTitle);

      expect(assignment.getTitle()).toBe(newTitle);
    });

    it('should throw error when updating title to empty string', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(() => assignment.updateTitle('')).toThrow('Assignment title is required');
    });

    // Requirement 9.8: Prevent editing after due date
    it('should throw error when updating title after due date', () => {
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-10')
      };
      const assignment = Assignment.reconstitute(props);

      expect(() => assignment.updateTitle('New Title')).toThrow('Cannot edit assignment after due date');
    });

    it('should throw error when updating title after grading started', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(() => assignment.updateTitle('New Title')).toThrow('Cannot edit assignment after grading has started');
    });
  });

  describe('updateDescription', () => {
    // Requirement 9.9: Allow editing before due date
    it('should update description before due date successfully', () => {
      const assignment = Assignment.create(validAssignmentProps);
      const newDescription = 'Updated description for the assignment';

      assignment.updateDescription(newDescription);

      expect(assignment.getDescription()).toBe(newDescription);
    });

    it('should throw error when updating description to empty string', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(() => assignment.updateDescription('')).toThrow('Assignment description is required');
    });

    // Requirement 9.8: Prevent editing after due date
    it('should throw error when updating description after due date', () => {
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-10')
      };
      const assignment = Assignment.reconstitute(props);

      expect(() => assignment.updateDescription('New Description')).toThrow('Cannot edit assignment after due date');
    });

    it('should throw error when updating description after grading started', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(() => assignment.updateDescription('New Description')).toThrow('Cannot edit assignment after grading has started');
    });
  });

  describe('updateDueDate', () => {
    const newFutureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

    // Requirement 9.9: Allow editing before due date
    it('should update due date before current due date successfully', () => {
      const assignment = Assignment.create(validAssignmentProps);

      assignment.updateDueDate(newFutureDate);

      expect(assignment.getDueDate()).toBe(newFutureDate);
    });

    // Requirement 9.2: New due date must be in the future
    it('should throw error when updating due date to past date', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(() => assignment.updateDueDate(pastDate)).toThrow('Assignment due date must be in the future');
    });

    // Requirement 9.8: Prevent editing after due date
    it('should throw error when updating due date after current due date', () => {
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-10')
      };
      const assignment = Assignment.reconstitute(props);

      expect(() => assignment.updateDueDate(newFutureDate)).toThrow('Cannot edit assignment after due date');
    });

    it('should throw error when updating due date after grading started', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(() => assignment.updateDueDate(newFutureDate)).toThrow('Cannot edit assignment after grading has started');
    });
  });

  describe('canAcceptSubmissions', () => {
    // Requirement 10.7: Accept submissions before grading starts
    it('should accept submissions before grading starts', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(assignment.canAcceptSubmissions()).toBe(true);
    });

    // Requirement 10.9: Reject submissions after grading starts
    it('should not accept submissions after grading starts', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(assignment.canAcceptSubmissions()).toBe(false);
    });
  });

  describe('isSubmissionLate', () => {
    // Requirement 10.8: Mark submissions after due date as late
    it('should return false when submission is before due date', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(assignment.isSubmissionLate()).toBe(false);
    });

    it('should return true when submission is after due date', () => {
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-10')
      };
      const assignment = Assignment.reconstitute(props);

      expect(assignment.isSubmissionLate()).toBe(true);
    });
  });

  describe('isPastDueDate', () => {
    it('should return false when current time is before due date', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(assignment.isPastDueDate()).toBe(false);
    });

    it('should return true when current time is after due date', () => {
      const props = {
        ...validAssignmentProps,
        dueDate: pastDate,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-10')
      };
      const assignment = Assignment.reconstitute(props);

      expect(assignment.isPastDueDate()).toBe(true);
    });
  });

  describe('hasGradingStarted', () => {
    it('should return false when grading has not started', () => {
      const assignment = Assignment.create(validAssignmentProps);

      expect(assignment.hasGradingStarted()).toBe(false);
    });

    it('should return true when grading has started', () => {
      const assignment = Assignment.create(validAssignmentProps);
      assignment.startGrading();

      expect(assignment.hasGradingStarted()).toBe(true);
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const assignment = Assignment.create(validAssignmentProps);
      const obj = assignment.toObject();

      expect(obj.id).toBe(validAssignmentProps.id);
      expect(obj.courseId).toBe(validAssignmentProps.courseId);
      expect(obj.title).toBe(validAssignmentProps.title);
      expect(obj.description).toBe(validAssignmentProps.description);
      expect(obj.dueDate).toBe(validAssignmentProps.dueDate);
      expect(obj.submissionType).toBe(validAssignmentProps.submissionType);
      expect(obj.acceptedFileFormats).toEqual(validAssignmentProps.acceptedFileFormats);
      expect(obj.gradingStarted).toBe(false);
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });
  });
});
