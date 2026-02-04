/**
 * PrismaUserRepository Implementation (Adapter)
 * 
 * Concrete implementation of IUserRepository using Prisma ORM.
 * This is an Adapter in Clean Architecture - implements the Port defined in domain layer.
 * 
 * Requirements:
 * - 17.1: Data persistence with PostgreSQL
 * - 17.2: Repository pattern implementation
 * - 17.3: Infrastructure layer implements domain interfaces
 * 
 * Design Decisions:
 * - Uses Prisma Client for database operations
 * - Maps between Prisma models and domain entities
 * - Handles database-specific errors (unique constraints, etc.)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { Role as PrismaRole } from '@prisma/client';
import { injectable } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User, Role } from '../../../domain/entities/User.js';
import { prisma as prismaClient } from '../prisma/client.js';

@injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly prisma = prismaClient;

  constructor() {
    // Use singleton prisma instance directly (ES Modules compatibility)
  }

  /**
   * Save a user entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * 
   * @param user - User entity to save
   * @returns Promise resolving to saved User entity
   * @throws Error if unique constraint violated (duplicate email)
   */
  async save(user: User): Promise<User> {
    try {
      const dbUser = await this.prisma.user.upsert({
        where: { id: user.getId() },
        create: {
          id: user.getId(),
          email: user.getEmail(),
          name: user.getName(),
          role: this.mapRoleToPrisma(user.getRole()),
          passwordHash: user.getPasswordHash(),
          createdAt: user.getCreatedAt(),
          updatedAt: user.getUpdatedAt()
        },
        update: {
          email: user.getEmail(),
          name: user.getName(),
          passwordHash: user.getPasswordHash(),
          updatedAt: user.getUpdatedAt()
        }
      });

      return this.toDomain(dbUser);
    } catch (error: any) {
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new Error('A user with this email already exists');
      }
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  /**
   * Find a user by ID
   * 
   * @param id - User ID (UUID)
   * @returns Promise resolving to User entity or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id }
    });

    return dbUser ? this.toDomain(dbUser) : null;
  }

  /**
   * Find a user by email address
   * 
   * @param email - User email address
   * @returns Promise resolving to User entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { email }
    });

    return dbUser ? this.toDomain(dbUser) : null;
  }

  /**
   * Delete a user by ID
   * 
   * @param id - User ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if user not found
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`User with ID ${id} not found`);
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Map Prisma User model to domain User entity
   * 
   * @param dbUser - Prisma User model
   * @returns Domain User entity
   */
  private toDomain(dbUser: any): User {
    return User.reconstitute({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: this.mapRoleToDomain(dbUser.role),
      passwordHash: dbUser.passwordHash,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    });
  }

  /**
   * Map domain Role to Prisma Role enum
   * 
   * @param role - Domain Role
   * @returns Prisma Role enum
   */
  private mapRoleToPrisma(role: Role): PrismaRole {
    return role as unknown as PrismaRole;
  }

  /**
   * Map Prisma Role enum to domain Role
   * 
   * @param role - Prisma Role enum
   * @returns Domain Role
   */
  private mapRoleToDomain(role: PrismaRole): Role {
    return role as unknown as Role;
  }
}
