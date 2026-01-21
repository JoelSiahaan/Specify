/**
 * Property-Based Testing Utilities
 * 
 * Custom generators and utilities for property-based testing with fast-check.
 */

import * as fc from 'fast-check';

/**
 * Generator for valid email addresses
 */
export const emailArbitrary = () =>
  fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9]+$/.test(s)),
      fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.com')
    )
    .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generator for valid passwords (min 8 characters)
 */
export const passwordArbitrary = () =>
  fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8);

/**
 * Generator for user names
 */
export const nameArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generator for user roles
 */
export const roleArbitrary = () =>
  fc.constantFrom('STUDENT', 'TEACHER');

/**
 * Generator for course codes (6-character alphanumeric)
 */
export const courseCodeArbitrary = () =>
  fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^[A-Z0-9]{6}$/.test(s));

/**
 * Generator for course names
 */
export const courseNameArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

/**
 * Generator for course descriptions
 */
export const courseDescriptionArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);

/**
 * Generator for course status
 */
export const courseStatusArbitrary = () =>
  fc.constantFrom('ACTIVE', 'ARCHIVED');

/**
 * Generator for future dates (for due dates)
 */
export const futureDateArbitrary = () =>
  fc.date({ min: new Date(Date.now() + 1000) }); // At least 1 second in future

/**
 * Generator for past dates
 */
export const pastDateArbitrary = () =>
  fc.date({ max: new Date(Date.now() - 1000) }); // At least 1 second in past

/**
 * Generator for grades (0-100)
 */
export const gradeArbitrary = () =>
  fc.integer({ min: 0, max: 100 });

/**
 * Generator for time limits (in minutes, 1-300)
 */
export const timeLimitArbitrary = () =>
  fc.integer({ min: 1, max: 300 });

/**
 * Generator for submission types
 */
export const submissionTypeArbitrary = () =>
  fc.constantFrom('FILE', 'TEXT', 'BOTH');

/**
 * Generator for question types
 */
export const questionTypeArbitrary = () =>
  fc.constantFrom('MCQ', 'ESSAY');

/**
 * Generator for UUIDs (simplified for testing)
 */
export const uuidArbitrary = () =>
  fc.uuid();

/**
 * Generator for valid user objects
 */
export const userArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    email: emailArbitrary(),
    name: nameArbitrary(),
    role: roleArbitrary(),
    passwordHash: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
  });

/**
 * Generator for valid course objects
 */
export const courseArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    name: courseNameArbitrary(),
    description: courseDescriptionArbitrary(),
    courseCode: courseCodeArbitrary(),
    status: courseStatusArbitrary(),
    teacherId: uuidArbitrary(),
  });

/**
 * Generator for valid assignment objects
 */
export const assignmentArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.string({ minLength: 0, maxLength: 1000 }),
    dueDate: futureDateArbitrary(),
    courseId: uuidArbitrary(),
    submissionType: submissionTypeArbitrary(),
  });

/**
 * Property test configuration with minimum 100 iterations
 */
export const propertyTestConfig = {
  numRuns: 100,
  timeout: 5000,
};

/**
 * Helper to run property tests with standard configuration
 */
export async function runPropertyTest<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  config = propertyTestConfig
): Promise<void> {
  await fc.assert(
    fc.asyncProperty(arbitrary, async (value: T) => {
      const result = await Promise.resolve(predicate(value));
      return result;
    }),
    config
  );
}
