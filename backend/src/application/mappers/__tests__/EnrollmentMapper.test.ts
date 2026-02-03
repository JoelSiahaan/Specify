/**
 * EnrollmentMapper Unit Tests
 * 
 * Tests for Enrollment entity to DTO mapping
 */

import { EnrollmentMapper } from '../EnrollmentMapper.js';
import { Enrollment } from '../../../domain/entities/Enrollment.js';

describe('EnrollmentMapper', () => {
  describe('toDTO', () => {
    it('should convert Enrollment entity to EnrollmentDTO', () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });

      // Act
      const dto = EnrollmentMapper.toDTO(enrollment);

      // Assert
      expect(dto).toEqual({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });
    });
  });

  describe('toDomain', () => {
    it('should create Enrollment entity from courseId and studentId', () => {
      // Arrange
      const courseId = 'course-456';
      const studentId = 'student-789';

      // Act
      const enrollment = EnrollmentMapper.toDomain(courseId, studentId);

      // Assert
      expect(enrollment.getCourseId()).toBe('course-456');
      expect(enrollment.getStudentId()).toBe('student-789');
      expect(enrollment.getId()).toBeDefined();
      expect(enrollment.getEnrolledAt()).toBeInstanceOf(Date);
    });
  });

  describe('toDTOList', () => {
    it('should convert array of Enrollment entities to array of EnrollmentDTOs', () => {
      // Arrange
      const enrollments = [
        Enrollment.create({
          id: 'enrollment-1',
          courseId: 'course-1',
          studentId: 'student-1',
          enrolledAt: new Date('2025-01-13T10:30:00Z')
        }),
        Enrollment.create({
          id: 'enrollment-2',
          courseId: 'course-2',
          studentId: 'student-2',
          enrolledAt: new Date('2025-01-14T10:30:00Z')
        })
      ];

      // Act
      const dtos = EnrollmentMapper.toDTOList(enrollments);

      // Assert
      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('enrollment-1');
      expect(dtos[0].courseId).toBe('course-1');
      expect(dtos[0].studentId).toBe('student-1');
      expect(dtos[1].id).toBe('enrollment-2');
      expect(dtos[1].courseId).toBe('course-2');
      expect(dtos[1].studentId).toBe('student-2');
    });
  });

  describe('toWithCourseDTO', () => {
    it('should convert Enrollment entity to EnrollmentWithCourseDTO with course info', () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });

      // Act
      const dto = EnrollmentMapper.toWithCourseDTO(
        enrollment,
        'Introduction to Programming',
        'ABC123',
        'John Doe'
      );

      // Assert
      expect(dto).toEqual({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z'),
        courseName: 'Introduction to Programming',
        courseCode: 'ABC123',
        teacherName: 'John Doe'
      });
    });

    it('should convert Enrollment entity to EnrollmentWithCourseDTO without course info', () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });

      // Act
      const dto = EnrollmentMapper.toWithCourseDTO(enrollment);

      // Assert
      expect(dto.courseName).toBeUndefined();
      expect(dto.courseCode).toBeUndefined();
      expect(dto.teacherName).toBeUndefined();
    });
  });

  describe('toWithCourseDTOList', () => {
    it('should convert array of Enrollment entities to array of EnrollmentWithCourseDTOs', () => {
      // Arrange
      const enrollments = [
        Enrollment.create({
          id: 'enrollment-1',
          courseId: 'course-1',
          studentId: 'student-1',
          enrolledAt: new Date('2025-01-13T10:30:00Z')
        }),
        Enrollment.create({
          id: 'enrollment-2',
          courseId: 'course-2',
          studentId: 'student-2',
          enrolledAt: new Date('2025-01-14T10:30:00Z')
        })
      ];

      const courseNames = new Map([
        ['course-1', 'Course 1'],
        ['course-2', 'Course 2']
      ]);

      const courseCodes = new Map([
        ['course-1', 'ABC123'],
        ['course-2', 'DEF456']
      ]);

      const teacherNames = new Map([
        ['course-1', 'Teacher 1'],
        ['course-2', 'Teacher 2']
      ]);

      // Act
      const dtos = EnrollmentMapper.toWithCourseDTOList(
        enrollments,
        courseNames,
        courseCodes,
        teacherNames
      );

      // Assert
      expect(dtos).toHaveLength(2);
      expect(dtos[0].courseName).toBe('Course 1');
      expect(dtos[0].courseCode).toBe('ABC123');
      expect(dtos[0].teacherName).toBe('Teacher 1');
      expect(dtos[1].courseName).toBe('Course 2');
      expect(dtos[1].courseCode).toBe('DEF456');
      expect(dtos[1].teacherName).toBe('Teacher 2');
    });
  });

  describe('toWithStudentDTO', () => {
    it('should convert Enrollment entity to EnrollmentWithStudentDTO with student info', () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });

      // Act
      const dto = EnrollmentMapper.toWithStudentDTO(
        enrollment,
        'Jane Smith',
        'jane@example.com'
      );

      // Assert
      expect(dto).toEqual({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z'),
        studentName: 'Jane Smith',
        studentEmail: 'jane@example.com'
      });
    });

    it('should convert Enrollment entity to EnrollmentWithStudentDTO without student info', () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: 'enrollment-123',
        courseId: 'course-456',
        studentId: 'student-789',
        enrolledAt: new Date('2025-01-13T10:30:00Z')
      });

      // Act
      const dto = EnrollmentMapper.toWithStudentDTO(enrollment);

      // Assert
      expect(dto.studentName).toBeUndefined();
      expect(dto.studentEmail).toBeUndefined();
    });
  });

  describe('toWithStudentDTOList', () => {
    it('should convert array of Enrollment entities to array of EnrollmentWithStudentDTOs', () => {
      // Arrange
      const enrollments = [
        Enrollment.create({
          id: 'enrollment-1',
          courseId: 'course-1',
          studentId: 'student-1',
          enrolledAt: new Date('2025-01-13T10:30:00Z')
        }),
        Enrollment.create({
          id: 'enrollment-2',
          courseId: 'course-2',
          studentId: 'student-2',
          enrolledAt: new Date('2025-01-14T10:30:00Z')
        })
      ];

      const studentNames = new Map([
        ['student-1', 'Student 1'],
        ['student-2', 'Student 2']
      ]);

      const studentEmails = new Map([
        ['student-1', 'student1@example.com'],
        ['student-2', 'student2@example.com']
      ]);

      // Act
      const dtos = EnrollmentMapper.toWithStudentDTOList(
        enrollments,
        studentNames,
        studentEmails
      );

      // Assert
      expect(dtos).toHaveLength(2);
      expect(dtos[0].studentName).toBe('Student 1');
      expect(dtos[0].studentEmail).toBe('student1@example.com');
      expect(dtos[1].studentName).toBe('Student 2');
      expect(dtos[1].studentEmail).toBe('student2@example.com');
    });
  });
});
