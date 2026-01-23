/**
 * Material Entity Unit Tests
 * 
 * Tests for Material domain entity business logic and validation.
 */

import { Material, MaterialType } from '../Material';
import { randomUUID } from 'crypto';

describe('Material Entity', () => {
  describe('create', () => {
    it('should create a FILE type material with valid properties', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Lecture Notes',
        type: MaterialType.FILE,
        filePath: 'uploads/abc123.pdf',
        fileName: 'lecture-notes.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      };

      const material = Material.create(props);

      expect(material.getId()).toBe(props.id);
      expect(material.getCourseId()).toBe(props.courseId);
      expect(material.getTitle()).toBe(props.title);
      expect(material.getType()).toBe(MaterialType.FILE);
      expect(material.getFilePath()).toBe(props.filePath);
      expect(material.getFileName()).toBe(props.fileName);
      expect(material.getFileSize()).toBe(props.fileSize);
      expect(material.getMimeType()).toBe(props.mimeType);
      expect(material.isFile()).toBe(true);
      expect(material.isText()).toBe(false);
      expect(material.isVideoLink()).toBe(false);
    });

    it('should create a TEXT type material with valid properties', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Introduction',
        type: MaterialType.TEXT,
        content: '<p>This is the course introduction</p>'
      };

      const material = Material.create(props);

      expect(material.getId()).toBe(props.id);
      expect(material.getTitle()).toBe(props.title);
      expect(material.getType()).toBe(MaterialType.TEXT);
      expect(material.getContent()).toBe(props.content);
      expect(material.isFile()).toBe(false);
      expect(material.isText()).toBe(true);
      expect(material.isVideoLink()).toBe(false);
    });

    it('should create a VIDEO_LINK type material with valid YouTube URL', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Tutorial Video',
        type: MaterialType.VIDEO_LINK,
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      };

      const material = Material.create(props);

      expect(material.getId()).toBe(props.id);
      expect(material.getTitle()).toBe(props.title);
      expect(material.getType()).toBe(MaterialType.VIDEO_LINK);
      expect(material.getContent()).toBe(props.content);
      expect(material.isFile()).toBe(false);
      expect(material.isText()).toBe(false);
      expect(material.isVideoLink()).toBe(true);
    });

    it('should create a VIDEO_LINK type material with valid Vimeo URL', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Tutorial Video',
        type: MaterialType.VIDEO_LINK,
        content: 'https://vimeo.com/123456789'
      };

      const material = Material.create(props);

      expect(material.getContent()).toBe(props.content);
      expect(material.isVideoLink()).toBe(true);
    });

    it('should throw error if material ID is missing', () => {
      const props = {
        id: '',
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Content'
      };

      expect(() => Material.create(props)).toThrow('Material ID is required');
    });

    it('should throw error if course ID is missing', () => {
      const props = {
        id: randomUUID(),
        courseId: '',
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Content'
      };

      expect(() => Material.create(props)).toThrow('Course ID is required');
    });

    it('should throw error if title is missing', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: '',
        type: MaterialType.TEXT,
        content: 'Content'
      };

      expect(() => Material.create(props)).toThrow('Material title is required');
    });

    it('should throw error if type is invalid', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: 'INVALID' as MaterialType,
        content: 'Content'
      };

      expect(() => Material.create(props)).toThrow('Invalid material type');
    });
  });

  describe('FILE type validation', () => {
    it('should throw error if FILE type is missing filePath', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      };

      expect(() => Material.create(props)).toThrow('File path is required for FILE type material');
    });

    it('should throw error if FILE type is missing fileName', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      };

      expect(() => Material.create(props)).toThrow('File name is required for FILE type material');
    });

    it('should throw error if FILE type is missing fileSize', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/test.pdf',
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      };

      expect(() => Material.create(props)).toThrow('File size is required for FILE type material');
    });

    it('should throw error if FILE type is missing mimeType', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024
      };

      expect(() => Material.create(props)).toThrow('MIME type is required for FILE type material');
    });
  });

  describe('TEXT type validation', () => {
    it('should throw error if TEXT type is missing content', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT
      };

      expect(() => Material.create(props)).toThrow('Content is required for TEXT type material');
    });
  });

  describe('VIDEO_LINK type validation', () => {
    it('should throw error if VIDEO_LINK type is missing content', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK
      };

      expect(() => Material.create(props)).toThrow('URL is required for VIDEO_LINK type material');
    });

    it('should throw error if VIDEO_LINK has invalid URL format', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK,
        content: 'not-a-valid-url'
      };

      expect(() => Material.create(props)).toThrow('Invalid URL format for video link');
    });

    it('should throw error if VIDEO_LINK is not from YouTube or Vimeo', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK,
        content: 'https://example.com/video.mp4'
      };

      expect(() => Material.create(props)).toThrow('Video links must be from YouTube or Vimeo');
    });

    it('should throw error if VIDEO_LINK does not use HTTPS', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK,
        content: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
      };

      expect(() => Material.create(props)).toThrow('Video links must use HTTPS protocol');
    });
  });

  describe('updateTitle', () => {
    it('should update material title', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Old Title',
        type: MaterialType.TEXT,
        content: 'Content'
      });

      material.updateTitle('New Title');

      expect(material.getTitle()).toBe('New Title');
    });

    it('should throw error if new title is empty', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Old Title',
        type: MaterialType.TEXT,
        content: 'Content'
      });

      expect(() => material.updateTitle('')).toThrow('Material title is required');
    });
  });

  describe('updateTextContent', () => {
    it('should update text content for TEXT type material', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Old content'
      });

      material.updateTextContent('New content');

      expect(material.getContent()).toBe('New content');
    });

    it('should throw error if material is not TEXT type', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      });

      expect(() => material.updateTextContent('New content')).toThrow('Can only update content for TEXT type materials');
    });

    it('should throw error if new content is empty', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Old content'
      });

      expect(() => material.updateTextContent('')).toThrow('Content is required for TEXT type material');
    });
  });

  describe('updateVideoUrl', () => {
    it('should update video URL for VIDEO_LINK type material', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK,
        content: 'https://www.youtube.com/watch?v=old'
      });

      material.updateVideoUrl('https://www.youtube.com/watch?v=new');

      expect(material.getContent()).toBe('https://www.youtube.com/watch?v=new');
    });

    it('should throw error if material is not VIDEO_LINK type', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Content'
      });

      expect(() => material.updateVideoUrl('https://www.youtube.com/watch?v=new')).toThrow('Can only update URL for VIDEO_LINK type materials');
    });

    it('should throw error if new URL is invalid', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.VIDEO_LINK,
        content: 'https://www.youtube.com/watch?v=old'
      });

      expect(() => material.updateVideoUrl('https://example.com/video')).toThrow('Video links must be from YouTube or Vimeo');
    });
  });

  describe('updateFile', () => {
    it('should update file metadata for FILE type material', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/old.pdf',
        fileName: 'old.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      });

      material.updateFile('uploads/new.pdf', 'new.pdf', 2048, 'application/pdf');

      expect(material.getFilePath()).toBe('uploads/new.pdf');
      expect(material.getFileName()).toBe('new.pdf');
      expect(material.getFileSize()).toBe(2048);
      expect(material.getMimeType()).toBe('application/pdf');
    });

    it('should throw error if material is not FILE type', () => {
      const material = Material.create({
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Content'
      });

      expect(() => material.updateFile('uploads/new.pdf', 'new.pdf', 2048, 'application/pdf')).toThrow('Can only update file for FILE type materials');
    });
  });

  describe('toObject', () => {
    it('should convert FILE type material to plain object', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.FILE,
        filePath: 'uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      };

      const material = Material.create(props);
      const obj = material.toObject();

      expect(obj.id).toBe(props.id);
      expect(obj.courseId).toBe(props.courseId);
      expect(obj.title).toBe(props.title);
      expect(obj.type).toBe(MaterialType.FILE);
      expect(obj.filePath).toBe(props.filePath);
      expect(obj.fileName).toBe(props.fileName);
      expect(obj.fileSize).toBe(props.fileSize);
      expect(obj.mimeType).toBe(props.mimeType);
    });

    it('should convert TEXT type material to plain object', () => {
      const props = {
        id: randomUUID(),
        courseId: randomUUID(),
        title: 'Test',
        type: MaterialType.TEXT,
        content: 'Content'
      };

      const material = Material.create(props);
      const obj = material.toObject();

      expect(obj.id).toBe(props.id);
      expect(obj.type).toBe(MaterialType.TEXT);
      expect(obj.content).toBe(props.content);
    });
  });
});
