/**
 * File Validation Utilities
 * 
 * Helper functions for validating file uploads.
 */

import { CONFIG, getAllowedFileExtensions } from '../constants';

/**
 * Validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file type
 */
export function validateFileType(file: File): FileValidationResult {
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  const allowedExtensions = getAllowedFileExtensions();

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): FileValidationResult {
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File): FileValidationResult {
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

/**
 * Check if file is an image
 */
export function isImageFile(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return (CONFIG.ALLOWED_FILE_TYPES.IMAGES as readonly string[]).includes(extension);
}

/**
 * Check if file is a document
 */
export function isDocumentFile(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return (CONFIG.ALLOWED_FILE_TYPES.DOCUMENTS as readonly string[]).includes(extension);
}
