/**
 * IUserRepository Interface (Port)
 * 
 * Repository interface for User entity data access.
 * This is a Port in Clean Architecture - defines the contract for data access
 * without specifying implementation details.
 * 
 * Requirements:
 * - 17.1: Data persistence abstraction
 * - 17.2: Repository pattern for data access
 * - 17.3: Domain layer independence from infrastructure
 * 
 * Implementation:
 * - Infrastructure layer provides concrete implementation (Adapter)
 * - Domain layer depends only on this interface (Dependency Inversion)
 */

import { User } from '../entities/User.js';

export interface IUserRepository {
  /**
   * Save a user entity (create or update)
   * 
   * @param user - User entity to save
   * @returns Promise resolving to saved User entity
   * @throws Error if save operation fails
   */
  save(user: User): Promise<User>;

  /**
   * Find a user by ID
   * 
   * @param id - User ID (UUID)
   * @returns Promise resolving to User entity or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email address
   * 
   * @param email - User email address
   * @returns Promise resolving to User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Delete a user by ID
   * 
   * @param id - User ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if user not found or delete operation fails
   */
  delete(id: string): Promise<void>;
}
