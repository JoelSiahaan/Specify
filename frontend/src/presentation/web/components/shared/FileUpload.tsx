/**
 * FileUpload Component
 * 
 * Reusable file upload component with drag & drop, progress tracking, and validation.
 * 
 * Features:
 * - Drag and drop support
 * - File type validation (PDF, DOCX, images)
 * - File size validation (max 10MB)
 * - Upload progress indicator
 * - Retry mechanism for failed uploads
 * - File preview after upload
 * - Remove/replace file option
 * 
 * @example
 * // Basic usage (file selection only, no auto-upload)
 * <FileUpload
 *   onFileSelect={(file) => setSelectedFile(file)}
 * />
 * 
 * @example
 * // With auto-upload
 * <FileUpload
 *   onFileSelect={(file) => setSelectedFile(file)}
 *   onUpload={async (file) => {
 *     const formData = new FormData();
 *     formData.append('file', file);
 *     await api.post('/upload', formData);
 *   }}
 * />
 * 
 * @example
 * // With custom accept types and helper text
 * <FileUpload
 *   onFileSelect={(file) => setSelectedFile(file)}
 *   accept=".pdf,.docx"
 *   helperText="Only PDF and DOCX files allowed (max 10MB)"
 * />
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { validateFile, formatFileSize } from '../../utils/fileValidator';
import { Button } from './Button';

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload?: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  file?: File;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUpload,
  accept,
  disabled = false,
  className = '',
  helperText = 'PDF, DOCX, or images (max 10MB)',
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: validation.error,
        file,
      });
      return;
    }

    // Update state with selected file
    setUploadState({
      status: 'idle',
      progress: 0,
      file,
    });

    // Notify parent component
    onFileSelect(file);

    // Auto-upload if onUpload is provided
    if (onUpload) {
      handleUpload(file);
    }
  }, [onFileSelect, onUpload]);

  /**
   * Handle file upload
   */
  const handleUpload = async (file: File) => {
    if (!onUpload) return;

    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      progress: 0,
      error: undefined,
    }));

    try {
      // Simulate progress (in real implementation, use XMLHttpRequest or fetch with progress)
      progressIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return;
        }
        setUploadState(prev => {
          if (prev.progress >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);

      await onUpload(file);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (isMountedRef.current) {
        setUploadState(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
        }));
      }
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (isMountedRef.current) {
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
        }));
      }
    }
  };

  /**
   * Handle retry upload
   */
  const handleRetry = () => {
    if (uploadState.file) {
      handleUpload(uploadState.file);
    }
  };

  /**
   * Handle remove file
   */
  const handleRemove = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle click to browse
   */
  const handleClick = () => {
    if (!disabled && uploadState.status !== 'uploading') {
      fileInputRef.current?.click();
    }
  };

  /**
   * Render default state (no file selected)
   */
  const renderDefaultState = () => (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragOver
          ? 'border-primary bg-blue-50'
          : 'border-gray-300 hover:border-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl" aria-hidden="true">📁</span>
        <div>
          <p className="text-lg font-medium text-gray-700">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="File upload input"
      />
    </div>
  );

  /**
   * Render uploading state
   */
  const renderUploadingState = () => (
    <div className="border-2 border-primary rounded-lg p-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl" aria-hidden="true">📄</span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{uploadState.file?.name}</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
              role="progressbar"
              aria-valuenow={uploadState.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading... {uploadState.progress}%
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * Render success state
   */
  const renderSuccessState = () => (
    <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl" aria-hidden="true">📄</span>
          <div>
            <p className="font-medium text-gray-900">{uploadState.file?.name}</p>
            <p className="text-sm text-gray-600">
              {uploadState.file && formatFileSize(uploadState.file.size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl text-green-600" aria-label="Upload successful">✓</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <div className="border-2 border-red-500 rounded-lg p-6 bg-red-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl" aria-hidden="true">📄</span>
          <div>
            <p className="font-medium text-gray-900">{uploadState.file?.name}</p>
            <p className="text-sm text-red-600">{uploadState.error}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetry}
              disabled={disabled}
            >
              Retry
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Render idle state with file selected (no auto-upload)
   */
  const renderIdleWithFileState = () => (
    <div className="border-2 border-gray-300 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl" aria-hidden="true">📄</span>
          <div>
            <p className="font-medium text-gray-900">{uploadState.file?.name}</p>
            <p className="text-sm text-gray-600">
              {uploadState.file && formatFileSize(uploadState.file.size)}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
        >
          Remove
        </Button>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {uploadState.status === 'idle' && !uploadState.file && renderDefaultState()}
      {uploadState.status === 'idle' && uploadState.file && renderIdleWithFileState()}
      {uploadState.status === 'uploading' && renderUploadingState()}
      {uploadState.status === 'success' && renderSuccessState()}
      {uploadState.status === 'error' && renderErrorState()}
    </div>
  );
};

export default FileUpload;
