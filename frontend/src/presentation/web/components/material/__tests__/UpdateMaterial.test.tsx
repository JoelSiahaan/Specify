/**
 * UpdateMaterial Component Tests
 * 
 * Tests for the UpdateMaterial component functionality.
 * 
 * Requirements:
 * - 7.7: Allow teachers to edit existing materials
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../../test/test-wrappers';
import { UpdateMaterial } from '../UpdateMaterial';
import * as materialService from '../../../services/materialService';
import { MaterialType } from '../../../types';

// Mock materialService
vi.mock('../../../services/materialService', () => ({
  getMaterialById: vi.fn(),
  updateFileMaterial: vi.fn(),
  updateTextMaterial: vi.fn(),
  updateVideoMaterial: vi.fn(),
}));

// Mock materials for testing
const mockFileMaterial = {
  id: 'material-1',
  courseId: 'course-123',
  title: 'Lecture Notes',
  type: MaterialType.FILE,
  filePath: 'uploads/test.pdf',
  fileName: 'test.pdf',
  fileSize: 1024 * 1024, // 1MB
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

describe('UpdateMaterial Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching material', () => {
      vi.spyOn(materialService, 'getMaterialById').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(<UpdateMaterial materialId="material-1" />);

      expect(screen.getByText(/loading material/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message if material fails to load', async () => {
      vi.spyOn(materialService, 'getMaterialById').mockRejectedValue({
        message: 'Material not found',
      });

      renderWithRouter(<UpdateMaterial materialId="material-1" onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/material not found/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('FILE Material Update', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockFileMaterial);
    });

    it('should render update form for FILE material', async () => {
      renderWithRouter(<UpdateMaterial materialId="material-1" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Update Material' })).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Lecture Notes')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByLabelText(/replace file/i)).toBeInTheDocument();
    });

    it('should update FILE material without replacing file', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateFileMaterial').mockResolvedValue({
        ...mockFileMaterial,
        title: 'Updated Lecture Notes',
      });

      renderWithRouter(<UpdateMaterial materialId="material-1" onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Lecture Notes')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Lecture Notes');

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(materialService.updateFileMaterial).toHaveBeenCalledWith('material-1', {
          title: 'Updated Lecture Notes',
          file: undefined,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should update FILE material with file replacement', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateFileMaterial').mockResolvedValue({
        ...mockFileMaterial,
        title: 'Updated Lecture Notes',
        fileName: 'new-test.pdf',
      });

      renderWithRouter(<UpdateMaterial materialId="material-1" onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Lecture Notes')).toBeInTheDocument();
      });

      // Enable file replacement
      const replaceCheckbox = screen.getByLabelText(/replace file/i);
      await user.click(replaceCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/new file/i)).toBeInTheDocument();
      });

      // Select new file
      const file = new File(['new content'], 'new-test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/new file/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('new-test.pdf')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(materialService.updateFileMaterial).toHaveBeenCalledWith('material-1', {
          title: 'Lecture Notes',
          file: file,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should validate file size when replacing file', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UpdateMaterial materialId="material-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Lecture Notes')).toBeInTheDocument();
      });

      // Enable file replacement
      const replaceCheckbox = screen.getByLabelText(/replace file/i);
      await user.click(replaceCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/new file/i)).toBeInTheDocument();
      });

      // Try to upload large file
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });
      const fileInput = screen.getByLabelText(/new file/i) as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file size must not exceed 10mb/i)).toBeInTheDocument();
      });
    });

    it('should validate file type when replacing file', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UpdateMaterial materialId="material-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Lecture Notes')).toBeInTheDocument();
      });

      // Enable file replacement
      const replaceCheckbox = screen.getByLabelText(/replace file/i);
      await user.click(replaceCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/new file/i)).toBeInTheDocument();
      });

      // Try to upload invalid file type
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const fileInput = screen.getByLabelText(/new file/i) as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('TEXT Material Update', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockTextMaterial);
    });

    it('should render update form for TEXT material', async () => {
      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Update Material' })).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome to the course!')).toBeInTheDocument();
      expect(screen.getByText(/\/50,000 characters/i)).toBeInTheDocument();
    });

    it('should update TEXT material successfully', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateTextMaterial').mockResolvedValue({
        ...mockTextMaterial,
        title: 'Updated Introduction',
        content: 'Updated content',
      });

      renderWithRouter(<UpdateMaterial materialId="material-2" onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Introduction');

      const contentInput = screen.getByLabelText(/content/i);
      await user.clear(contentInput);
      await user.type(contentInput, 'Updated content');

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(materialService.updateTextMaterial).toHaveBeenCalledWith('material-2', {
          title: 'Updated Introduction',
          content: 'Updated content',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should validate required content for TEXT material', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const contentInput = screen.getByLabelText(/content/i);
      await user.clear(contentInput);

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('VIDEO_LINK Material Update', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockVideoMaterial);
    });

    it('should render update form for VIDEO_LINK material', async () => {
      renderWithRouter(<UpdateMaterial materialId="material-3" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Update Material' })).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Tutorial Video')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://www.youtube.com/watch?v=example')).toBeInTheDocument();
    });

    it('should update VIDEO_LINK material successfully', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateVideoMaterial').mockResolvedValue({
        ...mockVideoMaterial,
        title: 'Updated Video',
        content: 'https://www.youtube.com/watch?v=updated',
      });

      renderWithRouter(<UpdateMaterial materialId="material-3" onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Tutorial Video')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Video');

      const urlInput = screen.getByLabelText(/video url/i);
      await user.clear(urlInput);
      await user.type(urlInput, 'https://www.youtube.com/watch?v=updated');

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(materialService.updateVideoMaterial).toHaveBeenCalledWith('material-3', {
          title: 'Updated Video',
          content: 'https://www.youtube.com/watch?v=updated',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockTextMaterial);
    });

    it('should validate required title', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should validate title length', async () => {

      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput).toHaveAttribute('maxLength', '200');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockTextMaterial);
    });

    it('should display error message on update failure', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateTextMaterial').mockRejectedValue({
        message: 'Failed to update material',
      });

      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update material/i)).toBeInTheDocument();
      });
    });

    it('should handle server validation errors', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateTextMaterial').mockRejectedValue({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: {
          title: 'Title is too short',
          content: 'Content is required',
        },
      });

      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is too short/i)).toBeInTheDocument();
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockTextMaterial);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      renderWithRouter(<UpdateMaterial materialId="material-2" onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State During Update', () => {
    beforeEach(() => {
      vi.spyOn(materialService, 'getMaterialById').mockResolvedValue(mockTextMaterial);
    });

    it('should display loading state during update', async () => {
      const user = userEvent.setup();
      vi.spyOn(materialService, 'updateTextMaterial').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTextMaterial), 100))
      );

      renderWithRouter(<UpdateMaterial materialId="material-2" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Course Introduction')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update material/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });
    });
  });
});
