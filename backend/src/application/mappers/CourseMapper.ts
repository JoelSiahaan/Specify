/**
 * Course Mapper
 * 
 * Maps between Course domain entity and CourseDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 */

import { Course, CourseStatus } from '../../domain/entities/Course.js';
import { CourseDTO, CreateCourseDTO, UpdateCourseDTO, CourseListDTO } from '../dtos/CourseDTO.js';
import { randomUUID } from 'crypto';

export class CourseMapper {
  /**
   * Convert Course entity to CourseDTO
   * 
   * @param course - Course domain entity
   * @returns CourseDTO for API response
   */
  static toDTO(course: Course): CourseDTO {
    return {
      id: course.getId(),
      name: course.getName(),
      description: course.getDescription(),
      courseCode: course.getCourseCode(),
      status: course.getStatus(),
      teacherId: course.getTeacherId(),
      createdAt: course.getCreatedAt(),
      updatedAt: course.getUpdatedAt()
    };
  }

  /**
   * Convert CreateCourseDTO to Course entity
   * Used for course creation
   * 
   * @param dto - CreateCourseDTO from API request
   * @param courseCode - Generated unique course code
   * @param teacherId - ID of the teacher creating the course
   * @returns Course domain entity
   */
  static toDomain(dto: CreateCourseDTO, courseCode: string, teacherId: string): Course {
    return Course.create({
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      courseCode: courseCode,
      status: CourseStatus.ACTIVE,
      teacherId: teacherId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple Course entities to CourseDTOs
   * 
   * @param courses - Array of Course domain entities
   * @returns Array of CourseDTOs
   */
  static toDTOList(courses: Course[]): CourseDTO[] {
    return courses.map(course => this.toDTO(course));
  }

  /**
   * Convert Course entity to CourseListDTO
   * Used for listing courses with additional information
   * 
   * @param course - Course domain entity
   * @param teacherName - Optional teacher name
   * @param enrollmentCount - Optional enrollment count
   * @returns CourseListDTO for API response
   */
  static toListDTO(
    course: Course,
    teacherName?: string,
    enrollmentCount?: number
  ): CourseListDTO {
    return {
      id: course.getId(),
      name: course.getName(),
      description: course.getDescription(),
      courseCode: course.getCourseCode(),
      status: course.getStatus(),
      teacherId: course.getTeacherId(),
      teacherName: teacherName,
      enrollmentCount: enrollmentCount,
      createdAt: course.getCreatedAt(),
      updatedAt: course.getUpdatedAt()
    };
  }

  /**
   * Convert multiple Course entities to CourseListDTOs
   * 
   * @param courses - Array of Course domain entities
   * @param teacherNames - Optional map of teacher IDs to names
   * @param enrollmentCounts - Optional map of course IDs to enrollment counts
   * @returns Array of CourseListDTOs
   */
  static toListDTOList(
    courses: Course[],
    teacherNames?: Map<string, string>,
    enrollmentCounts?: Map<string, number>
  ): CourseListDTO[] {
    return courses.map(course => 
      this.toListDTO(
        course,
        teacherNames?.get(course.getTeacherId()),
        enrollmentCounts?.get(course.getId())
      )
    );
  }

  /**
   * Apply UpdateCourseDTO to existing Course entity
   * Updates only the fields provided in the DTO
   * 
   * @param course - Existing Course domain entity
   * @param dto - UpdateCourseDTO with fields to update
   * @returns Updated Course entity
   */
  static applyUpdate(course: Course, dto: UpdateCourseDTO): Course {
    if (dto.name !== undefined) {
      course.updateName(dto.name);
    }

    if (dto.description !== undefined) {
      course.updateDescription(dto.description);
    }

    return course;
  }
}
