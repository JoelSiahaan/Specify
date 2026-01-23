/**
 * MaterialList Component Tests
 * 
 * Tests for the MaterialList component functionality.
 * 
 * Requirements:
 * - 8.1: Display list of materials
 * - 8.2: Download files
 * - 19.1, 19.2, 19.5: Frontend interface requirements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialList } from '../MaterialList';
import * as materialServiceModule from '../../../services/materialService';
import { AuthContext } from '../../../contexts/AuthContext';
import type { User, Material } from '../../../types';
import { UserRole, MaterialType } from '../../../types';

// Mock services
vi.mock('../../../services/materialService');

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock data
const mockTeacher: User = {
  id: 'teacher-123',
  email: 'teacher@example.com',
  name: 'John Teacher',
  role: UserRole.TEACHER,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockStudent: User = {
  id: 'student-123',
  email: 'student@example.com',
  name: 'Jane Student',
  role: UserRole.STUDENT,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockFileMaterial: Material = {
  id: 'material-1',
  title: 'Lecture Notes',
  type: 'FILE' as MaterialType,
  courseId: 'course-123',
  filePath: 'uploads/file.pdf',
  fileName: 'lecture-notes.pdf',
  fileSize: 1024000, // 1MB
  mimeType: 'application/pdf',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockTextMaterial: Material = {
  id: 'material-2',
  title: 'Course Introduction',
  type: 'TEXT' as MaterialType,
  courseId: 'course-123',
  content: 'Welcome to the course! This is a comprehensive introduction to programming...',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockVideoMaterial: Material = {
  id: 'material-3',
  title: 'Tutorial Video',
  type: 'VIDEO_LINK' as MaterialType,
  courseId: 'course-123',
  content: 'https://www.youtube.com/watch?v=example',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// Helper to render with auth context
const renderWithAuth = (user: User | null = mockStudent) => {
  const mockAuthContext = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    clearError: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MaterialList courseId="course-123" />
    </AuthContext.Provider>
  );
};

describe('MaterialList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Display', () => {
    it('should display loading spinner while fetching materials', () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithAuth();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display materials after loading', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial, mockTextMaterial, mockVideoMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      expect(screen.getByText('Course Introduction')).toBeInTheDocument();
      expect(screen.getByText('Tutorial Video')).toBeInTheDocument();
    });

    it('should display error message when fetch fails', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockRejectedValue({
        message: 'Failed to load materials',
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Failed to load materials')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display empty state when no materials exist', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('No Materials')).toBeInTheDocument();
      });

      expect(screen.getByText("This course doesn't have any materials yet.")).toBeInTheDocument();
    });
  });

  describe('Material Types', () => {
    it('should display FILE material with download button', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText(/1000.0 KB/)).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should display TEXT material with content preview', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockTextMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Course Introduction')).toBeInTheDocument();
      });

      expect(screen.getByText('Text Content')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to the course/)).toBeInTheDocument();
    });

    it('should display VIDEO_LINK material with embedded iframe', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockVideoMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Tutorial Video')).toBeInTheDocument();
      });

      expect(screen.getByText('Video Link')).toBeInTheDocument();
      
      // Check for embedded iframe
      const iframe = screen.getByTitle('Tutorial Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/example');
      
      // Check for link below iframe
      const link = screen.getByText('https://www.youtube.com/watch?v=example');
      expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=example');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Download Functionality', () => {
    it('should handle file download', async () => {
      const mockDownload = vi.spyOn(materialServiceModule, 'downloadMaterial').mockResolvedValue();
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      expect(mockDownload).toHaveBeenCalledWith('material-1', 'lecture-notes.pdf');
    });

    it('should display error when download fails', async () => {
      vi.spyOn(materialServiceModule, 'downloadMaterial').mockRejectedValue({
        message: 'Failed to download file',
      });
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to download file')).toBeInTheDocument();
      });
    });
  });

  describe('Teacher Actions', () => {
    it('should show edit and delete buttons for teachers', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should not show edit and delete buttons for students', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth(mockStudent);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should handle material deletion', async () => {
      const mockDelete = vi.spyOn(materialServiceModule, 'deleteMaterial').mockResolvedValue();
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial, mockTextMaterial],
      });

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('material-1');
      });

      // Material should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('Lecture Notes')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Course Introduction')).toBeInTheDocument();
    });

    it('should display error when deletion fails', async () => {
      vi.spyOn(materialServiceModule, 'deleteMaterial').mockRejectedValue({
        message: 'Failed to delete material',
      });
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete material')).toBeInTheDocument();
      });
    });

    it('should show deleting state during deletion', async () => {
      vi.spyOn(materialServiceModule, 'deleteMaterial').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show add material button for teachers in empty state', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [],
      });

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('No Materials')).toBeInTheDocument();
      });

      expect(screen.getByText('Add Material')).toBeInTheDocument();
    });

    it('should not show add material button for students in empty state', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [],
      });

      renderWithAuth(mockStudent);

      await waitFor(() => {
        expect(screen.getByText('No Materials')).toBeInTheDocument();
      });

      expect(screen.queryByText('Add Material')).not.toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should retry fetching materials on retry button click', async () => {
      const mockListMaterials = vi.spyOn(materialServiceModule, 'listMaterials')
        .mockRejectedValueOnce({ message: 'Network error' })
        .mockResolvedValueOnce({ data: [mockFileMaterial] });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      expect(mockListMaterials).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edit Modal Integration', () => {
    it('should open edit modal when edit button is clicked', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });
      vi.spyOn(materialServiceModule, 'getMaterialById').mockResolvedValue(mockFileMaterial);

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Should show UpdateMaterial modal (check for heading)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /update material/i })).toBeInTheDocument();
      });
    });

    it('should close edit modal when cancel is clicked', async () => {
      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });
      vi.spyOn(materialServiceModule, 'getMaterialById').mockResolvedValue(mockFileMaterial);

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      // Open edit modal
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /update material/i })).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Modal should close, material list should be visible again
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /update material/i })).not.toBeInTheDocument();
      });
      expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
    });

    it('should update material in list after successful edit', async () => {
      const updatedMaterial = {
        ...mockFileMaterial,
        title: 'Updated Lecture Notes',
      };

      vi.spyOn(materialServiceModule, 'listMaterials').mockResolvedValue({
        data: [mockFileMaterial],
      });
      vi.spyOn(materialServiceModule, 'getMaterialById').mockResolvedValue(mockFileMaterial);
      vi.spyOn(materialServiceModule, 'updateFileMaterial').mockResolvedValue(updatedMaterial);

      renderWithAuth(mockTeacher);

      await waitFor(() => {
        expect(screen.getByText('Lecture Notes')).toBeInTheDocument();
      });

      // Open edit modal
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /update material/i })).toBeInTheDocument();
      });

      // Update title
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Lecture Notes' } });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update material/i });
      fireEvent.click(updateButton);

      // Modal should close and material should be updated in list
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /update material/i })).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Updated Lecture Notes')).toBeInTheDocument();
      });
      expect(screen.queryByText('Lecture Notes')).not.toBeInTheDocument();
    });
  });
});
