/**
 * SubmissionList Component (Teacher View)
 * 
 * Displays all submissions for an assignment with status filtering.
 * Shows student information, submission status, late indicators, and grading links.
 * 
 * Requirements: 13.10
 */

import React, { useState } from 'react';
import { formatDueDate } from '../../utils/dateFormatter';
import type { AssignmentSubmissionListDTO } from '../../types/assignment.types';
import { SubmissionStatus } from '../../types/common.types';

interface SubmissionListProps {
  submissions: AssignmentSubmissionListDTO[];
  onGradeClick?: (submissionId: string) => void;
}

type FilterStatus = 'all' | SubmissionStatus;

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  onGradeClick,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Filter submissions based on selected status
  const filteredSubmissions = submissions.filter((submission) => {
    if (filterStatus === 'all') return true;
    
    // "Submitted" tab should include both SUBMITTED and GRADED
    // because graded submissions are also submitted
    if (filterStatus === SubmissionStatus.SUBMITTED) {
      return submission.status === 'SUBMITTED' || submission.status === 'GRADED';
    }
    
    return submission.status === filterStatus;
  });

  // Count submissions by status
  const statusCounts = {
    all: submissions.length,
    [SubmissionStatus.NOT_SUBMITTED]: submissions.filter(
      (s) => s.status === 'NOT_SUBMITTED'
    ).length,
    // "Submitted" count includes both SUBMITTED and GRADED
    // because graded submissions are also submitted
    [SubmissionStatus.SUBMITTED]: submissions.filter(
      (s) => s.status === 'SUBMITTED' || s.status === 'GRADED'
    ).length,
    [SubmissionStatus.GRADED]: submissions.filter(
      (s) => s.status === 'GRADED'
    ).length,
  };

  const getStatusBadge = (status: SubmissionStatus, isLate: boolean) => {
    if (status === SubmissionStatus.NOT_SUBMITTED) {
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
          <span>Not Submitted</span>
        </div>
      );
    }

    if (status === SubmissionStatus.SUBMITTED) {
      if (isLate) {
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="inline-flex items-center gap-1">
              <span>⚠</span>
              <span>Late Submission</span>
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          <span>Submitted</span>
        </div>
      );
    }

    if (status === SubmissionStatus.GRADED) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span>Graded</span>
        </div>
      );
    }

    return null;
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">📝</span>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
        <p className="text-gray-600">Students haven't submitted any work yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Filter submissions">
          <button
            onClick={() => setFilterStatus('all')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              filterStatus === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus(SubmissionStatus.NOT_SUBMITTED)}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              filterStatus === SubmissionStatus.NOT_SUBMITTED
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Not Submitted ({statusCounts[SubmissionStatus.NOT_SUBMITTED]})
          </button>
          <button
            onClick={() => setFilterStatus(SubmissionStatus.SUBMITTED)}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              filterStatus === SubmissionStatus.SUBMITTED
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Submitted ({statusCounts[SubmissionStatus.SUBMITTED]})
          </button>
          <button
            onClick={() => setFilterStatus(SubmissionStatus.GRADED)}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              filterStatus === SubmissionStatus.GRADED
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Graded ({statusCounts[SubmissionStatus.GRADED]})
          </button>
        </nav>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No submissions in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left: Student info and status */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">👤</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {submission.studentName || 'Unknown Student'}
                      </h4>
                      <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="ml-11">
                    {getStatusBadge(submission.status, submission.isLate)}
                  </div>

                  {/* Submission timestamp */}
                  {submission.submittedAt && (
                    <p className="text-sm text-gray-500 mt-2 ml-11">
                      Submitted: {formatDueDate(submission.submittedAt.toString())}
                    </p>
                  )}
                </div>

                {/* Right: Grade or action button */}
                <div className="flex items-center gap-4">
                  {submission.status === SubmissionStatus.GRADED && submission.grade !== undefined ? (
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">{submission.grade}</span>
                      <p className="text-xs text-gray-500">/ 100</p>
                    </div>
                  ) : null}

                  {submission.status !== SubmissionStatus.NOT_SUBMITTED && (
                    <button
                      onClick={() => onGradeClick?.(submission.id)}
                      className="py-2 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {submission.status === SubmissionStatus.GRADED ? 'Edit Grade' : 'Grade'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionList;
