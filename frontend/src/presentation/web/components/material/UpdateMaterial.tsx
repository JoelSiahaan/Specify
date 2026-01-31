/**
 * UpdateMaterial Component
 * 
 * Form for updating an existing material.
 * Supports updating FILE (with optional file replacement), TEXT content, and VIDEO_LINK.
 * Teacher-only component.
 * 
 * Requirements:
 * - 7.7: Allow teachers to edit existing materials
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, ErrorMessage, Spinner } from '../shared';
import { materialService } from '../../services';
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ICONS } from '../../types';
import type { Material, ApiError } from '../../types';

interface UpdateMaterialProps {
  materialId: string;
  onSuccess?: (material: Material) => void;
  onCancel?: () => void;
}

export const UpdateMaterial: React.FC<UpdateMaterialProps> = ({
  materialId,
  onSuccess,
  onCancel,
}) => {
  // Material state
  const [material, setMaterial] = useState<Material | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [replaceFile, setReplaceFile] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Load material data on mount
   */
  useEffect(() => {
    const loadMaterial = async () => {
      try {
        setLoadingMaterial(true);
        const data = await materialService.getMaterialById(materialId);
        setMaterial(data);
        setTitle(data.title);
        setContent(data.content || '');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load material');
      } finally {
        setLoadingMaterial(false);
      }
    };

    loadMaterial();
  }, [materialId]);

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
    
    if (material?.type === 'TEXT') {
      if (!content.trim()) {
        errors.content = 'Content is required';
      } else if (content.length > 50000) {
        errors.content = 'Content must not exceed 50,000 characters';
      }
    } else if (material?.type === 'VIDEO_LINK') {
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
    
    if (!material) return;
    
    // Clear previous errors
    setError('');
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      let updatedMaterial: Material;
      
      if (material.type === 'FILE') {
        // Update file material
        updatedMaterial = await materialService.updateFileMaterial(materialId, {
          title,
          file: file || undefined,
        });
        
        // Simulate progress (real progress would need axios onUploadProgress)
        if (file) {
          setUploadProgress(100);
        }
      } else if (material.type === 'TEXT') {
        // Update text material
        updatedMaterial = await materialService.updateTextMaterial(materialId, {
          title,
          content,
        });
      } else {
        // Update video link material
        updatedMaterial = await materialService.updateVideoMaterial(materialId, {
          title,
          content,
        });
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(updatedMaterial);
      }
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else {
        setError(apiError.message || 'Failed to update material. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
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

  // Loading state
  if (loadingMaterial) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">Loading material...</span>
        </div>
      </div>
    );
  }

  // Error loading material
  if (!material) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <ErrorMessage message={error || 'Material not found'} />
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="mt-4"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Update Material
      </h2>

      {/* Material Type Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          <span>{MATERIAL_TYPE_ICONS[material.type]}</span>
          <span>{MATERIAL_TYPE_LABELS[material.type]}</span>
        </span>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Update Material Form */}
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <Input
          label="Title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Lecture 1: Introduction"
          error={validationErrors.title}
          disabled={loading}
          maxLength={200}
        />

        {/* FILE Type: Current File Info + Optional Replacement */}
        {material.type === 'FILE' && (
          <div className="mb-4">
            {/* Current File Info */}
            <div className="mb-3">
              <label className="block font-medium text-gray-800 mb-2">
                Current File
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{material.fileName}</p>
                    {material.fileSize && (
                      <p className="text-sm text-gray-600">
                        {formatFileSize(material.fileSize)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Replace File Option */}
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceFile}
                  onChange={(e) => {
                    setReplaceFile(e.target.checked);
                    if (!e.target.checked) {
                      setFile(null);
                      const newErrors = { ...validationErrors };
                      delete newErrors.file;
                      setValidationErrors(newErrors);
                    }
                  }}
                  disabled={loading}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Replace file
                </span>
              </label>
            </div>

            {/* File Upload (if replacing) */}
            {replaceFile && (
              <div>
                <label htmlFor="file" className="block font-medium text-gray-800 mb-2">
                  New File
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
          </div>
        )}

        {/* TEXT Type: Textarea (temporary, will use RichTextEditor when library is installed) */}
        {material.type === 'TEXT' && (
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
        {material.type === 'VIDEO_LINK' && (
          <div className="mb-4">
            <Input
              label="Video URL"
              name="content"
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              error={validationErrors.content}
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
                {material.type === 'FILE' && file ? 'Uploading...' : 'Updating...'}
              </span>
            ) : (
              'Update Material'
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

export default UpdateMaterial;
