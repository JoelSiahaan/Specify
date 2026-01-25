/**
 * AssignmentList Component
 * 
 * Displays a list of assignments with status, due dates, and time remaining.
 * Highlights overdue items and indicates late submissions.
 * 
 * Requirements: 9.11, 9.12, 16.1-16.6
 */

import React, { useEffect, useState } from 'react';
import { listAssignments, getMySubmission } from '../../services/assignmentService';
import { formatDueDate, isPastDate } from '../../utils/dateFormatter';
import { Spinner, ErrorMessage } from '../shared';
import type { Assignment } from '../../types';
import { SubmissionStatus } from '../../types/common.types';
import { useAuth } from '../../hooks/useAuth';

interface AssignmentListProps {
  courseId: string;
  courseStatus?: string;
  onAssignmentClick?: (assignmentId: string) => void;
}

interface AssignmentWithStatus extends Assignment {
  status: SubmissionStatus;
  isLate: boolean;
  grade?: number;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  courseId,
  courseStatus,
  onAssignmentClick,
}) => {
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listAssignments(courseId);
        
        // Fetch submission status for each assignment (students only)
        if (user?.role === 'STUDENT') {
          const assignmentsWithStatus = await Promise.all(
            response.data.map(async (assignment) => {
              try {
                const submission = await getMySubmission(assignment.id);
                
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
          setAssignments(assignmentsWithStatus);
        } else {
          // Teachers don't need submission status in list view
          const assignmentsWithStatus = response.data.map((assignment) => ({
            ...assignment,
            status: SubmissionStatus.NOT_SUBMITTED,
            isLate: false,
            grade: undefined,
          }));
          setAssignments(assignmentsWithStatus);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId, user]);

  const getStatusBadge = (status: SubmissionStatus, isLate: boolean) => {
    if (status === SubmissionStatus.NOT_SUBMITTED) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
          Not Submitted
        </span>
      );
    }
    
    if (status === SubmissionStatus.SUBMITTED) {
      if (isLate) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
            <span>⚠</span>
            <span>Late</span>
          </span>
        );
      }
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
          Submitted
        </span>
      );
    }
    
    if (status === SubmissionStatus.GRADED) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
          <span>✓</span>
          <span>Graded</span>
        </span>
      );
    }
    
    return null;
  };

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return null; // Overdue
    }

    if (diffHours < 24) {
      return `${diffHours} hours remaining`;
    }

    return `${diffDays} days remaining`;
  };

  const isOverdue = (assignment: AssignmentWithStatus) => {
    return (
      isPastDate(assignment.dueDate) &&
      assignment.status === SubmissionStatus.NOT_SUBMITTED
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">📝</span>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments</h3>
        <p className="text-gray-600">This course doesn't have any assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const overdueItem = isOverdue(assignment);
        const timeRemaining = getTimeRemaining(assignment.dueDate);

        return (
          <div
            key={assignment.id}
            className={`bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              overdueItem ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            onClick={() => onAssignmentClick?.(assignment.id)}
          >
            <div className="flex items-start justify-between">
              {/* Left: Icon and info */}
              <div className="flex gap-4 flex-1">
                <span className="text-3xl">📝</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                  <p
                    className={`text-sm mt-1 ${
                      overdueItem ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    Due: {formatDueDate(assignment.dueDate)}
                    {overdueItem && ' (Overdue)'}
                  </p>

                  {/* Time remaining */}
                  {timeRemaining && !overdueItem && (
                    <p className="text-sm text-gray-500 mt-1">{timeRemaining}</p>
                  )}

                  {/* Status indicator */}
                  <div className="mt-2">{getStatusBadge(assignment.status, assignment.isLate)}</div>
                </div>
              </div>

              {/* Right: Grade or action */}
              {assignment.status === SubmissionStatus.GRADED && assignment.grade !== undefined && (
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">{assignment.grade}</span>
                  <p className="text-xs text-gray-500">/ 100</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentList;
