/**
 * File Validator Tests
 * 
 * Tests comprehensive file validation including:
 * - File size validation
 * - File extension validation (whitelist + blacklist)
 * - MIME type validation
 * - File content validation (magic numbers)
 * 
 * Requirements:
 * - 20.4: Validate file types before accepting uploads
 * - 20.5: Enforce file size limits on all uploads
 */

import { FileValidator, MAX_FILE_SIZE } from '../FileValidator.js';
import { ApplicationError } from '../../../application/errors/ApplicationErrors.js';

describe('FileValidator', () => {
  describe('File Size Validation', () => {
    it('should accept files within size limit', () => {
      const buffer = createPDFBuffer(); // Valid PDF with magic numbers
      const result = FileValidator.validate(
        buffer,
        'test.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding 10MB limit', () => {
      const buffer = Buffer.alloc(100);
      const result = FileValidator.validate(
        buffer,
        'large.pdf',
        'application/pdf',
        MAX_FILE_SIZE + 1
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_SIZE');
      expect(result.error).toContain('exceeds maximum limit');
    });

    it('should reject empty files', () => {
      const buffer = Buffer.alloc(0);
      const result = FileValidator.validate(
        buffer,
        'empty.pdf',
        'application/pdf',
        0
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_SIZE');
      expect(result.error).toContain('empty');
    });
  });

  describe('File Extension Validation', () => {
    it('should accept allowed extensions (PDF)', () => {
      const buffer = createPDFBuffer();
      const result = FileValidator.validate(
        buffer,
        'document.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed extensions (DOCX)', () => {
      const buffer = createDOCXBuffer();
      const result = FileValidator.validate(
        buffer,
        'document.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed extensions (JPG)', () => {
      const buffer = createJPEGBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.jpg',
        'image/jpeg',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed extensions (PNG)', () => {
      const buffer = createPNGBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.png',
        'image/png',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed extensions (GIF)', () => {
      const buffer = createGIFBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.gif',
        'image/gif',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject dangerous extensions (.exe)', () => {
      const buffer = Buffer.from('fake executable');
      const result = FileValidator.validate(
        buffer,
        'malware.exe',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('not allowed for security reasons');
    });

    it('should reject dangerous extensions (.js)', () => {
      const buffer = Buffer.from('console.log("malicious")');
      const result = FileValidator.validate(
        buffer,
        'script.js',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should reject dangerous extensions (.php)', () => {
      const buffer = Buffer.from('<?php echo "hack"; ?>');
      const result = FileValidator.validate(
        buffer,
        'shell.php',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should reject dangerous extensions (.sh)', () => {
      const buffer = Buffer.from('#!/bin/bash\nrm -rf /');
      const result = FileValidator.validate(
        buffer,
        'script.sh',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should reject files without extension', () => {
      const buffer = Buffer.from('no extension');
      const result = FileValidator.validate(
        buffer,
        'noextension',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('valid extension');
    });

    it('should reject unsupported extensions (.txt)', () => {
      const buffer = Buffer.from('text file');
      const result = FileValidator.validate(
        buffer,
        'document.txt',
        'text/plain',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('MIME Type Validation', () => {
    it('should accept allowed MIME types (PDF)', () => {
      const buffer = createPDFBuffer();
      const result = FileValidator.validate(
        buffer,
        'document.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed MIME types (DOCX)', () => {
      const buffer = createDOCXBuffer();
      const result = FileValidator.validate(
        buffer,
        'document.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should accept allowed MIME types (JPEG)', () => {
      const buffer = createJPEGBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.jpg',
        'image/jpeg',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject disallowed MIME types (video)', () => {
      const buffer = Buffer.from('fake video');
      const result = FileValidator.validate(
        buffer,
        'video.mp4',
        'video/mp4',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should reject disallowed MIME types (text)', () => {
      const buffer = Buffer.from('text file');
      const result = FileValidator.validate(
        buffer,
        'document.txt',
        'text/plain',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('File Content Validation (Magic Numbers)', () => {
    it('should accept PDF with valid magic number', () => {
      const buffer = createPDFBuffer();
      const result = FileValidator.validate(
        buffer,
        'document.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject PDF with invalid magic number', () => {
      const buffer = Buffer.from('Not a real PDF file');
      const result = FileValidator.validate(
        buffer,
        'fake.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('content does not match');
    });

    it('should accept JPEG with valid magic number', () => {
      const buffer = createJPEGBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.jpg',
        'image/jpeg',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject JPEG with invalid magic number', () => {
      const buffer = Buffer.from('Not a real JPEG file');
      const result = FileValidator.validate(
        buffer,
        'fake.jpg',
        'image/jpeg',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('content does not match');
    });

    it('should accept PNG with valid magic number', () => {
      const buffer = createPNGBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.png',
        'image/png',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject PNG with invalid magic number', () => {
      const buffer = Buffer.from('Not a real PNG file');
      const result = FileValidator.validate(
        buffer,
        'fake.png',
        'image/png',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should accept GIF with valid magic number (GIF87a)', () => {
      const buffer = createGIFBuffer();
      const result = FileValidator.validate(
        buffer,
        'image.gif',
        'image/gif',
        buffer.length
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject renamed executable as PDF', () => {
      // Simulate a renamed .exe file with PDF extension
      const buffer = Buffer.from('MZ'); // EXE magic number
      const result = FileValidator.validate(
        buffer,
        'malware.pdf',
        'application/pdf',
        buffer.length
      );

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('content does not match');
    });
  });

  describe('validateOrThrow', () => {
    it('should not throw for valid file', () => {
      const buffer = createPDFBuffer();
      
      expect(() => {
        FileValidator.validateOrThrow(
          buffer,
          'document.pdf',
          'application/pdf',
          buffer.length
        );
      }).not.toThrow();
    });

    it('should throw ApplicationError for invalid file', () => {
      const buffer = Buffer.from('fake pdf');
      
      expect(() => {
        FileValidator.validateOrThrow(
          buffer,
          'fake.pdf',
          'application/pdf',
          buffer.length
        );
      }).toThrow(ApplicationError);
    });

    it('should throw with correct error code', () => {
      const buffer = Buffer.from('fake pdf');
      
      try {
        FileValidator.validateOrThrow(
          buffer,
          'fake.pdf',
          'application/pdf',
          buffer.length
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).code).toBe('INVALID_FILE_TYPE');
      }
    });
  });
});

// Helper functions to create valid file buffers with magic numbers

function createPDFBuffer(): Buffer {
  // PDF magic number: %PDF
  return Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
}

function createDOCXBuffer(): Buffer {
  // DOCX magic number: PK (ZIP format)
  return Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
}

function createJPEGBuffer(): Buffer {
  // JPEG magic number: FF D8 FF E0 (JFIF)
  return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
}

function createPNGBuffer(): Buffer {
  // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
  return Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
}

function createGIFBuffer(): Buffer {
  // GIF magic number: GIF87a
  return Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
}
