/**
 * User Entity Property-Based Tests
 * 
 * Property-based tests for User domain entity using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 1.5: Role assignment (Student or Teacher only)
 */

import * as fc from 'fast-check';
import { User, Role, type UserProps } from '../User';
import { 
  emailArbitrary, 
  nameArbitrary, 
  roleArbitrary, 
  uuidArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils';

describe('User Entity Properties', () => {
  /**
   * Property 1: Role assignment
   * Feature: core-lms, Property 1: Role assignment
   * Validates: Requirements 1.5
   * 
   * For any user, the role must be either Student or Teacher
   */
  it('Property 1: For any user, the role must be either STUDENT or TEACHER', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          email: emailArbitrary(),
          name: nameArbitrary(),
          role: roleArbitrary(),
          passwordHash: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
        }),
        async (userProps: UserProps) => {
          // Create user with generated properties
          const user = User.create(userProps);
          
          // Property: Role must be either STUDENT or TEACHER
          const role = user.getRole();
          const isValidRole = role === Role.STUDENT || role === Role.TEACHER;
          
          return isValidRole;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Additional property: Invalid roles should be rejected
   * Validates: Requirements 1.5
   * 
   * For any invalid role value, user creation must fail
   */
  it('Property: Invalid roles are rejected during user creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          email: emailArbitrary(),
          name: nameArbitrary(),
          role: fc.string().filter(s => s !== 'STUDENT' && s !== 'TEACHER'),
          passwordHash: fc.string({ minLength: 60, maxLength: 60 }),
        }),
        async (userProps: any) => {
          // Property: Creating user with invalid role should throw error
          try {
            User.create(userProps);
            return false; // Should not reach here
          } catch (error) {
            // Verify error message mentions invalid role
            return error instanceof Error && error.message.includes('Invalid role');
          }
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Role is immutable after creation
   * Validates: Requirements 1.5, 2.1
   * 
   * For any user, the role cannot be changed after creation
   */
  it('Property: User role is immutable after creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          email: emailArbitrary(),
          name: nameArbitrary(),
          role: roleArbitrary(),
          passwordHash: fc.string({ minLength: 60, maxLength: 60 }),
        }),
        async (userProps: UserProps) => {
          // Create user
          const user = User.create(userProps);
          const originalRole = user.getRole();
          
          // Attempt to modify role through toObject (should not affect original)
          const obj = user.toObject();
          obj.role = originalRole === Role.STUDENT ? Role.TEACHER : Role.STUDENT;
          
          // Property: Original user role remains unchanged
          return user.getRole() === originalRole;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: isStudent() and isTeacher() are mutually exclusive
   * Validates: Requirements 1.5, 2.2
   * 
   * For any user, exactly one of isStudent() or isTeacher() must be true
   */
  it('Property: isStudent() and isTeacher() are mutually exclusive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          email: emailArbitrary(),
          name: nameArbitrary(),
          role: roleArbitrary(),
          passwordHash: fc.string({ minLength: 60, maxLength: 60 }),
        }),
        async (userProps: UserProps) => {
          const user = User.create(userProps);
          
          // Property: Exactly one must be true (XOR)
          const isStudent = user.isStudent();
          const isTeacher = user.isTeacher();
          
          return (isStudent && !isTeacher) || (!isStudent && isTeacher);
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Property: Role consistency across methods
   * Validates: Requirements 1.5, 2.2
   * 
   * For any user, getRole(), isStudent(), and isTeacher() must be consistent
   */
  it('Property: Role consistency across all role-related methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: uuidArbitrary(),
          email: emailArbitrary(),
          name: nameArbitrary(),
          role: roleArbitrary(),
          passwordHash: fc.string({ minLength: 60, maxLength: 60 }),
        }),
        async (userProps: UserProps) => {
          const user = User.create(userProps);
          
          const role = user.getRole();
          const isStudent = user.isStudent();
          const isTeacher = user.isTeacher();
          
          // Property: Methods must be consistent with each other
          if (role === Role.STUDENT) {
            return isStudent === true && isTeacher === false;
          } else if (role === Role.TEACHER) {
            return isTeacher === true && isStudent === false;
          }
          
          return false; // Should never reach here with valid roles
        }
      ),
      propertyTestConfig
    );
  });
});
