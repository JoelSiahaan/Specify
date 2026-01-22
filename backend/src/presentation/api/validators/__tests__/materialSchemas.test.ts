/**
 * Material Schemas Unit Tests
 * 
 * Tests for Zod validation schemas for material-related requests.
 * Validates that schemas correctly accept valid input and reject invalid input.
 */

import {
  MaterialTypeSchema,
  MaterialTitleSchema,
  TextContentSchema,
  VideoURLSchema,
  FileNameSchema,
  FileSizeSchema,
  MimeTypeSchema,
  CreateTextMaterialRequestSchema,
  CreateVideoLinkMaterialRequestSchema,
  CreateFileMaterialRequestSchema,
  CreateMaterialRequestSchema,
  UpdateTextMaterialRequestSchema,
  UpdateVideoLinkMaterialRequestSchema,
  UpdateFileMaterialRequestSchema,
  UpdateMaterialRequestSchema,
  MaterialQuerySchema
} from '../materialSchemas';

describe('Material Validation Schemas', () => {
  describe('MaterialTypeSchema', () => {
    it('should accept FILE type', () => {
      const result = MaterialTypeSchema.safeParse('FILE');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('FILE');
      }
    });

    it('should accept TEXT type', () => {
      const result = MaterialTypeSchema.safeParse('TEXT');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TEXT');
      }
    });

    it('should accept VIDEO_LINK type', () => {
      const result = MaterialTypeSchema.safeParse('VIDEO_LINK');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('VIDEO_LINK');
      }
    });

    it('should reject invalid type', () => {
      const result = MaterialTypeSchema.safeParse('AUDIO');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('FILE, TEXT, or VIDEO_LINK');
      }
    });

    it('should reject empty string', () => {
      const result = MaterialTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('MaterialTitleSchema', () => {
    it('should accept valid material title', () => {
      const result = MaterialTitleSchema.safeParse('Lecture 1: Introduction');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Lecture 1: Introduction');
      }
    });

    it('should trim whitespace', () => {
      const result = MaterialTitleSchema.safeParse('  Lecture 1  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Lecture 1');
      }
    });

    it('should reject empty string', () => {
      const result = MaterialTitleSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const result = MaterialTitleSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 characters');
      }
    });

    it('should accept title with exactly 200 characters', () => {
      const title = 'a'.repeat(200);
      const result = MaterialTitleSchema.safeParse(title);
      expect(result.success).toBe(true);
    });
  });

  describe('TextContentSchema', () => {
    it('should accept valid text content', () => {
      const result = TextContentSchema.safeParse('<p>This is some HTML content</p>');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('<p>This is some HTML content</p>');
      }
    });

    it('should trim whitespace', () => {
      const result = TextContentSchema.safeParse('  <p>Content</p>  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('<p>Content</p>');
      }
    });

    it('should reject empty string', () => {
      const result = TextContentSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject content exceeding 50000 characters', () => {
      const longContent = 'a'.repeat(50001);
      const result = TextContentSchema.safeParse(longContent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50000 characters');
      }
    });

    it('should accept content with exactly 50000 characters', () => {
      const content = 'a'.repeat(50000);
      const result = TextContentSchema.safeParse(content);
      expect(result.success).toBe(true);
    });
  });

  describe('VideoURLSchema', () => {
    it('should accept valid YouTube URL', () => {
      const result = VideoURLSchema.safeParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.success).toBe(true);
    });

    it('should accept YouTube short URL', () => {
      const result = VideoURLSchema.safeParse('https://youtu.be/dQw4w9WgXcQ');
      expect(result.success).toBe(true);
    });

    it('should accept YouTube URL without www', () => {
      const result = VideoURLSchema.safeParse('https://youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.success).toBe(true);
    });

    it('should accept valid Vimeo URL', () => {
      const result = VideoURLSchema.safeParse('https://vimeo.com/123456789');
      expect(result.success).toBe(true);
    });

    it('should accept Vimeo URL without www', () => {
      const result = VideoURLSchema.safeParse('https://www.vimeo.com/123456789');
      expect(result.success).toBe(true);
    });

    it('should accept HTTP YouTube URL', () => {
      const result = VideoURLSchema.safeParse('http://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = VideoURLSchema.safeParse('  https://youtube.com/watch?v=test  ');
      expect(result.success).toBe(true);
    });

    it('should reject non-YouTube/Vimeo URL', () => {
      const result = VideoURLSchema.safeParse('https://example.com/video');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('YouTube or Vimeo');
      }
    });

    it('should reject invalid URL format', () => {
      const result = VideoURLSchema.safeParse('not-a-url');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid URL');
      }
    });

    it('should reject empty string', () => {
      const result = VideoURLSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        // Empty string fails URL validation first, not the required check
        expect(result.error.issues[0].message).toContain('URL');
      }
    });
  });

  describe('FileNameSchema', () => {
    it('should accept valid file name', () => {
      const result = FileNameSchema.safeParse('document.pdf');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('document.pdf');
      }
    });

    it('should trim whitespace', () => {
      const result = FileNameSchema.safeParse('  document.pdf  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('document.pdf');
      }
    });

    it('should reject empty string', () => {
      const result = FileNameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject file name exceeding 255 characters', () => {
      const longName = 'a'.repeat(256);
      const result = FileNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255 characters');
      }
    });

    it('should accept file name with exactly 255 characters', () => {
      const name = 'a'.repeat(255);
      const result = FileNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  describe('FileSizeSchema', () => {
    it('should accept valid file size', () => {
      const result = FileSizeSchema.safeParse(1024 * 1024); // 1MB
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1024 * 1024);
      }
    });

    it('should accept file size at 10MB limit', () => {
      const result = FileSizeSchema.safeParse(10 * 1024 * 1024);
      expect(result.success).toBe(true);
    });

    it('should reject file size exceeding 10MB', () => {
      const result = FileSizeSchema.safeParse(10 * 1024 * 1024 + 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10MB');
      }
    });

    it('should reject negative file size', () => {
      const result = FileSizeSchema.safeParse(-1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject zero file size', () => {
      const result = FileSizeSchema.safeParse(0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject non-integer file size', () => {
      const result = FileSizeSchema.safeParse(1024.5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });
  });

  describe('MimeTypeSchema', () => {
    it('should accept PDF mime type', () => {
      const result = MimeTypeSchema.safeParse('application/pdf');
      expect(result.success).toBe(true);
    });

    it('should accept DOCX mime type', () => {
      const result = MimeTypeSchema.safeParse('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.success).toBe(true);
    });

    it('should accept JPEG mime type', () => {
      const result = MimeTypeSchema.safeParse('image/jpeg');
      expect(result.success).toBe(true);
    });

    it('should accept PNG mime type', () => {
      const result = MimeTypeSchema.safeParse('image/png');
      expect(result.success).toBe(true);
    });

    it('should accept GIF mime type', () => {
      const result = MimeTypeSchema.safeParse('image/gif');
      expect(result.success).toBe(true);
    });

    it('should reject unsupported mime type', () => {
      const result = MimeTypeSchema.safeParse('video/mp4');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('PDF, DOCX, JPEG, PNG, or GIF');
      }
    });

    it('should reject empty string', () => {
      const result = MimeTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('CreateTextMaterialRequestSchema', () => {
    const validTextRequest = {
      title: 'Lecture Notes',
      type: 'TEXT' as const,
      content: '<p>This is the lecture content</p>'
    };

    it('should accept valid TEXT material request', () => {
      const result = CreateTextMaterialRequestSchema.safeParse(validTextRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Lecture Notes');
        expect(result.data.type).toBe('TEXT');
        expect(result.data.content).toBe('<p>This is the lecture content</p>');
      }
    });

    it('should trim whitespace from fields', () => {
      const request = {
        title: '  Lecture Notes  ',
        type: 'TEXT' as const,
        content: '  <p>Content</p>  '
      };
      const result = CreateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Lecture Notes');
        expect(result.data.content).toBe('<p>Content</p>');
      }
    });

    it('should reject missing title', () => {
      const request = { ...validTextRequest };
      delete (request as any).title;
      const result = CreateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const request = { ...validTextRequest };
      delete (request as any).content;
      const result = CreateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const request = { ...validTextRequest, content: '' };
      const result = CreateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject wrong type', () => {
      const request = { ...validTextRequest, type: 'FILE' };
      const result = CreateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateVideoLinkMaterialRequestSchema', () => {
    const validVideoRequest = {
      title: 'Tutorial Video',
      type: 'VIDEO_LINK' as const,
      content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };

    it('should accept valid VIDEO_LINK material request', () => {
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(validVideoRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Tutorial Video');
        expect(result.data.type).toBe('VIDEO_LINK');
        expect(result.data.content).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }
    });

    it('should accept Vimeo URL', () => {
      const request = { ...validVideoRequest, content: 'https://vimeo.com/123456789' };
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject non-YouTube/Vimeo URL', () => {
      const request = { ...validVideoRequest, content: 'https://example.com/video' };
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const request = { ...validVideoRequest };
      delete (request as any).title;
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const request = { ...validVideoRequest };
      delete (request as any).content;
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject wrong type', () => {
      const request = { ...validVideoRequest, type: 'TEXT' };
      const result = CreateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateFileMaterialRequestSchema', () => {
    const validFileRequest = {
      title: 'Assignment Document',
      type: 'FILE' as const
    };

    it('should accept valid FILE material request', () => {
      const result = CreateFileMaterialRequestSchema.safeParse(validFileRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Assignment Document');
        expect(result.data.type).toBe('FILE');
      }
    });

    it('should trim whitespace from title', () => {
      const request = { ...validFileRequest, title: '  Assignment Document  ' };
      const result = CreateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Assignment Document');
      }
    });

    it('should reject missing title', () => {
      const request = { ...validFileRequest };
      delete (request as any).title;
      const result = CreateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject wrong type', () => {
      const request = { ...validFileRequest, type: 'TEXT' };
      const result = CreateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateMaterialRequestSchema (discriminated union)', () => {
    it('should accept TEXT material', () => {
      const request = {
        title: 'Notes',
        type: 'TEXT',
        content: '<p>Content</p>'
      };
      const result = CreateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept VIDEO_LINK material', () => {
      const request = {
        title: 'Video',
        type: 'VIDEO_LINK',
        content: 'https://youtube.com/watch?v=test'
      };
      const result = CreateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept FILE material', () => {
      const request = {
        title: 'Document',
        type: 'FILE'
      };
      const result = CreateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const request = {
        title: 'Material',
        type: 'AUDIO',
        content: 'test'
      };
      const result = CreateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTextMaterialRequestSchema', () => {
    it('should accept update with only title', () => {
      const request = { title: 'Updated Title' };
      const result = UpdateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
        expect(result.data.content).toBeUndefined();
      }
    });

    it('should accept update with only content', () => {
      const request = { content: '<p>Updated content</p>' };
      const result = UpdateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('<p>Updated content</p>');
        expect(result.data.title).toBeUndefined();
      }
    });

    it('should accept update with both title and content', () => {
      const request = {
        title: 'Updated Title',
        content: '<p>Updated content</p>'
      };
      const result = UpdateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject update with no fields', () => {
      const request = {};
      const result = UpdateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('should reject empty content when provided', () => {
      const request = { content: '' };
      const result = UpdateTextMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateVideoLinkMaterialRequestSchema', () => {
    it('should accept update with only title', () => {
      const request = { title: 'Updated Video Title' };
      const result = UpdateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept update with only content', () => {
      const request = { content: 'https://youtube.com/watch?v=new' };
      const result = UpdateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept update with both fields', () => {
      const request = {
        title: 'Updated Title',
        content: 'https://vimeo.com/123456789'
      };
      const result = UpdateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject update with no fields', () => {
      const request = {};
      const result = UpdateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('should reject invalid video URL', () => {
      const request = { content: 'https://example.com/video' };
      const result = UpdateVideoLinkMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateFileMaterialRequestSchema', () => {
    it('should accept update with title', () => {
      const request = { title: 'Updated File Title' };
      const result = UpdateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated File Title');
      }
    });

    it('should accept empty update (file replacement only)', () => {
      const request = {};
      const result = UpdateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from title', () => {
      const request = { title: '  Updated Title  ' };
      const result = UpdateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
      }
    });

    it('should reject empty title when provided', () => {
      const request = { title: '' };
      const result = UpdateFileMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateMaterialRequestSchema', () => {
    it('should accept update with only title', () => {
      const request = { title: 'Updated Title' };
      const result = UpdateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept update with only content', () => {
      const request = { content: 'Updated content' };
      const result = UpdateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept update with both fields', () => {
      const request = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      const result = UpdateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should reject update with no fields', () => {
      const request = {};
      const result = UpdateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('should trim whitespace from content', () => {
      const request = { content: '  Updated content  ' };
      const result = UpdateMaterialRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Updated content');
      }
    });
  });

  describe('MaterialQuerySchema', () => {
    it('should accept empty query', () => {
      const query = {};
      const result = MaterialQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should accept query with any additional fields (for future filters)', () => {
      const query = { type: 'FILE', search: 'test' };
      const result = MaterialQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});
