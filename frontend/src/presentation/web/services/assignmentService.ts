/**
 * Assignment Service
 * 
 * API calls for assignment management.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  ListAssignmentsResponse,
  Submission,
  SubmitAssignmentRequest,
  ListSubmissionsResponse,
} from '../types';

/**
 * List all assignments for a course
 */
export const listAssignments = async (courseId: string): Promise<ListAssignmentsResponse> => {
  return await api.get<ListAssignmentsResponse>(API_ENDPOINTS.ASSIGNMENTS.LIST(courseId));
};

/**
 * Get assignment details by ID
 */
export const getAssignmentById = async (id: string): Promise<Assignment> => {
  return await api.get<Assignment>(API_ENDPOINTS.ASSIGNMENTS.DETAILS(id));
};

/**
 * Create new assignment (teacher only)
 */
export const createAssignment = async (
  courseId: string,
  data: CreateAssignmentRequest
): Promise<Assignment> => {
  return await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENTS.CREATE(courseId), data);
};

/**
 * Update assignment (teacher only)
 */
export const updateAssignment = async (
  id: string,
  data: UpdateAssignmentRequest
): Promise<Assignment> => {
  return await api.put<Assignment>(API_ENDPOINTS.ASSIGNMENTS.UPDATE(id), data);
};

/**
 * Delete assignment (teacher only)
 */
export const deleteAssignment = async (id: string): Promise<void> => {
  return await api.delete<void>(API_ENDPOINTS.ASSIGNMENTS.DELETE(id));
};

/**
 * List submissions for an assignment (teacher only)
 */
export const listSubmissions = async (assignmentId: string): Promise<ListSubmissionsResponse> => {
  return await api.get<ListSubmissionsResponse>(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId));
};

/**
 * Submit assignment (student only)
 */
export const submitAssignment = async (
  assignmentId: string,
  data: SubmitAssignmentRequest
): Promise<Submission> => {
  // If file upload, use FormData
  if (data.file) {
    const formData = new FormData();
    formData.append('submissionType', data.submissionType);
    formData.append('file', data.file);
    if (data.textContent) {
      formData.append('content', data.textContent); // Backend expects 'content', not 'textContent'
    }
    
    return await api.post<Submission>(
      API_ENDPOINTS.ASSIGNMENTS.SUBMIT(assignmentId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
  
  // Text-only submission - map textContent to content
  const requestData = {
    submissionType: data.submissionType,
    content: data.textContent
  };
  
  return await api.post<Submission>(API_ENDPOINTS.ASSIGNMENTS.SUBMIT(assignmentId), requestData);
};

/**
 * Get student's own submission for an assignment (student only)
 */
export const getMySubmission = async (assignmentId: string): Promise<Submission | null> => {
  try {
    return await api.get<Submission>(API_ENDPOINTS.ASSIGNMENTS.MY_SUBMISSION(assignmentId));
  } catch (error) {
    // If 404, student hasn't submitted yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};
