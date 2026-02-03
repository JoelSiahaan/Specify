/**
 * DownloadMaterialUseCase Property-Based Tests
 * 
 * Property-based tests for material download use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 8.2: Students and teachers can download course materials
 * - 20.3: Prevent unauthorized file access
 */

import * as fc from 'fast-check';
import { DownloadMaterialUseCase } from '../DownloadMaterialUseCase.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Material, MaterialType } from '../../../../domain/entities/Material.js';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import type { IMaterialRepository } from '../../../../domain/repositories/IMaterialRepository.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import type { IFileStorage } from '../../../../domain/storage/IFileStorage.js';
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

const mockFileStorage: jest.Mocked<IFileStorage> = {
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getMetadata: jest.fn()
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

// Helper to create test FILE material
function createTestFileMaterial(courseId: string): Material {
  return Material.create({
    id: randomUUID(),
    courseId,
    title: 'Test Material',
    type: MaterialType.FILE,
    filePath: '/uploads/test.pdf',
    fileName: 'test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Helper to create test TEXT material
function createTestTextMaterial(courseId: string): Material {
  return Material.create({
    id: randomUUID(),
    courseId,
    title: 'Test Material',
    type: MaterialType.TEXT,
    content: '<p>Test content</p>',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

describe('DownloadMaterialUseCase Properties', () => {
  let useCase: DownloadMaterialUseCase;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new DownloadMaterialUseCase(
      mockCourseRepository,
      mockMaterialRepository,
      mockUserRepository,
      mockEnrollmentRepository,
      mockFileStorage,
      mockAuthPolicy
    );
  });

  /**
   * Property 1: Teachers can download materials for their own courses
   * Feature: core-lms, Property 1: Teachers can download materials for their own courses
   * Validates: Requirements 8.2, 20.3
   * 
   * For any teacher and their own course, they can download FILE materials
   */
  it('Property 1: For any teacher and their own course, they can download FILE materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10240 }), // File size in bytes
        async (fileSize) => {
          // Create teacher and their course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());
          const material = createTestFileMaterial(course.getId());

          // Create file buffer
          const fileBuffer = Buffer.alloc(fileSize);

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null); // Teacher doesn't need enrollment
          mockAuthPolicy.canViewMaterials.mockReturnValue(true); // Teacher owns course
          mockFileStorage.download.mockResolvedValue(fileBuffer);

          // Execute use case
          const result = await useCase.execute(material.getId(), teacher.getId());

          // Property: Teacher can download file
          return (
            result.buffer.length === fileSize &&
            result.fileName === material.getFileName() &&
            result.mimeType === material.getMimeType()
          );
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 2: Students cannot download materials without enrollment
   * Feature: core-lms, Property 2: Students cannot download materials without enrollment
   * Validates: Requirements 8.2, 20.3
   * 
   * For any student not enrolled in a course, they cannot download materials
   */
  it('Property 2: For any student not enrolled in a course, they cannot download materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10240 }), // File size
        async (fileSize) => {
          // Create student and teacher's course
          const student = createTestUser(Role.STUDENT);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());
          const material = createTestFileMaterial(course.getId());

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(student);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null); // Not enrolled
          mockAuthPolicy.canViewMaterials.mockReturnValue(false); // Not enrolled

          // Property: Student cannot download
          try {
            await useCase.execute(material.getId(), student.getId());
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
   * Property 3: Only FILE type materials can be downloaded
   * Feature: core-lms, Property 3: Only FILE type materials can be downloaded
   * Validates: Requirements 8.2
   * 
   * For any non-FILE material, download attempt fails
   */
  it('Property 3: For any non-FILE material, download attempt fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(MaterialType.TEXT, MaterialType.VIDEO_LINK),
        async (materialType) => {
          // Create teacher and course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create non-FILE material
          const material = materialType === MaterialType.TEXT
            ? createTestTextMaterial(course.getId())
            : Material.create({
                id: randomUUID(),
                courseId: course.getId(),
                title: 'Video Material',
                type: MaterialType.VIDEO_LINK,
                content: 'https://www.youtube.com/watch?v=test',
                createdAt: new Date(),
                updatedAt: new Date()
              });

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
          mockAuthPolicy.canViewMaterials.mockReturnValue(true);

          // Property: Non-FILE materials cannot be downloaded
          try {
            await useCase.execute(material.getId(), teacher.getId());
            return false; // Should not succeed
          } catch (error) {
            return (
              error instanceof Error &&
              error.message.includes('Only FILE type materials can be downloaded')
            );
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 4: Authorization is always checked before download
   * Feature: core-lms, Property 4: Authorization is always checked before download
   * Validates: Requirements 8.2, 20.3
   * 
   * For any user and material, authorization must be checked before download
   */
  it('Property 4: For any user and material, authorization is checked before download', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Role.STUDENT, Role.TEACHER),
        fc.boolean(), // Authorization result
        async (role, isAuthorized) => {
          // Create user and course
          const user = createTestUser(role);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());
          const material = createTestFileMaterial(course.getId());

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(user);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(
            isAuthorized && role === Role.STUDENT ? { id: randomUUID() } : null
          );
          mockAuthPolicy.canViewMaterials.mockReturnValue(isAuthorized);
          mockFileStorage.download.mockResolvedValue(Buffer.alloc(1024));

          // Execute use case
          try {
            await useCase.execute(material.getId(), user.getId());

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
   * Property 5: Material not found results in error
   * Feature: core-lms, Property 5: Material not found results in error
   * Validates: Requirements 8.2
   * 
   * For any user, if material is not found, an error is thrown
   */
  it('Property 5: For any user, if material is not found, an error is thrown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // Material ID
        async (materialId) => {
          // Create user
          const user = createTestUser(Role.TEACHER);

          // Setup mocks - material not found
          mockUserRepository.findById.mockResolvedValue(user);
          mockMaterialRepository.findById.mockResolvedValue(null);

          // Property: Material not found throws error
          try {
            await useCase.execute(materialId, user.getId());
            return false; // Should not succeed
          } catch (error) {
            return error instanceof Error && error.message.includes('Material not found');
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 6: File not found in storage results in error
   * Feature: core-lms, Property 6: File not found in storage results in error
   * Validates: Requirements 8.2
   * 
   * For any authorized user, if file is not found in storage, an error is thrown
   */
  it('Property 6: For any authorized user, if file is not found in storage, an error is thrown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Role.STUDENT, Role.TEACHER),
        async (role) => {
          // Create user and course
          const user = createTestUser(role);
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());
          const material = createTestFileMaterial(course.getId());

          // Setup mocks - file not found in storage
          mockUserRepository.findById.mockResolvedValue(user);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValue(
            role === Role.STUDENT ? { id: randomUUID() } : null
          );
          mockAuthPolicy.canViewMaterials.mockReturnValue(true);
          mockFileStorage.download.mockRejectedValue(new Error('File not found'));

          // Property: File not found throws error
          try {
            await useCase.execute(material.getId(), user.getId());
            return false; // Should not succeed
          } catch (error) {
            return error instanceof Error && error.message.includes('File not found in storage');
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property 7: Downloaded file metadata matches material metadata
   * Feature: core-lms, Property 7: Downloaded file metadata matches material metadata
   * Validates: Requirements 8.2
   * 
   * For any authorized download, file metadata matches material metadata
   */
  it('Property 7: For any authorized download, file metadata matches material metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use alphanumeric strings with dots and dashes for file names
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789.-_'),
          { minLength: 1, maxLength: 100 }
        ).map(arr => arr.join('') || 'default.pdf'), // Ensure non-empty
        // Use alphanumeric strings with slashes for MIME types
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789/-'),
          { minLength: 1, maxLength: 50 }
        ).map(arr => arr.join('') || 'application/pdf'), // Ensure non-empty
        fc.integer({ min: 1, max: 10240 }), // File size
        async (fileName, mimeType, fileSize) => {
          // Create teacher and course
          const teacher = createTestUser(Role.TEACHER);
          const course = createTestCourse(teacher.getId());

          // Create material with specific metadata
          const material = Material.create({
            id: randomUUID(),
            courseId: course.getId(),
            title: 'Test Material',
            type: MaterialType.FILE,
            filePath: '/uploads/test.pdf',
            fileName: fileName,
            fileSize,
            mimeType: mimeType,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Create file buffer
          const fileBuffer = Buffer.alloc(fileSize);

          // Setup mocks
          mockUserRepository.findById.mockResolvedValue(teacher);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockCourseRepository.findById.mockResolvedValue(course);
          mockAuthPolicy.canViewMaterials.mockReturnValue(true);
          mockFileStorage.download.mockResolvedValue(fileBuffer);

          // Execute use case
          const result = await useCase.execute(material.getId(), teacher.getId());

          // Property: Metadata matches
          return (
            result.fileName === fileName &&
            result.mimeType === mimeType &&
            result.fileSize === fileSize &&
            result.buffer.length === fileSize
          );
        }
      ),
      propertyTestConfig
    );
  });
});
