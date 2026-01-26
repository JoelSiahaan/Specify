/**
 * AssignmentsPage Component
 * 
 * Display list of assignments for a course.
 * Shows different views for teachers and students.
 * 
 * Teacher view:
 * - List all assignments with edit/delete actions
 * - Create new assignment button
 * - View submissions for each assignment
 * 
 * Student view:
 * - List all assignments with submission status
 * - Submit assignment button
 * - View grades and feedback
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseLayout } from '../../components/layout';
import { AssignmentList, CreateAssignment, SubmitAssignment } from '../../components/assignment';
import { Button, Spinner, ErrorMessage } from '../../components/shared';
import { useAuth, useCourse, useAssignments } from '../../hooks';
import { assignmentService } from '../../services';
import type { Assignment } from '../../types';
import { SubmissionStatus } from '../../types/common.types';

interface AssignmentWithStatus extends Assignment {
  status?: SubmissionStatus;
  isLate?: boolean;
  grade?: number;
}

export const AssignmentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use custom hooks for data
  const { course, loading: courseLoading, error: courseError } = useCourse(courseId);
  const { assignments, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useAssignments(courseId);
  
  // State
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showSubmitAssignment, setShowSubmitAssignment] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentsWithStatus, setAssignmentsWithStatus] = useState<AssignmentWithStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Combined loading and error states
  const loading = courseLoading || assignmentsLoading || statusLoading;
  const error = courseError || assignmentsError;

  const isTeacher = user?.role === 'TEACHER';

  // Fetch submission status for students
  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      if (!user || isTeacher || assignments.length === 0) {
        // Teachers don't need submission status, just pass assignments as-is
        setAssignmentsWithStatus(assignments);
        return;
      }

      try {
        setStatusLoading(true);
        
        // Fetch submission status for each assignment (students only)
        const withStatus = await Promise.all(
          assignments.map(async (assignment) => {
            try {
              const submission = await assignmentService.getMySubmission(assignment.id);
              
              if (!submission) {
                return {
                  ...assignment,
                  status: SubmissionStatus.NOT_SUBMITTED,
                  isLate: false,
                  grade: undefined,
                };
              }
              
              return {
                ...assignment,
                status: submission.status,
                isLate: submission.isLate,
                grade: submission.grade,
              };
            } catch (err) {
              // If error fetching submission, assume not submitted
              return {
                ...assignment,
                status: SubmissionStatus.NOT_SUBMITTED,
                isLate: false,
                grade: undefined,
              };
            }
          })
        );
        setAssignmentsWithStatus(withStatus);
      } catch (err) {
        console.error('Failed to fetch submission status:', err);
        // On error, just show assignments without status
        setAssignmentsWithStatus(assignments);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchSubmissionStatus();
  }, [assignments, user, isTeacher]);

  /**
   * Handle create assignment success
   */
  const handleCreateSuccess = () => {
    setShowCreateAssignment(false);
    refetchAssignments(); // Refetch assignments after creation
  };

  /**
   * Handle assignment click (for students to submit)
   */
  const handleAssignmentClick = (assignmentId: string) => {
    if (isTeacher) {
      // Navigate to submissions page for teachers
      navigate(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
    } else {
      // Open submit assignment modal for students
      setSelectedAssignmentId(assignmentId);
      setShowSubmitAssignment(true);
    }
  };

  /**
   * Handle submit assignment success
   */
  const handleSubmitSuccess = () => {
    setShowSubmitAssignment(false);
    setSelectedAssignmentId(null);
    refetchAssignments(); // Refetch assignments after submission
  };

  /**
   * Handle cancel submit assignment
   */
  const handleCancelSubmit = () => {
    setShowSubmitAssignment(false);
    setSelectedAssignmentId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage message={error || 'Course not found'} />
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName={course.name}>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Assignments</h1>
              <p className="text-gray-600 mt-1">{course.name}</p>
            </div>
            
            {/* Create Assignment Button (Teacher only, Active courses only) */}
            {isTeacher && !showCreateAssignment && course.status === 'ACTIVE' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateAssignment(true)}
              >
                + Create Assignment
              </Button>
            )}
          </div>
        </div>

        {/* Archived Course Notice */}
        {course.status === 'ARCHIVED' && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              📦 This course is archived. {isTeacher ? 'Assignments cannot be created, edited, or deleted.' : 'You cannot submit assignments.'}
            </p>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CreateAssignment
                courseId={courseId!}
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateAssignment(false)}
              />
            </div>
          </div>
        )}

        {/* Submit Assignment Modal (Student only) */}
        {showSubmitAssignment && selectedAssignmentId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <SubmitAssignment
                assignmentId={selectedAssignmentId}
                onSubmitSuccess={handleSubmitSuccess}
                onCancel={handleCancelSubmit}
              />
            </div>
          </div>
        )}

        {/* Assignment List */}
        <AssignmentList
          assignments={assignmentsWithStatus}
          onAssignmentClick={handleAssignmentClick}
        />
      </div>
    </CourseLayout>
  );
};

export default AssignmentsPage;
