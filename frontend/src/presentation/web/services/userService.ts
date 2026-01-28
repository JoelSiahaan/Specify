/**
 * User Service
 * 
 * API calls for user profile operations.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { 
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResult
} from '../types';

/**
 * User service
 */
export const userService = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<{ profile: UserProfile }>(API_ENDPOINTS.USER.PROFILE);
    return response.profile;
  },

  /**
   * Update user profile (name)
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<{ profile: UserProfile }>(API_ENDPOINTS.USER.PROFILE, data);
    return response.profile;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResult> => {
    const response = await api.put<{ result: ChangePasswordResult }>(API_ENDPOINTS.USER.PASSWORD, data);
    return response.result;
  },
};

export default userService;
