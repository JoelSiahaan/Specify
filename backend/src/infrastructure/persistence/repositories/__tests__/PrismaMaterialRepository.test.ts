/**
 * PrismaMaterialRepository Integration Tests
 * 
 * Tests the PrismaMaterialRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMaterialRepository } from '../PrismaMaterialRepository';
import { Material, MaterialType } from '../../../../domain/entities/Material';
import { randomUUID } from 'crypto';

describe('PrismaMaterialRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaMaterialRepository;
  let testCourseId: string;
  let testTeacherId: string;

  beforeAll(async () => {
    // Create a fresh PrismaClient instance for tests
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    repository = new PrismaMaterialRepository(prisma);
    
    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up materials, courses, and users tables before each test
    await prisma.material.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create a test teacher
    testTeacherId = randomUUID();
    await prisma.user.create({
      data: {
        id: testTeacherId,
        email: 'teacher@example.com',
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: 'hashed_password'
      }
    });

    // Create a test course for material relationships
    testCourseId = randomUUID();
    await prisma.course.create({
      data: {
        id: testCourseId,
        name: 'Test Course',
        description: 'Test course description',
        courseCode: 'TEST123',
        status: 'ACTIVE',
        teacherId: testTeacherId
      }
    });
  });

  describe('save', () => {
    it('should create a new FILE type material', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Lecture Notes PDF',
        type: MaterialType.FILE,
        filePath: 'uploads/lecture-notes.pdf',
        fileName: 'lecture-notes.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      });

      // Act
      const savedMaterial = await repository.save(material);

      // Assert
      expect(savedMaterial.getId()).toBe(materialId);
      expect(savedMaterial.getTitle()).toBe('Lecture Notes PDF');
      expect(savedMaterial.getType()).toBe(MaterialType.FILE);
      expect(savedMaterial.getFilePath()).toBe('uploads/lecture-notes.pdf');
      expect(savedMaterial.getFileName()).toBe('lecture-notes.pdf');
      expect(savedMaterial.getFileSize()).toBe(1024000);
      expect(savedMaterial.getMimeType()).toBe('application/pdf');
      expect(savedMaterial.getCourseId()).toBe(testCourseId);
    });

    it('should create a new TEXT type material', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Introduction Text',
        type: MaterialType.TEXT,
        content: '<p>This is the introduction content</p>'
      });

      // Act
      const savedMaterial = await repository.save(material);

      // Assert
      expect(savedMaterial.getId()).toBe(materialId);
      expect(savedMaterial.getTitle()).toBe('Introduction Text');
      expect(savedMaterial.getType()).toBe(MaterialType.TEXT);
      expect(savedMaterial.getContent()).toBe('<p>This is the introduction content</p>');
      expect(savedMaterial.getCourseId()).toBe(testCourseId);
    });

    it('should create a new VIDEO_LINK type material', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Tutorial Video',
        type: MaterialType.VIDEO_LINK,
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      });

      // Act
      const savedMaterial = await repository.save(material);

      // Assert
      expect(savedMaterial.getId()).toBe(materialId);
      expect(savedMaterial.getTitle()).toBe('Tutorial Video');
      expect(savedMaterial.getType()).toBe(MaterialType.VIDEO_LINK);
      expect(savedMaterial.getContent()).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(savedMaterial.getCourseId()).toBe(testCourseId);
    });

    it('should update an existing material', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Original Title',
        type: MaterialType.TEXT,
        content: '<p>Original content</p>'
      });
      await repository.save(material);

      // Update material
      material.updateTitle('Updated Title');
      material.updateTextContent('<p>Updated content</p>');

      // Act
      const updatedMaterial = await repository.save(material);

      // Assert
      expect(updatedMaterial.getId()).toBe(materialId);
      expect(updatedMaterial.getTitle()).toBe('Updated Title');
      expect(updatedMaterial.getContent()).toBe('<p>Updated content</p>');
    });

    it('should throw error when courseId does not exist', async () => {
      // Arrange
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(), // Non-existent course
        title: 'Test Material',
        type: MaterialType.TEXT,
        content: '<p>Test content</p>'
      });

      // Act & Assert
      await expect(repository.save(material)).rejects.toThrow('Course not found');
    });
  });

  describe('findById', () => {
    it('should find material by ID', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Test Material',
        type: MaterialType.TEXT,
        content: '<p>Test content</p>'
      });
      await repository.save(material);

      // Act
      const foundMaterial = await repository.findById(materialId);

      // Assert
      expect(foundMaterial).not.toBeNull();
      expect(foundMaterial!.getId()).toBe(materialId);
      expect(foundMaterial!.getTitle()).toBe('Test Material');
      expect(foundMaterial!.getType()).toBe(MaterialType.TEXT);
    });

    it('should return null when material not found', async () => {
      // Act
      const foundMaterial = await repository.findById(randomUUID());

      // Assert
      expect(foundMaterial).toBeNull();
    });
  });

  describe('findByCourseId', () => {
    it('should find all materials for a course', async () => {
      // Arrange
      const material1 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 1',
        type: MaterialType.TEXT,
        content: '<p>Content 1</p>'
      });
      const material2 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 2',
        type: MaterialType.FILE,
        filePath: 'uploads/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      });
      const material3 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 3',
        type: MaterialType.VIDEO_LINK,
        content: 'https://www.youtube.com/watch?v=test'
      });
      await repository.save(material1);
      await repository.save(material2);
      await repository.save(material3);

      // Act
      const materials = await repository.findByCourseId(testCourseId);

      // Assert
      expect(materials).toHaveLength(3);
      expect(materials.map(m => m.getTitle())).toContain('Material 1');
      expect(materials.map(m => m.getTitle())).toContain('Material 2');
      expect(materials.map(m => m.getTitle())).toContain('Material 3');
    });

    it('should return empty array when course has no materials', async () => {
      // Act
      const materials = await repository.findByCourseId(testCourseId);

      // Assert
      expect(materials).toHaveLength(0);
    });

    it('should only return materials for specified course', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Another Course',
          description: 'Another description',
          courseCode: 'OTHER123',
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      // Create materials for both courses
      const material1 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 1',
        type: MaterialType.TEXT,
        content: '<p>Content 1</p>'
      });
      const material2 = Material.create({
        id: randomUUID(),
        courseId: anotherCourseId,
        title: 'Material 2',
        type: MaterialType.TEXT,
        content: '<p>Content 2</p>'
      });
      await repository.save(material1);
      await repository.save(material2);

      // Act
      const materials = await repository.findByCourseId(testCourseId);

      // Assert
      expect(materials).toHaveLength(1);
      expect(materials[0].getTitle()).toBe('Material 1');
    });

    it('should return materials ordered by creation date', async () => {
      // Arrange - Create materials with slight delay
      const material1 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'First Material',
        type: MaterialType.TEXT,
        content: '<p>First</p>'
      });
      await repository.save(material1);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const material2 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Second Material',
        type: MaterialType.TEXT,
        content: '<p>Second</p>'
      });
      await repository.save(material2);

      // Act
      const materials = await repository.findByCourseId(testCourseId);

      // Assert
      expect(materials).toHaveLength(2);
      expect(materials[0].getTitle()).toBe('First Material');
      expect(materials[1].getTitle()).toBe('Second Material');
    });
  });

  describe('update', () => {
    it('should update an existing material', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Original Title',
        type: MaterialType.TEXT,
        content: '<p>Original content</p>'
      });
      await repository.save(material);

      // Update material
      material.updateTitle('Updated Title');
      material.updateTextContent('<p>Updated content</p>');

      // Act
      const updatedMaterial = await repository.update(material);

      // Assert
      expect(updatedMaterial.getId()).toBe(materialId);
      expect(updatedMaterial.getTitle()).toBe('Updated Title');
      expect(updatedMaterial.getContent()).toBe('<p>Updated content</p>');
    });

    it('should throw error when updating non-existent material', async () => {
      // Arrange
      const material = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Non-existent Material',
        type: MaterialType.TEXT,
        content: '<p>Content</p>'
      });

      // Act & Assert
      await expect(repository.update(material)).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should delete material by ID', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Test Material',
        type: MaterialType.TEXT,
        content: '<p>Test content</p>'
      });
      await repository.save(material);

      // Act
      await repository.delete(materialId);

      // Assert
      const foundMaterial = await repository.findById(materialId);
      expect(foundMaterial).toBeNull();
    });

    it('should throw error when deleting non-existent material', async () => {
      // Act & Assert
      await expect(repository.delete(randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('deleteByCourseId', () => {
    it('should delete all materials for a course', async () => {
      // Arrange
      const material1 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 1',
        type: MaterialType.TEXT,
        content: '<p>Content 1</p>'
      });
      const material2 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 2',
        type: MaterialType.TEXT,
        content: '<p>Content 2</p>'
      });
      await repository.save(material1);
      await repository.save(material2);

      // Act
      const deletedCount = await repository.deleteByCourseId(testCourseId);

      // Assert
      expect(deletedCount).toBe(2);
      const materials = await repository.findByCourseId(testCourseId);
      expect(materials).toHaveLength(0);
    });

    it('should return 0 when course has no materials', async () => {
      // Act
      const deletedCount = await repository.deleteByCourseId(testCourseId);

      // Assert
      expect(deletedCount).toBe(0);
    });

    it('should only delete materials for specified course', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Another Course',
          description: 'Another description',
          courseCode: 'OTHER123',
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      // Create materials for both courses
      const material1 = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Material 1',
        type: MaterialType.TEXT,
        content: '<p>Content 1</p>'
      });
      const material2 = Material.create({
        id: randomUUID(),
        courseId: anotherCourseId,
        title: 'Material 2',
        type: MaterialType.TEXT,
        content: '<p>Content 2</p>'
      });
      await repository.save(material1);
      await repository.save(material2);

      // Act
      const deletedCount = await repository.deleteByCourseId(testCourseId);

      // Assert
      expect(deletedCount).toBe(1);
      const materials1 = await repository.findByCourseId(testCourseId);
      const materials2 = await repository.findByCourseId(anotherCourseId);
      expect(materials1).toHaveLength(0);
      expect(materials2).toHaveLength(1);
    });
  });

  describe('relationship with Course', () => {
    it('should maintain foreign key relationship with Course', async () => {
      // Arrange
      const material = Material.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Test Material',
        type: MaterialType.TEXT,
        content: '<p>Test content</p>'
      });
      await repository.save(material);

      // Act - Verify relationship in database
      const dbMaterial = await prisma.material.findUnique({
        where: { id: material.getId() },
        include: { course: true }
      });

      // Assert
      expect(dbMaterial).not.toBeNull();
      expect(dbMaterial!.course.id).toBe(testCourseId);
      expect(dbMaterial!.course.name).toBe('Test Course');
      expect(dbMaterial!.course.courseCode).toBe('TEST123');
    });

    it('should cascade delete materials when course is deleted', async () => {
      // Arrange
      const materialId = randomUUID();
      const material = Material.create({
        id: materialId,
        courseId: testCourseId,
        title: 'Test Material',
        type: MaterialType.TEXT,
        content: '<p>Test content</p>'
      });
      await repository.save(material);

      // Act - Delete course (should cascade to materials)
      await prisma.course.delete({
        where: { id: testCourseId }
      });

      // Assert
      const foundMaterial = await repository.findById(materialId);
      expect(foundMaterial).toBeNull();
    });
  });
});
