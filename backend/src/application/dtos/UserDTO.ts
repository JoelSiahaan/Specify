/**
 * User Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring user data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

import { Role } from '../../domain/entities/User';

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
