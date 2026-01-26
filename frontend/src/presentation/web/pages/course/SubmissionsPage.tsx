/**
 * SubmissionsPage Component
 * 
 * Teacher view to see all student submissions for an assignment.
 * 
 * Features:
 * - List all submissions with status
 * - Filter by status (All, Submitted, Graded, Not Submitted)
 * - View submission details
 * - Grade submissions
 * - Download submitted files
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseLayout } from '../../components/layout';
import { Button, Spinner, ErrorMessage } from '../../components/shared';
import { GradeSubmission } from '../../components/grading';
import * as assignmentService from '../../services/assignmentService';
import { formatDueDate } from '../../utils/dateFormatter';
import { buildRoute, ROUTES } from '../../constants/routes';
import type { Assignment, Submission, ApiError } from '../../types';
import { SubmissionStatus } from '../../types/common.types';

export const SubmissionsPage: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  
  // State
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | SubmissionStatus>('ALL');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Fetch assignment and submissions
  useEffect(() => {
    if (assignmentId) {
      fetchData();
    }
  }, [assignmentId]);

  const fetchData = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignment details
      const assignmentData = await assignmentService.getAssignmentById(assignmentId);
      setAssignment(assignmentData);
      
      // Fetch submissions
      const submissionsData = await assignmentService.listSubmissions(assignmentId);
      setSubmissions(submissionsData.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge
   */
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

  /**
   * Filter submissions by status
   */
  const filteredSubmissions = filterStatus === 'ALL' 
    ? submissions 
    : submissions.filter(sub => sub.status === filterStatus);

  /**
   * Get submission counts
   */
  const submittedCount = submissions.filter(s => s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.GRADED).length;
  const gradedCount = submissions.filter(s => s.status === SubmissionStatus.GRADED).length;
  const notSubmittedCount = submissions.filter(s => s.status === SubmissionStatus.NOT_SUBMITTED).length;

  /**
   * Handle grade button click
   */
  const handleGradeClick = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setShowGradeModal(true);
  };

  /**
   * Handle grade success
   */
  const handleGradeSuccess = () => {
    setShowGradeModal(false);
    setSelectedSubmissionId(null);
    fetchData(); // Refresh submissions
  };

  /**
   * Handle grade cancel
   */
  const handleGradeCancel = () => {
    setShowGradeModal(false);
    setSelectedSubmissionId(null);
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
  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage message={error || 'Assignment not found'} />
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName="">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">         
          <h1 className="text-3xl font-semibold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600 mt-1">Due: {formatDueDate(assignment.dueDate)}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-gray-900">{submittedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Graded</p>
            <p className="text-3xl font-bold text-green-600">{gradedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Not Submitted</p>
            <p className="text-3xl font-bold text-gray-600">{notSubmittedCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilterStatus(SubmissionStatus.SUBMITTED)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === SubmissionStatus.SUBMITTED
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submitted ({submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length})
            </button>
            <button
              onClick={() => setFilterStatus(SubmissionStatus.GRADED)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === SubmissionStatus.GRADED
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Graded ({gradedCount})
            </button>
            <button
              onClick={() => setFilterStatus(SubmissionStatus.NOT_SUBMITTED)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === SubmissionStatus.NOT_SUBMITTED
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Submitted ({notSubmittedCount})
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions</h3>
            <p className="text-gray-600">
              {filterStatus === 'ALL' 
                ? 'No students have submitted yet.' 
                : `No submissions with status: ${filterStatus}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Student info */}
                  <div className="flex gap-4 flex-1">
                    <span className="text-3xl">👤</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        Student ID: {submission.studentId}
                      </h4>
                      {submission.status !== SubmissionStatus.NOT_SUBMITTED && (
                        <>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted: {formatDueDate(submission.submittedAt)}
                          </p>
                          {submission.fileName && (
                            <p className="text-sm text-gray-600 mt-1">
                              File: {submission.fileName}
                            </p>
                          )}
                        </>
                      )}
                      
                      {/* Status badge */}
                      <div className="mt-2">
                        {getStatusBadge(submission.status, submission.isLate)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Grade or action */}
                  <div className="text-right">
                    {submission.status === SubmissionStatus.GRADED && submission.grade !== undefined ? (
                      <>
                        <span className="text-2xl font-bold text-green-600">{submission.grade}</span>
                        <p className="text-xs text-gray-500">/ 100</p>
                      </>
                    ) : submission.status === SubmissionStatus.SUBMITTED ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleGradeClick(submission.id)}
                      >
                        Grade
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grade Submission Modal */}
        {showGradeModal && selectedSubmissionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Grade Submission</h2>
                  <button
                    onClick={handleGradeCancel}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <GradeSubmission
                  submissionId={selectedSubmissionId}
                  onSuccess={handleGradeSuccess}
                  onCancel={handleGradeCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </CourseLayout>
  );
};

export default SubmissionsPage;
