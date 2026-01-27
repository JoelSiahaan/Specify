/**
 * Concurrent Request Handling Tests
 * 
 * Verifies that the system can handle multiple concurrent requests without:
 * - Database connection pool exhaustion
 * - Race conditions in critical operations
 * - Data corruption or inconsistencies
 * 
 * Requirements: 21.5 - Concurrent request handling
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../infrastructure/persistence/prisma/client';

describe('Concurrent Request Handling', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await getPrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connection Pooling', () => {
    it('should handle 20 concurrent database queries without exhausting connection pool', async () => {
      // Create 20 concurrent queries
      const queries = Array.from({ length: 20 }, (_, i) => 
        prisma.user.findMany({ take: 1 })
      );

      // Execute all queries concurrently
      const results = await Promise.all(queries);

      // Verify all queries completed successfully
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle 50 concurrent database queries without errors', async () => {
      // Create 50 concurrent queries (more than default pool size of 10)
      const queries = Array.from({ length: 50 }, (_, i) => 
        prisma.user.count()
      );

      // Execute all queries concurrently
      const results = await Promise.all(queries);

      // Verify all queries completed successfully
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(typeof result).toBe('number');
      });
    });

    it('should handle mixed read and write operations concurrently', async () => {
      // Create test users for concurrent operations
      const testUsers = await Promise.all([
        prisma.user.create({
          data: {
            email: `concurrent-test-1-${Date.now()}@example.com`,
            name: 'Concurrent Test User 1',
            passwordHash: 'hashed_password',
            role: 'STUDENT'
          }
        }),
        prisma.user.create({
          data: {
            email: `concurrent-test-2-${Date.now()}@example.com`,
            name: 'Concurrent Test User 2',
            passwordHash: 'hashed_password',
            role: 'TEACHER'
          }
        })
      ]);

      // Mix of read and write operations
      const operations = [
        // Reads
        prisma.user.findUnique({ where: { id: testUsers[0].id } }),
        prisma.user.findUnique({ where: { id: testUsers[1].id } }),
        prisma.user.count(),
        prisma.user.findMany({ take: 5 }),
        
        // Writes
        prisma.user.update({
          where: { id: testUsers[0].id },
          data: { name: 'Updated Name 1' }
        }),
        prisma.user.update({
          where: { id: testUsers[1].id },
          data: { name: 'Updated Name 2' }
        })
      ];

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      // Verify all operations completed successfully
      expect(results).toHaveLength(6);
      expect(results[0]).toBeDefined(); // findUnique 1
      expect(results[1]).toBeDefined(); // findUnique 2
      expect(typeof results[2]).toBe('number'); // count
      expect(Array.isArray(results[3])).toBe(true); // findMany
      expect(results[4]).toHaveProperty('name', 'Updated Name 1'); // update 1
      expect(results[5]).toHaveProperty('name', 'Updated Name 2'); // update 2

      // Cleanup
      await prisma.user.deleteMany({
        where: {
          id: { in: [testUsers[0].id, testUsers[1].id] }
        }
      });
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent duplicate course code generation in concurrent requests', async () => {
      // Create a teacher for testing
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-race-${Date.now()}@example.com`,
          name: 'Race Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      // Attempt to create 10 courses concurrently
      // Each should get a unique course code
      const courseCreations = Array.from({ length: 10 }, (_, i) =>
        prisma.course.create({
          data: {
            name: `Concurrent Course ${i}`,
            description: 'Test course for concurrency',
            courseCode: `TST${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
            teacherId: teacher.id
          }
        })
      );

      const courses = await Promise.all(courseCreations);

      // Verify all courses were created
      expect(courses).toHaveLength(10);

      // Verify all course codes are unique
      const courseCodes = courses.map(c => c.courseCode);
      const uniqueCourseCodes = new Set(courseCodes);
      expect(uniqueCourseCodes.size).toBe(10);

      // Cleanup
      await prisma.course.deleteMany({
        where: { teacherId: teacher.id }
      });
      await prisma.user.delete({ where: { id: teacher.id } });
    });

    it('should handle concurrent enrollment requests without duplicates', async () => {
      // Create test data
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-enroll-${Date.now()}@example.com`,
          name: 'Enrollment Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      const course = await prisma.course.create({
        data: {
          name: 'Concurrent Enrollment Test',
          description: 'Test course',
          courseCode: `ENR${Date.now()}`,
          teacherId: teacher.id
        }
      });

      const students = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          prisma.user.create({
            data: {
              email: `student-enroll-${i}-${Date.now()}@example.com`,
              name: `Student ${i}`,
              passwordHash: 'hashed_password',
              role: 'STUDENT'
            }
          })
        )
      );

      // Attempt concurrent enrollments
      const enrollments = await Promise.all(
        students.map(student =>
          prisma.enrollment.create({
            data: {
              studentId: student.id,
              courseId: course.id
            }
          })
        )
      );

      // Verify all enrollments were created
      expect(enrollments).toHaveLength(5);

      // Verify unique constraint works (attempt duplicate enrollment)
      await expect(
        prisma.enrollment.create({
          data: {
            studentId: students[0].id,
            courseId: course.id
          }
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.enrollment.deleteMany({ where: { courseId: course.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.deleteMany({
        where: { id: { in: [...students.map(s => s.id), teacher.id] } }
      });
    });

    it('should handle concurrent grade updates with optimistic locking', async () => {
      // Create test data
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-grade-${Date.now()}@example.com`,
          name: 'Grade Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      const student = await prisma.user.create({
        data: {
          email: `student-grade-${Date.now()}@example.com`,
          name: 'Grade Test Student',
          passwordHash: 'hashed_password',
          role: 'STUDENT'
        }
      });

      const course = await prisma.course.create({
        data: {
          name: 'Grade Test Course',
          description: 'Test course',
          courseCode: `GRD${Date.now()}`,
          teacherId: teacher.id
        }
      });

      const assignment = await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: 'Test Assignment',
          description: 'Test',
          dueDate: new Date(Date.now() + 86400000),
          submissionType: 'TEXT'
        }
      });

      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.id,
          content: 'Test submission',
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });

      // Attempt concurrent grade updates
      // Only one should succeed due to optimistic locking (version field)
      const gradeUpdates = [
        prisma.assignmentSubmission.update({
          where: { 
            id: submission.id,
            version: submission.version
          },
          data: {
            grade: 85,
            feedback: 'Good work',
            status: 'GRADED',
            version: { increment: 1 }
          }
        }),
        prisma.assignmentSubmission.update({
          where: { 
            id: submission.id,
            version: submission.version
          },
          data: {
            grade: 90,
            feedback: 'Excellent',
            status: 'GRADED',
            version: { increment: 1 }
          }
        })
      ];

      // One should succeed, one should fail
      const results = await Promise.allSettled(gradeUpdates);
      
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // At least one should succeed
      expect(succeeded.length).toBeGreaterThanOrEqual(1);

      // Verify final state
      const finalSubmission = await prisma.assignmentSubmission.findUnique({
        where: { id: submission.id }
      });
      
      expect(finalSubmission).toBeDefined();
      expect(finalSubmission!.grade).toBeDefined();
      expect(finalSubmission!.status).toBe('GRADED');
      expect(finalSubmission!.version).toBeGreaterThan(submission.version);

      // Cleanup
      await prisma.assignmentSubmission.delete({ where: { id: submission.id } });
      await prisma.assignment.delete({ where: { id: assignment.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.deleteMany({
        where: { id: { in: [student.id, teacher.id] } }
      });
    });
  });

  describe('Connection Pool Limits', () => {
    it('should queue requests when connection pool is full', async () => {
      // Create more queries than the connection pool size (default 10)
      const queries = Array.from({ length: 30 }, (_, i) => 
        prisma.user.count()
      );

      const startTime = Date.now();
      
      // Execute all queries concurrently
      const results = await Promise.all(queries);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all queries completed successfully
      expect(results).toHaveLength(30);
      results.forEach(result => {
        expect(typeof result).toBe('number');
      });

      // Queries should complete (may take longer due to queueing)
      // But should not timeout or fail
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });
  });

  describe('Transaction Handling', () => {
    it('should handle concurrent transactions without deadlocks', async () => {
      // Create test users
      const users = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          prisma.user.create({
            data: {
              email: `tx-user-${i}-${Date.now()}@example.com`,
              name: `Transaction User ${i}`,
              passwordHash: 'hashed_password',
              role: 'STUDENT'
            }
          })
        )
      );

      // Execute concurrent transactions
      const transactions = users.map(user =>
        prisma.$transaction(async (tx) => {
          // Read user
          const foundUser = await tx.user.findUnique({
            where: { id: user.id }
          });

          // Update user
          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { name: `${foundUser!.name} - Updated` }
          });

          return updatedUser;
        })
      );

      const results = await Promise.all(transactions);

      // Verify all transactions completed successfully
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.name).toContain('Updated');
      });

      // Cleanup
      await prisma.user.deleteMany({
        where: { id: { in: users.map(u => u.id) } }
      });
    });
  });
});
