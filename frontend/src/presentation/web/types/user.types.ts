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
