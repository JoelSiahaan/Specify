/**
 * File Upload Security Validator
 * 
 * Provides comprehensive file validation for security purposes.
 * Validates file types, sizes, and content to prevent malicious uploads.
 * 
 * Requirements:
 * - 20.3: Prevent unauthorized file access
 * - 20.4: Validate file types before accepting uploads
 * - 20.5: Enforce file size limits on all uploads
 * 
 * Security Features:
 * - Whitelist-based file type validation
 * - MIME type validation (from file content, not just extension)
 * - File extension validation
 * - File size limit enforcement
 * - Rejection of executable and script files
 * - Magic number (file signature) validation
 */

import { ApplicationError } from '../../application/errors/ApplicationErrors';

/**
 * Allowed file MIME types (whitelist)
 * 
 * Requirements:
 * - 7.8: Support PDF and image file formats (JPG, PNG, GIF)
 * - 10.13: Support PDF, DOCX, and image formats (JPG, PNG) for assignments
 * - 7.10: No video file uploads allowed
 */
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif'
];

/**
 * Allowed file extensions (whitelist)
 */
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif'
];

/**
 * Dangerous file extensions (blacklist)
 * 
 * These file types are explicitly rejected to prevent execution of malicious code.
 * 
 * Requirements:
 * - 20.4: Validate file types before accepting uploads
 */
const DANGEROUS_EXTENSIONS = [
  // Executables
  '.exe', '.com', '.bat', '.cmd', '.msi', '.app', '.deb', '.rpm',
  
  // Scripts
  '.js', '.jsx', '.ts', '.tsx', '.php', '.py', '.rb', '.pl', '.sh', '.bash',
  
  // Web files that could execute code
  '.html', '.htm', '.svg',
  
  // Archives (could contain malicious files)
  '.zip', '.rar', '.tar', '.gz', '.7z',
  
  // Other potentially dangerous
  '.dll', '.so', '.dylib', '.jar'
];

/**
 * Maximum file size in bytes (10MB)
 * 
 * Requirements:
 * - 7.5: Enforce 10MB file size limit
 * - 20.5: Enforce file size limits on all uploads
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File magic numbers (file signatures) for validation
 * 
 * These are the first few bytes of files that identify their type.
 * Used to validate file content, not just extension.
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46] // %PDF
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP format)
    [0x50, 0x4B, 0x05, 0x06], // PK.. (ZIP format)
    [0x50, 0x4B, 0x07, 0x08]  // PK.. (ZIP format)
  ],
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // EXIF
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE3]  // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG signature
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ]
};

/**
 * File validation result
 */
export interface FileValidationResult {
  /**
   * Whether the file is valid
   */
  isValid: boolean;
  
  /**
   * Error message if validation failed
   */
  error?: string;
  
  /**
   * Error code if validation failed
   */
  errorCode?: string;
}

/**
 * File Validator
 * 
 * Provides comprehensive file validation for security purposes.
 */
export class FileValidator {
  /**
   * Validate file upload
   * 
   * Performs comprehensive validation:
   * 1. File size validation
   * 2. File extension validation (whitelist + blacklist)
   * 3. MIME type validation
   * 4. File content validation (magic numbers)
   * 
   * Requirements:
   * - 20.4: Validate file types before accepting uploads
   * - 20.5: Enforce file size limits on all uploads
   * 
   * @param buffer - File content as Buffer
   * @param fileName - Original file name
   * @param mimeType - MIME type from upload
   * @param fileSize - File size in bytes
   * @returns FileValidationResult
   */
  static validate(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): FileValidationResult {
    // 1. Validate file size (Requirement 20.5)
    const sizeValidation = this.validateFileSize(fileSize);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // 2. Validate file extension (Requirement 20.4)
    const extensionValidation = this.validateFileExtension(fileName);
    if (!extensionValidation.isValid) {
      return extensionValidation;
    }

    // 3. Validate MIME type (Requirement 20.4)
    const mimeValidation = this.validateMimeType(mimeType);
    if (!mimeValidation.isValid) {
      return mimeValidation;
    }

    // 4. Validate file content (magic numbers) (Requirement 20.4)
    const contentValidation = this.validateFileContent(buffer, mimeType);
    if (!contentValidation.isValid) {
      return contentValidation;
    }

    // All validations passed
    return { isValid: true };
  }

