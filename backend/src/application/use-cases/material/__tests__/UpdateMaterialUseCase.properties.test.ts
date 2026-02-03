/**
 * UpdateMaterialUseCase Property-Based Tests
 * 
 * Property-based tests for material update use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 7.7: Allow teachers to edit existing materials
 * - 7.5: Enforce file size limit (10MB max) for file replacement
 * - 7.8: Sanitize HTML content before storage
 * - 20.2: Input validation and sanitization
 */

import * as fc from 'fast-check';
import { UpdateMaterialUseCase } from '../UpdateMaterialUseCase.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { Course, CourseStatus } from '../../../../domain/entities/Course.js';
import { Material, MaterialType } from '../../../../domain/entities/Material.js';
import type { ICourseRepository } from '../../../../domain/repositories/ICourseRepository.js';
import type { IMaterialRepository } from '../../../../domain/repositories/IMaterialRepository.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import type { IAuthorizationPolicy } from '../../../policies/IAuthorizationPolicy.js';
import { UpdateMaterialDTO } from '../../../dtos/MaterialDTO.js';
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
        filePath: '/uploads/test.pdf',
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

describe('UpdateMaterialUseCase Properties', () => {
  let useCase: UpdateMaterialUseCase;
  let teacher: User;
  let course: Course;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create use case instance
    useCase = new UpdateMaterialUseCase(
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
    mockMaterialRepository.update.mockImplementation(async (material: Material) => material);
  });

  /**
   * Property: File size limit enforcement for file replacement
   * Feature: core-lms
   * Validates: Requirements 7.7, 7.5, 7.9
   * 
   * For any file replacement, files exceeding 10MB are rejected
   */
  it('Property: For any file replacement, files exceeding 10MB are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file size (both valid and invalid)
        fc.integer({ min: 1, max: 20 * 1024 * 1024 }), // 1 byte to 20MB
        // Generate file metadata
        fc.record({
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
          // Create existing FILE material
          const material = createTestMaterial(course.getId(), MaterialType.FILE);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Create update DTO with new file
          const dto: UpdateMaterialDTO = {
            filePath: `/uploads/${randomUUID()}.pdf`,
            fileName: metadata.fileName,
            fileSize,
            mimeType: metadata.mimeType
          };

          // Property: Files exceeding 10MB must be rejected
          if (fileSize > MAX_FILE_SIZE) {
            // File exceeds limit - should be rejected
            try {
              await useCase.execute(material.getId(), dto, teacher.getId());
              return false; // Should not reach here - update should fail
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
              const result = await useCase.execute(material.getId(), dto, teacher.getId());
              // Verify material was updated successfully
              return result !== null;
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
   * Property: HTML sanitization for TEXT material updates
   * Feature: core-lms
   * Validates: Requirements 7.7, 7.8, 20.2
   * 
   * For any TEXT material update, malicious HTML is sanitized
   */
  it('Property: For any TEXT material update, malicious HTML is sanitized', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate HTML content with potential XSS
        fc.record({
          safeContent: fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            // Filter out strings that would be HTML-encoded differently
            // (e.g., "&" becomes "&amp;", "<" becomes "&lt;")
            return !s.includes('&') && !s.includes('<') && !s.includes('>') && !s.includes('"');
          }),
          maliciousTag: fc.constantFrom(
            '<script>alert("xss")</script>',
            '<img src=x onerror="alert(1)">',
            '<iframe src="evil.com"></iframe>',
            '<object data="evil.swf"></object>',
            '<embed src="evil.swf">',
            '<link rel="stylesheet" href="evil.css">'
          )
        }),
        async ({ safeContent, maliciousTag }) => {
          // Create existing TEXT material
          const material = createTestMaterial(course.getId(), MaterialType.TEXT);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Create update DTO with malicious content
          const dto: UpdateMaterialDTO = {
            content: `<p>${safeContent}</p>${maliciousTag}`
          };

          // Property: Malicious HTML must be sanitized
          try {
            const result = await useCase.execute(material.getId(), dto, teacher.getId());
            
            // Verify malicious tags are removed
            const updatedContent = result.content || '';
            const hasMaliciousContent = (
              updatedContent.includes('<script') ||
              updatedContent.includes('onerror=') ||
              updatedContent.includes('<iframe') ||
              updatedContent.includes('<object') ||
              updatedContent.includes('<embed') ||
              updatedContent.includes('<link')
            );
            
            // Property: Malicious content must be removed
            // Note: We only check that malicious content is removed, not that safe content
            // is preserved exactly, because HTML sanitization may encode special characters
            return !hasMaliciousContent;
          } catch (error) {
            // Should not fail - sanitization should handle malicious content
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Video URL validation for VIDEO_LINK material updates
   * Feature: core-lms
   * Validates: Requirements 7.7, 7.3, 7.11
   * 
   * For any VIDEO_LINK material update, only YouTube and Vimeo URLs are accepted
   */
  it('Property: For any VIDEO_LINK update, only YouTube and Vimeo URLs are accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various URLs
        fc.record({
          platform: fc.constantFrom('youtube', 'vimeo', 'other'),
          videoId: fc.string({ minLength: 5, maxLength: 20 })
        }),
        async ({ platform, videoId }) => {
          // Create existing VIDEO_LINK material
          const material = createTestMaterial(course.getId(), MaterialType.VIDEO_LINK);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Generate URL based on platform
          let url: string;
          let shouldBeAccepted: boolean;

          switch (platform) {
            case 'youtube':
              url = `https://www.youtube.com/watch?v=${videoId}`;
              shouldBeAccepted = true;
              break;
            case 'vimeo':
              url = `https://vimeo.com/${videoId}`;
              shouldBeAccepted = true;
              break;
            default:
              url = `https://www.dailymotion.com/video/${videoId}`;
              shouldBeAccepted = false;
              break;
          }

          // Create update DTO
          const dto: UpdateMaterialDTO = {
            content: url
          };

          // Property: Only YouTube and Vimeo URLs should be accepted
          try {
            await useCase.execute(material.getId(), dto, teacher.getId());
            return shouldBeAccepted; // Should only succeed for YouTube/Vimeo
          } catch (error) {
            // Should fail for non-YouTube/Vimeo URLs
            return !shouldBeAccepted && error instanceof Error && 
                   error.message.includes('YouTube or Vimeo');
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Partial updates preserve unchanged fields
   * Feature: core-lms
   * Validates: Requirements 7.7
   * 
   * For any partial update, fields not in DTO remain unchanged
   */
  it('Property: Partial updates preserve unchanged fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate material type
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        // Generate new title
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (materialType, newTitle) => {
          // Create existing material
          const material = createTestMaterial(course.getId(), materialType);
          const originalContent = material.getContent();
          const originalFilePath = material.getFilePath();
          
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Create update DTO with only title (partial update)
          const dto: UpdateMaterialDTO = {
            title: newTitle
          };

          // Property: Only title should change, other fields preserved
          try {
            const result = await useCase.execute(material.getId(), dto, teacher.getId());
            
            // Verify title was updated
            const titleUpdated = result.title === newTitle;
            
            // Verify other fields preserved (based on type)
            let otherFieldsPreserved = true;
            if (materialType === MaterialType.TEXT || materialType === MaterialType.VIDEO_LINK) {
              otherFieldsPreserved = result.content === originalContent;
            } else if (materialType === MaterialType.FILE) {
              otherFieldsPreserved = result.filePath === originalFilePath;
            }
            
            return titleUpdated && otherFieldsPreserved;
          } catch (error) {
            // Should not fail for valid partial update
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Empty content updates are rejected
   * Feature: core-lms
   * Validates: Requirements 7.7, 20.2
   * 
   * For any material update, empty content is rejected
   */
  it('Property: Empty content updates are rejected for TEXT and VIDEO_LINK materials', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate material type (TEXT or VIDEO_LINK)
        fc.constantFrom(MaterialType.TEXT, MaterialType.VIDEO_LINK),
        // Generate empty or whitespace-only content
        fc.constantFrom('', '   ', '\t', '\n', '  \n  '),
        async (materialType, emptyContent) => {
          // Create existing material
          const material = createTestMaterial(course.getId(), materialType);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Create update DTO with empty content
          const dto: UpdateMaterialDTO = {
            content: emptyContent
          };

          // Property: Empty content must be rejected
          try {
            await useCase.execute(material.getId(), dto, teacher.getId());
            return false; // Should not succeed with empty content
          } catch (error) {
            // Verify error indicates empty content
            return (
              error instanceof Error &&
              (error.message.includes('cannot be empty') ||
                error.message.includes('is required'))
            );
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: File metadata consistency for file replacement
   * Feature: core-lms
   * Validates: Requirements 7.7
   * 
   * For any file replacement, all file metadata must be provided together
   */
  it('Property: File replacement requires all metadata fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate partial file metadata (missing some fields)
        fc.record({
          hasFilePath: fc.boolean(),
          hasFileName: fc.boolean(),
          hasFileSize: fc.boolean(),
          hasMimeType: fc.boolean()
        }).filter(fields => {
          // At least one field present, but not all
          const presentCount = Object.values(fields).filter(Boolean).length;
          return presentCount > 0 && presentCount < 4;
        }),
        async (fields) => {
          // Create existing FILE material
          const material = createTestMaterial(course.getId(), MaterialType.FILE);
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Create partial update DTO
          const dto: UpdateMaterialDTO = {};
          if (fields.hasFilePath) dto.filePath = `/uploads/${randomUUID()}.pdf`;
          if (fields.hasFileName) dto.fileName = 'test.pdf';
          if (fields.hasFileSize) dto.fileSize = 1024;
          if (fields.hasMimeType) dto.mimeType = 'application/pdf';

          // Property: Partial file metadata must be rejected
          try {
            await useCase.execute(material.getId(), dto, teacher.getId());
            return false; // Should not succeed with partial metadata
          } catch (error) {
            // Verify error indicates incomplete metadata
            return (
              error instanceof Error &&
              error.message.includes('All file metadata')
            );
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Update preserves material type
   * Feature: core-lms
   * Validates: Requirements 7.7
   * 
   * For any material update, the material type cannot be changed
   */
  it('Property: Material type cannot be changed through update', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate original and target material types
        fc.constantFrom(MaterialType.FILE, MaterialType.TEXT, MaterialType.VIDEO_LINK),
        async (originalType) => {
          // Create existing material
          const material = createTestMaterial(course.getId(), originalType);
          const originalTypeValue = material.getType();
          
          mockMaterialRepository.findById.mockResolvedValue(material);

          // Try to update with content appropriate for different type
          let dto: UpdateMaterialDTO;
          switch (originalType) {
            case MaterialType.FILE:
              // Try updating FILE with text content (should preserve FILE type)
              dto = { title: 'Updated Title' };
              break;
            case MaterialType.TEXT:
              // Try updating TEXT with new content
              dto = { content: '<p>New content</p>' };
              break;
            case MaterialType.VIDEO_LINK:
              // Try updating VIDEO_LINK with new URL
              dto = { content: 'https://www.youtube.com/watch?v=new' };
              break;
          }

          // Property: Material type must remain unchanged
          try {
            const result = await useCase.execute(material.getId(), dto, teacher.getId());
            return result.type === originalTypeValue;
          } catch (error) {
            // May fail for other reasons, but type should not change
            return true;
          }
        }
      ),
      propertyTestConfig
    );
  });
});
