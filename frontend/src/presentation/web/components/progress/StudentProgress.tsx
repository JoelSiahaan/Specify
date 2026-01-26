/**
 * StudentProgress Component
 * 
 * Displays student progress for a course including:
 * - All assignments and quizzes with status
 * - Grades and feedback
 * - Overdue items highlighted
 * - Course average
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { useEffect, useState } from 'react';
import { getStudentProgress, type ProgressItem, type TransformedProgressResponse } from '../../services/gradingService';
import { Spinner } from '../shared/Spinner';
import { ErrorMessage } from '../shared/ErrorMessage';

interface StudentProgressProps {
  courseId: string;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({ courseId }) => {
  const [progress, setProgress] = useState<TransformedProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStudentProgress(courseId);
        setProgress(data);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!progress) {
    return <ErrorMessage message="No progress data available" />;
  }

  const { items, averageGrade } = progress;

  // Separate items by type (with null/undefined check)
  const assignments = (items || []).filter(item => item.type === 'ASSIGNMENT');
  const quizzes = (items || []).filter(item => item.type === 'QUIZ');

  const renderProgressItem = (item: ProgressItem) => {
    const isOverdue = item.isOverdue && item.status === 'NOT_SUBMITTED';
    const isLate = item.isLate;
    const isGraded = item.status === 'GRADED';
    const isSubmitted = item.status === 'SUBMITTED';

    return (
      <div
        key={item.id}
        className={`bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
          isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between">
          {/* Left: Icon and info */}
          <div className="flex gap-4 flex-1">
            <span className="text-3xl">
              {item.type === 'ASSIGNMENT' ? '📝' : '❓'}
            </span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Due: {new Date(item.dueDate).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              {/* Status indicator */}
              <div className="mt-2">
                {item.status === 'NOT_SUBMITTED' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    isOverdue 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isOverdue && <span>!</span>}
                    <span>{isOverdue ? 'Overdue' : 'Not Submitted'}</span>
                  </span>
                )}
                {isSubmitted && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    <span>Submitted</span>
                  </span>
                )}
                {isGraded && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    <span>✓</span>
                    <span>Graded</span>
                  </span>
                )}
                {isLate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold ml-2">
                    <span>⚠</span>
                    <span>Late</span>
                  </span>
                )}
              </div>

              {/* Feedback */}
              {item.feedback && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                  <p className="text-sm text-gray-600">{item.feedback}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Grade */}
          {isGraded && item.grade !== undefined && (
            <div className="text-right ml-4">
              <span className={`text-2xl font-bold ${
                item.grade >= 90 ? 'text-green-600' :
                item.grade >= 75 ? 'text-blue-600' :
                item.grade >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {item.grade}
              </span>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Average */}
      {averageGrade !== null && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Course Average</p>
            <p className={`text-5xl font-bold ${
              averageGrade >= 90 ? 'text-green-600' :
              averageGrade >= 75 ? 'text-blue-600' :
              averageGrade >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {averageGrade.toFixed(1)}
            </p>
            <p className="text-lg text-gray-500 mt-1">out of 100</p>
          </div>
        </div>
      )}

      {/* No graded items message */}
      {averageGrade === null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            No graded items yet. Your average will appear here once assignments or quizzes are graded.
          </p>
        </div>
      )}

      {/* Assignments Section */}
      {assignments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Assignments</h3>
          <div className="space-y-3">
            {assignments.map(renderProgressItem)}
          </div>
        </div>
      )}

      {/* Quizzes Section */}
      {quizzes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quizzes</h3>
          <div className="space-y-3">
            {quizzes.map(renderProgressItem)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!items || items.length === 0) && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Yet</h3>
          <p className="text-gray-600">
            This course doesn't have any assignments or quizzes yet.
          </p>
        </div>
      )}
    </div>
  );
};
