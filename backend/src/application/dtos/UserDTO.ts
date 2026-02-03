/**
 * User Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring user data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

import { Role } from '../../domain/entities/User.js';

/**
 * User DTO for API responses
 * Excludes sensitive data like password hash
 */
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create User DTO for registration
 */
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role: Role;
}

/**
 * Login DTO for authentication
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Login Response DTO
 * Contains user data and tokens
 */
export interface LoginResponseDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh Token Response DTO
 */
export interface RefreshTokenResponseDTO {
  accessToken: string;
}

/**
 * User Profile DTO for profile view
 * 
 * Requirements:
 * - 1.1: View profile information
 * 
 * Excludes password hash for security
 */
export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update User Profile DTO
 * 
 * Requirements:
 * - 1.2: Edit profile name
 * - 2.2: Name validation (1-100 chars)
 */
export interface UpdateUserProfileDTO {
  name: string;
}

/**
 * Change Password DTO
 * 
 * Requirements:
 * - 1.3: Change password functionality
 * - 2.3: Password strength validation
 */
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Result DTO
 * 
 * Requirements:
 * - 1.3: Password change feedback
 */
export interface ChangePasswordResultDTO {
  success: boolean;
  message: string;
}
