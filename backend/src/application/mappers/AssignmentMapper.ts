/**
 * Assignment Mapper
 * 
 * Maps between Assignment domain entity and AssignmentDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 */

import { Assignment } from '../../domain/entities/Assignment';
import { 
  AssignmentDTO, 
  CreateAssignmentDTO, 
  UpdateAssignmentDTO,
  AssignmentListDTO 
} from '../dtos/AssignmentDTO';
import { SubmissionStatus } from '../../domain/entities/Submission';
import { randomUUID } from 'crypto';

export class AssignmentMapper {
  /**
   * Convert Assignment entity to AssignmentDTO
   * 
   * @param assignment - Assignment domain entity
   * @returns AssignmentDTO for API response
   */
  static toDTO(assignment: Assignment): AssignmentDTO {
    return {
      id: assignment.getId(),
      courseId: assignment.getCourseId(),
      title: assignment.getTitle(),
      description: assignment.getDescription(),
      dueDate: assignment.getDueDate(),
      submissionType: assignment.getSubmissionType(),
      acceptedFileFormats: assignment.getAcceptedFileFormats(),
      gradingStarted: assignment.getGradingStarted(),
      createdAt: assignment.getCreatedAt(),
      updatedAt: assignment.getUpdatedAt()
    };
  }

  /**
   * Convert CreateAssignmentDTO to Assignment entity
   * Used for assignment creation
   * 
   * @param dto - CreateAssignmentDTO from API request
   * @param courseId - ID of the course this assignment belongs to
   * @returns Assignment domain entity
   */
  static toDomain(dto: CreateAssignmentDTO, courseId: string): Assignment {
    return Assignment.create({
      id: randomUUID(),
      courseId: courseId,
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      submissionType: dto.submissionType,
      acceptedFileFormats: dto.acceptedFileFormats || [],
      gradingStarted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple Assignment entities to AssignmentDTOs
   * 
   * @param assignments - Array of Assignment domain entities
   * @returns Array of AssignmentDTOs
   */
  static toDTOList(assignments: Assignment[]): AssignmentDTO[] {
    return assignments.map(assignment => this.toDTO(assignment));
  }

  /**
   * Convert Assignment entity to AssignmentListDTO
   * Used for listing assignments with additional information
   * 
   * @param assignment - Assignment domain entity
   * @param submissionStatus - Optional submission status for student view
   * @param grade - Optional grade for student view
   * @param isLate - Optional late flag for student view
   * @returns AssignmentListDTO for API response
   */
  static toListDTO(
    assignment: Assignment,
    submissionStatus?: SubmissionStatus,
    grade?: number,
    isLate?: boolean
  ): AssignmentListDTO {
    return {
      id: assignment.getId(),
      courseId: assignment.getCourseId(),
      title: assignment.getTitle(),
      description: assignment.getDescription(),
      dueDate: assignment.getDueDate(),
      submissionType: assignment.getSubmissionType(),
      gradingStarted: assignment.getGradingStarted(),
      isPastDue: assignment.isPastDueDate(),
      submissionStatus: submissionStatus,
      grade: grade,
      isLate: isLate,
      createdAt: assignment.getCreatedAt(),
      updatedAt: assignment.getUpdatedAt()
    };
  }

  /**
   * Convert multiple Assignment entities to AssignmentListDTOs
   * 
   * @param assignments - Array of Assignment domain entities
   * @param submissionStatuses - Optional map of assignment IDs to submission statuses
   * @param grades - Optional map of assignment IDs to grades
   * @param lateFlags - Optional map of assignment IDs to late flags
   * @returns Array of AssignmentListDTOs
   */
  static toListDTOList(
    assignments: Assignment[],
    submissionStatuses?: Map<string, SubmissionStatus>,
    grades?: Map<string, number>,
    lateFlags?: Map<string, boolean>
  ): AssignmentListDTO[] {
    return assignments.map(assignment => 
      this.toListDTO(
        assignment,
        submissionStatuses?.get(assignment.getId()),
        grades?.get(assignment.getId()),
        lateFlags?.get(assignment.getId())
      )
    );
  }

  /**
   * Apply UpdateAssignmentDTO to existing Assignment entity
   * Updates only the fields provided in the DTO
   * 
   * @param assignment - Existing Assignment domain entity
   * @param dto - UpdateAssignmentDTO with fields to update
   * @returns Updated Assignment entity
   */
  static applyUpdate(assignment: Assignment, dto: UpdateAssignmentDTO): Assignment {
    if (dto.title !== undefined) {
      assignment.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      assignment.updateDescription(dto.description);
    }

    if (dto.dueDate !== undefined) {
      assignment.updateDueDate(dto.dueDate);
    }

    return assignment;
  }
}
