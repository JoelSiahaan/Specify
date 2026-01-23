/**
 * SearchCoursesUseCase Unit Tests
 * 
 * Tests the course search functionality for students.
 * 
 * Requirements:
 * - 6.1: Display only active courses with name, teacher, and description
 * - 6.2: NOT include archived courses in search results
 * - 6.3: Provide search box to filter active courses by name
 * - 6.4: Indicate which courses the student is already enrolled in
 */

import { SearchCoursesUseCase } from '../SearchCoursesUseCase';
import { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import { IEnrollmentRepository } from '../../../../domain/repositories/IEnrollmentRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Enrollment } from '../../../../domain/entities/Enrollment';
import { User, Role } from '../../../../domain/entities/User';
import { ApplicationError } from '../../../errors/ApplicationErrors';

describe('SearchCoursesUseCase', () => {
  let useCase: SearchCoursesUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  // Test data
  const studentId = 'student-uuid';
  const teacherId = 'teacher-uuid';

  const activeCourse1 = Course.reconstitute({
    id: 'course-1',
    name: 'Introduction to Programming',
    description: 'Learn programming basics',
    courseCode: 'ABC123',
    status: CourseStatus.ACTIVE,
    teacherId: teacherId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  });

  const activeCourse2 = Course.reconstitute({
    id: 'course-2',
    name: 'Advanced Algorithms',
    description: 'Learn advanced algorithms',
    courseCode: 'DEF456',
    status: CourseStatus.ACTIVE,
    teacherId: teacherId,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02')
  });

  const activeCourse3 = Course.reconstitute({
    id: 'course-3',
    name: 'Data Structures',
    description: 'Learn data structures',
    courseCode: 'GHI789',
    status: CourseStatus.ACTIVE,
    teacherId: teacherId,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03')
  });

  const student = User.reconstitute({
    id: studentId,
    email: 'student@example.com',
    name: 'John Student',
    role: Role.STUDENT,
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const enrollment1 = Enrollment.reconstitute({
    id: 'enrollment-1',
    courseId: 'course-1',
    studentId: studentId,
    enrolledAt: new Date()
  });

  beforeEach(() => {
    // Create mock repositories
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

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    };

    // Create use case with mocked dependencies
    useCase = new SearchCoursesUseCase(
      mockCourseRepository,
      mockEnrollmentRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should return only active courses (Requirement 6.1, 6.2)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId);

      // Assert
      expect(mockCourseRepository.findAll).toHaveBeenCalledWith(CourseStatus.ACTIVE);
      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(CourseStatus.ACTIVE);
      expect(result[1].status).toBe(CourseStatus.ACTIVE);
      expect(result[2].status).toBe(CourseStatus.ACTIVE);
    });

    it('should filter courses by name when query provided (Requirement 6.3)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: 'programming' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Introduction to Programming');
    });

    it('should filter courses case-insensitively (Requirement 6.3)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: 'ADVANCED' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Advanced Algorithms');
    });

    it('should filter courses by partial name match (Requirement 6.3)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: 'data' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Data Structures');
    });

    it('should indicate enrollment status for each course (Requirement 6.4)', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      
      // Student is enrolled in course-1 only
      mockEnrollmentRepository.findByStudentAndCourse.mockImplementation(
        async (studentId: string, courseId: string) => {
          if (courseId === 'course-1') {
            return enrollment1;
          }
          return null;
        }
      );

      // Act
      const result = await useCase.execute(studentId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].isEnrolled).toBe(true);  // course-1
      expect(result[1].isEnrolled).toBe(false); // course-2
      expect(result[2].isEnrolled).toBe(false); // course-3
    });

    it('should return all courses when no query provided', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId);

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no courses match query', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: 'nonexistent' });

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should trim whitespace from query', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: '  programming  ' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Introduction to Programming');
    });

    it('should return all courses when query is empty string', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([
        activeCourse1,
        activeCourse2,
        activeCourse3
      ]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId, { query: '' });

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should throw ApplicationError when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(studentId)).rejects.toThrow(ApplicationError);
      await expect(useCase.execute(studentId)).rejects.toThrow('User not found');
    });

    it('should include course details in response', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(student);
      mockCourseRepository.findAll.mockResolvedValue([activeCourse1]);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(studentId);

      // Assert
      expect(result[0]).toMatchObject({
        id: 'course-1',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        teacherId: teacherId,
        isEnrolled: false
      });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });
});
