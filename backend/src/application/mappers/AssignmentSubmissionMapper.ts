/**
 * Assignment Submission Mapper
 * 
 * Maps between AssignmentSubmission domain entities and AssignmentSubmissionDTOs.
 * Follows the Mapper pattern for clean separation between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

import { AssignmentSubmission } from '../../domain/entities/AssignmentSubmission.js';
import { AssignmentSubmissionDTO } from '../dtos/AssignmentDTO.js';

export class AssignmentSubmissionMapper {
  /**
   * Map AssignmentSubmission entity to AssignmentSubmissionDTO
   * 
   * @param submission - AssignmentSubmission domain entity
   * @returns AssignmentSubmissionDTO for API response
   */
  static toDTO(submission: AssignmentSubmission): AssignmentSubmissionDTO {
    return {
      id: submission.getId(),
      assignmentId: submission.getAssignmentId(),
      studentId: submission.getStudentId(),
      textContent: submission.getContent(),
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
   * Map array of AssignmentSubmission entities to array of AssignmentSubmissionDTOs
   * 
   * @param submissions - Array of AssignmentSubmission domain entities
   * @returns Array of AssignmentSubmissionDTOs for API response
   */
  static toDTOArray(submissions: AssignmentSubmission[]): AssignmentSubmissionDTO[] {
    return submissions.map(submission => this.toDTO(submission));
  }
}
