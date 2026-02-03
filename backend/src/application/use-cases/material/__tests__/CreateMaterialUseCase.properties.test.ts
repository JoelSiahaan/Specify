/**
 * CreateMaterialUseCase Property-Based Tests
 * 
 * Property-based tests for material creation use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 7.5: Enforce file size limit (10MB max)
 * - 7.9: Validate file size before upload
 * - 20.5: File size limit enforcement
 */

import * as fc from 'fast-check';
import { CreateMaterialUseCase } from '../CreateMaterialUseCase.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Material, MaterialType } from '../../../../domain/entities/Material.js';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import type { IMaterialRepository } from '../../../../domain/repositories/IMaterialRepository.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { CreateMaterialDTO } from '../../../dtos/MaterialDTO.js';
import { propertyTestConfig } from '../../../../test/property-test-utils.js';
import { randomUUID } from 'crypto';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

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

describe('CreateMaterialUseCase Properties', () => {
  let useCase: CreateMaterialUseCase;
  let teacher: User;
  let course: Course;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new CreateMaterialUseCase(
      mockCourseRepository,
      mockMaterialRepository,
      mockUserRepository,
      mockAuthPolicy
    );

    // Create test data
    teacher = createTestUser(Role.TEACHER);
    course = createTestCourse(teacher.getId());

    // Setup mock responses
    mockUserRepository.findById.mockResolvedValue(teacher);
    mockCourseRepository.findById.mockResolvedValue(course);
    mockAuthPolicy.canManageMaterials.mockReturnValue(true);
    mockMaterialRepository.save.mockImplementation(async (material: Material) => material);
  });

  /**
   * Property 16: File size limit enforcement
   * Feature: core-lms, Property 16: File size limit enforcement
   * Validates: Requirements 7.5, 7.9, 20.5
   * 
   * For any file upload, files exceeding 10MB are rejected
   */
  it('Property 16: For any file upload, files exceeding 10MB are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file size (both valid and invalid)
        fc.integer({ min: 1, max: 20 * 1024 * 1024 }), // 1 byte to 20MB
        // Generate file metadata
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fileName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => `${s}.pdf`),
          mimeType: fc.constantFrom(
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
          )
        }),
        async (fileSize, metadata) => {
          // Create material DTO with generated file size
          const dto: CreateMaterialDTO = {
            title: metadata.title,
            type: MaterialType.FILE,
            filePath: `/uploads/${randomUUID()}.pdf`,
            fileName: metadata.fileName,
            fileSize,
            mimeType: metadata.mimeType
          };

          // Property: Files exceeding 10MB must be rejected
          if (fileSize > MAX_FILE_SIZE) {
            // File exceeds limit - should be rejected
            try {
              await useCase.execute(dto, course.getId(), teacher.getId());
              return false; // Should not reach here - upload should fail
            } catch (error) {
              // Verify error indicates file size exceeded
              return (
                error instanceof Error &&
                (error.message.includes('File size exceeds') ||
                  error.message.includes('INVALID_FILE_SIZE'))
              );
            }
          } else {
            // File within limit - should be accepted
            try {
              const result = await useCase.execute(dto, course.getId(), teacher.getId());
              // Verify material was created successfully
              return result !== null && result.title === metadata.title;
            } catch (error) {
              // Should not fail for valid file size
              return false;
            }
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Additional property: Boundary testing for file size limit
   * Validates: Requirements 7.5, 7.9, 20.5
   * 
   * Files exactly at 10MB should be accepted, files at 10MB + 1 byte should be rejected
   */
  it('Property: File size boundary (10MB) is enforced correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file sizes around the boundary
        fc.constantFrom(
          MAX_FILE_SIZE - 1,     // Just under limit
          MAX_FILE_SIZE,         // Exactly at limit
          MAX_FILE_SIZE + 1      // Just over limit
        ),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fileName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => `${s}.pdf`),
          mimeType: fc.constantFrom('application/pdf')
        }),
        async (fileSize, metadata) => {
          // Create material DTO
          const dto: CreateMaterialDTO = {
            title: metadata.title,
            type: MaterialType.FILE,
            filePath: `/uploads/${randomUUID()}.pdf`,
            fileName: metadata.fileName,
            fileSize,
            mimeType: metadata.mimeType
          };

          // Property: Boundary enforcement
          if (fileSize > MAX_FILE_SIZE) {
            // Over limit - must be rejected
            try {
              await useCase.execute(dto, course.getId(), teacher.getId());
              return false; // Should not succeed
            } catch (error) {
              return error instanceof Error && error.message.includes('File size exceeds');
            }
          } else {
            // At or under limit - must be accepted
            try {
              const result = await useCase.execute(dto, course.getId(), teacher.getId());
              return result !== null;
            } catch (error) {
              return false; // Should not fail
            }
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: File size validation is consistent across multiple uploads
   * Validates: Requirements 7.5, 7.9, 20.5
   * 
   * For any sequence of file uploads, size limit is consistently enforced
   */
  it('Property: File size limit is consistently enforced across multiple uploads', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of file sizes
        fc.array(
          fc.integer({ min: 1, max: 20 * 1024 * 1024 }),
          { minLength: 2, maxLength: 5 }
        ),
        async (fileSizes) => {
          // Test each file size
          let allValidationsCorrect = true;

          for (const fileSize of fileSizes) {
            const dto: CreateMaterialDTO = {
              title: `Test Material ${fileSize}`,
              type: MaterialType.FILE,
              filePath: `/uploads/${randomUUID()}.pdf`,
              fileName: `file-${fileSize}.pdf`,
              fileSize,
              mimeType: 'application/pdf'
            };

            try {
              await useCase.execute(dto, course.getId(), teacher.getId());
              
              // If execution succeeded, file size must be within limit
              if (fileSize > MAX_FILE_SIZE) {
                allValidationsCorrect = false;
                break;
              }
            } catch (error) {
              // If execution failed, file size must exceed limit
              if (fileSize <= MAX_FILE_SIZE) {
                allValidationsCorrect = false;
                break;
              }
              
              // Verify error message is about file size
              if (!(error instanceof Error && error.message.includes('File size exceeds'))) {
                allValidationsCorrect = false;
                break;
              }
            }
          }

          // Property: All validations must be correct
          return allValidationsCorrect;
        }
      ),
      { ...propertyTestConfig, numRuns: 50 } // Reduced runs due to multiple uploads per test
    );
  });

  /**
   * Property: File size validation applies only to FILE type materials
   * Validates: Requirements 7.5, 7.9
   * 
   * TEXT and VIDEO_LINK materials should not be subject to file size validation
   */
  it('Property: File size validation only applies to FILE type materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(MaterialType.TEXT, MaterialType.VIDEO_LINK),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (materialType, title) => {
          // Create material DTO without file size (TEXT or VIDEO_LINK)
          const dto: CreateMaterialDTO = {
            title,
            type: materialType,
            content: materialType === MaterialType.TEXT 
              ? '<p>Test content</p>' 
              : 'https://www.youtube.com/watch?v=test'
          };

          // Property: Non-FILE materials should not fail due to missing file size
          try {
            const result = await useCase.execute(dto, course.getId(), teacher.getId());
            return result !== null;
          } catch (error) {
            // Should not fail due to file size validation
            if (error instanceof Error && error.message.includes('File size')) {
              return false;
            }
            // May fail for other reasons (e.g., invalid URL), which is acceptable
            return true;
          }
        }
      ),
      propertyTestConfig
    );
  });
});
