/**
 * Material Service
 * 
 * API calls for material management.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type {
  Material,
  ListMaterialsResponse,
  CreateFileMaterialRequest,
  CreateTextMaterialRequest,
  CreateVideoMaterialRequest,
  UpdateTextMaterialRequest,
  UpdateVideoMaterialRequest,
  UpdateFileMaterialRequest,
} from '../types';

/**
 * List all materials for a course
 */
export const listMaterials = async (courseId: string): Promise<ListMaterialsResponse> => {
  return await api.get<ListMaterialsResponse>(API_ENDPOINTS.MATERIALS.LIST(courseId));
};

/**
 * Get material details by ID
 */
export const getMaterialById = async (id: string): Promise<Material> => {
  return await api.get<Material>(API_ENDPOINTS.MATERIALS.DETAILS(id));
};

/**
 * Create new FILE material (teacher only)
 */
export const createFileMaterial = async (
  courseId: string,
  data: CreateFileMaterialRequest
): Promise<Material> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('type', data.type);
  formData.append('file', data.file);

  return await api.post<Material>(
    `${API_ENDPOINTS.MATERIALS.CREATE(courseId)}/file`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

/**
 * Create new TEXT material (teacher only)
 */
export const createTextMaterial = async (
  courseId: string,
  data: CreateTextMaterialRequest
): Promise<Material> => {
  return await api.post<Material>(
    `${API_ENDPOINTS.MATERIALS.CREATE(courseId)}/text`,
    data
  );
};

/**
 * Create new VIDEO_LINK material (teacher only)
 */
export const createVideoMaterial = async (
  courseId: string,
  data: CreateVideoMaterialRequest
): Promise<Material> => {
  return await api.post<Material>(
    `${API_ENDPOINTS.MATERIALS.CREATE(courseId)}/video`,
    data
  );
};

/**
 * Update TEXT material (teacher only)
 */
export const updateTextMaterial = async (
  id: string,
  data: UpdateTextMaterialRequest
): Promise<Material> => {
  return await api.put<Material>(
    `${API_ENDPOINTS.MATERIALS.UPDATE(id)}/text`,
    data
  );
};

/**
 * Update VIDEO_LINK material (teacher only)
 */
export const updateVideoMaterial = async (
  id: string,
  data: UpdateVideoMaterialRequest
): Promise<Material> => {
  return await api.put<Material>(
    `${API_ENDPOINTS.MATERIALS.UPDATE(id)}/video`,
    data
  );
};

/**
 * Update FILE material (teacher only)
 */
export const updateFileMaterial = async (
  id: string,
  data: UpdateFileMaterialRequest
): Promise<Material> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.file) {
    formData.append('file', data.file);
  }

  return await api.put<Material>(
    `${API_ENDPOINTS.MATERIALS.UPDATE(id)}/file`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

/**
 * Delete material (teacher only)
 */
export const deleteMaterial = async (id: string): Promise<void> => {
  return await api.delete<void>(API_ENDPOINTS.MATERIALS.DELETE(id));
};

/**
 * Download material file
 */
export const downloadMaterial = async (id: string, fileName: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.MATERIALS.DOWNLOAD(id), {
    method: 'GET',
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  // Create blob from response
  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * View material file in new tab
 */
export const viewMaterial = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.MATERIALS.DOWNLOAD(id), {
    method: 'GET',
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error('Failed to load file');
  }

  // Create blob from response
  const blob = await response.blob();
  
  // Create blob URL and open in new tab
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  
  // Note: URL will be revoked when tab is closed
  // We don't revoke immediately to allow the tab to load
};
