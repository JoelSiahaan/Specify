/**
 * BulkUnenrollUseCase Unit Tests
 * 
 * Tests the bulk unenroll use case with mocked repositories.
 * Validates business rules and error scenarios.
 * 
 * Requirements:
 * - 5.8: Bulk unenroll students from archived courses
 */

import { BulkUnenrollUseCase } from '../BulkUnenrollUseCase.js';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository.js';
import { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Enrollment } from '../../../../domain/entities/Enrollment.js';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from '../../../errors/ApplicationErrors.js';

describe('BulkUnenrollUseCase', () => {
  let useCase: BulkUnenrollUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let mockAuthorizationPolicy: jest.Mocked<IAuthorizationPolicy>;

  // Test data
  const teacherId = 'teacher-uuid';
  const otherTeacherId = 'other-teacher-uuid';
  const studentId = 'student-uuid';
  const courseId = 'course-uuid';

  const createTeacher = (id: string = teacherId): User => {
    return User.create({
      id: id,
      email: `teacher-${id}@example.com`,
      name: 'Jane Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });
  };

  const createStudent = (): User => {
    return User.create({
      id: studentId,
      email: 'student@example.com',
      name: 'John Student',
      role: Role.STUDENT,
      passwordHash: 'hashed-password'
    });
  };

  const createActiveCourse = (): Course => {
    return Course.create({
      id: courseId,
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: teacherId
    });
  };

  const createArchivedCourse = (): Course => {
    const course = Course.create({
      id: courseId,
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: teacherId
    });
    course.archive();
    return course;
  };

  const createEnrollments = (count: number): Enrollment[] => {
    return Array.from({ length: count }, (_, i) => 
      Enrollment.create({
        id: `enrollment-${i}`,
        courseId: courseId,
        studentId: `student-${i}`
      })
    );
  };

  beforeEach(() => {
    // Create mock repositories
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    };

    mockCourseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTeacherId: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    };

    mockEnrollmentRepository = {
      save: jest.fn(),
      findByStudentAndCourse: jest.fn(),
      findByCourse: jest.fn(),
      deleteAllByCourse: jest.fn()
    };

    mockAuthorizationPolicy = {
      canAccessCourse: jest.fn(),
      canModifyCourse: jest.fn(),
      canArchiveCourse: jest.fn(),
      canDeleteCourse: jest.fn(),
      canCreateCourse: jest.fn(),
      canEnrollInCourse: jest.fn(),
      canViewMaterials: jest.fn(),
      canManageMaterials: jest.fn(),
      canViewAssignments: jest.fn(),
      canManageAssignments: jest.fn(),
      canSubmitAssignment: jest.fn(),
      canGradeSubmissions: jest.fn(),
      canViewSubmission: jest.fn(),
      canExportGrades: jest.fn(),
      canViewProgress: jest.fn()
    };

    // Create use case with mocked dependencies
    useCase = new BulkUnenrollUseCase(
      mockUserRepository,
      mockCourseRepository,
      mockEnrollmentRepository,
      mockAuthorizationPolicy
    );
  });

  describe('Successful Bulk Unenroll', () => {
    it('should bulk unenroll all students from archived course', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();
      const enrollments = createEnrollments(3);

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue(enrollments);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      const result = await useCase.execute(courseId, teacherId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.courseId).toBe(courseId);
      expect(result.unenrolledCount).toBe(3);
      expect(result.message).toContain('3 student(s)');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(teacherId);
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockAuthorizationPolicy.canDeleteCourse).toHaveBeenCalledWith(teacher, course);
      expect(mockEnrollmentRepository.findByCourse).toHaveBeenCalledWith(courseId);
      expect(mockEnrollmentRepository.deleteAllByCourse).toHaveBeenCalledWith(courseId);
    });

    it('should handle course with no enrollments', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue([]);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      const result = await useCase.execute(courseId, teacherId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.unenrolledCount).toBe(0);
      expect(result.message).toContain('0 student(s)');
    });
  });

  describe('Authentication Validation', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow(UnauthorizedError);
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow('User not found');
    });
  });

  describe('Course Validation', () => {
    it('should throw NotFoundError when course not found', async () => {
      // Arrange
      const teacher = createTeacher();
      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow('Course not found');
    });
  });

  describe('Authorization Validation', () => {
    it('should throw ForbiddenError when user is not course owner', async () => {
      // Arrange
      const otherTeacher = createTeacher(otherTeacherId);
      const course = createArchivedCourse();

      mockUserRepository.findById.mockResolvedValue(otherTeacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(courseId, otherTeacherId)).rejects.toThrow(ForbiddenError);
      await expect(useCase.execute(courseId, otherTeacherId)).rejects.toThrow('You do not have permission to unenroll students from this course');
    });

    it('should throw ForbiddenError when user is a student', async () => {
      // Arrange
      const student = createStudent();
      const course = createArchivedCourse();

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(false);

      // Act & Assert
      await expect(useCase.execute(courseId, studentId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Course Status Validation', () => {
    it('should throw ConflictError when course is active', async () => {
      // Arrange
      const teacher = createTeacher();
      const activeCourse = createActiveCourse();

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(activeCourse);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);

      // Act & Assert
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(courseId, teacherId)).rejects.toThrow('Can only bulk unenroll students from archived courses');
    });
  });

  describe('Repository Interactions', () => {
    it('should call repositories in correct order', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();
      const enrollments = createEnrollments(2);

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue(enrollments);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      await useCase.execute(courseId, teacherId);

      // Assert - verify call order
      const userCall = mockUserRepository.findById.mock.invocationCallOrder[0];
      const courseCall = mockCourseRepository.findById.mock.invocationCallOrder[0];
      const findEnrollmentsCall = mockEnrollmentRepository.findByCourse.mock.invocationCallOrder[0];
      const deleteCall = mockEnrollmentRepository.deleteAllByCourse.mock.invocationCallOrder[0];

      expect(userCall).toBeLessThan(courseCall);
      expect(courseCall).toBeLessThan(findEnrollmentsCall);
      expect(findEnrollmentsCall).toBeLessThan(deleteCall);
    });

    it('should get enrollment count before deletion', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();
      const enrollments = createEnrollments(5);

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue(enrollments);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      const result = await useCase.execute(courseId, teacherId);

      // Assert
      expect(mockEnrollmentRepository.findByCourse).toHaveBeenCalledWith(courseId);
      expect(result.unenrolledCount).toBe(5);
    });

    it('should pass correct courseId to deleteAllByCourse', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();
      const enrollments = createEnrollments(1);

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue(enrollments);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      await useCase.execute(courseId, teacherId);

      // Assert
      expect(mockEnrollmentRepository.deleteAllByCourse).toHaveBeenCalledWith(courseId);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      // Arrange
      const teacher = createTeacher();
      const course = createArchivedCourse();
      const enrollments = createEnrollments(3);

      mockUserRepository.findById.mockResolvedValue(teacher);
      mockCourseRepository.findById.mockResolvedValue(course);
      mockAuthorizationPolicy.canDeleteCourse.mockReturnValue(true);
      mockEnrollmentRepository.findByCourse.mockResolvedValue(enrollments);
      mockEnrollmentRepository.deleteAllByCourse.mockResolvedValue();

      // Act
      const result = await useCase.execute(courseId, teacherId);

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('courseId');
      expect(result).toHaveProperty('unenrolledCount');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.courseId).toBe('string');
      expect(typeof result.unenrolledCount).toBe('number');
    });
  });
});
