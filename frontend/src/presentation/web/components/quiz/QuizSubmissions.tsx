/**
 * QuizSubmissions Component
 * 
 * Display list of quiz submissions for teachers to grade.
 * Shows student names, submission status, and grades.
 * 
 * Requirements:
 * - 11.10: View quiz submissions (teacher)
 * - Display submission list with student info
 * - Show submission status and grades
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { CourseLayout, Breadcrumb } from '../layout';
import { quizService } from '../../services';
import { ROUTES, buildRoute } from '../../constants';
import { useAuth } from '../../hooks';
import { formatDueDate } from '../../utils/dateFormatter';
import type { Quiz, QuizSubmissionListItem, QuizSubmissionStatus, ApiError } from '../../types';

export const QuizSubmissions: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine dashboard route
  const dashboardRoute = ROUTES.TEACHER_DASHBOARD;
  const courseRoute = buildRoute(ROUTES.TEACHER_COURSE_DETAILS, { courseId: courseId || '' });

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
        <Button
          variant="secondary"
          onClick={() => navigate(courseRoute)}
          className="mt-4"
        >
          Back to Course
        </Button>
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
          <Button
            variant="primary"
            onClick={() => navigate(courseRoute)}
          >
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName="Quiz Submissions">
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', path: dashboardRoute },
            { label: 'Course', path: courseRoute },
            { label: quiz.title }
          ]}
        />

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Quiz Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
          
          <div className="mt-4 flex gap-4 text-sm text-gray-600">
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

        {/* Submissions List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Submissions</h2>
          
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">
                Students haven't submitted this quiz yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const getStatusBadge = (status: QuizSubmissionStatus) => {
                  switch (status) {
                    case 'NOT_STARTED':
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          <span>✓</span>
                          <span>Submitted</span>
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

                return (
                  <div
                    key={submission.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: Student info */}
                      <div className="flex gap-4 flex-1 min-w-0">
                        <span className="text-3xl flex-shrink-0">👤</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{submission.studentName}</h4>
                          <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                          
                          {/* Submission details */}
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                            {submission.submittedAt && (
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                <span>Submitted: {formatDueDate(submission.submittedAt)}</span>
                              </div>
                            )}
                            {submission.grade !== null && (
                              <div className="flex items-center gap-1">
                                <span>📊</span>
                                <span>Grade: {submission.grade}/100</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Status badge */}
                          <div className="mt-2">
                            {getStatusBadge(submission.status)}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex gap-2 ml-4">
                        {submission.status === 'SUBMITTED' || submission.status === 'GRADED' ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                // Navigate to view submission details
                                navigate(buildRoute(ROUTES.TEACHER_QUIZ_SUBMISSION_DETAILS, {
                                  courseId: courseId!,
                                  quizId: quizId!,
                                  submissionId: submission.id
                                }));
                              }}
                            >
                              View Answers
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                // TODO: Navigate to grading page when implemented
                                alert('Grading feature coming soon!');
                              }}
                            >
                              {submission.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                          >
                            Not Submitted
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CourseLayout>
  );
};

export default QuizSubmissions;
