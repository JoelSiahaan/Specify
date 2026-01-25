/**
 * Submission Mapper
 * 
 * Maps between Submission domain entity and SubmissionDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 */

import { Submission, SubmissionStatus } from '../../domain/entities/Submission';
import { 
  SubmissionDTO, 
  CreateSubmissionDTO,
  GradeSubmissionDTO,
  SubmissionListDTO 
} from '../dtos/AssignmentDTO';
import { randomUUID } from 'crypto';

export class SubmissionMapper {
  /**
   * Convert Submission entity to SubmissionDTO
   * 
   * @param submission - Submission domain entity
   * @returns SubmissionDTO for API response
   */
  static toDTO(submission: Submission): SubmissionDTO {
    return {
      id: submission.getId(),
      assignmentId: submission.getAssignmentId(),
      studentId: submission.getStudentId(),
      content: submission.getContent(),
      filePath: submission.getFilePath(),
      fileName: submission.getFileName(),
      grade: submission.getGrade(),
      feedback: submission.getFeedback(),
      isLate: submission.getIsLate(),
      status: submission.getStatus(),
      version: submission.getVersion(),
      submittedAt: submission.getSubmittedAt(),
      gradedAt: submission.getGradedAt(),
      createdAt: submission.getCreatedAt(),
      updatedAt: submission.getUpdatedAt()
    };
  }

  /**
   * Convert CreateSubmissionDTO to Submission entity
   * Used for submission creation
   * 
   * @param dto - CreateSubmissionDTO from API request
   * @param assignmentId - ID of the assignment being submitted
   * @param studentId - ID of the student submitting
   * @param isLate - Whether the submission is late
   * @returns Submission domain entity
   */
  static toDomain(
    dto: CreateSubmissionDTO, 
    assignmentId: string, 
    studentId: string,
    isLate: boolean
  ): Submission {
    return Submission.create({
      id: randomUUID(),
      assignmentId: assignmentId,
      studentId: studentId,
      content: dto.content,
      filePath: dto.filePath,
      fileName: dto.fileName,
      isLate: isLate,
      status: SubmissionStatus.SUBMITTED,
      version: 0,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple Submission entities to SubmissionDTOs
   * 
   * @param submissions - Array of Submission domain entities
   * @returns Array of SubmissionDTOs
   */
  static toDTOList(submissions: Submission[]): SubmissionDTO[] {
    return submissions.map(submission => this.toDTO(submission));
  }

  /**
   * Convert Submission entity to SubmissionListDTO
   * Used for listing submissions with student information
   * 
   * @param submission - Submission domain entity
   * @param studentName - Optional student name
   * @param studentEmail - Optional student email
   * @returns SubmissionListDTO for API response
   */
  static toListDTO(
    submission: Submission,
    studentName?: string,
    studentEmail?: string
  ): SubmissionListDTO {
    return {
      id: submission.getId(),
      assignmentId: submission.getAssignmentId(),
      studentId: submission.getStudentId(),
      studentName: studentName,
      studentEmail: studentEmail,
      content: submission.getContent(),
      filePath: submission.getFilePath(),
      fileName: submission.getFileName(),
      grade: submission.getGrade(),
      feedback: submission.getFeedback(),
      isLate: submission.getIsLate(),
      status: submission.getStatus(),
      submittedAt: submission.getSubmittedAt(),
      gradedAt: submission.getGradedAt(),
      createdAt: submission.getCreatedAt(),
      updatedAt: submission.getUpdatedAt()
    };
  }

  /**
   * Convert multiple Submission entities to SubmissionListDTOs
   * 
   * @param submissions - Array of Submission domain entities
   * @param studentNames - Optional map of student IDs to names
   * @param studentEmails - Optional map of student IDs to emails
   * @returns Array of SubmissionListDTOs
   */
  static toListDTOList(
    submissions: Submission[],
    studentNames?: Map<string, string>,
    studentEmails?: Map<string, string>
  ): SubmissionListDTO[] {
    return submissions.map(submission => 
      this.toListDTO(
        submission,
        studentNames?.get(submission.getStudentId()),
        studentEmails?.get(submission.getStudentId())
      )
    );
  }

  /**
   * Apply GradeSubmissionDTO to existing Submission entity
   * Used for grading a submission
   * 
   * @param submission - Existing Submission domain entity
   * @param dto - GradeSubmissionDTO with grade and feedback
   * @returns Updated Submission entity
   */
  static applyGrade(submission: Submission, dto: GradeSubmissionDTO): Submission {
    if (submission.isGraded()) {
      // Update existing grade
      submission.updateGrade(dto.grade, dto.feedback, dto.version);
    } else {
      // Assign new grade
      submission.assignGrade(dto.grade, dto.feedback, dto.version);
    }

    return submission;
  }

  /**
   * Apply CreateSubmissionDTO to existing Submission entity
   * Used for resubmission
   * 
   * @param submission - Existing Submission domain entity
   * @param dto - CreateSubmissionDTO with new content
   * @param isLate - Whether the resubmission is late
   * @returns Updated Submission entity
   */
  static applyResubmission(
    submission: Submission, 
    dto: CreateSubmissionDTO,
    isLate: boolean
  ): Submission {
    submission.updateContent(dto.content, dto.filePath, dto.fileName);
    submission.resubmit(isLate);
    return submission;
  }
}
