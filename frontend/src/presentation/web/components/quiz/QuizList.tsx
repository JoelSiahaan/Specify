/**
 * QuizList Component
 * 
 * Display list of quizzes for a course with status, time remaining, and overdue indicators.
 * Shows quiz details, due dates, and provides actions for teachers and students.
 * 
 * Requirements:
 * - 11.9: List quizzes for a course
 * - Display quiz status (upcoming, overdue)
 * - Show time remaining until due date
 * - Highlight overdue items
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ErrorMessage } from '../shared';
import { UpdateQuiz } from './UpdateQuiz';
import { quizService } from '../../services';
import { useAuth } from '../../hooks';
import { formatDueDate, isPastDate } from '../../utils/dateFormatter';
import { ROUTES, buildRoute } from '../../constants';
import type { QuizListItem, ApiError } from '../../types';
import { UserRole } from '../../types';

interface QuizListProps {
  quizzes: QuizListItem[];
  courseId: string;
  courseStatus?: 'ACTIVE' | 'ARCHIVED';
  onRefetch: () => void;
}

/**
 * Calculate time remaining until due date
 */
const getTimeRemaining = (dueDate: string): string => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return 'Overdue';
  }
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} remaining`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} remaining`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} remaining`;
  } else {
    return 'Less than 1 minute remaining';
  }
};

export const QuizList: React.FC<QuizListProps> = ({ quizzes, courseId, courseStatus = 'ACTIVE', onRefetch }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Check if user is teacher
  const isTeacher = user?.role === UserRole.TEACHER;
  
  // Check if course is archived (read-only)
  const isArchived = courseStatus === 'ARCHIVED';
  
  /**
   * Handle quiz delete
   */
  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(quizId);
      setError(null);
      await quizService.deleteQuiz(quizId);
      
      // Refetch quizzes from parent
      onRefetch();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle edit quiz
   */
  const handleEdit = (quizId: string) => {
    setEditingQuizId(quizId);
  };

  /**
   * Handle update success
   */
  const handleUpdateSuccess = () => {
    // Refetch quizzes from parent
    onRefetch();
    
    // Close edit modal
    setEditingQuizId(null);
  };

  /**
   * Handle update cancel
   */
  const handleUpdateCancel = () => {
    setEditingQuizId(null);
  };

  /**
   * Handle take quiz (student)
   */
  const handleTakeQuiz = (quizId: string) => {
    // Navigate to quiz taking page using proper route
    const route = isTeacher 
      ? buildRoute(ROUTES.TEACHER_COURSE_DETAILS, { courseId })
      : buildRoute(ROUTES.STUDENT_QUIZ_TAKE, { courseId, quizId });
    navigate(route);
  };

  /**
   * Handle view submissions (teacher)
   */
  const handleViewSubmissions = (quizId: string) => {
    // Navigate to submissions page using proper route
    const route = buildRoute(ROUTES.TEACHER_QUIZ_SUBMISSIONS, { courseId, quizId });
    navigate(route);
  };

  // Empty state
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">❓</span>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes</h3>
        <p className="text-gray-600 mb-6">This course doesn't have any quizzes yet.</p>
      </div>
    );
  }

  // Quiz list
  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Edit Quiz Modal */}
      {editingQuizId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UpdateQuiz
              quizId={editingQuizId}
              onSuccess={handleUpdateSuccess}
              onCancel={handleUpdateCancel}
            />
          </div>
        </div>
      )}

      {/* Quizzes */}
      {quizzes.map((quiz) => {
        const isOverdue = isPastDate(quiz.dueDate);
        const timeRemaining = getTimeRemaining(quiz.dueDate);
        const hasSubmitted = quiz.hasSubmission === true;
        const isGraded = quiz.isGraded === true;
        
        return (
          <div
            key={quiz.id}
            className={`bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
              isOverdue ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Left: Icon and info */}
              <div className="flex gap-4 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0">❓</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 break-words">{quiz.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{quiz.description}</p>
                  
                  {/* Quiz details */}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>Time limit: {quiz.timeLimit} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📝</span>
                      <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  {/* Close time and time remaining */}
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Available until: {formatDueDate(quiz.dueDate)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                          <span>!</span>
                          <span>Closed</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          timeRemaining.includes('hour') || timeRemaining.includes('minute')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <span>⏰</span>
                          <span>{timeRemaining}</span>
                        </span>
                      )}
                      
                      {/* Student submission status */}
                      {!isTeacher && hasSubmitted && (
                        <>
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              <span>✓</span>
                              <span>Graded: {quiz.grade}/100</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              <span>✓</span>
                              <span>Submitted</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-2 ml-4">
                {/* Student actions */}
                {!isTeacher && !isArchived && (
                  <>
                    {hasSubmitted ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                      >
                        {isGraded ? 'Completed' : 'Submitted'}
                      </Button>
                    ) : isOverdue ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                      >
                        Closed
                      </Button>
                    ) : quiz.hasStarted ? (
                      // Quiz started but not submitted - show Resume button
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTakeQuiz(quiz.id)}
                      >
                        Resume Quiz
                      </Button>
                    ) : (
                      // Quiz not started - show Take Quiz button
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTakeQuiz(quiz.id)}
                      >
                        Take Quiz
                      </Button>
                    )}
                  </>
                )}

                {/* Teacher actions */}
                {isTeacher && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewSubmissions(quiz.id)}
                    >
                      Submissions
                    </Button>
                    
                    {!isArchived && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(quiz.id)}
                          disabled={isOverdue}
                        >
                          {isOverdue ? 'Cannot Edit (Overdue)' : 'Edit'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(quiz.id)}
                          disabled={deletingId === quiz.id}
                        >
                          {deletingId === quiz.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuizList;
