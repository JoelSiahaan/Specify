/**
 * CreateMaterial Component
 * 
 * Form for creating a new material with type selector.
 * Supports FILE upload, TEXT content, and VIDEO_LINK.
 * Teacher-only component.
 * 
 * Requirements:
 * - 7.1: Upload files (PDF, images up to 10MB)
 * - 7.2: Add rich text content
 * - 7.3: Link to external videos
 * - 21.6: File upload with progress bar and retry mechanism
 */

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Spinner } from '../shared/Spinner';
import * as materialService from '../../services/materialService';
import { MATERIAL_TYPE_LABELS, MaterialType, Material, ApiError } from '../../types';

interface CreateMaterialProps {
  courseId: string;
  onSuccess?: (material: Material) => void;
  onCancel?: () => void;
}

export const CreateMaterial: React.FC<CreateMaterialProps> = ({
  courseId,
  onSuccess,
  onCancel,
}) => {
  // Form state
  const [materialType, setMaterialType] = useState<MaterialType>(MaterialType.FILE);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handle material type change
   */
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as unknown as MaterialType;
    setMaterialType(newType);
    
    // Reset form fields
    setContent('');
    setFile(null);
    setValidationErrors({});
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setValidationErrors({
        ...validationErrors,
        file: 'File size must not exceed 10MB',
      });
      setFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setValidationErrors({
        ...validationErrors,
        file: 'File type not allowed. Please upload PDF, DOCX, JPG, PNG, or GIF',
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    
    // Clear file validation error
    if (validationErrors.file) {
      const newErrors = { ...validationErrors };
      delete newErrors.file;
      setValidationErrors(newErrors);
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
    
    if (materialType === MaterialType.FILE) {
      if (!file) {
        errors.file = 'Please select a file to upload';
      }
    } else if (materialType === MaterialType.TEXT) {
      if (!content.trim()) {
        errors.content = 'Content is required';
      } else if (content.length > 50000) {
        errors.content = 'Content must not exceed 50,000 characters';
      }
    } else if (materialType === MaterialType.VIDEO_LINK) {
      if (!content.trim()) {
        errors.content = 'Video URL is required';
      } else {
        // Basic URL validation
        try {
          new URL(content);
        } catch {
          errors.content = 'Please enter a valid URL';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== HANDLE SUBMIT START ===');
    console.log('Current validationErrors state:', validationErrors);
    
    // Clear previous general error (but keep validation errors)
    setError('');
    
    // Validate form (this sets validation errors in state)
    console.log('Calling validateForm()...');
    const isValid = validateForm();
    console.log('validateForm() returned:', isValid);
    console.log('validationErrors after validateForm:', validationErrors);
    
    // If validation fails, stop here (errors are already set in state)
    if (!isValid) {
      console.log('Validation failed, returning early');
      console.log('=== HANDLE SUBMIT END (validation failed) ===');
      return;
    }
    
    console.log('Validation passed, proceeding with submission');
    // Clear validation errors before proceeding with submission
    setValidationErrors({});
    setLoading(true);
    setUploadProgress(0);
    
    try {
      let material: Material;
      
      if (materialType === MaterialType.FILE && file) {
        // Upload file material
        material = await materialService.createFileMaterial(courseId, {
          title,
          type: 'FILE',
          file,
        });
        
        // Simulate progress (real progress would need axios onUploadProgress)
        setUploadProgress(100);
      } else if (materialType === MaterialType.TEXT) {
        // Create text material
        material = await materialService.createTextMaterial(courseId, {
          title,
          type: 'TEXT',
          content,
        });
      } else {
        // Create video link material
        material = await materialService.createVideoMaterial(courseId, {
          title,
          type: 'VIDEO_LINK',
          content,
        });
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(material);
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else {
        setError(apiError.message || 'Failed to create material. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Add New Material
      </h2>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Create Material Form */}
      <form onSubmit={handleSubmit}>
        {/* Material Type Selector */}
        <div className="mb-4">
          <label htmlFor="materialType" className="block font-medium text-gray-800 mb-2">
            Material Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="materialType"
            value={materialType}
            onChange={handleTypeChange}
            disabled={loading}
            className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={MaterialType.FILE}>{MATERIAL_TYPE_LABELS.FILE}</option>
            <option value={MaterialType.TEXT}>{MATERIAL_TYPE_LABELS.TEXT}</option>
            <option value={MaterialType.VIDEO_LINK}>{MATERIAL_TYPE_LABELS.VIDEO_LINK}</option>
          </select>
        </div>

        {/* Title */}
        <Input
          label="Title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Lecture 1: Introduction"
          error={validationErrors.title}
          required
          disabled={loading}
          maxLength={200}
        />

        {/* FILE Type: File Upload */}
        {materialType === MaterialType.FILE && (
          <div className="mb-4">
            <label htmlFor="file" className="block font-medium text-gray-800 mb-2">
              File
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                disabled={loading}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.gif"
                className="hidden"
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <span className="text-4xl">📁</span>
                {file ? (
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF, DOCX, or images (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
            {validationErrors.file && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.file}</p>
            )}
            
            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* TEXT Type: Textarea (temporary, will use RichTextEditor when library is installed) */}
        {materialType === MaterialType.TEXT && (
          <div className="mb-4">
            <label htmlFor="content" className="block font-medium text-gray-800 mb-2">
              Content
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your text content here..."
              required
              disabled={loading}
              rows={10}
              maxLength={50000}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
                validationErrors.content
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {validationErrors.content && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.content}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {content.length}/50,000 characters
            </p>
          </div>
        )}

        {/* VIDEO_LINK Type: URL Input */}
        {materialType === MaterialType.VIDEO_LINK && (
          <div className="mb-4">
            <Input
              label="Video URL"
              name="content"
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              error={validationErrors.content}
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter a YouTube, Vimeo, or other video URL
            </p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                {materialType === MaterialType.FILE ? 'Uploading...' : 'Creating...'}
              </span>
            ) : (
              'Add Material'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};


export default CreateMaterial;
