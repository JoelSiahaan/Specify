/**
 * MaterialList Component
 * 
 * Display list of materials for a course with type icons and actions.
 * Shows download button for files and edit/delete buttons for teachers.
 * 
 * Requirements:
 * - 8.1: Display list of materials
 * - 8.3: Show material type icons
 * - 8.4: Download button for files
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Button, Spinner, ErrorMessage } from '../shared';
import { UpdateMaterial } from './UpdateMaterial';
import { materialService } from '../../services';
import { useAuth } from '../../hooks';
import { MATERIAL_TYPE_ICONS, MATERIAL_TYPE_LABELS } from '../../types';
import type { Material, ApiError } from '../../types';
import { UserRole } from '../../types';

interface MaterialListProps {
  courseId: string;
  courseStatus?: 'ACTIVE' | 'ARCHIVED';
}

/**
 * Convert YouTube/Vimeo URLs to embed format
 * 
 * Supports:
 * - YouTube: watch?v=, youtu.be/, /embed/, /v/
 * - Vimeo: vimeo.com/VIDEO_ID, player.vimeo.com/video/VIDEO_ID
 * 
 * @param url - Video URL
 * @returns Embed URL or original URL if not recognized
 */
const getEmbedUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // YouTube patterns
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      
      // youtube.com/watch?v=VIDEO_ID
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v') || '';
      }
      // youtu.be/VIDEO_ID
      else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      // youtube.com/embed/VIDEO_ID (already embed format)
      else if (urlObj.pathname.startsWith('/embed/')) {
        return url;
      }
      // youtube.com/v/VIDEO_ID
      else if (urlObj.pathname.startsWith('/v/')) {
        videoId = urlObj.pathname.slice(3);
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Vimeo patterns
    if (urlObj.hostname.includes('vimeo.com')) {
      // player.vimeo.com/video/VIDEO_ID (already embed format)
      if (urlObj.hostname === 'player.vimeo.com' && urlObj.pathname.startsWith('/video/')) {
        return url;
      }
      
      // vimeo.com/VIDEO_ID
      const videoId = urlObj.pathname.slice(1).split('/')[0];
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    // Return original URL if not recognized
    return url;
  } catch {
    // Invalid URL, return as-is
    return url;
  }
};

export const MaterialList: React.FC<MaterialListProps> = ({ courseId, courseStatus = 'ACTIVE' }) => {
  const { user } = useAuth();

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  // Check if user is teacher
  const isTeacher = user?.role === UserRole.TEACHER;
  
  // Check if course is archived (read-only)
  const isArchived = courseStatus === 'ARCHIVED';

  /**
   * Fetch materials on mount
   */
  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  /**
   * Fetch materials from API
   */
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await materialService.listMaterials(courseId);
      setMaterials(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle material download
   */
  const handleDownload = async (material: Material) => {
    if (material.type !== 'FILE' || !material.fileName) {
      return;
    }

    try {
      await materialService.downloadMaterial(material.id, material.fileName);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to download file');
    }
  };

  /**
   * Handle view file (same as download - browser will display if supported)
   */
  const handleViewFile = async (material: Material) => {
    if (material.type !== 'FILE' || !material.id) {
      return;
    }

    try {
      await materialService.viewMaterial(material.id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to view file');
    }
  };

  /**
   * Get file type icon based on MIME type
   */
  const getFileTypeIcon = (mimeType?: string): string => {
    if (!mimeType) return '📄';
    
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    
    return '📄';
  };

  /**
   * Handle material delete
   */
  const handleDelete = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      setDeletingId(materialId);
      setError(null);
      await materialService.deleteMaterial(materialId);
      
      // Remove from list
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete material');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle edit material
   */
  const handleEdit = (materialId: string) => {
    setEditingMaterialId(materialId);
  };

  /**
   * Handle update success
   */
  const handleUpdateSuccess = (updatedMaterial: Material) => {
    // Update material in list
    setMaterials(materials.map(m => 
      m.id === updatedMaterial.id ? updatedMaterial : m
    ));
    
    // Close edit modal
    setEditingMaterialId(null);
  };

  /**
   * Handle update cancel
   */
  const handleUpdateCancel = () => {
    setEditingMaterialId(null);
  };

  /**
   * Sanitize HTML content and truncate for preview
   */
  const getContentPreview = (content: string, maxLength: number = 150): { html: string; isTruncated: boolean } => {
    // Sanitize HTML first
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
    
    // Get text length for truncation check
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (textContent.length <= maxLength) {
      return { html: sanitized, isTruncated: false };
    }
    
    // Truncate text while preserving some HTML structure
    let currentLength = 0;
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    
    while (walker.nextNode() && currentLength < maxLength) {
      const node = walker.currentNode;
      const text = node.textContent || '';
      const remaining = maxLength - currentLength;
      
      if (text.length <= remaining) {
        currentLength += text.length;
      } else {
        node.textContent = text.substring(0, remaining);
        currentLength = maxLength;
        break;
      }
    }
    
    return { html: tempDiv.innerHTML, isTruncated: true };
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && materials.length === 0) {
    return (
      <div className="py-6">
        <ErrorMessage message={error} />
        <Button
          variant="secondary"
          onClick={fetchMaterials}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (materials.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">📄</span>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Materials</h3>
        <p className="text-gray-600 mb-6">This course doesn't have any materials yet.</p>
        {isTeacher && !isArchived && (
          <Button variant="primary">
            Add Material
          </Button>
        )}
      </div>
    );
  }

  // Material list
  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Edit Material Modal */}
      {editingMaterialId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <UpdateMaterial
              materialId={editingMaterialId}
              onSuccess={handleUpdateSuccess}
              onCancel={handleUpdateCancel}
            />
          </div>
        </div>
      )}

      {/* Materials */}
      {materials.map((material) => (
        <div
          key={material.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            {/* Left: Icon and info */}
            <div className="flex gap-4 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">{MATERIAL_TYPE_ICONS[material.type]}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 break-words">{material.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {MATERIAL_TYPE_LABELS[material.type]}
                  {material.type === 'FILE' && material.fileSize && (
                    <span> • {formatFileSize(material.fileSize)}</span>
                  )}
                </p>
                
                {/* File preview button */}
                {material.type === 'FILE' && material.fileName && (
                  <button
                    onClick={() => handleViewFile(material)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left w-full"
                  >
                    <span className="text-2xl">{getFileTypeIcon(material.mimeType)}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {material.fileName}
                    </span>
                  </button>
                )}
                
                {/* Content preview for TEXT and VIDEO_LINK */}
                {material.type === 'TEXT' && material.content && (() => {
                  const preview = getContentPreview(material.content);
                  return (
                    <div 
                      className="mt-2 text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ 
                        __html: preview.html + (preview.isTruncated ? '...' : '')
                      }}
                    />
                  );
                })()}
                {material.type === 'VIDEO_LINK' && material.content && (
                  <div className="mt-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={getEmbedUrl(material.content)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={material.title}
                      />
                    </div>
                    <a
                      href={material.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-primary mt-1 inline-block break-all"
                    >
                      {material.content}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex gap-2 ml-4">
              {/* Download button for FILE type */}
              {material.type === 'FILE' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(material)}
                >
                  Download
                </Button>
              )}

              {/* Edit/Delete buttons for teachers (only if course is active) */}
              {isTeacher && !isArchived && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(material.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    disabled={deletingId === material.id}
                  >
                    {deletingId === material.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaterialList;
