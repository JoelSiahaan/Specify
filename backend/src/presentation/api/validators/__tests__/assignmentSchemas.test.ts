/**
 * Assignment Schemas Unit Tests
 * 
 * Tests for Zod validation schemas for assignment-related requests.
 * Validates that schemas correctly accept valid input and reject invalid input.
 */

import {
  SubmissionTypeSchema,
  AssignmentTitleSchema,
  AssignmentDescriptionSchema,
  DueDateSchema,
  AcceptedFileFormatsSchema,
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  SubmissionContentSchema,
  SubmitTextAssignmentRequestSchema,
  SubmitFileAssignmentRequestSchema,
  SubmitBothAssignmentRequestSchema,
  SubmitAssignmentRequestSchema,
  GradeSubmissionRequestSchema,
  AssignmentQuerySchema
} from '../assignmentSchemas.js';

describe('Assignment Validation Schemas', () => {
  describe('SubmissionTypeSchema', () => {
    it('should accept FILE submission type', () => {
      const result = SubmissionTypeSchema.safeParse('FILE');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('FILE');
      }
    });

    it('should accept TEXT submission type', () => {
      const result = SubmissionTypeSchema.safeParse('TEXT');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TEXT');
      }
    });

    it('should accept BOTH submission type', () => {
      const result = SubmissionTypeSchema.safeParse('BOTH');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('BOTH');
      }
    });

    it('should reject invalid submission type', () => {
      const result = SubmissionTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('FILE, TEXT, or BOTH');
      }
    });

    it('should reject empty string', () => {
      const result = SubmissionTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('AssignmentTitleSchema', () => {
    it('should accept valid assignment title', () => {
      const result = AssignmentTitleSchema.safeParse('Assignment 1: Variables');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Assignment 1: Variables');
      }
    });

    it('should trim whitespace', () => {
      const result = AssignmentTitleSchema.safeParse('  Assignment 1  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Assignment 1');
      }
    });

    it('should reject empty string', () => {
      const result = AssignmentTitleSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const result = AssignmentTitleSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 characters');
      }
    });

    it('should accept title with exactly 200 characters', () => {
      const title = 'a'.repeat(200);
      const result = AssignmentTitleSchema.safeParse(title);
      expect(result.success).toBe(true);
    });
  });

  describe('AssignmentDescriptionSchema', () => {
    it('should accept valid assignment description', () => {
      const result = AssignmentDescriptionSchema.safeParse('Complete the exercises on variables');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Complete the exercises on variables');
      }
    });

    it('should trim whitespace', () => {
      const result = AssignmentDescriptionSchema.safeParse('  Complete the exercises  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Complete the exercises');
      }
    });

    it('should reject empty string', () => {
      const result = AssignmentDescriptionSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject description exceeding 10000 characters', () => {
      const longDescription = 'a'.repeat(10001);
      const result = AssignmentDescriptionSchema.safeParse(longDescription);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10000 characters');
      }
    });

    it('should accept description with exactly 10000 characters', () => {
      const description = 'a'.repeat(10000);
      const result = AssignmentDescriptionSchema.safeParse(description);
      expect(result.success).toBe(true);
    });
  });

  describe('DueDateSchema', () => {
    it('should accept valid future date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const result = DueDateSchema.safeParse(futureDate.toISOString());
      expect(result.success).toBe(true);
    });

    it('should reject past date', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const result = DueDateSchema.safeParse(pastDate.toISOString());
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('future');
      }
    });

    it('should reject invalid date format', () => {
      const result = DueDateSchema.safeParse('2025-13-45'); // Invalid date
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601');
      }
    });

    it('should reject non-ISO 8601 format', () => {
      const result = DueDateSchema.safeParse('01/13/2025'); // MM/DD/YYYY format
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = DueDateSchema.safeParse(`  ${futureDate.toISOString()}  `);
      expect(result.success).toBe(true);
    });
  });

  describe('AcceptedFileFormatsSchema', () => {
    it('should accept valid file formats', () => {
      const result = AcceptedFileFormatsSchema.safeParse(['pdf', 'docx']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['pdf', 'docx']);
      }
    });

    it('should accept all supported formats', () => {
      const result = AcceptedFileFormatsSchema.safeParse(['pdf', 'docx', 'jpg', 'jpeg', 'png']);
      expect(result.success).toBe(true);
    });

    it('should accept single format', () => {
      const result = AcceptedFileFormatsSchema.safeParse(['pdf']);
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = AcceptedFileFormatsSchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one');
      }
    });

    it('should reject invalid format', () => {
      const result = AcceptedFileFormatsSchema.safeParse(['pdf', 'exe']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('pdf, docx, jpg, jpeg, png');
      }
    });

    it('should reject more than 5 formats', () => {
      const result = AcceptedFileFormatsSchema.safeParse(['pdf', 'docx', 'jpg', 'jpeg', 'png', 'gif']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5 file formats');
      }
    });

    it('should accept undefined (optional)', () => {
      const result = AcceptedFileFormatsSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateAssignmentRequestSchema', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const validCreateRequest = {
      title: 'Assignment 1: Variables',
      description: 'Complete the exercises on variables',
      dueDate: futureDate,
      submissionType: 'TEXT' as const
    };

    it('should accept valid TEXT assignment request', () => {
      const result = CreateAssignmentRequestSchema.safeParse(validCreateRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Assignment 1: Variables');
        expect(result.data.submissionType).toBe('TEXT');
      }
    });

    it('should accept valid FILE assignment request with formats', () => {
      const request = {
        ...validCreateRequest,
        submissionType: 'FILE' as const,
        acceptedFileFormats: ['pdf', 'docx']
      };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept valid BOTH assignment request with formats', () => {
      const request = {
        ...validCreateRequest,
        submissionType: 'BOTH' as const,
        acceptedFileFormats: ['pdf']
      };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject FILE submission without acceptedFileFormats', () => {
      const request = {
        ...validCreateRequest,
        submissionType: 'FILE' as const
      };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Accepted file formats');
      }
    });

    it('should reject BOTH submission without acceptedFileFormats', () => {
      const request = {
        ...validCreateRequest,
        submissionType: 'BOTH' as const
      };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const request = { ...validCreateRequest };
      delete (request as any).title;
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject missing description', () => {
      const request = { ...validCreateRequest };
      delete (request as any).description;
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should reject missing dueDate', () => {
      const request = { ...validCreateRequest };
      delete (request as any).dueDate;
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('dueDate');
      }
    });

    it('should reject missing submissionType', () => {
      const request = { ...validCreateRequest };
      delete (request as any).submissionType;
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('submissionType');
      }
    });

    it('should reject past due date', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const request = { ...validCreateRequest, dueDate: pastDate };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from fields', () => {
      const request = {
        title: '  Assignment 1  ',
        description: '  Complete exercises  ',
        dueDate: futureDate,
        submissionType: 'TEXT' as const
      };
      const result = CreateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Assignment 1');
        expect(result.data.description).toBe('Complete exercises');
      }
    });
  });

  describe('UpdateAssignmentRequestSchema', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    it('should accept update with only title', () => {
      const request = { title: 'Updated Assignment Title' };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Assignment Title');
        expect(result.data.description).toBeUndefined();
        expect(result.data.dueDate).toBeUndefined();
      }
    });

    it('should accept update with only description', () => {
      const request = { description: 'Updated description' };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Updated description');
        expect(result.data.title).toBeUndefined();
      }
    });

    it('should accept update with only dueDate', () => {
      const request = { dueDate: futureDate };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBe(futureDate);
        expect(result.data.title).toBeUndefined();
      }
    });

    it('should accept update with all fields', () => {
      const request = {
        title: 'Updated Title',
        description: 'Updated description',
        dueDate: futureDate
      };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject update with no fields', () => {
      const request = {};
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('should reject past due date', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const request = { dueDate: pastDate };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from fields', () => {
      const request = {
        title: '  Updated Title  ',
        description: '  Updated description  '
      };
      const result = UpdateAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
        expect(result.data.description).toBe('Updated description');
      }
    });
  });

  describe('SubmissionContentSchema', () => {
    it('should accept valid submission content', () => {
      const result = SubmissionContentSchema.safeParse('This is my submission text');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('This is my submission text');
      }
    });

    it('should trim whitespace', () => {
      const result = SubmissionContentSchema.safeParse('  My submission  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('My submission');
      }
    });

    it('should reject empty string', () => {
      const result = SubmissionContentSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject content exceeding 50000 characters', () => {
      const longContent = 'a'.repeat(50001);
      const result = SubmissionContentSchema.safeParse(longContent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50000 characters');
      }
    });

    it('should accept content with exactly 50000 characters', () => {
      const content = 'a'.repeat(50000);
      const result = SubmissionContentSchema.safeParse(content);
      expect(result.success).toBe(true);
    });
  });

  describe('SubmitTextAssignmentRequestSchema', () => {
    it('should accept valid TEXT submission', () => {
      const request = {
        submissionType: 'TEXT' as const,
        content: 'This is my submission'
      };
      const result = SubmitTextAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionType).toBe('TEXT');
        expect(result.data.content).toBe('This is my submission');
      }
    });

    it('should reject TEXT submission without content', () => {
      const request = { submissionType: 'TEXT' as const };
      const result = SubmitTextAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content');
      }
    });

    it('should reject TEXT submission with empty content', () => {
      const request = {
        submissionType: 'TEXT' as const,
        content: ''
      };
      const result = SubmitTextAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('SubmitFileAssignmentRequestSchema', () => {
    it('should accept valid FILE submission', () => {
      const request = { submissionType: 'FILE' as const };
      const result = SubmitFileAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionType).toBe('FILE');
      }
    });
  });

  describe('SubmitBothAssignmentRequestSchema', () => {
    it('should accept valid BOTH submission', () => {
      const request = {
        submissionType: 'BOTH' as const,
        content: 'This is my submission'
      };
      const result = SubmitBothAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionType).toBe('BOTH');
        expect(result.data.content).toBe('This is my submission');
      }
    });

    it('should reject BOTH submission without content', () => {
      const request = { submissionType: 'BOTH' as const };
      const result = SubmitBothAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content');
      }
    });
  });

  describe('SubmitAssignmentRequestSchema', () => {
    it('should accept TEXT submission', () => {
      const request = {
        submissionType: 'TEXT' as const,
        content: 'My submission'
      };
      const result = SubmitAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept FILE submission', () => {
      const request = { submissionType: 'FILE' as const };
      const result = SubmitAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept BOTH submission', () => {
      const request = {
        submissionType: 'BOTH' as const,
        content: 'My submission'
      };
      const result = SubmitAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject invalid submission type', () => {
      const request = {
        submissionType: 'INVALID' as any,
        content: 'My submission'
      };
      const result = SubmitAssignmentRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('GradeSubmissionRequestSchema', () => {
    it('should accept valid grade with feedback', () => {
      const request = {
        grade: 85,
        feedback: 'Good work!'
      };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(85);
        expect(result.data.feedback).toBe('Good work!');
      }
    });

    it('should accept valid grade without feedback', () => {
      const request = { grade: 90 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(90);
        expect(result.data.feedback).toBeUndefined();
      }
    });

    it('should accept grade of 0', () => {
      const request = { grade: 0 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept grade of 100', () => {
      const request = { grade: 100 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject grade below 0', () => {
      const request = { grade: -1 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('0 and 100');
      }
    });

    it('should reject grade above 100', () => {
      const request = { grade: 101 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('0 and 100');
      }
    });

    it('should accept decimal grade for precise grading', () => {
      const request = { grade: 85.5 };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(85.5);
      }
    });

    it('should reject missing grade', () => {
      const request = { feedback: 'Good work!' };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('grade');
      }
    });

    it('should trim whitespace from feedback', () => {
      const request = {
        grade: 85,
        feedback: '  Good work!  '
      };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feedback).toBe('Good work!');
      }
    });

    it('should reject feedback exceeding 5000 characters', () => {
      const request = {
        grade: 85,
        feedback: 'a'.repeat(5001)
      };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000 characters');
      }
    });

    it('should accept version for optimistic locking', () => {
      const request = {
        grade: 85,
        version: 1
      };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1);
      }
    });

    it('should accept version of 0 (non-negative)', () => {
      const request = {
        grade: 85,
        version: 0
      };
      const result = GradeSubmissionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(0);
      }
    });
  });

  describe('AssignmentQuerySchema', () => {
    it('should accept empty query', () => {
      const query = {};
      const result = AssignmentQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});
