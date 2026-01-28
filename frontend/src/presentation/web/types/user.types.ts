/**
 * User Types
 * 
 * Types related to users and authentication.
 */

import { UserRole } from './common.types';

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  accessToken?: string; // Optional, may be in HTTP-only cookie
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: User;
}

/**
 * User profile (for viewing profile)
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  name: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password result
 */
export interface ChangePasswordResult {
  success: boolean;
  message: string;
}
