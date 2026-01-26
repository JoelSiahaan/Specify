/**
 * GetStudentProgressUseCase
 * 
 * Use case for retrieving student progress in a course.
 * Displays all assignments and quizzes with their status, grades, and feedback.
 * Calculates course average from all graded items.
 * 
 * Requirements:
 * - 14.1: Display all assignments and quizzes with status
 * - 14.2: Show "Not Submitted" for items without submissions
 * - 14.3: Show "Submitted" for items awaiting grading
 * - 14.4: Show "Graded" with grade and feedback
 * - 14.5: Highlight overdue items not submitted
 * - 16.6: Indicate late submissions
 * - 16.7: Calculate and display average grade
 * - 16.8: Display appropriate message when no items are graded
 */

import { inject, injectable } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import {
  StudentProgressDTO,
  AssignmentProgressItemDTO,
  QuizProgressItemDTO,
} from '../../dtos/ProgressDTO';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../errors/ApplicationErrors';
import { AssignmentSubmissionStatus } from '../../../domain/entities/AssignmentSubmission';

@injectable()
export class GetStudentProgressUseCase {
  constructor(
    @inject('IAssignmentRepository')
    private assignmentRepository: IAssignmentRepository,
    @inject('IAssignmentSubmissionRepository')
    private assignmentSubmissionRepository: IAssignmentSubmissionRepository,
    @inject('IQuizRepository')
    private quizRepository: IQuizRepository,
    @inject('IQuizSubmissionRepository')
    private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject('IEnrollmentRepository')
    private enrollmentRepository: IEnrollmentRepository,
    @inject('ICourseRepository')
    private courseRepository: ICourseRepository,
    @inject('IUserRepository')
    private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy')
    private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute the use case
   * 
   * @param courseId - Course ID
   * @param studentId - Student ID (authenticated user)
   * @returns Promise resolving to StudentProgressDTO
   * @throws UnauthorizedError if user not authenticated
   * @throws ForbiddenError if student not enrolled in course
   * @throws NotFoundError if course not found
   */
  async execute(courseId: string, studentId: string): Promise<StudentProgressDTO> {
    // Load user for authorization
    const user = await this.userRepository.findById(studentId);
    if (!user) {
      throw new UnauthorizedError('AUTH_REQUIRED');
    }

    // Validate course exists
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('COURSE_NOT_FOUND');
    }

    // Check enrollment status for authorization context
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    const isEnrolled = enrollment !== null;

    // Validate authorization using policy (Requirement 14.1)
    if (!this.authPolicy.canViewProgress(user, course, { isEnrolled })) {
      throw new ForbiddenError('NOT_ENROLLED');
    }

    // Get all assignments for the course
    const assignments = await this.assignmentRepository.findByCourseId(courseId);

    // Get all assignment submissions for the student in this course
    const allAssignmentSubmissions = await this.assignmentSubmissionRepository.findByCourseId(courseId);
    const assignmentSubmissions = allAssignmentSubmissions.filter(
      (sub) => sub.getStudentId() === studentId
    );

    // Create a map of assignment submissions by assignment ID
    const submissionMap = new Map(
      assignmentSubmissions.map((sub) => [sub.getAssignmentId(), sub])
    );

    // Build assignment progress items
    const assignmentProgressItems: AssignmentProgressItemDTO[] = assignments.map((assignment) => {
      const submission = submissionMap.get(assignment.getId());
      const now = new Date();
      const isOverdue = assignment.getDueDate() < now;

      if (!submission) {
        // No submission - check if overdue
        return {
          id: assignment.getId(),
          title: assignment.getTitle(),
          description: assignment.getDescription(),
          dueDate: assignment.getDueDate(),
          submissionType: assignment.getSubmissionType(),
          status: AssignmentSubmissionStatus.NOT_SUBMITTED,
          isLate: false,
          isOverdue: isOverdue,
        };
      }

      // Has submission
      return {
        id: assignment.getId(),
        title: assignment.getTitle(),
        description: assignment.getDescription(),
        dueDate: assignment.getDueDate(),
        submissionType: assignment.getSubmissionType(),
        status: submission.getStatus(),
        grade: submission.getGrade(),
        feedback: submission.getFeedback(),
        isLate: submission.getIsLate(),
        isOverdue: false,  // Has submission, so not overdue
        submittedAt: submission.getSubmittedAt(),
        gradedAt: submission.getGradedAt(),
      };
    });

    // Get all quizzes for the course
    const quizzes = await this.quizRepository.findByCourseId(courseId);

    // Get all quiz submissions for the student
    const quizSubmissions = await this.quizSubmissionRepository.findByStudentAndCourse(
      studentId,
      courseId
    );

    // Create a map of quiz submissions by quiz ID
    const quizSubmissionMap = new Map(
      quizSubmissions.map((sub) => [sub.getQuizId(), sub])
    );

    // Build quiz progress items
    const quizProgressItems: QuizProgressItemDTO[] = quizzes.map((quiz) => {
      const submission = quizSubmissionMap.get(quiz.getId());
      const now = new Date();
      const isOverdue = quiz.getDueDate() < now;

      if (!submission) {
        // No submission - check if overdue
        return {
          id: quiz.getId(),
          title: quiz.getTitle(),
          description: quiz.getDescription(),
          dueDate: quiz.getDueDate(),
          timeLimit: quiz.getTimeLimit(),
          questionCount: quiz.getQuestions().length,
          status: 'NOT_SUBMITTED',
          isOverdue: isOverdue,
        };
      }

      // Has submission
      const hasGrade = submission.getGrade() !== undefined && submission.getGrade() !== null;
      const status = hasGrade ? 'GRADED' : 'SUBMITTED';

      return {
        id: quiz.getId(),
        title: quiz.getTitle(),
        description: quiz.getDescription(),
        dueDate: quiz.getDueDate(),
        timeLimit: quiz.getTimeLimit(),
        questionCount: quiz.getQuestions().length,
        status: status,
        grade: submission.getGrade() ?? undefined,
        feedback: submission.getFeedback() || undefined,
        isOverdue: false,  // Has submission, so not overdue
        submittedAt: submission.getSubmittedAt() || undefined,
      };
    });

    // Calculate average grade from all graded items
    const gradedAssignments = assignmentProgressItems.filter((item) => item.grade !== undefined && item.grade !== null);
    const gradedQuizzes = quizProgressItems.filter((item) => item.grade !== undefined && item.grade !== null);
    const allGrades = [
      ...gradedAssignments.map((item) => item.grade!),
      ...gradedQuizzes.map((item) => item.grade!),
    ];

    const averageGrade =
      allGrades.length > 0
        ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
        : undefined;

    const totalGradedItems = allGrades.length;  // Fixed: use allGrades.length instead of counting separately
    const totalItems = assignments.length + quizzes.length;

    // Get student name (from enrollment or user repository)
    // For now, we'll use a placeholder - in a real implementation, we'd fetch from user repository
    const studentName = 'Student';  // TODO: Fetch from user repository

    return {
      courseId: course.getId(),
      courseName: course.getName(),
      studentId: studentId,
      studentName: studentName,
      assignments: assignmentProgressItems,
      quizzes: quizProgressItems,
      averageGrade: averageGrade,
      totalGradedItems: totalGradedItems,
      totalItems: totalItems,
    };
  }
}