  /**
   * Validate file size
   * 
   * Requirements:
   * - 7.5: Enforce 10MB file size limit
   * - 20.5: Enforce file size limits on all uploads
   * 
   * @param fileSize - File size in bytes
   * @returns FileValidationResult
   * @private
   */
  private static validateFileSize(fileSize: number): FileValidationResult {
    if (fileSize > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        errorCode: 'INVALID_FILE_SIZE'
      };
    }

    if (fileSize === 0) {
      return {
        isValid: false,
        error: 'File is empty',
        errorCode: 'INVALID_FILE_SIZE'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file extension
   * 
   * Uses both whitelist (allowed extensions) and blacklist (dangerous extensions).
   * 
   * Requirements:
   * - 20.4: Validate file types before accepting uploads
   * 
   * @param fileName - Original file name
   * @returns FileValidationResult
   * @private
   */
  private static validateFileExtension(fileName: string): FileValidationResult {
    // Extract extension (case-insensitive)
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Check if extension is missing
    if (!extension || extension === fileName) {
      return {
        isValid: false,
        error: 'File must have a valid extension',
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    // Check blacklist first (dangerous extensions)
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `File type not allowed for security reasons: ${extension}`,
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    // Check whitelist (allowed extensions)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `File extension not allowed. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate MIME type
   * 
   * Requirements:
   * - 20.4: Validate file types before accepting uploads
   * 
   * @param mimeType - MIME type from upload
   * @returns FileValidationResult
   * @private
   */
  private static validateMimeType(mimeType: string): FileValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: 'File type not allowed. Supported formats: PDF, DOCX, JPG, PNG, GIF',
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file content using magic numbers (file signatures)
   * 
   * Reads the first few bytes of the file to verify it matches the expected
   * file type. This prevents users from renaming malicious files to bypass
   * extension checks.
   * 
   * Requirements:
   * - 20.4: Validate file types before accepting uploads
   * 
   * @param buffer - File content as Buffer
   * @param mimeType - Expected MIME type
   * @returns FileValidationResult
   * @private
   */
  private static validateFileContent(
    buffer: Buffer,
    mimeType: string
  ): FileValidationResult {
    // Get expected signatures for this MIME type
    const expectedSignatures = FILE_SIGNATURES[mimeType];

    if (!expectedSignatures) {
      // No signature validation for this type (shouldn't happen with whitelist)
      return { isValid: true };
    }

    // Check if file starts with any of the expected signatures
    const hasValidSignature = expectedSignatures.some(signature => {
      // Check if buffer is long enough
      if (buffer.length < signature.length) {
        return false;
      }

      // Compare bytes
      return signature.every((byte, index) => buffer[index] === byte);
    });

    if (!hasValidSignature) {
      return {
        isValid: false,
        error: 'File content does not match the declared file type',
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate and throw error if invalid
   * 
   * Convenience method that validates and throws ApplicationError if validation fails.
   * 
   * @param buffer - File content as Buffer
   * @param fileName - Original file name
   * @param mimeType - MIME type from upload
   * @param fileSize - File size in bytes
   * @throws ApplicationError if validation fails
   */
  static validateOrThrow(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): void {
    const result = this.validate(buffer, fileName, mimeType, fileSize);

    if (!result.isValid) {
      throw new ApplicationError(
        result.errorCode || 'VALIDATION_FAILED',
        result.error || 'File validation failed',
        400
      );
    }
  }
}
