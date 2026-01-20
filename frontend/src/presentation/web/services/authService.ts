/**
 * Authentication Service
 * 
 * API calls for authentication operations.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  User 
} from '../types';

/**
 * Authentication service
 */
export const authService = {
  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    return api.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Refresh access token
   */
  refresh: async (): Promise<void> => {
    return api.post<void>(API_ENDPOINTS.AUTH.REFRESH);
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ user: User }>(API_ENDPOINTS.AUTH.ME);
    console.log('getCurrentUser response:', response);
    return response.user;
  },
};

export default authService;
