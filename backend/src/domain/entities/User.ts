/**
 * User Domain Entity
 * 
 * Represents a user in the LMS system with role-based access control.
 * Supports two roles: Student and Teacher.
 * 
 * Requirements:
 * - 1.5: Role assignment (Student or Teacher only)
 * - 2.1: User identity and role management
 * - 2.2: Role validation
 */

export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export interface UserProps {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly id: string;
  private email: string;
  private name: string;
  private readonly role: Role;
  private passwordHash: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.role = props.role;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new User entity
   * 
   * @param props - User properties
   * @returns User instance
   * @throws Error if validation fails
   */
  public static create(props: UserProps): User {
    return new User(props);
  }

  /**
   * Reconstitute User from persistence
   * 
   * @param props - User properties from database
   * @returns User instance
   */
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  /**
   * Validate User entity invariants
   * 
   * Requirements:
   * - 1.5: Role must be Student or Teacher only
   * - 2.1: Email and name are required
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    // Requirement 1.5: Role validation (Student or Teacher only)
    if (!Object.values(Role).includes(this.role)) {
      throw new Error(`Invalid role: ${this.role}. Must be STUDENT or TEACHER`);
    }

    if (!this.passwordHash || this.passwordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }
  }

  /**
   * Update user email
   * 
   * @param email - New email address
   */
  public updateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }
    this.email = email;
    this.updatedAt = new Date();
  }

  /**
   * Update user name
   * 
   * Requirements:
   * - 1.2: Name update functionality
   * - 2.2: Name validation (1-100 chars after trim)
   * 
   * @param name - New name
   * @throws Error if name is invalid
   */
  public updateName(name: string): void {
    const trimmedName = name?.trim() || '';
    
    if (trimmedName.length === 0) {
      throw new Error('Name is required');
    }
    
    if (trimmedName.length > 100) {
      throw new Error('Name must be 100 characters or less');
    }
    
    this.name = trimmedName;
    this.updatedAt = new Date();
  }

  /**
   * Update password hash
   * 
   * Requirements:
   * - 1.3: Password change functionality
   * - 2.3: Password strength validation (handled by PasswordService)
   * - 2.4: BCrypt hashing (handled by PasswordService)
   * 
   * @param passwordHash - New password hash (BCrypt)
   * @throws Error if password hash is invalid
   */
  public updatePasswordHash(passwordHash: string): void {
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }
    this.passwordHash = passwordHash;
    this.updatedAt = new Date();
  }

  /**
   * Check if user is a student
   * 
   * @returns true if user role is STUDENT
   */
  public isStudent(): boolean {
    return this.role === Role.STUDENT;
  }

  /**
   * Check if user is a teacher
   * 
   * @returns true if user role is TEACHER
   */
  public isTeacher(): boolean {
    return this.role === Role.TEACHER;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getName(): string {
    return this.name;
  }

  public getRole(): Role {
    return this.role;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Convert entity to plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): UserProps {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
