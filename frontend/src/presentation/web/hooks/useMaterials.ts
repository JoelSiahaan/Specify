/**
 * useMaterials Custom Hooks
 * 
 * Encapsulates all material-related data fetching logic.
 * Provides reusable hooks for material operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { materialService } from '../services';
import type { Material, ApiError } from '../types';

// ============================================================================
// useMaterials - Fetch materials list for a course
// ============================================================================

interface UseMaterialsResult {
  materials: Material[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMaterials(courseId: string | undefined): UseMaterialsResult {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await materialService.listMaterials(courseId);
      setMaterials(response.data || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return { materials, loading, error, refetch: fetchMaterials };
}

// ============================================================================
// useMaterial - Fetch single material by ID
// ============================================================================

interface UseMaterialResult {
  material: Material | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMaterial(materialId: string | undefined): UseMaterialResult {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterial = useCallback(async () => {
    if (!materialId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await materialService.getMaterialById(materialId);
      setMaterial(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load material');
      setMaterial(null);
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  return { material, loading, error, refetch: fetchMaterial };
}

// ============================================================================
// useDeleteMaterial - Delete material
// ============================================================================

interface UseDeleteMaterialResult {
  deleteMaterial: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useDeleteMaterial(): UseDeleteMaterialResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMaterial = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await materialService.deleteMaterial(id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteMaterial, loading, error };
}
