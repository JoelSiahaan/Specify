/**
 * API Client
 * 
 * Centralized Axios configuration for all API calls.
 * Handles authentication, error handling, and request/response interceptors.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CONFIG } from '../constants';
import type { ApiError } from '../types';

/**
 * Create Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests (for JWT in HTTP-only cookies)
});

/**
 * Request interceptor
 * Add any request modifications here (e.g., auth headers if not using cookies)
 */
apiClient.interceptors.request.use(
  (config) => {
    // Request is sent with cookies automatically due to withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handle common response scenarios and errors
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response data directly
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle specific error scenarios
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized
      // DON'T redirect automatically - let components handle it
      // This prevents infinite redirect loops
      if (status === 401) {
        console.log('401 Unauthorized:', error.config?.url);
        // Components will handle redirect based on context
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error('Access denied:', data?.message);
      }

      // Return structured error
      return Promise.reject({
        code: data?.code || 'UNKNOWN_ERROR',
        message: data?.message || 'An unexpected error occurred',
        details: data?.details,
        status,
      });
    }

    // Network error or no response
    if (error.request) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        status: 0,
      });
    }

    // Request setup error
    return Promise.reject({
      code: 'REQUEST_ERROR',
      message: error.message || 'Failed to send request',
      status: 0,
    });
  }
);

/**
 * API Client methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get<T>(url, config).then((response) => response.data);
  },

  /**
   * POST request
   */
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post<T>(url, data, config).then((response) => response.data);
  },

  /**
   * PUT request
   */
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put<T>(url, data, config).then((response) => response.data);
  },

  /**
   * DELETE request
   */
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete<T>(url, config).then((response) => response.data);
  },

  /**
   * PATCH request
   */
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch<T>(url, data, config).then((response) => response.data);
  },
};

export default api;
