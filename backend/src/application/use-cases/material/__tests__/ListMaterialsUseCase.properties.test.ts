/**
 * ListMaterialsUseCase Property-Based Tests
 * 
 * Property-based tests for material listing use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 8.1: Students and teachers can view course materials
 * - 2.1: Role-based access control (Student vs Teacher)
 * - 2.3: Enrollment-based access control
 */

import * as fc from 'fast-check';
import { ListMaterialsUseCase } from '../ListMaterialsUseCase.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Material, MaterialType } from '../../../../domain/entities/Material.js';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import type { IMaterialRepository } from '../../../../domain/repositories/IMaterialRepository.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { propertyTestConfig } from '../../../../test/property-test-utils.js';
import { randomUUID } from 'crypto';

// Mock repositories using jest.Mocked
const mockUserRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  delete: jest.fn()
};

const mockCourseRepository: jest.Mocked<ICourseRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByTeacherId: jest.fn(),
  findByCode: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn()
};

const mockMaterialRepository: jest.Mocked<IMaterialRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCourseId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteByCourseId: jest.fn()
};

const mockEnrollmentRepository: jest.Mocked<any> = {
  findById: jest.fn(),
  findByStudentId: jest.fn(),
  findByCourseId: jest.fn(),
  findByStudentAndCourse: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  bulkDelete: jest.fn(),
  update: jest.fn()
};

