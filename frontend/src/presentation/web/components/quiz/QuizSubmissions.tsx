/**
 * QuizSubmissions Component
 * 
 * Display list of quiz submissions for teachers to grade.
 * Shows student names, submission status, and grades.
 * Includes filter tabs and status counts matching SubmissionList pattern.
 * 
 * Requirements:
 * - 11.10: View quiz submissions (teacher)
 * - Display submission list with student info
 * - Show submission status and grades
 * - Filter by status (All, Not Started, Submitted, Graded)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { CourseLayout } from '../layout';
import { GradeQuizSubmission } from '../grading';
import { quizService } from '../../services';
import { formatDueDate } from '../../utils/dateFormatter';
import type { Quiz, QuizSubmissionListItem, QuizSubmissionStatus, ApiError } from '../../types';

type FilterStatus = 'all' | QuizSubmissionStatus;

export const QuizSubmissions: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  /**
   * Fetch quiz details on mount
   */
  useEffect(() => {
    if (courseId && quizId) {
      fetchQuizAndSubmissions();
    }
  }, [courseId, quizId]);

  /**
   * Fetch quiz and submissions from API
   */
  const fetchQuizAndSubmissions = async () => {
    if (!quizId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch quiz details and submissions in parallel
      const [quizData, submissionsData] = await Promise.all([
        quizService.getQuiz(quizId),
        quizService.listQuizSubmissions(quizId)
      ]);
      
      setQuiz(quizData);
      setSubmissions(submissionsData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load quiz submissions');
    } finally {
      setLoading(false);
    }
  };

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
    fetchQuizAndSubmissions(); // Refresh submissions
  };

  /**
   * Handle grade cancel
   */
  const handleGradeCancel = () => {
    setShowGradeModal(false);
    setSelectedSubmissionId(null);
  };

  // Filter submissions based on selected status
  const filteredSubmissions = submissions.filter((submission) => {
    if (filterStatus === 'all') return true;
    
    // "Submitted" tab should include both SUBMITTED and GRADED
    // because graded submissions are also submitted
    if (filterStatus === 'SUBMITTED') {
      return submission.status === 'SUBMITTED' || submission.status === 'GRADED';
    }
    
    return submission.status === filterStatus;
  });

  // Count submissions by status
  const statusCounts = {
    all: submissions.length,
    NOT_STARTED: submissions.filter((s) => s.status === 'NOT_STARTED').length,
    IN_PROGRESS: submissions.filter((s) => s.status === 'IN_PROGRESS').length,
    // "Submitted" count includes both SUBMITTED and GRADED
    // because graded submissions are also submitted
    SUBMITTED: submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'GRADED').length,
    GRADED: submissions.filter((s) => s.status === 'GRADED').length,
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (status: QuizSubmissionStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            Not Started
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
            <span>⏳</span>
            <span>In Progress</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
            Submitted
          </span>
        );
      case 'GRADED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
            <span>✓</span>
            <span>Graded</span>
          </span>
        );
      default:
        return null;
    }
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
  if (error && !quiz) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Quiz not found
  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <span className="text-5xl mb-4 block">❓</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName="">
      <div className="p-6">
        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600 mt-1">{quiz.description}</p>
          
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{quiz.timeLimit} minutes</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📝</span>
              <span>{quiz.questions?.length || 0} questions</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-gray-900">{statusCounts.SUBMITTED + statusCounts.GRADED}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Graded</p>
            <p className="text-3xl font-bold text-green-600">{statusCounts.GRADED}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Not Started</p>
            <p className="text-3xl font-bold text-gray-600">{statusCounts.NOT_STARTED}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilterStatus('NOT_STARTED' as QuizSubmissionStatus)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === 'NOT_STARTED'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Started ({statusCounts.NOT_STARTED})
            </button>
            <button
              onClick={() => setFilterStatus('SUBMITTED' as QuizSubmissionStatus)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === 'SUBMITTED'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submitted ({statusCounts.SUBMITTED})
            </button>
            <button
              onClick={() => setFilterStatus('GRADED' as QuizSubmissionStatus)}
              className={`px-4 py-2 rounded transition-colors ${
                filterStatus === 'GRADED'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Graded ({statusCounts.GRADED})
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions</h3>
            <p className="text-gray-600">
              {filterStatus === 'all'
                ? 'Students haven\'t submitted this quiz yet.'
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
                      <h4 className="font-semibold text-gray-900">{submission.studentName}</h4>
                      <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                      
                      {submission.status !== 'NOT_STARTED' && submission.submittedAt && (
                        <p className="text-sm text-gray-600 mt-1">
                          Submitted: {formatDueDate(submission.submittedAt)}
                        </p>
                      )}
                      
                      {/* Status badge */}
                      <div className="mt-2">
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Grade or action */}
                  <div className="text-right">
                    {submission.status === 'GRADED' && submission.grade !== null ? (
                      <>
                        <span className="text-2xl font-bold text-green-600">{submission.grade}</span>
                        <p className="text-xs text-gray-500">/ 100</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGradeClick(submission.id)}
                          className="mt-2"
                        >
                          Edit Grade
                        </Button>
                      </>
                    ) : submission.status === 'SUBMITTED' ? (
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

        {/* Grade Quiz Submission Modal */}
        {showGradeModal && selectedSubmissionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Grade Quiz Submission</h2>
                  <button
                    onClick={handleGradeCancel}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <GradeQuizSubmission
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

export default QuizSubmissions;
