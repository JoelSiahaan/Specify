/**
 * ExportGradesUseCase
 * 
 * Use case for exporting all grades for a course to CSV format.
 * Includes student information, assignment/quiz names, grades, submission dates, and averages.
 * 
 * Requirements:
 * - 15.1: Generate CSV file with all student grades
 * - 15.2: Include student name, email, assignment/quiz name, grade, submission date
 * - 15.3: Include average grade per student
 * - 15.4: Allow teachers to download exported file
 * - 15.5: Include both graded and ungraded items (showing "Not Submitted" or "Pending")
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
  GradeExportDTO,
  GradeExportRowDTO,
  StudentGradeSummaryDTO,
} from '../../dtos/ExportDTO';
import { ForbiddenError, NotFoundError } from '../../errors/ApplicationErrors';
import { AssignmentSubmissionStatus } from '../../../domain/entities/AssignmentSubmission';

@injectable()
export class ExportGradesUseCase {
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
   * @param teacherId - Teacher ID (authenticated user)
   * @returns Promise resolving to GradeExportDTO
   * @throws UnauthorizedError if user not authenticated
   * @throws ForbiddenError if user is not the course owner
   * @throws NotFoundError if course not found
   */
  async execute(courseId: string, teacherId: string): Promise<GradeExportDTO> {
    // Load user for authorization
    const user = await this.userRepository.findById(teacherId);
    if (!user) {
      throw new ForbiddenError('AUTH_REQUIRED');
    }

    // Validate course exists
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('COURSE_NOT_FOUND');
    }

    // Validate authorization using policy (Requirement 15.1)
    if (!this.authPolicy.canExportGrades(user, course)) {
      throw new ForbiddenError('NOT_OWNER');
    }

    // Get all enrollments for the course
    const enrollments = await this.enrollmentRepository.findByCourse(courseId);

    // Get all assignments and quizzes for the course
    const assignments = await this.assignmentRepository.findByCourseId(courseId);
    const quizzes = await this.quizRepository.findByCourseId(courseId);

    // Get all submissions for the course
    const assignmentSubmissions = await this.assignmentSubmissionRepository.findByCourseId(courseId);
    
    // Get all quiz submissions for the course (we need to iterate through enrollments)
    const quizSubmissions: any[] = [];
    for (const enrollment of enrollments) {
      const studentQuizSubmissions = await this.quizSubmissionRepository.findByStudentAndCourse(
        enrollment.getStudentId(),
        courseId
      );
      quizSubmissions.push(...studentQuizSubmissions);
    }

    // Create maps for quick lookup
    const assignmentSubmissionMap = new Map<string, Map<string, any>>();
    assignmentSubmissions.forEach((sub) => {
      const assignmentId = sub.getAssignmentId();
      const studentId = sub.getStudentId();
      if (!assignmentSubmissionMap.has(assignmentId)) {
        assignmentSubmissionMap.set(assignmentId, new Map());
      }
      assignmentSubmissionMap.get(assignmentId)!.set(studentId, sub);
    });

    const quizSubmissionMap = new Map<string, Map<string, any>>();
    quizSubmissions.forEach((sub) => {
      const quizId = sub.getQuizId();
      const studentId = sub.getStudentId();
      if (!quizSubmissionMap.has(quizId)) {
        quizSubmissionMap.set(quizId, new Map());
      }
      quizSubmissionMap.get(quizId)!.set(studentId, sub);
    });

    // Build export rows and student summaries
    const rows: GradeExportRowDTO[] = [];
    const studentSummaries: StudentGradeSummaryDTO[] = [];

    for (const enrollment of enrollments) {
      const studentId = enrollment.getStudentId();
      const student = await this.userRepository.findById(studentId);
      
      if (!student) {
        continue;  // Skip if student not found
      }

      const studentName = student.getName();
      const studentEmail = student.getEmail();
      const studentGrades: number[] = [];

      // Process assignments
      for (const assignment of assignments) {
        const assignmentId = assignment.getId();
        const submission = assignmentSubmissionMap.get(assignmentId)?.get(studentId);

        if (!submission) {
          // Not submitted
          rows.push({
            studentName,
            studentEmail,
            itemType: 'Assignment',
            itemName: assignment.getTitle(),
            grade: 'Not Submitted',
            submissionDate: '',
            status: 'Not Submitted',
          });
        } else {
          const grade = submission.getGrade();
          const status = submission.getStatus();
          const isLate = submission.getIsLate();

          let gradeStr: string;
          let statusStr: string;

          if (status === AssignmentSubmissionStatus.GRADED && grade !== undefined && grade !== null) {
            gradeStr = grade.toString();
            studentGrades.push(grade);
            statusStr = isLate ? 'Late' : 'Graded';
          } else if (status === AssignmentSubmissionStatus.SUBMITTED) {
            gradeStr = 'Pending';
            statusStr = isLate ? 'Late' : 'Submitted';
          } else {
            gradeStr = 'Not Submitted';
            statusStr = 'Not Submitted';
          }

          rows.push({
            studentName,
            studentEmail,
            itemType: 'Assignment',
            itemName: assignment.getTitle(),
            grade: gradeStr,
            submissionDate: submission.getSubmittedAt()?.toISOString() || '',
            status: statusStr,
          });
        }
      }

      // Process quizzes
      for (const quiz of quizzes) {
        const quizId = quiz.getId();
        const submission = quizSubmissionMap.get(quizId)?.get(studentId);

        if (!submission) {
          // Not submitted
          rows.push({
            studentName,
            studentEmail,
            itemType: 'Quiz',
            itemName: quiz.getTitle(),
            grade: 'Not Submitted',
            submissionDate: '',
            status: 'Not Submitted',
          });
        } else {
          const grade = submission.getGrade();
          const submittedAt = submission.getSubmittedAt();

          let gradeStr: string;
          let statusStr: string;

          if (grade !== undefined && grade !== null) {
            gradeStr = grade.toString();
            studentGrades.push(grade);
            statusStr = 'Graded';
          } else if (submittedAt) {
            gradeStr = 'Pending';
            statusStr = 'Submitted';
          } else {
            gradeStr = 'Not Submitted';
            statusStr = 'Not Submitted';
          }

          rows.push({
            studentName,
            studentEmail,
            itemType: 'Quiz',
            itemName: quiz.getTitle(),
            grade: gradeStr,
            submissionDate: submittedAt?.toISOString() || '',
            status: statusStr,
          });
        }
      }

      // Calculate student average
      const averageGrade =
        studentGrades.length > 0
          ? studentGrades.reduce((sum, grade) => sum + grade, 0) / studentGrades.length
          : undefined;

      studentSummaries.push({
        studentId,
        studentName,
        studentEmail,
        averageGrade,
        totalGradedItems: studentGrades.length,
        totalItems: assignments.length + quizzes.length,
      });
    }

    return {
      courseId: course.getId(),
      courseName: course.getName(),
      exportDate: new Date(),
      rows,
      studentSummaries,
    };
  }

  /**
   * Convert GradeExportDTO to CSV string
   * 
   * @param exportData - Grade export data
   * @returns CSV string
   */
  toCSV(exportData: GradeExportDTO): string {
    const lines: string[] = [];

    // Header
    lines.push('Student Name,Student Email,Item Type,Item Name,Grade,Submission Date,Status');

    // Data rows
    for (const row of exportData.rows) {
      lines.push(
        `"${row.studentName}","${row.studentEmail}","${row.itemType}","${row.itemName}","${row.grade}","${row.submissionDate}","${row.status}"`
      );
    }

    // Add empty line
    lines.push('');

    // Student summaries
    lines.push('Student Name,Student Email,Average Grade,Graded Items,Total Items');
    for (const summary of exportData.studentSummaries) {
      const avgGrade = summary.averageGrade !== undefined ? summary.averageGrade.toFixed(2) : 'N/A';
      lines.push(
        `"${summary.studentName}","${summary.studentEmail}","${avgGrade}","${summary.totalGradedItems}","${summary.totalItems}"`
      );
    }

    return lines.join('\n');
  }
}

