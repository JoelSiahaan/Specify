/**
 * IFileStorage Interface (Port)
 * 
 * Defines the contract for file storage operations.
 * This is a Port in Clean Architecture - the domain defines the interface,
 * and the infrastructure layer provides the implementation (Adapter).
 * 
 * Requirements:
 * - 7.1: Upload files to course
 * - 7.9: Enforce 10MB file size limit
 * - 20.3: Prevent unauthorized file access
 */

/**
 * File metadata structure
 */
export interface FileMetadata {
  /**
   * Original file name provided by user
   */
  originalName: string;

  /**
   * Stored file name (typically UUID + extension)
   */
  storedName: string;

  /**
   * File path relative to storage root
   */
  path: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * MIME type of the file
   */
  mimeType: string;

  /**
   * Upload timestamp
   */
  uploadedAt: Date;
}

/**
 * File upload options
 */
export interface UploadOptions {
  /**
   * Original file name
   */
  originalName: string;

  /**
   * MIME type
   */
  mimeType: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Optional subdirectory within storage root
   * Example: 'courses/abc123/materials'
   */
  directory?: string;
}

/**
 * IFileStorage Interface
 * 
 * Port for file storage operations. Implementations can be:
 * - LocalFileStorage: Store files on local filesystem
 * - S3FileStorage: Store files on AWS S3
 * - Any other storage provider
 */
export interface IFileStorage {
  /**
   * Upload a file to storage
   * 
   * Requirements:
   * - 7.1: Store uploaded file
   * - 7.9: Enforce 10MB file size limit
   * 
   * @param buffer - File content as Buffer
   * @param options - Upload options (file name, MIME type, size, directory)
   * @returns FileMetadata with storage details
   * @throws Error if upload fails or file exceeds size limit
   */
  upload(buffer: Buffer, options: UploadOptions): Promise<FileMetadata>;

  /**
   * Download a file from storage
   * 
   * Requirements:
   * - 8.2: Allow students to download files
   * - 20.3: Validate file access authorization (handled by use case)
   * 
   * @param path - File path relative to storage root
   * @returns File content as Buffer
   * @throws Error if file not found or download fails
   */
  download(path: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * 
   * Requirements:
   * - 7.6: Delete material (including file)
   * 
   * @param path - File path relative to storage root
   * @returns void
   * @throws Error if file not found or deletion fails
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists in storage
   * 
   * @param path - File path relative to storage root
   * @returns true if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata without downloading content
   * 
   * @param path - File path relative to storage root
   * @returns FileMetadata if file exists
   * @throws Error if file not found
   */
  getMetadata(path: string): Promise<FileMetadata>;
}
