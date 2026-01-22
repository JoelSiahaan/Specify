/**
 * LocalFileStorage Implementation (Adapter)
 * 
 * Implements IFileStorage interface for local filesystem storage.
 * This is an Adapter in Clean Architecture - implements the Port defined by domain layer.
 * 
 * Requirements:
 * - 7.1: Upload files to course
 * - 7.9: Enforce 10MB file size limit
 * - 20.3: Prevent unauthorized file access (path traversal prevention)
 * 
 * Security Features:
 * - UUID-based filenames prevent predictable paths
 * - Path traversal prevention (reject .., ./, ~/)
 * - Path normalization and validation
 * - Files stored outside web root
 */

import { injectable } from 'tsyringe';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  IFileStorage,
  FileMetadata,
  UploadOptions,
} from '../../domain/storage/IFileStorage';

/**
 * Maximum file size: 10MB (as per requirements)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * LocalFileStorage
 * 
 * Stores files on local filesystem with security measures:
 * - UUID-based filenames
 * - Path traversal prevention
 * - Size limit enforcement
 */
@injectable()
export class LocalFileStorage implements IFileStorage {
  private readonly baseDir: string;

  constructor() {
    // Base directory for file storage (from environment or default)
    // Default: uploads directory in project root
    this.baseDir = path.resolve(
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    );
  }

  /**
   * Upload a file to local storage
   * 
   * Requirements:
   * - 7.1: Store uploaded file
   * - 7.9: Enforce 10MB file size limit
   * 
   * Security:
   * - Generates UUID-based filename to prevent collisions and predictable paths
   * - Validates file size before upload
   * - Creates directory structure if needed
   * 
   * @param buffer - File content as Buffer
   * @param options - Upload options (file name, MIME type, size, directory)
   * @returns FileMetadata with storage details
   * @throws Error if file exceeds size limit or upload fails
   */
  async upload(buffer: Buffer, options: UploadOptions): Promise<FileMetadata> {
    // Validate file size (Requirement 7.9)
    if (options.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Extract file extension from original name
    const extension = path.extname(options.originalName);

    // Generate unique filename: UUID + original extension
    // Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
    const storedName = `${randomUUID()}${extension}`;

    // Build file path with optional subdirectory
    const relativePath = options.directory
      ? path.join(options.directory, storedName)
      : storedName;

    // Validate path (prevent path traversal)
    this.validatePath(relativePath);

    // Full absolute path
    const fullPath = path.join(this.baseDir, relativePath);

    try {
      // Create directory structure if needed
      const directory = path.dirname(fullPath);
      await fs.mkdir(directory, { recursive: true });

      // Write file to disk
      await fs.writeFile(fullPath, buffer);

      // Return file metadata
      return {
        originalName: options.originalName,
        storedName,
        path: relativePath,
        size: options.size,
        mimeType: options.mimeType,
        uploadedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Download a file from local storage
   * 
   * Requirements:
   * - 8.2: Allow students to download files
   * - 20.3: Validate file path (prevent path traversal)
   * 
   * Security:
   * - Path validation prevents directory traversal attacks
   * - Path normalization ensures consistent path handling
   * 
   * @param filePath - File path relative to storage root
   * @returns File content as Buffer
   * @throws Error if file not found or download fails
   */
  async download(filePath: string): Promise<Buffer> {
    // Validate path (prevent path traversal)
    this.validatePath(filePath);

    // Full absolute path
    const fullPath = path.join(this.baseDir, filePath);

    try {
      // Check if file exists
      await fs.access(fullPath);

      // Read and return file content
      return await fs.readFile(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw new Error(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a file from local storage
   * 
   * Requirements:
   * - 7.6: Delete material (including file)
   * 
   * Security:
   * - Path validation prevents directory traversal attacks
   * 
   * @param filePath - File path relative to storage root
   * @returns void
   * @throws Error if file not found or deletion fails
   */
  async delete(filePath: string): Promise<void> {
    // Validate path (prevent path traversal)
    this.validatePath(filePath);

    // Full absolute path
    const fullPath = path.join(this.baseDir, filePath);

    try {
      // Delete file
      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a file exists in local storage
   * 
   * @param filePath - File path relative to storage root
   * @returns true if file exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    // Validate path (prevent path traversal)
    this.validatePath(filePath);

    // Full absolute path
    const fullPath = path.join(this.baseDir, filePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata without downloading content
   * 
   * @param filePath - File path relative to storage root
   * @returns FileMetadata if file exists
   * @throws Error if file not found
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    // Validate path (prevent path traversal)
    this.validatePath(filePath);

    // Full absolute path
    const fullPath = path.join(this.baseDir, filePath);

    try {
      // Get file stats
      const stats = await fs.stat(fullPath);

      // Extract stored name from path
      const storedName = path.basename(filePath);

      return {
        originalName: storedName, // We don't store original name separately
        storedName,
        path: filePath,
        size: stats.size,
        mimeType: 'application/octet-stream', // Default, actual MIME type stored in database
        uploadedAt: new Date(stats.birthtime), // Convert to Date object
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw new Error(
        `Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate file path to prevent path traversal attacks
   * 
   * Requirements:
   * - 20.3: Prevent unauthorized file access
   * 
   * Security Checks:
   * - Reject paths containing '..' (parent directory)
   * - Reject paths containing './' (current directory)
   * - Reject paths containing '~/' (home directory)
   * - Ensure normalized path stays within base directory
   * 
   * @param filePath - File path to validate
   * @throws Error if path is invalid or contains traversal attempts
   */
  private validatePath(filePath: string): void {
    // Reject paths with traversal attempts
    if (
      filePath.includes('..') ||
      filePath.includes('./') ||
      filePath.includes('~/')
    ) {
      throw new Error('Invalid file path: path traversal detected');
    }

    // Normalize path and ensure it stays within base directory
    const normalizedPath = path.normalize(filePath);
    const fullPath = path.join(this.baseDir, normalizedPath);
    const resolvedPath = path.resolve(fullPath);

    // Ensure resolved path starts with base directory
    if (!resolvedPath.startsWith(path.resolve(this.baseDir))) {
      throw new Error('Invalid file path: path traversal detected');
    }
  }
}
