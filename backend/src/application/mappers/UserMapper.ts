/**
 * User Mapper
 * 
 * Maps between User domain entity and UserDTO.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 */

import { User } from '../../domain/entities/User';
import { UserDTO, CreateUserDTO } from '../dtos/UserDTO';
import { randomUUID } from 'crypto';

export class UserMapper {
  /**
   * Convert User entity to UserDTO
   * Excludes sensitive data like password hash
   * 
   * @param user - User domain entity
   * @returns UserDTO for API response
   */
  static toDTO(user: User): UserDTO {
    return {
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      role: user.getRole(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    };
  }

  /**
   * Convert CreateUserDTO to User entity
   * Used for user registration
   * 
   * @param dto - CreateUserDTO from API request
   * @param passwordHash - Hashed password
   * @returns User domain entity
   */
  static toDomain(dto: CreateUserDTO, passwordHash: string): User {
    return User.create({
      id: randomUUID(),
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple User entities to UserDTOs
   * 
   * @param users - Array of User domain entities
   * @returns Array of UserDTOs
   */
  static toDTOList(users: User[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }
}
