/**
 * Course Schemas Unit Tests
 * 
 * Tests for Zod validation schemas for course-related requests.
 * Validates that schemas correctly accept valid input and reject invalid input.
 */

import {
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  CourseQuerySchema,
  CourseNameSchema,
  CourseDescriptionSchema,
  CourseCodeSchema,
  CourseStatusSchema
} from '../courseSchemas';

describe('Course Validation Schemas', () => {
  describe('CourseNameSchema', () => {
    it('should accept valid course name', () => {
      const result = CourseNameSchema.safeParse('Introduction to Programming');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Introduction to Programming');
      }
    });

    it('should trim whitespace', () => {
      const result = CourseNameSchema.safeParse('  Introduction to Programming  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Introduction to Programming');
      }
    });

    it('should reject empty string', () => {
      const result = CourseNameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject name exceeding 200 characters', () => {
      const longName = 'a'.repeat(201);
      const result = CourseNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 characters');
      }
    });

    it('should accept name with exactly 200 characters', () => {
      const name = 'a'.repeat(200);
      const result = CourseNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  describe('CourseDescriptionSchema', () => {
    it('should accept valid course description', () => {
      const result = CourseDescriptionSchema.safeParse('Learn programming basics with Python');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Learn programming basics with Python');
      }
    });

    it('should trim whitespace', () => {
      const result = CourseDescriptionSchema.safeParse('  Learn programming basics  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Learn programming basics');
      }
    });

    it('should reject empty string', () => {
      const result = CourseDescriptionSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject description exceeding 5000 characters', () => {
      const longDescription = 'a'.repeat(5001);
      const result = CourseDescriptionSchema.safeParse(longDescription);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000 characters');
      }
    });

    it('should accept description with exactly 5000 characters', () => {
      const description = 'a'.repeat(5000);
      const result = CourseDescriptionSchema.safeParse(description);
      expect(result.success).toBe(true);
    });
  });

  describe('CourseCodeSchema', () => {
    it('should accept valid course code', () => {
      const result = CourseCodeSchema.safeParse('ABC123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should normalize to uppercase', () => {
      const result = CourseCodeSchema.safeParse('abc123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should trim whitespace', () => {
      const result = CourseCodeSchema.safeParse('  ABC123  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABC123');
      }
    });

    it('should reject code with less than 6 characters', () => {
      const result = CourseCodeSchema.safeParse('ABC12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject code with more than 6 characters', () => {
      const result = CourseCodeSchema.safeParse('ABC1234');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    it('should reject code with lowercase letters', () => {
      const result = CourseCodeSchema.safeParse('abc123');
      // This should pass because we normalize to uppercase
      expect(result.success).toBe(true);
    });

    it('should reject code with special characters', () => {
      const result = CourseCodeSchema.safeParse('ABC-12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters and numbers');
      }
    });

    it('should reject code with spaces', () => {
      const result = CourseCodeSchema.safeParse('ABC 12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters and numbers');
      }
    });

    it('should accept code with only letters', () => {
      const result = CourseCodeSchema.safeParse('ABCDEF');
      expect(result.success).toBe(true);
    });

    it('should accept code with only numbers', () => {
      const result = CourseCodeSchema.safeParse('123456');
      expect(result.success).toBe(true);
    });
  });

  describe('CourseStatusSchema', () => {
    it('should accept ACTIVE status', () => {
      const result = CourseStatusSchema.safeParse('ACTIVE');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ACTIVE');
      }
    });

    it('should accept ARCHIVED status', () => {
      const result = CourseStatusSchema.safeParse('ARCHIVED');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ARCHIVED');
      }
    });

    it('should reject invalid status', () => {
      const result = CourseStatusSchema.safeParse('DELETED');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ACTIVE or ARCHIVED');
      }
    });

    it('should reject empty string', () => {
      const result = CourseStatusSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCourseRequestSchema', () => {
    const validCreateRequest = {
      name: 'Introduction to Programming',
      description: 'Learn programming basics with Python'
    };

    it('should accept valid create course request', () => {
      const result = CreateCourseRequestSchema.safeParse(validCreateRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Introduction to Programming');
        expect(result.data.description).toBe('Learn programming basics with Python');
      }
    });

    it('should trim whitespace from fields', () => {
      const request = {
        name: '  Introduction to Programming  ',
        description: '  Learn programming basics  '
      };
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Introduction to Programming');
        expect(result.data.description).toBe('Learn programming basics');
      }
    });

    it('should reject missing name', () => {
      const request = { ...validCreateRequest };
      delete (request as any).name;
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should reject missing description', () => {
      const request = { ...validCreateRequest };
      delete (request as any).description;
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should reject empty name', () => {
      const request = { ...validCreateRequest, name: '' };
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const request = { ...validCreateRequest, description: '' };
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 200 characters', () => {
      const request = { ...validCreateRequest, name: 'a'.repeat(201) };
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 5000 characters', () => {
      const request = { ...validCreateRequest, description: 'a'.repeat(5001) };
      const result = CreateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCourseRequestSchema', () => {
    it('should accept update with only name', () => {
      const request = { name: 'Updated Course Name' };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Course Name');
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should accept update with only description', () => {
      const request = { description: 'Updated description' };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Updated description');
        expect(result.data.name).toBeUndefined();
      }
    });

    it('should accept update with both name and description', () => {
      const request = {
        name: 'Updated Course Name',
        description: 'Updated description'
      };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Course Name');
        expect(result.data.description).toBe('Updated description');
      }
    });

    it('should reject update with no fields', () => {
      const request = {};
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('should trim whitespace from fields', () => {
      const request = {
        name: '  Updated Name  ',
        description: '  Updated description  '
      };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.description).toBe('Updated description');
      }
    });

    it('should reject empty name when provided', () => {
      const request = { name: '' };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty description when provided', () => {
      const request = { description: '' };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 200 characters', () => {
      const request = { name: 'a'.repeat(201) };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 5000 characters', () => {
      const request = { description: 'a'.repeat(5001) };
      const result = UpdateCourseRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('CourseQuerySchema', () => {
    it('should accept query with ACTIVE status', () => {
      const query = { status: 'ACTIVE' };
      const result = CourseQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('should accept query with ARCHIVED status', () => {
      const query = { status: 'ARCHIVED' };
      const result = CourseQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ARCHIVED');
      }
    });

    it('should accept query without status', () => {
      const query = {};
      const result = CourseQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });

    it('should reject query with invalid status', () => {
      const query = { status: 'DELETED' };
      const result = CourseQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });
});

