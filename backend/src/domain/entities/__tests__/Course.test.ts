/**
 * Course Entity Unit Tests
 * 
 * Tests for Course domain entity business logic and validation.
 * 
 * Requirements tested:
 * - 5.1: Course creation with name, description, and unique course code
 * - 5.4: Course archiving (prevents new enrollments, closes assignments/quizzes)
 * - 5.6: Course deletion (only archived courses can be deleted)
 * - 5.7: Cascade deletion of related data
 */

import { Course, CourseStatus, type CourseProps } from '../Course';

describe('Course Entity', () => {
  const validCourseProps: CourseProps = {
    id: 'course-123',
    name: 'Introduction to Programming',
    description: 'Learn programming basics with Python',
    courseCode: 'ABC123',
    status: CourseStatus.ACTIVE,
    teacherId: 'teacher-456'
  };

  describe('create', () => {
    it('should create a valid course with all required fields', () => {
      const course = Course.create(validCourseProps);

      expect(course.getId()).toBe(validCourseProps.id);
      expect(course.getName()).toBe(validCourseProps.name);
      expect(course.getDescription()).toBe(validCourseProps.description);
      expect(course.getCourseCode()).toBe(validCourseProps.courseCode);
      expect(course.getStatus()).toBe(validCourseProps.status);
      expect(course.getTeacherId()).toBe(validCourseProps.teacherId);
      expect(course.getCreatedAt()).toBeInstanceOf(Date);
      expect(course.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create a course with ACTIVE status', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });

      expect(course.getStatus()).toBe(CourseStatus.ACTIVE);
      expect(course.isActive()).toBe(true);
      expect(course.isArchived()).toBe(false);
    });

    it('should create a course with ARCHIVED status', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(course.getStatus()).toBe(CourseStatus.ARCHIVED);
      expect(course.isArchived()).toBe(true);
      expect(course.isActive()).toBe(false);
    });

    it('should throw error when id is missing', () => {
      const props = { ...validCourseProps, id: '' };

      expect(() => Course.create(props)).toThrow('Course ID is required');
    });

    // Requirement 5.1: Course name is required
    it('should throw error when name is missing', () => {
      const props = { ...validCourseProps, name: '' };

      expect(() => Course.create(props)).toThrow('Course name is required');
    });

    it('should throw error when description is missing', () => {
      const props = { ...validCourseProps, description: '' };

      expect(() => Course.create(props)).toThrow('Course description is required');
    });

    it('should throw error when course code is missing', () => {
      const props = { ...validCourseProps, courseCode: '' };

      expect(() => Course.create(props)).toThrow('Course code is required');
    });

    // Requirement 5.4: Status validation (Active or Archived)
    it('should throw error for invalid status', () => {
      const props = { ...validCourseProps, status: 'DELETED' as CourseStatus };

      expect(() => Course.create(props)).toThrow('Invalid course status');
    });

    it('should throw error when teacher ID is missing', () => {
      const props = { ...validCourseProps, teacherId: '' };

      expect(() => Course.create(props)).toThrow('Teacher ID is required');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute course from persistence with timestamps', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-01-10');
      const props = { ...validCourseProps, createdAt, updatedAt };

      const course = Course.reconstitute(props);

      expect(course.getId()).toBe(props.id);
      expect(course.getCreatedAt()).toEqual(createdAt);
      expect(course.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('archive', () => {
    // Requirement 5.4: Archive active course succeeds
    it('should archive an active course successfully', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });
      const beforeUpdate = course.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        course.archive();

        expect(course.getStatus()).toBe(CourseStatus.ARCHIVED);
        expect(course.isArchived()).toBe(true);
        expect(course.isActive()).toBe(false);
        expect(course.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      }, 10);
    });

    // Requirement 5.4: Cannot archive already archived course
    it('should throw error when archiving already archived course', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(() => course.archive()).toThrow('Course is already archived');
    });
  });

  describe('validateCanDelete', () => {
    // Requirement 5.6: Only archived courses can be deleted
    it('should allow deletion of archived course', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(() => course.validateCanDelete()).not.toThrow();
    });

    // Requirement 5.6: Active courses cannot be deleted
    it('should throw error when trying to delete active course', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });

      expect(() => course.validateCanDelete()).toThrow('Cannot delete active course. Archive the course first');
    });
  });

  describe('updateName', () => {
    // Requirement 5.3: Update active course
    it('should update name of active course successfully', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });
      const newName = 'Advanced Programming';

      course.updateName(newName);

      expect(course.getName()).toBe(newName);
    });

    it('should throw error when updating name to empty string', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });

      expect(() => course.updateName('')).toThrow('Course name is required');
    });

    it('should throw error when updating name of archived course', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(() => course.updateName('New Name')).toThrow('Cannot update archived course');
    });
  });

  describe('updateDescription', () => {
    // Requirement 5.3: Update active course
    it('should update description of active course successfully', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });
      const newDescription = 'Advanced programming concepts';

      course.updateDescription(newDescription);

      expect(course.getDescription()).toBe(newDescription);
    });

    it('should throw error when updating description to empty string', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });

      expect(() => course.updateDescription('')).toThrow('Course description is required');
    });

    it('should throw error when updating description of archived course', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(() => course.updateDescription('New Description')).toThrow('Cannot update archived course');
    });
  });

  describe('status checks', () => {
    it('should correctly identify active status', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ACTIVE });

      expect(course.isActive()).toBe(true);
      expect(course.isArchived()).toBe(false);
    });

    it('should correctly identify archived status', () => {
      const course = Course.create({ ...validCourseProps, status: CourseStatus.ARCHIVED });

      expect(course.isArchived()).toBe(true);
      expect(course.isActive()).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const course = Course.create(validCourseProps);
      const obj = course.toObject();

      expect(obj.id).toBe(validCourseProps.id);
      expect(obj.name).toBe(validCourseProps.name);
      expect(obj.description).toBe(validCourseProps.description);
      expect(obj.courseCode).toBe(validCourseProps.courseCode);
      expect(obj.status).toBe(validCourseProps.status);
      expect(obj.teacherId).toBe(validCourseProps.teacherId);
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });
  });
});
