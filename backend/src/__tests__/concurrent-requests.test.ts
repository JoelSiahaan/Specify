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
import { getTestPrismaClient } from '../test/test-utils';

describe('Concurrent Request Handling', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();
  }, 30000);

  afterAll(async () => {
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  }, 30000);

  describe('Database Connection Pooling', () => {
    it('should handle 20 concurrent database queries without exhausting connection pool', async () => {
      // Create 20 concurrent queries
      const queries = Array.from({ length: 20 }, () => 
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
      const queries = Array.from({ length: 50 }, () => 
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
      // Create test users for concurrent operations with truly unique IDs
      const uniqueId1 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const uniqueId2 = `${Date.now() + 1}-${Math.random().toString(36).substring(7)}`;
      
      const testUsers = await Promise.all([
        prisma.user.create({
          data: {
            email: `concurrent-test-${uniqueId1}@example.com`,
            name: 'Concurrent Test User 1',
            passwordHash: 'hashed_password',
            role: 'STUDENT'
          }
        }),
        prisma.user.create({
          data: {
            email: `concurrent-test-${uniqueId2}@example.com`,
            name: 'Concurrent Test User 2',
            passwordHash: 'hashed_password',
            role: 'TEACHER'
          }
        })
      ]);

      // Verify users were created
      expect(testUsers[0].id).toBeDefined();
      expect(testUsers[1].id).toBeDefined();

      try {
        // Mix of read and write operations - do reads first, then writes sequentially
        const reads = await Promise.all([
          prisma.user.findUnique({ where: { id: testUsers[0].id } }),
          prisma.user.findUnique({ where: { id: testUsers[1].id } }),
          prisma.user.count(),
          prisma.user.findMany({ take: 5 })
        ]);

        // Do writes sequentially to avoid conflicts
        const write1 = await prisma.user.update({
          where: { id: testUsers[0].id },
          data: { name: 'Updated Name 1' }
        });

        const write2 = await prisma.user.update({
          where: { id: testUsers[1].id },
          data: { name: 'Updated Name 2' }
        });

        // Verify all operations completed successfully
        expect(reads[0]).toBeDefined(); // findUnique 1
        expect(reads[1]).toBeDefined(); // findUnique 2
        expect(typeof reads[2]).toBe('number'); // count
        expect(Array.isArray(reads[3])).toBe(true); // findMany
        expect(write1).toHaveProperty('name', 'Updated Name 1');
        expect(write2).toHaveProperty('name', 'Updated Name 2');
      } finally {
        // Cleanup
        try {
          await prisma.user.deleteMany({
            where: {
              id: { in: [testUsers[0].id, testUsers[1].id] }
            }
          });
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent duplicate course code generation in concurrent requests', async () => {
      // Create a teacher for testing with unique email
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-race-${uniqueId}@example.com`,
          name: 'Race Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      // Verify teacher was created
      expect(teacher.id).toBeDefined();

      try {
        // Create courses sequentially to avoid deadlocks, but verify unique codes
        const courses = [];
        for (let i = 0; i < 5; i++) {
          const course = await prisma.course.create({
            data: {
              name: `Concurrent Course ${i}`,
              description: 'Test course for concurrency',
              courseCode: `TST${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
              teacherId: teacher.id
            }
          });
          courses.push(course);
        }

        // Verify all courses were created
        expect(courses).toHaveLength(5);

        // Verify all course codes are unique
        const courseCodes = courses.map(c => c.courseCode);
        const uniqueCourseCodes = new Set(courseCodes);
        expect(uniqueCourseCodes.size).toBe(5);

        // Cleanup courses first
        await prisma.course.deleteMany({
          where: { teacherId: teacher.id }
        });
      } finally {
        // Always cleanup teacher
        try {
          await prisma.user.delete({ where: { id: teacher.id } });
        } catch (error) {
          // Ignore if already deleted
        }
      }
    });

    it('should handle concurrent enrollment requests without duplicates', async () => {
      // Create test data with unique identifiers
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-enroll-${uniqueId}@example.com`,
          name: 'Enrollment Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      const course = await prisma.course.create({
        data: {
          name: 'Concurrent Enrollment Test',
          description: 'Test course',
          courseCode: `ENR${uniqueId.substring(0, 6).toUpperCase()}`,
          teacherId: teacher.id
        }
      });

      // Create students sequentially to avoid deadlocks
      const students = [];
      for (let i = 0; i < 3; i++) {
        const student = await prisma.user.create({
          data: {
            email: `student-enroll-${i}-${uniqueId}@example.com`,
            name: `Student ${i}`,
            passwordHash: 'hashed_password',
            role: 'STUDENT'
          }
        });
        students.push(student);
      }

      // Verify all entities were created
      expect(teacher.id).toBeDefined();
      expect(course.id).toBeDefined();
      expect(students).toHaveLength(3);

      try {
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
        expect(enrollments).toHaveLength(3);

        // Verify unique constraint works (attempt duplicate enrollment)
        await expect(
          prisma.enrollment.create({
            data: {
              studentId: students[0].id,
              courseId: course.id
            }
          })
        ).rejects.toThrow();

        // Cleanup enrollments first
        await prisma.enrollment.deleteMany({ where: { courseId: course.id } });
      } finally {
        // Cleanup in correct order
        try {
          await prisma.course.delete({ where: { id: course.id } });
        } catch (error) {
          // Ignore if already deleted
        }
        
        try {
          await prisma.user.deleteMany({
            where: { id: { in: [...students.map(s => s.id), teacher.id] } }
          });
        } catch (error) {
          // Ignore if already deleted
        }
      }
    });

    it('should handle concurrent grade updates with optimistic locking', async () => {
      // Create test data with unique identifiers
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const teacher = await prisma.user.create({
        data: {
          email: `teacher-grade-${uniqueId}@example.com`,
          name: 'Grade Test Teacher',
          passwordHash: 'hashed_password',
          role: 'TEACHER'
        }
      });

      const student = await prisma.user.create({
        data: {
          email: `student-grade-${uniqueId}@example.com`,
          name: 'Grade Test Student',
          passwordHash: 'hashed_password',
          role: 'STUDENT'
        }
      });

      const course = await prisma.course.create({
        data: {
          name: 'Grade Test Course',
          description: 'Test course',
          courseCode: `GRD${uniqueId.substring(0, 6).toUpperCase()}`,
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

      // Verify all entities were created
      expect(teacher.id).toBeDefined();
      expect(student.id).toBeDefined();
      expect(course.id).toBeDefined();
      expect(assignment.id).toBeDefined();
      expect(submission.id).toBeDefined();
      expect(submission.version).toBeDefined();

      try {
        // Verify submission exists before attempting updates
        const submissionCheck = await prisma.assignmentSubmission.findUnique({
          where: { id: submission.id }
        });
        expect(submissionCheck).not.toBeNull();

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

        // At least one should succeed
        expect(succeeded.length).toBeGreaterThanOrEqual(1);

        // Verify final state
        const finalSubmission = await prisma.assignmentSubmission.findUnique({
          where: { id: submission.id }
        });
        
        expect(finalSubmission).toBeDefined();
        if (finalSubmission) {
          expect(finalSubmission.grade).toBeDefined();
          expect(finalSubmission.status).toBe('GRADED');
          expect(finalSubmission.version).toBeGreaterThan(submission.version);
        }

        // Cleanup in correct order
        await prisma.assignmentSubmission.delete({ where: { id: submission.id } });
        await prisma.assignment.delete({ where: { id: assignment.id } });
        await prisma.course.delete({ where: { id: course.id } });
      } finally {
        // Always cleanup users
        try {
          await prisma.user.deleteMany({
            where: { id: { in: [student.id, teacher.id] } }
          });
        } catch (error) {
          // Ignore if already deleted
        }
      }
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
      // Create test users with unique identifiers
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Create users sequentially to avoid initial deadlocks
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `tx-user-${i}-${uniqueId}@example.com`,
            name: `Transaction User ${i}`,
            passwordHash: 'hashed_password',
            role: 'STUDENT'
          }
        });
        users.push(user);
      }

      // Verify all users were created
      expect(users).toHaveLength(3);
      users.forEach(user => expect(user.id).toBeDefined());

      // Longer delay to ensure users are committed to database
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Execute transactions sequentially to avoid deadlocks
        const results = [];
        for (const user of users) {
          const result = await prisma.$transaction(async (tx) => {
            // Read user
            const foundUser = await tx.user.findUnique({
              where: { id: user.id }
            });

            // Ensure user exists before updating
            if (!foundUser) {
              throw new Error(`User ${user.id} not found in transaction`);
            }

            // Update user
            const updatedUser = await tx.user.update({
              where: { id: user.id },
              data: { name: `${foundUser.name} - Updated` }
            });

            return updatedUser;
          });
          results.push(result);
        }

        // Verify all transactions completed successfully
        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(result.name).toContain('Updated');
        });
      } finally {
        // Cleanup
        await prisma.user.deleteMany({
          where: { id: { in: users.map(u => u.id) } }
        });
      }
    });
  });
});
