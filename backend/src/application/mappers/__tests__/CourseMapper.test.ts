/**
 * CourseMapper Unit Tests
 * 
 * Tests for Course entity to DTO mapping
 */

import { CourseMapper } from '../CourseMapper';
import { Course, CourseStatus } from '../../../domain/entities/Course';
import { CreateCourseDTO, UpdateCourseDTO } from '../../dtos/CourseDTO';

describe('CourseMapper', () => {
  describe('toDTO', () => {
    it('should convert Course entity to CourseDTO', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });

      // Act
      const dto = CourseMapper.toDTO(course);

      // Assert
      expect(dto).toEqual({
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
    });
  });

  describe('toDomain', () => {
    it('should convert CreateCourseDTO to Course entity', () => {
      // Arrange
      const dto: CreateCourseDTO = {
        name: 'Advanced Algorithms',
        description: 'Learn advanced algorithms'
      };
      const courseCode = 'DEF456';
      const teacherId = 'teacher-789';

      // Act
      const course = CourseMapper.toDomain(dto, courseCode, teacherId);

      // Assert
      expect(course.getName()).toBe('Advanced Algorithms');
      expect(course.getDescription()).toBe('Learn advanced algorithms');
      expect(course.getCourseCode()).toBe('DEF456');
      expect(course.getStatus()).toBe(CourseStatus.ACTIVE);
      expect(course.getTeacherId()).toBe('teacher-789');
      expect(course.getId()).toBeDefined();
      expect(course.getCreatedAt()).toBeInstanceOf(Date);
      expect(course.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('toDTOList', () => {
    it('should convert array of Course entities to array of CourseDTOs', () => {
      // Arrange
      const courses = [
        Course.create({
          id: 'course-1',
          name: 'Course 1',
          description: 'Description 1',
          courseCode: 'ABC123',
          status: CourseStatus.ACTIVE,
          teacherId: 'teacher-1',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        }),
        Course.create({
          id: 'course-2',
          name: 'Course 2',
          description: 'Description 2',
          courseCode: 'DEF456',
          status: CourseStatus.ARCHIVED,
          teacherId: 'teacher-2',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02')
        })
      ];

      // Act
      const dtos = CourseMapper.toDTOList(courses);

      // Assert
      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('course-1');
      expect(dtos[0].name).toBe('Course 1');
      expect(dtos[1].id).toBe('course-2');
      expect(dtos[1].name).toBe('Course 2');
    });
  });

  describe('toListDTO', () => {
    it('should convert Course entity to CourseListDTO with additional info', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });

      // Act
      const dto = CourseMapper.toListDTO(course, 'John Doe', 25);

      // Assert
      expect(dto).toEqual({
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        teacherName: 'John Doe',
        enrollmentCount: 25,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
    });

    it('should convert Course entity to CourseListDTO without additional info', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });

      // Act
      const dto = CourseMapper.toListDTO(course);

      // Assert
      expect(dto.teacherName).toBeUndefined();
      expect(dto.enrollmentCount).toBeUndefined();
    });
  });

  describe('applyUpdate', () => {
    it('should update course name when provided', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Old Name',
        description: 'Old Description',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
      const updateDTO: UpdateCourseDTO = {
        name: 'New Name'
      };

      // Act
      const updatedCourse = CourseMapper.applyUpdate(course, updateDTO);

      // Assert
      expect(updatedCourse.getName()).toBe('New Name');
      expect(updatedCourse.getDescription()).toBe('Old Description');
    });

    it('should update course description when provided', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Old Name',
        description: 'Old Description',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
      const updateDTO: UpdateCourseDTO = {
        description: 'New Description'
      };

      // Act
      const updatedCourse = CourseMapper.applyUpdate(course, updateDTO);

      // Assert
      expect(updatedCourse.getName()).toBe('Old Name');
      expect(updatedCourse.getDescription()).toBe('New Description');
    });

    it('should update both name and description when provided', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Old Name',
        description: 'Old Description',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
      const updateDTO: UpdateCourseDTO = {
        name: 'New Name',
        description: 'New Description'
      };

      // Act
      const updatedCourse = CourseMapper.applyUpdate(course, updateDTO);

      // Assert
      expect(updatedCourse.getName()).toBe('New Name');
      expect(updatedCourse.getDescription()).toBe('New Description');
    });

    it('should not update anything when no fields provided', () => {
      // Arrange
      const course = Course.create({
        id: 'course-123',
        name: 'Old Name',
        description: 'Old Description',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: 'teacher-456',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      });
      const updateDTO: UpdateCourseDTO = {};

      // Act
      const updatedCourse = CourseMapper.applyUpdate(course, updateDTO);

      // Assert
      expect(updatedCourse.getName()).toBe('Old Name');
      expect(updatedCourse.getDescription()).toBe('Old Description');
    });
  });
});
