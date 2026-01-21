/**
 * Authorization Policy Unit Tests
 * 
 * Tests authorization logic for access control decisions.
 * All tests use pure functions without mocks.
 * 
 * Requirements:
 * - 2.1: Role-based access control (Student vs Teacher)
 * - 2.2: Resource-based access control (ownership)
 * - 2.3: Enrollment-based access control
 * - 2.4: Authorization enforcement on all protected routes
 */

import { AuthorizationPolicy } from '../AuthorizationPolicy';
import { User, Role } from '../../../domain/entities/User';
import { Course, CourseStatus } from '../../../domain/entities/Course';
import { AuthorizationContext } from '../IAuthorizationPolicy';

describe('AuthorizationPolicy', () => {
  let policy: AuthorizationPolicy;
  let teacher: User;
  let student: User;
  let otherTeacher: User;
  let activeCourse: Course;
  let archivedCourse: Course;

  beforeEach(() => {
    policy = new AuthorizationPolicy();

    // Create test users
    teacher = User.create({
      id: 'teacher-1',
      email: 'teacher@example.com',
      name: 'Teacher One',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    student = User.create({
      id: 'student-1',
      email: 'student@example.com',
      name: 'Student One',
      role: Role.STUDENT,
      passwordHash: 'hashed-password'
    });

    otherTeacher = User.create({
      id: 'teacher-2',
      email: 'teacher2@example.com',
      name: 'Teacher Two',
      role: Role.TEACHER,
      passwordHash: 'hashed-password'
    });

    // Create test courses
    activeCourse = Course.create({
      id: 'course-1',
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: CourseStatus.ACTIVE,
      teacherId: teacher.getId()
    });

    archivedCourse = Course.create({
      id: 'course-2',
      name: 'Advanced Algorithms',
      description: 'Advanced algorithm concepts',
      courseCode: 'DEF456',
      status: CourseStatus.ARCHIVED,
      teacherId: teacher.getId()
    });
  });

  describe('canAccessCourse', () => {
    it('should allow teacher to access their own course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canAccessCourse(teacher, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny teacher access to another teacher\'s course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canAccessCourse(otherTeacher, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should allow enrolled student to access course', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canAccessCourse(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny non-enrolled student access to course', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canAccessCourse(student, activeCourse, context);
      expect(result).toBe(false);
    });
  });

  describe('canModifyCourse', () => {
    it('should allow teacher to modify their own active course', () => {
      const result = policy.canModifyCourse(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from modifying another teacher\'s course', () => {
      const result = policy.canModifyCourse(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny teacher from modifying archived course', () => {
      const result = policy.canModifyCourse(teacher, archivedCourse);
      expect(result).toBe(false);
    });

    it('should deny student from modifying course', () => {
      const result = policy.canModifyCourse(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canArchiveCourse', () => {
    it('should allow teacher to archive their own active course', () => {
      const result = policy.canArchiveCourse(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from archiving another teacher\'s course', () => {
      const result = policy.canArchiveCourse(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny teacher from archiving already archived course', () => {
      const result = policy.canArchiveCourse(teacher, archivedCourse);
      expect(result).toBe(false);
    });

    it('should deny student from archiving course', () => {
      const result = policy.canArchiveCourse(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canDeleteCourse', () => {
    it('should allow teacher to delete their own archived course', () => {
      const result = policy.canDeleteCourse(teacher, archivedCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from deleting another teacher\'s course', () => {
      const result = policy.canDeleteCourse(otherTeacher, archivedCourse);
      expect(result).toBe(false);
    });

    it('should deny teacher from deleting active course', () => {
      const result = policy.canDeleteCourse(teacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny student from deleting course', () => {
      const result = policy.canDeleteCourse(student, archivedCourse);
      expect(result).toBe(false);
    });
  });

  describe('canCreateCourse', () => {
    it('should allow teacher to create course', () => {
      const result = policy.canCreateCourse(teacher);
      expect(result).toBe(true);
    });

    it('should deny student from creating course', () => {
      const result = policy.canCreateCourse(student);
      expect(result).toBe(false);
    });
  });

  describe('canEnrollInCourse', () => {
    it('should allow student to enroll in active course', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canEnrollInCourse(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny student from enrolling in archived course', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canEnrollInCourse(student, archivedCourse, context);
      expect(result).toBe(false);
    });

    it('should deny student from enrolling if already enrolled', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canEnrollInCourse(student, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should deny teacher from enrolling in course', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canEnrollInCourse(teacher, activeCourse, context);
      expect(result).toBe(false);
    });
  });

  describe('canViewMaterials', () => {
    it('should allow teacher to view materials in their own course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewMaterials(teacher, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny teacher from viewing materials in another teacher\'s course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewMaterials(otherTeacher, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should allow enrolled student to view materials', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canViewMaterials(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny non-enrolled student from viewing materials', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canViewMaterials(student, activeCourse, context);
      expect(result).toBe(false);
    });
  });

  describe('canManageMaterials', () => {
    it('should allow teacher to manage materials in their own course', () => {
      const result = policy.canManageMaterials(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from managing materials in another teacher\'s course', () => {
      const result = policy.canManageMaterials(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny student from managing materials', () => {
      const result = policy.canManageMaterials(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canViewAssignments', () => {
    it('should allow teacher to view assignments in their own course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewAssignments(teacher, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny teacher from viewing assignments in another teacher\'s course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewAssignments(otherTeacher, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should allow enrolled student to view assignments', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canViewAssignments(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny non-enrolled student from viewing assignments', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canViewAssignments(student, activeCourse, context);
      expect(result).toBe(false);
    });
  });

  describe('canManageAssignments', () => {
    it('should allow teacher to manage assignments in their own course', () => {
      const result = policy.canManageAssignments(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from managing assignments in another teacher\'s course', () => {
      const result = policy.canManageAssignments(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny student from managing assignments', () => {
      const result = policy.canManageAssignments(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canSubmitAssignment', () => {
    it('should allow enrolled student to submit assignment', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canSubmitAssignment(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny non-enrolled student from submitting assignment', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canSubmitAssignment(student, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should deny teacher from submitting assignment', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canSubmitAssignment(teacher, activeCourse, context);
      expect(result).toBe(false);
    });
  });

  describe('canGradeSubmissions', () => {
    it('should allow teacher to grade submissions in their own course', () => {
      const result = policy.canGradeSubmissions(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from grading submissions in another teacher\'s course', () => {
      const result = policy.canGradeSubmissions(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny student from grading submissions', () => {
      const result = policy.canGradeSubmissions(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canViewSubmission', () => {
    it('should allow teacher to view any submission in their course', () => {
      const result = policy.canViewSubmission(teacher, student.getId(), activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from viewing submission in another teacher\'s course', () => {
      const result = policy.canViewSubmission(otherTeacher, student.getId(), activeCourse);
      expect(result).toBe(false);
    });

    it('should allow student to view their own submission', () => {
      const result = policy.canViewSubmission(student, student.getId(), activeCourse);
      expect(result).toBe(true);
    });

    it('should deny student from viewing another student\'s submission', () => {
      const otherStudent = User.create({
        id: 'student-2',
        email: 'student2@example.com',
        name: 'Student Two',
        role: Role.STUDENT,
        passwordHash: 'hashed-password'
      });
      const result = policy.canViewSubmission(student, otherStudent.getId(), activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canExportGrades', () => {
    it('should allow teacher to export grades from their own course', () => {
      const result = policy.canExportGrades(teacher, activeCourse);
      expect(result).toBe(true);
    });

    it('should deny teacher from exporting grades from another teacher\'s course', () => {
      const result = policy.canExportGrades(otherTeacher, activeCourse);
      expect(result).toBe(false);
    });

    it('should deny student from exporting grades', () => {
      const result = policy.canExportGrades(student, activeCourse);
      expect(result).toBe(false);
    });
  });

  describe('canViewProgress', () => {
    it('should allow teacher to view progress in their own course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewProgress(teacher, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny teacher from viewing progress in another teacher\'s course', () => {
      const context: AuthorizationContext = {};
      const result = policy.canViewProgress(otherTeacher, activeCourse, context);
      expect(result).toBe(false);
    });

    it('should allow enrolled student to view their own progress', () => {
      const context: AuthorizationContext = { isEnrolled: true };
      const result = policy.canViewProgress(student, activeCourse, context);
      expect(result).toBe(true);
    });

    it('should deny non-enrolled student from viewing progress', () => {
      const context: AuthorizationContext = { isEnrolled: false };
      const result = policy.canViewProgress(student, activeCourse, context);
      expect(result).toBe(false);
    });
  });
});
