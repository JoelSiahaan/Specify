/**
 * CreateMaterial Component Tests
 * 
 * Tests for the CreateMaterial component functionality.
 * 
 * Requirements:
 * - 7.1: Upload files (PDF, images up to 10MB)
 * - 7.2: Add rich text content
 * - 7.3: Link to external videos
 * - 19.1, 19.2, 19.5: Frontend interface requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter as render } from '../../../../../test/test-utils';
import { CreateMaterial } from '../CreateMaterial';
import * as materialService from '../../../services/materialService';
import { MaterialType } from '../../../types';

// Mock materialService
vi.mock('../../../services/materialService', () => ({
  createFileMaterial: vi.fn(),
  createTextMaterial: vi.fn(),
  createVideoMaterial: vi.fn(),
}));

// Mock materials for testing
const mockFileMaterial = {
  id: 'material-1',
  courseId: 'course-123',
  title: 'Lecture Notes',
  type: MaterialType.FILE,
  filePath: 'uploads/test.pdf',
  fileName: 'test.pdf',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTextMaterial = {
  id: 'material-2',
  courseId: 'course-123',
  title: 'Course Introduction',
  type: MaterialType.TEXT,
  content: 'Welcome to the course!',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockVideoMaterial = {
  id: 'material-3',
  courseId: 'course-123',
  title: 'Tutorial Video',
  type: MaterialType.VIDEO_LINK,
  content: 'https://www.youtube.com/watch?v=example',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CreateMaterial Component', () => {
  const mockCourseId = 'course-123';
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create material form', () => {
      render(<CreateMaterial courseId={mockCourseId} />);
      
      expect(screen.getByText('Add New Material')).toBeInTheDocument();
      expect(screen.getByLabelText(/material type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add material/i })).toBeInTheDocument();
    });

    it('should render cancel button when onCancel is provided', () => {
      render(<CreateMaterial courseId={mockCourseId} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should default to FILE material type', () => {
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const typeSelect = screen.getByLabelText(/material type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe(MaterialType.FILE);
    });
  });

  describe('Material Type Selection', () => {
    it('should show file upload for FILE type', async () => {
      const user = userEvent.setup();
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const typeSelect = screen.getByLabelText(/material type/i);
      await user.selectOptions(typeSelect, MaterialType.FILE);
      
      expect(screen.getByText(/click to browse or drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF, DOCX, or images \(max 10MB\)/i)).toBeInTheDocument();
    });

    it('should show textarea for TEXT type', async () => {
      const user = userEvent.setup();
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const typeSelect = screen.getByLabelText(/material type/i);
      await user.selectOptions(typeSelect, MaterialType.TEXT);
      
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByText(/0\/50,000 characters/i)).toBeInTheDocument();
    });

    it('should show URL input for VIDEO_LINK type', async () => {
      const user = userEvent.setup();
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const typeSelect = screen.getByLabelText(/material type/i);
      await user.selectOptions(typeSelect, MaterialType.VIDEO_LINK);
      
      expect(screen.getByLabelText(/video url/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a youtube, vimeo, or other video url/i)).toBeInTheDocument();
    });
  });


  describe('Form Validation', () => {
    it('should validate required title', async () => {
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeRequired();
    });

    it('should validate title length', () => {
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput).toHaveAttribute('maxLength', '200');
    });

    it('should validate file selection for FILE type', async () => {
      render(<CreateMaterial courseId={mockCourseId} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /add material/i });
      
      fireEvent.change(titleInput, { target: { value: 'Test Material' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please select a file to upload/i)).toBeInTheDocument();
      });
    });

    it('should validate content for TEXT type', async () => {
      const user = userEvent.setup();
      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      await user.selectOptions(typeSelect, MaterialType.TEXT);

      // Wait for re-render after material type change
      await waitFor(() => {
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Material');

      const submitButton = screen.getByRole('button', { name: /add material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });

    it('should validate URL for VIDEO_LINK type', async () => {
      const user = userEvent.setup();
      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      await user.selectOptions(typeSelect, MaterialType.VIDEO_LINK);

      // Wait for re-render after material type change
      await waitFor(() => {
        expect(screen.getByLabelText(/video url/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Material');

      const contentInput = screen.getByLabelText(/video url/i);
      await user.type(contentInput, 'invalid-url');

      const submitButton = screen.getByRole('button', { name: /add material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      });
    });
  });


  describe('File Upload', () => {
    it('should handle file selection', () => {
      render(<CreateMaterial courseId={mockCourseId} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/file/i) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('should validate file size (max 10MB)', () => {
      render(<CreateMaterial courseId={mockCourseId} />);

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/file/i) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(screen.getByText(/file size must not exceed 10mb/i)).toBeInTheDocument();
    });

    it('should validate file type', () => {
      render(<CreateMaterial courseId={mockCourseId} />);

      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const fileInput = screen.getByLabelText(/file/i) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
    });

    it('should display file size', () => {
      render(<CreateMaterial courseId={mockCourseId} />);

      const file = new File(['x'.repeat(1024 * 1024)], 'test.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/file/i) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText(/1.0 MB/)).toBeInTheDocument();
    });
  });


  describe('Form Submission', () => {
    it('should create FILE material successfully', async () => {
      vi.spyOn(materialService, 'createFileMaterial').mockResolvedValue(mockFileMaterial);

      render(<CreateMaterial courseId={mockCourseId} onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Lecture Notes' } });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/file/i) as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(materialService.createFileMaterial).toHaveBeenCalledWith(mockCourseId, {
          title: 'Lecture Notes',
          type: 'FILE',
          file,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockFileMaterial);
    });

    it('should create TEXT material successfully', async () => {
      vi.spyOn(materialService, 'createTextMaterial').mockResolvedValue(mockTextMaterial);

      render(<CreateMaterial courseId={mockCourseId} onSuccess={mockOnSuccess} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Course Introduction' } });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Welcome to the course!' } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(materialService.createTextMaterial).toHaveBeenCalledWith(mockCourseId, {
          title: 'Course Introduction',
          type: 'TEXT',
          content: 'Welcome to the course!',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockTextMaterial);
    });

    it('should create VIDEO_LINK material successfully', async () => {
      vi.spyOn(materialService, 'createVideoMaterial').mockResolvedValue(mockVideoMaterial);

      render(<CreateMaterial courseId={mockCourseId} onSuccess={mockOnSuccess} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.VIDEO_LINK } });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Tutorial Video' } });

      const contentInput = screen.getByLabelText(/video url/i);
      fireEvent.change(contentInput, {
        target: { value: 'https://www.youtube.com/watch?v=example' },
      });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(materialService.createVideoMaterial).toHaveBeenCalledWith(mockCourseId, {
          title: 'Tutorial Video',
          type: 'VIDEO_LINK',
          content: 'https://www.youtube.com/watch?v=example',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockVideoMaterial);
    });

    it('should display loading state during submission', async () => {
      vi.spyOn(materialService, 'createTextMaterial').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTextMaterial), 100))
      );

      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });
    });

    it('should display error message on submission failure', async () => {
      vi.spyOn(materialService, 'createTextMaterial').mockRejectedValue({
        message: 'Failed to create material',
      });

      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create material/i)).toBeInTheDocument();
      });
    });

    it('should handle server validation errors', async () => {
      vi.spyOn(materialService, 'createTextMaterial').mockRejectedValue({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: {
          title: 'Title is too short',
          content: 'Content is required',
        },
      });

      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      // Wait for re-render after material type change
      await waitFor(() => {
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'T' } });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is too short/i)).toBeInTheDocument();
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });
  });


  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<CreateMaterial courseId={mockCourseId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful submission', async () => {
      vi.spyOn(materialService, 'createTextMaterial').mockResolvedValue(mockTextMaterial);

      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const submitButton = screen.getByRole('button', { name: /add material/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
        expect(contentInput.value).toBe('');
      });
    });
  });

  describe('Character Counter', () => {
    it('should display character count for TEXT type', () => {
      render(<CreateMaterial courseId={mockCourseId} />);

      const typeSelect = screen.getByLabelText(/material type/i);
      fireEvent.change(typeSelect, { target: { value: MaterialType.TEXT } });

      expect(screen.getByText(/0\/50,000 characters/i)).toBeInTheDocument();

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Hello World' } });

      expect(screen.getByText(/11\/50,000 characters/i)).toBeInTheDocument();
    });
  });
});