const mockAuthPolicy: jest.Mocked<IAuthorizationPolicy> = {
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

// Helper to create test user
function createTestUser(role: Role = Role.TEACHER, id?: string): User {
  return User.create({
    id: id || randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role,
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Helper to create test course
function createTestCourse(teacherId: string, id?: string): Course {
  return Course.create({
    id: id || randomUUID(),
    name: 'Test Course',
    description: 'Test Description',
    courseCode: 'ABC123',
    status: CourseStatus.ACTIVE,
    teacherId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Helper to create test material
function createTestMaterial(courseId: string, type: MaterialType = MaterialType.TEXT): Material {
  const baseProps = {
    id: randomUUID(),
    courseId,
    title: 'Test Material',
    type,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (type === MaterialType.FILE) {
    return Material.create({
      ...baseProps,
      filePath: '/uploads/test.pdf',
      fileName: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf'
    });
  } else if (type === MaterialType.TEXT) {
    return Material.create({
      ...baseProps,
      content: '<p>Test content</p>'
    });
  } else {
    return Material.create({
      ...baseProps,
      content: 'https://www.youtube.com/watch?v=test'
    });
  }
}

describe('ListMaterialsUseCase Properties', () => {
  let useCase: ListMaterialsUseCase;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new ListMaterialsUseCase(
      mockCourseRepository,
      mockMaterialRepository,
      mockUserRepository,
      mockEnrollmentRepository,
      mockAuthPolicy
    );
  });

  /**
   * Property 1: Teachers can view materials for their own courses
   * Feature: core-lms, Property 1: Teachers can view materials for their own courses
   * Validates: Requirements 8.1, 2.1
   * 
   * For any teacher and their own course, they can view all materials
   */
  it('Property 1: For any teacher and their own course, they can view all materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of materials
        fc.integer({ min: 0, max: 10 }),
        async (materialCount) => {
          // Create teacher and their course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create materials for the course
          const materials = Array.from({ length: materialCount }, () =>
            createTestMaterial(course.getId())
          );

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null); // Teacher doesn't need enrollment
          mockAuthPolicy.canViewMaterials.mockReturnValue(true); // Teacher owns course
          mockMaterialRepository.findByCourseId.mockResolvedValue(materials);

          // Execute use case
          const result = await useCase.execute(course.getId(), teacher.getId());

          // Property: Teacher can view all materials
          return result.length === materialCount;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 2: Students cannot view materials without enrollment
   * Feature: core-lms, Property 2: Students cannot view materials without enrollment
   * Validates: Requirements 8.1, 2.3
   * 
   * For any student not enrolled in a course, they cannot view materials
   */
  it('Property 2: For any student not enrolled in a course, they cannot view materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of materials
        async (materialCount) => {
          // Create student and teacher's course
          const student = createTestUser(Role.STUDENT);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create materials
          const materials = Array.from({ length: materialCount }, () =>
            createTestMaterial(course.getId())
          );

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(student);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null); // Not enrolled
          mockAuthPolicy.canViewMaterials.mockReturnValue(false); // Not enrolled
          mockMaterialRepository.findByCourseId.mockResolvedValue(materials);

          // Property: Student cannot view materials
          try {
            await useCase.execute(course.getId(), student.getId());
            return false; // Should not succeed
          } catch (error) {
            // Verify error is about authorization
            return (
              error instanceof Error &&
              (error.message.includes('permission') || error.message.includes('FORBIDDEN'))
            );
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 3: Authorization is always checked before listing materials
   * Feature: core-lms, Property 3: Authorization is always checked before listing materials
   * Validates: Requirements 8.1, 2.1
   * 
   * For any user and course, authorization must be checked before materials are listed
   */
  it('Property 3: For any user and course, authorization is checked before listing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Role.STUDENT, Role.TEACHER),
        fc.boolean(), // Authorization result
        async (role, isAuthorized) => {
          // Create user and course
          const user = createTestUser(role);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(user);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(
            isAuthorized && role === Role.STUDENT ? { id: randomUUID() } : null
          );
          mockAuthPolicy.canViewMaterials.mockReturnValue(isAuthorized);
          mockMaterialRepository.findByCourseId.mockResolvedValue([]);

          // Execute use case
          try {
            await useCase.execute(course.getId(), user.getId());

            // If succeeded, authorization must have been granted
            if (!isAuthorized) {
              return false;
            }

            // Verify authorization was checked
            return mockAuthPolicy.canViewMaterials.mock.calls.length > 0;
          } catch (error) {
            // If failed, authorization must have been denied
            if (isAuthorized) {
              return false;
            }

            // Verify authorization was checked
            return mockAuthPolicy.canViewMaterials.mock.calls.length > 0;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 4: Empty material list is valid
   * Feature: core-lms, Property 4: Empty material list is valid
   * Validates: Requirements 8.1
   * 
   * For any authorized user, an empty material list is a valid result
   */
  it('Property 4: For any authorized user, an empty material list is valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Role.STUDENT, Role.TEACHER),
        async (role) => {
          // Create user and course
          const user = createTestUser(role);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(user);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(
            role === Role.STUDENT ? { id: randomUUID() } : null
          );
          mockAuthPolicy.canViewMaterials.mockReturnValue(true); // Authorized
          mockMaterialRepository.findByCourseId.mockResolvedValue([]); // Empty list

          // Execute use case
          const result = await useCase.execute(course.getId(), user.getId());

          // Property: Empty list is valid
          return Array.isArray(result) && result.length === 0;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 5: Material count matches repository result
   * Feature: core-lms, Property 5: Material count matches repository result
   * Validates: Requirements 8.1
   * 
   * For any authorized user, the number of materials returned matches the repository
   */
  it('Property 5: For any authorized user, material count matches repository', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }), // Number of materials
        async (materialCount) => {
          // Create user and course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create materials
          const materials = Array.from({ length: materialCount }, () =>
            createTestMaterial(course.getId())
          );

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
          mockAuthPolicy.canViewMaterials.mockReturnValue(true);
          mockMaterialRepository.findByCourseId.mockResolvedValue(materials);

          // Execute use case
          const result = await useCase.execute(course.getId(), teacher.getId());

          // Property: Count matches
          return result.length === materialCount;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 6: All material types are supported
   * Feature: core-lms, Property 6: All material types are supported
   * Validates: Requirements 8.1
   * 
   * For any material type (FILE, TEXT, VIDEO_LINK), materials can be listed
   */
  it('Property 6: For any material type, materials can be listed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        fc.integer({ min: 1, max: 5 }), // Number of materials
        async (materialType, materialCount) => {
          // Create teacher and course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create materials of specific type
          const materials = Array.from({ length: materialCount }, () =>
            createTestMaterial(course.getId(), materialType)
          );

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
          mockAuthPolicy.canViewMaterials.mockReturnValue(true);
          mockMaterialRepository.findByCourseId.mockResolvedValue(materials);

          // Execute use case
          const result = await useCase.execute(course.getId(), teacher.getId());

          // Property: All materials are returned
          return result.length === materialCount && result.every(m => m.type === materialType);
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 7: User not found results in error
   * Feature: core-lms, Property 7: User not found results in error
   * Validates: Requirements 8.1
   * 
   * For any course, if user is not found, an error is thrown
   */
  it('Property 7: For any course, if user is not found, an error is thrown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // User ID
        async (userId) => {
          // Create course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Setup mocks - user not found
          mockUserRepository.findById.mockResolvedValue(null);
          mockCourseRepository.findById.mockResolvedValue(course);

          // Property: User not found throws error
          try {
            await useCase.execute(course.getId(), userId);
            return false; // Should not succeed
          } catch (error) {
            return error instanceof Error && error.message.includes('User not found');
          }
        }
      ),
      propertyTestConfig
    );
  });
});
