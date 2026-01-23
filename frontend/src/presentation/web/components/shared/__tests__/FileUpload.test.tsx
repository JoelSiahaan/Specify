/**
 * FileUpload Component Tests
 * 
 * Tests for the FileUpload component functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileUpload } from '../FileUpload';
import * as fileValidator from '../../../utils/fileValidator';

// Mock the file validator
vi.mock('../../../utils/fileValidator', () => ({
  validateFile: vi.fn(),
  formatFileSize: vi.fn((bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`),
}));

describe('FileUpload Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fileValidator.validateFile).mockReturnValue({ valid: true });
  });

  it('should render default state', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/Drop files here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, or images \(max 10MB\)/i)).toBeInTheDocument();
  });

  it('should handle file selection via input', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('should display validation error for invalid file', () => {
    vi.mocked(fileValidator.validateFile).mockReturnValue({
      valid: false,
      error: 'File size exceeds 10MB limit',
    });

    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const file = new File(['test content'], 'large-file.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/File size exceeds 10MB limit/i)).toBeInTheDocument();
  });

  it('should show uploading state with progress', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<FileUpload onFileSelect={mockOnFileSelect} onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
    });
  });

  it('should show success state after upload', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    render(<FileUpload onFileSelect={mockOnFileSelect} onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Upload successful/i)).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should show error state and retry button on upload failure', async () => {
    mockOnUpload.mockRejectedValue(new Error('Network error'));

    render(<FileUpload onFileSelect={mockOnFileSelect} onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });

  it('should handle retry after failed upload', async () => {
    mockOnUpload
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);

    render(<FileUpload onFileSelect={mockOnFileSelect} onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/Retry/i);
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Upload successful/i)).toBeInTheDocument();
    });
  });

  it('should handle file removal', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    render(<FileUpload onFileSelect={mockOnFileSelect} onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Upload successful/i)).toBeInTheDocument();
    });

    const removeButton = screen.getByText(/Remove/i);
    fireEvent.click(removeButton);
    
    expect(screen.getByText(/Drop files here or click to browse/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
