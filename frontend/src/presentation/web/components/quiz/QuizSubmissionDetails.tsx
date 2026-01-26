/**
 * QuizSubmissionDetails Component
 * 
 * Display detailed view of a student's quiz submission.
 * Shows all questions and student's answers.
 * 
 * Requirements:
 * - 14.1: View submitted content (quiz answers)
 * - Display student info and submission details
 * - Show all questions with student answers
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { CourseLayout, Breadcrumb } from '../layout';
import { GradeQuizSubmission } from '../grading';
import { quizService } from '../../services';
import { ROUTES, buildRoute } from '../../constants';
import { formatDueDate } from '../../utils/dateFormatter';
import type { Quiz, QuizSubmission, ApiError } from '../../types';

export const QuizSubmissionDetails: React.FC = () => {
  const { courseId, quizId, submissionId } = useParams<{ 
    courseId: string; 
    quizId: string;
    submissionId: string;
  }>();
  const navigate = useNavigate();

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Routes
  const dashboardRoute = ROUTES.TEACHER_DASHBOARD;
  const courseRoute = buildRoute(ROUTES.TEACHER_COURSE_DETAILS, { courseId: courseId || '' });
  const submissionsRoute = buildRoute(ROUTES.TEACHER_QUIZ_SUBMISSIONS, { 
    courseId: courseId || '', 
    quizId: quizId || '' 
  });

  /**
   * Fetch quiz and submission on mount
   */
  useEffect(() => {
    if (courseId && quizId && submissionId) {
      fetchData();
    }
  }, [courseId, quizId, submissionId]);

  /**
   * Fetch quiz and submission from API
   */
  const fetchData = async () => {
    if (!quizId || !submissionId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch quiz and submission in parallel
      const [quizData, submissionData] = await Promise.all([
        quizService.getQuiz(quizId),
        quizService.getQuizSubmission(submissionId)
      ]);
      
      setQuiz(quizData);
      setSubmission(submissionData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submission details');
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
    fetchData(); // Refresh submission data
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
  if (error && (!quiz || !submission)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage message={error} />
        <Button
          variant="secondary"
          onClick={() => navigate(submissionsRoute)}
          className="mt-4"
        >
          Back to Submissions
        </Button>
      </div>
    );
  }

  // Data not found
  if (!quiz || !submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <span className="text-5xl mb-4 block">❓</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-6">The submission you're looking for doesn't exist.</p>
          <Button
            variant="primary"
            onClick={() => navigate(submissionsRoute)}
          >
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName="Submission Details">
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', path: dashboardRoute },
            { label: 'Course', path: courseRoute },
            { label: quiz.title, path: submissionsRoute },
            { label: 'Submission Details' }
          ]}
        />

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Submission Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">{quiz.title}</h1>
              <p className="text-gray-600">Student Submission</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(submissionsRoute)}
            >
              Back to Submissions
            </Button>
          </div>
          
          {/* Submission Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Submitted:</span>
              <span className="ml-2 font-medium text-gray-900">
                {submission.submittedAt ? formatDueDate(submission.submittedAt) : 'Not submitted'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2">
                {submission.status === 'GRADED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    <span>✓</span>
                    <span>Graded: {submission.grade}/100</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    <span>✓</span>
                    <span>Submitted</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Questions and Answers</h2>
          
          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const studentAnswer = submission.answers.find(a => a.questionIndex === index);
              
              return (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  {/* Question */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-700">{question.questionText}</p>
                  </div>

                  {/* MCQ Options and Answer */}
                  {question.type === 'MCQ' && question.options && (
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isStudentAnswer = studentAnswer?.answer === optionIndex;
                          const isCorrectAnswer = question.correctAnswer === optionIndex;
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded border ${
                                isStudentAnswer && isCorrectAnswer
                                  ? 'bg-green-50 border-green-500'
                                  : isStudentAnswer
                                  ? 'bg-red-50 border-red-500'
                                  : isCorrectAnswer
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-gray-900">{option}</span>
                                {isStudentAnswer && (
                                  <span className="ml-auto text-sm font-semibold">
                                    {isCorrectAnswer ? (
                                      <span className="text-green-700">✓ Student's Answer (Correct)</span>
                                    ) : (
                                      <span className="text-red-700">✗ Student's Answer (Incorrect)</span>
                                    )}
                                  </span>
                                )}
                                {!isStudentAnswer && isCorrectAnswer && (
                                  <span className="ml-auto text-sm font-semibold text-green-700">
                                    ✓ Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Essay Answer */}
                  {question.type === 'ESSAY' && (
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Student's Answer:</p>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {studentAnswer?.answer || '(No answer provided)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Section (if graded) */}
        {submission.status === 'GRADED' && submission.feedback && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-gray-900 whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate(submissionsRoute)}
          >
            Back to Submissions
          </Button>
          {submission.status !== 'GRADED' && (
            <Button
              variant="primary"
              onClick={() => handleGradeClick(submission.id)}
            >
              Grade This Submission
            </Button>
          )}
        </div>

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

export default QuizSubmissionDetails;
