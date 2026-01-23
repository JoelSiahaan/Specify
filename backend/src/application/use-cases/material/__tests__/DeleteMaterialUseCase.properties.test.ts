/**
 * DeleteMaterialUseCase Property-Based Tests
 * 
 * Property-based tests for material deletion use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 7.6: Allow teachers to delete materials
 * - File cleanup for FILE type materials
 */

import * as fc from 'fast-check';
import { DeleteMaterialUseCase } from '../DeleteMaterialUseCase';
import { User, Role } from '../../../../domain/entities/User';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { Material, MaterialType } from '../../../../domain/entities/Material';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository';
import type { IMaterialRepository } from '../../../../domain/repositories/IMaterialRepository';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import type { IFileStorage } from '../../../../domain/storage/IFileStorage';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy';
import { propertyTestConfig } from '../../../../test/property-test-utils';
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
function createTestUser(role: Role = Role.TEACHER): User {
  return User.create({
    id: randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role,
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Helper to create test course
function createTestCourse(teacherId: string): Course {
  return Course.create({
    id: randomUUID(),
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
function createTestMaterial(courseId: string, type: MaterialType): Material {
  const baseProps = {
    id: randomUUID(),
    courseId,
    title: 'Test Material',
    type,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  switch (type) {
    case MaterialType.FILE:
      return Material.create({
        ...baseProps,
        filePath: `/uploads/${randomUUID()}.pdf`,
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      });
    case MaterialType.TEXT:
      return Material.create({
        ...baseProps,
        content: '<p>Test content</p>'
      });
    case MaterialType.VIDEO_LINK:
      return Material.create({
        ...baseProps,
        content: 'https://www.youtube.com/watch?v=test'
      });
  }
}

describe('DeleteMaterialUseCase Properties', () => {
  let useCase: DeleteMaterialUseCase;
  let teacher: User;
  let course: Course;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new DeleteMaterialUseCase(
      mockCourseRepository,
      mockMaterialRepository,
      mockUserRepository,
      mockFileStorage,
      mockAuthPolicy
    );

    // Create test data
    teacher = createTestUser(Role.TEACHER);
    course = createTestCourse(teacher.getId());

    // Setup mock responses
    mockUserRepository.findById.mockResolvedValue(teacher);
    mockCourseRepository.findById.mockResolvedValue(course);
    mockAuthPolicy.canManageMaterials.mockReturnValue(true);
    mockMaterialRepository.delete.mockResolvedValue(undefined);
    mockFileStorage.delete.mockResolvedValue(undefined);
  });

  /**
   * Property: FILE materials trigger file deletion from storage
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any FILE material deletion, the associated file is deleted from storage
   */
  it('Property: For any FILE material deletion, the associated file is deleted from storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file metadata
        fc.record({
          fileName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => `${s}.pdf`),
          fileSize: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          mimeType: fc.constantFrom(
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
          )
        }),
        async (fileMetadata) => {
          // Create FILE material with generated metadata
          const filePath = `/uploads/${randomUUID()}.pdf`;
          const material = Material.create({
            id: randomUUID(),
            courseId: course.getId(),
            title: 'Test File Material',
            type: MaterialType.FILE,
            filePath,
            fileName: fileMetadata.fileName,
            fileSize: fileMetadata.fileSize,
            mimeType: fileMetadata.mimeType
          });

          mockMaterialRepository.findById.mockResolvedValue(material);

          // Property: File deletion must be called for FILE materials
          try {
            await useCase.execute(material.getId(), teacher.getId());
            
            // Verify file storage delete was called with correct path
            return mockFileStorage.delete.mock.calls.some(
              call => call[0] === filePath
            );
          } catch (error) {
            // Should not fail for valid deletion
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Non-FILE materials do not trigger file deletion
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any TEXT or VIDEO_LINK material deletion, file storage is not accessed
   */
  it('Property: For any TEXT or VIDEO_LINK deletion, file storage is not accessed', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate non-FILE material type
        fc.constantFrom(MaterialType.TEXT, MaterialType.VIDEO_LINK),
        async (materialType) => {
          // Create non-FILE material
          const material = createTestMaterial(course.getId(), materialType);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Property: File storage delete must NOT be called
          try {
            await useCase.execute(material.getId(), teacher.getId());
            
            // Verify file storage delete was NOT called
            return mockFileStorage.delete.mock.calls.length === 0;
          } catch (error) {
            // Should not fail for valid deletion
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Material deletion always removes database record
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any material deletion, the database record is always removed
   */
  it('Property: For any material deletion, the database record is always removed', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate any material type
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        async (materialType) => {
          // Create material of any type
          const material = createTestMaterial(course.getId(), materialType);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Property: Repository delete must always be called
          try {
            await useCase.execute(material.getId(), teacher.getId());
            
            // Verify repository delete was called with correct ID
            return mockMaterialRepository.delete.mock.calls.some(
              call => call[0] === material.getId()
            );
          } catch (error) {
            // Should not fail for valid deletion
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: File deletion failure does not prevent database deletion
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any FILE material deletion, if file deletion fails, database record is still removed
   */
  it('Property: File deletion failure does not prevent database record deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file metadata
        fc.record({
          fileName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => `${s}.pdf`),
          fileSize: fc.integer({ min: 1, max: 10 * 1024 * 1024 })
        }),
        async (fileMetadata) => {
          // Create FILE material
          const material = Material.create({
            id: randomUUID(),
            courseId: course.getId(),
            title: 'Test File Material',
            type: MaterialType.FILE,
            filePath: `/uploads/${randomUUID()}.pdf`,
            fileName: fileMetadata.fileName,
            fileSize: fileMetadata.fileSize,
            mimeType: 'application/pdf'
          });

          mockMaterialRepository.findById.mockResolvedValue(material);
          
          // Simulate file deletion failure
          mockFileStorage.delete.mockRejectedValue(new Error('File not found'));

          // Property: Database deletion must still succeed
          try {
            await useCase.execute(material.getId(), teacher.getId());
            
            // Verify repository delete was still called
            return mockMaterialRepository.delete.mock.calls.some(
              call => call[0] === material.getId()
            );
          } catch (error) {
            // Should not fail - file deletion errors are handled gracefully
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Authorization is checked before deletion
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any material deletion attempt, authorization is verified first
   */
  it('Property: Authorization is always checked before deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate material type
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        // Generate authorization result
        fc.boolean(),
        async (materialType, isAuthorized) => {
          // Reset mocks for this iteration
          mockAuthPolicy.canManageMaterials.mockClear();
          mockFileStorage.delete.mockClear();
          mockMaterialRepository.delete.mockClear();
          
          // Create material
          const material = createTestMaterial(course.getId(), materialType);
          mockMaterialRepository.findById.mockResolvedValue(material);
          mockAuthPolicy.canManageMaterials.mockReturnValue(isAuthorized);

          // Property: Deletion only succeeds if authorized
          try {
            await useCase.execute(material.getId(), teacher.getId());
            
            // If execution succeeded, user must have been authorized
            if (!isAuthorized) {
              return false; // Should have failed authorization
            }
            
            // Verify authorization was checked
            return mockAuthPolicy.canManageMaterials.mock.calls.length > 0;
          } catch (error) {
            // If execution failed, user must not have been authorized
            if (isAuthorized) {
              return false; // Should have succeeded
            }
            
            // Verify error is authorization-related
            return (
              error instanceof Error &&
              (error.message.includes('permission') || 
               error.message.includes('FORBIDDEN') ||
               error.message.includes('owner'))
            );
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Deletion is idempotent for authorization failures
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any unauthorized deletion attempt, no side effects occur
   */
  it('Property: Unauthorized deletion attempts have no side effects', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate material type
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        async (materialType) => {
          // Create material
          const material = createTestMaterial(course.getId(), materialType);
          mockMaterialRepository.findById.mockResolvedValue(material);
          
          // Deny authorization
          mockAuthPolicy.canManageMaterials.mockReturnValue(false);

          // Property: No deletion operations should occur
          try {
            await useCase.execute(material.getId(), teacher.getId());
            return false; // Should have failed authorization
          } catch (error) {
            // Verify no deletion operations were performed
            const noFileDeleted = mockFileStorage.delete.mock.calls.length === 0;
            const noDbDeleted = mockMaterialRepository.delete.mock.calls.length === 0;
            
            return noFileDeleted && noDbDeleted;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Multiple deletions of same material type are consistent
   * Feature: core-lms
   * Validates: Requirements 7.6
   * 
   * For any sequence of material deletions of the same type, behavior is consistent
   */
  it('Property: Multiple deletions of same type are handled consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate material type
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        // Generate number of materials to delete
        fc.integer({ min: 2, max: 5 }),
        async (materialType, count) => {
          // Track file deletion calls for FILE materials
          let fileDeleteCallCount = 0;
          let dbDeleteCallCount = 0;

          // Delete multiple materials of same type
          for (let i = 0; i < count; i++) {
            // Reset mock call counts
            mockFileStorage.delete.mockClear();
            mockMaterialRepository.delete.mockClear();

            // Create material
            const material = createTestMaterial(course.getId(), materialType);
            mockMaterialRepository.findById.mockResolvedValue(material);

            try {
              await useCase.execute(material.getId(), teacher.getId());
              
              // Count deletion calls
              fileDeleteCallCount += mockFileStorage.delete.mock.calls.length;
              dbDeleteCallCount += mockMaterialRepository.delete.mock.calls.length;
            } catch (error) {
              return false; // Should not fail
            }
          }

          // Property: Behavior must be consistent
          // - FILE materials: file delete called once per material
          // - Non-FILE materials: file delete never called
          // - All materials: db delete called once per material
          const fileDeletesCorrect = materialType === MaterialType.FILE
            ? fileDeleteCallCount === count
            : fileDeleteCallCount === 0;
          
          const dbDeletesCorrect = dbDeleteCallCount === count;

          return fileDeletesCorrect && dbDeletesCorrect;
        }
      ),
      { ...propertyTestConfig, numRuns: 50 } // Reduced runs due to multiple deletions per test
    );
  });
});
