/**
 * LocalFileStorage Integration Tests
 * 
 * Tests file storage operations with local filesystem.
 * 
 * Requirements:
 * - 7.1: Upload files to course
 * - 7.9: Enforce 10MB file size limit
 * - 20.3: Prevent unauthorized file access (path traversal prevention)
 */

import { LocalFileStorage } from '../LocalFileStorage';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

describe('LocalFileStorage Integration Tests', () => {
  let storage: LocalFileStorage;
  let testDir: string;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(process.cwd(), 'uploads-test');
    process.env.UPLOAD_DIR = testDir;
    
    storage = new LocalFileStorage();
  });

  beforeEach(async () => {
    // Clean test directory before each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore error
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      // Arrange
      const fileContent = Buffer.from('Test file content');
      const options = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };

      // Act
      const metadata = await storage.upload(fileContent, options);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.originalName).toBe('test.pdf');
      expect(metadata.storedName).toMatch(/^[0-9a-f-]{36}\.pdf$/); // UUID format
      expect(metadata.path).toBe(metadata.storedName);
      expect(metadata.size).toBe(fileContent.length);
      expect(metadata.mimeType).toBe('application/pdf');
      expect(metadata.uploadedAt).toBeInstanceOf(Date);

      // Verify file exists on disk
      const filePath = path.join(testDir, metadata.path);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Verify file content
      const savedContent = await fs.readFile(filePath);
      expect(savedContent.toString()).toBe('Test file content');
    });

    it('should upload file with subdirectory', async () => {
      // Arrange
      const fileContent = Buffer.from('Test file content');
      const options = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
        directory: 'courses/abc123/materials',
      };

      // Act
      const metadata = await storage.upload(fileContent, options);

      // Assert
      // Normalize path for cross-platform compatibility (Windows uses backslashes)
      const normalizedPath = metadata.path.replace(/\\/g, '/');
      expect(normalizedPath).toMatch(/^courses\/abc123\/materials\/[0-9a-f-]{36}\.pdf$/);

      // Verify file exists in subdirectory
      const filePath = path.join(testDir, metadata.path);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should preserve file extension', async () => {
      // Arrange
      const fileContent = Buffer.from('Image content');
      const options = {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: fileContent.length,
      };

      // Act
      const metadata = await storage.upload(fileContent, options);

      // Assert
      expect(metadata.storedName).toMatch(/\.jpg$/);
      expect(path.extname(metadata.storedName)).toBe('.jpg');
    });

    it('should reject file exceeding size limit (Requirement 7.9)', async () => {
      // Arrange
      const fileContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const options = {
        originalName: 'large.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };

      // Act & Assert
      await expect(storage.upload(fileContent, options)).rejects.toThrow(
        'File size exceeds maximum allowed size of 10MB'
      );
    });

    it('should accept file at size limit (10MB)', async () => {
      // Arrange
      const fileContent = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      const options = {
        originalName: 'max-size.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };

      // Act
      const metadata = await storage.upload(fileContent, options);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.size).toBe(10 * 1024 * 1024);
    });

    it('should create directory structure if not exists', async () => {
      // Arrange
      const fileContent = Buffer.from('Test content');
      const options = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
        directory: 'deep/nested/directory/structure',
      };

      // Act
      const metadata = await storage.upload(fileContent, options);

      // Assert
      const filePath = path.join(testDir, metadata.path);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('download', () => {
    it('should download an existing file', async () => {
      // Arrange - Upload a file first
      const originalContent = Buffer.from('Download test content');
      const uploadOptions = {
        originalName: 'download-test.pdf',
        mimeType: 'application/pdf',
        size: originalContent.length,
      };
      const metadata = await storage.upload(originalContent, uploadOptions);

      // Act
      const downloadedContent = await storage.download(metadata.path);

      // Assert
      expect(downloadedContent).toBeInstanceOf(Buffer);
      expect(downloadedContent.toString()).toBe('Download test content');
    });

    it('should throw error when file not found', async () => {
      // Arrange
      const nonExistentPath = `${randomUUID()}.pdf`;

      // Act & Assert
      await expect(storage.download(nonExistentPath)).rejects.toThrow('File not found');
    });

    it('should reject path traversal attempts (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = '../../../etc/passwd';

      // Act & Assert
      await expect(storage.download(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });

    it('should reject path with ./ (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = './sensitive-file.txt';

      // Act & Assert
      await expect(storage.download(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });

    it('should reject path with ~/ (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = '~/sensitive-file.txt';

      // Act & Assert
      await expect(storage.download(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      // Arrange - Upload a file first
      const fileContent = Buffer.from('Delete test content');
      const uploadOptions = {
        originalName: 'delete-test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };
      const metadata = await storage.upload(fileContent, uploadOptions);

      // Verify file exists
      const filePath = path.join(testDir, metadata.path);
      let exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Act
      await storage.delete(metadata.path);

      // Assert - File should no longer exist
      exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should throw error when deleting non-existent file', async () => {
      // Arrange
      const nonExistentPath = `${randomUUID()}.pdf`;

      // Act & Assert
      await expect(storage.delete(nonExistentPath)).rejects.toThrow('File not found');
    });

    it('should reject path traversal attempts (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = '../../../important-file.txt';

      // Act & Assert
      await expect(storage.delete(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      // Arrange - Upload a file first
      const fileContent = Buffer.from('Exists test content');
      const uploadOptions = {
        originalName: 'exists-test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };
      const metadata = await storage.upload(fileContent, uploadOptions);

      // Act
      const exists = await storage.exists(metadata.path);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      // Arrange
      const nonExistentPath = `${randomUUID()}.pdf`;

      // Act
      const exists = await storage.exists(nonExistentPath);

      // Assert
      expect(exists).toBe(false);
    });

    it('should reject path traversal attempts (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = '../../../etc/passwd';

      // Act & Assert
      await expect(storage.exists(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for existing file', async () => {
      // Arrange - Upload a file first
      const fileContent = Buffer.from('Metadata test content');
      const uploadOptions = {
        originalName: 'metadata-test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
      };
      const uploadMetadata = await storage.upload(fileContent, uploadOptions);

      // Act
      const metadata = await storage.getMetadata(uploadMetadata.path);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.storedName).toBe(uploadMetadata.storedName);
      expect(metadata.path).toBe(uploadMetadata.path);
      expect(metadata.size).toBe(fileContent.length);
      // Check that uploadedAt is a valid Date
      expect(metadata.uploadedAt).toBeInstanceOf(Date);
      expect(metadata.uploadedAt.getTime()).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const nonExistentPath = `${randomUUID()}.pdf`;

      // Act & Assert
      await expect(storage.getMetadata(nonExistentPath)).rejects.toThrow('File not found');
    });

    it('should reject path traversal attempts (Requirement 20.3)', async () => {
      // Arrange
      const maliciousPath = '../../../etc/passwd';

      // Act & Assert
      await expect(storage.getMetadata(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });
  });

  describe('path validation (Requirement 20.3)', () => {
    it('should reject multiple parent directory traversals', async () => {
      // Arrange
      const maliciousPath = '../../../../../../etc/passwd';

      // Act & Assert
      await expect(storage.download(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });

    it('should reject path with .. in middle', async () => {
      // Arrange
      const maliciousPath = 'courses/../../../etc/passwd';

      // Act & Assert
      await expect(storage.download(maliciousPath)).rejects.toThrow(
        'Invalid file path: path traversal detected'
      );
    });

    it('should accept valid nested path', async () => {
      // Arrange - Upload file in nested directory
      const fileContent = Buffer.from('Valid nested path');
      const uploadOptions = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: fileContent.length,
        directory: 'courses/abc123/materials',
      };
      const metadata = await storage.upload(fileContent, uploadOptions);

      // Act - Download using valid nested path
      const downloadedContent = await storage.download(metadata.path);

      // Assert
      expect(downloadedContent.toString()).toBe('Valid nested path');
    });
  });
});
