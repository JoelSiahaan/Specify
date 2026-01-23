/**
 * EnrollStudentUseCase Unit Tests
 * 
 * Tests the enrollment use case with mocked repositories.
 * Validates business rules and error scenarios.
 * 
 * Requirements:
 * - 6.5: Enroll student in active course
 * - 6.6: Reject enrollment for archived courses
 * - 6.7: Reject enrollment with invalid course code
 * - 6.8: Prevent duplicate enrollment
 */

import { EnrollStudentUseCase } from '../EnrollStudentUseCase';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Enrollment } from '../../../../domain/entities/Enrollment';
import { CreateEnrollmentDTO } from '../../../dtos/EnrollmentDTO';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from '../../../errors/ApplicationErrors';

describe('EnrollStudentUseCase', () => {
  let useCase: EnrollStudentUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;

  // Test data
  const studentId = 'student-uuid';
  const teacherId = 'teacher-uuid';
  const courseId = 'course-uuid';
  const courseCode = 'ABC123';

  const createStudent = (): User => {
    return User.create({
      id: studentId,
      email: 'student@example.com',
      name: 'John Student',
      role: Role.STUDENT,
      passwordHash: 'hashed-password'
    });
  };

  const createTeacher = (): User => {
    return User.create({
      id: teacherId,
      email: 'teacher@example.com',
      name: 'Jane Teacher',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });
  };

  const createActiveCourse = (): Course => {
    return Course.create({
      id: courseId,
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: courseCode,
      status: CourseStatus.ACTIVE,
      teacherId: teacherId
    });
  };

  const createArchivedCourse = (): Course => {
    const course = Course.create({
      id: courseId,
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: courseCode,
      status: CourseStatus.ACTIVE,
      teacherId: teacherId
    });
    course.archive();
    return course;
  };

  const createEnrollment = (): Enrollment => {
    return Enrollment.create({
      id: 'enrollment-uuid',
      courseId: courseId,
      studentId: studentId
    });
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

    // Create use case with mocked dependencies
    useCase = new EnrollStudentUseCase(
      mockUserRepository,
      mockCourseRepository,
      mockEnrollmentRepository
    );
  });

  describe('Successful Enrollment', () => {
    it('should enroll student in active course', async () => {
      // Arrange
      const student = createStudent();
      const course = createActiveCourse();
      const enrollment = createEnrollment();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockEnrollmentRepository.save.mockResolvedValue(enrollment);

      // Act
      const result = await useCase.execute(dto, studentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.courseId).toBe(courseId);
      expect(result.studentId).toBe(studentId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(studentId);
      expect(mockCourseRepository.findByCode).toHaveBeenCalledWith(courseCode);
      expect(mockEnrollmentRepository.findByStudentAndCourse).toHaveBeenCalledWith(studentId, courseId);
      expect(mockEnrollmentRepository.save).toHaveBeenCalled();
    });
  });

  describe('Authentication Validation', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto, studentId)).rejects.toThrow(UnauthorizedError);
      await expect(useCase.execute(dto, studentId)).rejects.toThrow('User not found');
    });
  });

  describe('Role Validation', () => {
    it('should throw ForbiddenError when user is not a student', async () => {
      // Arrange
      const teacher = createTeacher();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(teacher);

      // Act & Assert
      await expect(useCase.execute(dto, teacherId)).rejects.toThrow(ForbiddenError);
      await expect(useCase.execute(dto, teacherId)).rejects.toThrow('Only students can enroll in courses');
    });
  });

  describe('Course Code Validation', () => {
    it('should throw NotFoundError when course code is invalid', async () => {
      // Arrange
      const student = createStudent();
      const dto: CreateEnrollmentDTO = { courseCode: 'INVALID' };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto, studentId)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(dto, studentId)).rejects.toThrow('Invalid course code');
    });
  });

  describe('Course Status Validation', () => {
    it('should throw ConflictError when course is archived', async () => {
      // Arrange
      const student = createStudent();
      const archivedCourse = createArchivedCourse();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(archivedCourse);

      // Act & Assert
      await expect(useCase.execute(dto, studentId)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(dto, studentId)).rejects.toThrow('Cannot enroll in archived course');
    });
  });

  describe('Duplicate Enrollment Prevention', () => {
    it('should throw ConflictError when student is already enrolled', async () => {
      // Arrange
      const student = createStudent();
      const course = createActiveCourse();
      const existingEnrollment = createEnrollment();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(existingEnrollment);

      // Act & Assert
      await expect(useCase.execute(dto, studentId)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(dto, studentId)).rejects.toThrow('Student is already enrolled in this course');
    });
  });

  describe('Repository Interactions', () => {
    it('should call repositories in correct order', async () => {
      // Arrange
      const student = createStudent();
      const course = createActiveCourse();
      const enrollment = createEnrollment();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockEnrollmentRepository.save.mockResolvedValue(enrollment);

      // Act
      await useCase.execute(dto, studentId);

      // Assert - verify call order
      const userCall = mockUserRepository.findById.mock.invocationCallOrder[0];
      const courseCall = mockCourseRepository.findByCode.mock.invocationCallOrder[0];
      const duplicateCall = mockEnrollmentRepository.findByStudentAndCourse.mock.invocationCallOrder[0];
      const saveCall = mockEnrollmentRepository.save.mock.invocationCallOrder[0];

      expect(userCall).toBeLessThan(courseCall);
      expect(courseCall).toBeLessThan(duplicateCall);
      expect(duplicateCall).toBeLessThan(saveCall);
    });

    it('should pass correct parameters to save method', async () => {
      // Arrange
      const student = createStudent();
      const course = createActiveCourse();
      const enrollment = createEnrollment();
      const dto: CreateEnrollmentDTO = { courseCode: courseCode };

      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findByCode.mockResolvedValue(course);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      mockEnrollmentRepository.save.mockResolvedValue(enrollment);

      // Act
      await useCase.execute(dto, studentId);

      // Assert
      expect(mockEnrollmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getCourseId: expect.any(Function),
          getStudentId: expect.any(Function)
        })
      );

      const savedEnrollment = mockEnrollmentRepository.save.mock.calls[0][0];
      expect(savedEnrollment.getCourseId()).toBe(courseId);
      expect(savedEnrollment.getStudentId()).toBe(studentId);
    });
  });
});
