/**
 * GradingPage Component
 * 
 * Teacher view to see all assignments and quizzes in a course for grading.
 * Provides quick access to submissions that need grading.
 * 
 * Features:
 * - List all assignments with submission counts
 * - List all quizzes with submission counts
 * - Quick navigation to grade submissions
 * - Filter by grading status
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseLayout } from '../../components/layout';
import { Button, Spinner, ErrorMessage } from '../../components/shared';
import * as assignmentService from '../../services/assignmentService';
import * as quizService from '../../services/quizService';
import { formatDueDate } from '../../utils/dateFormatter';
import type { Assignment, Quiz, ApiError } from '../../types';

interface AssignmentWithStats extends Assignment {
  submittedCount: number;
  gradedCount: number;
  notSubmittedCount: number;
}

interface QuizWithStats extends Quiz {
  submittedCount: number;
  gradedCount: number;
  notSubmittedCount: number;
}

export const GradingPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  // State
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes'>('assignments');

  // Fetch assignments and quizzes
  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignments
      const assignmentsData = await assignmentService.listAssignments(courseId);
      const assignmentsList = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData?.data || []);
      
      // Fetch submission stats for each assignment
      const assignmentsWithStats = await Promise.all(
        assignmentsList.map(async (assignment) => {
          try {
            const submissions = await assignmentService.listSubmissions(assignment.id);
            const submissionsList = Array.isArray(submissions) ? submissions : (submissions?.data || []);
            const submittedCount = submissionsList.filter(s => 
              s.status === 'SUBMITTED' || s.status === 'GRADED'
            ).length;
            const gradedCount = submissionsList.filter(s => s.status === 'GRADED').length;
            const notSubmittedCount = submissionsList.filter(s => s.status === 'NOT_SUBMITTED').length;
            
            return {
              ...assignment,
              submittedCount,
              gradedCount,
              notSubmittedCount
            };
          } catch {
            return {
              ...assignment,
              submittedCount: 0,
              gradedCount: 0,
              notSubmittedCount: 0
            };
          }
        })
      );
      
      setAssignments(assignmentsWithStats);
      
      // Fetch quizzes
      const quizzesData = await quizService.listQuizzes(courseId);
      const quizzesList = (Array.isArray(quizzesData) ? quizzesData : ((quizzesData as { data?: unknown[] })?.data || [])) as Quiz[];
      
      // Fetch submission stats for each quiz
      const quizzesWithStats: QuizWithStats[] = await Promise.all(
        quizzesList.map(async (quiz) => {
          try {
            const submissions = await quizService.listQuizSubmissions(quiz.id);
            const submissionsList = (Array.isArray(submissions) ? submissions : ((submissions as { data?: { status: string }[] })?.data || [])) as { status: string }[];
            const submittedCount = submissionsList.filter((s) => 
              s.status === 'SUBMITTED' || s.status === 'GRADED'
            ).length;
            const gradedCount = submissionsList.filter((s) => s.status === 'GRADED').length;
            const notSubmittedCount = submissionsList.filter((s) => s.status === 'NOT_STARTED').length;
            
            return {
              ...quiz,
              submittedCount,
              gradedCount,
              notSubmittedCount
            };
          } catch {
            return {
              ...quiz,
              submittedCount: 0,
              gradedCount: 0,
              notSubmittedCount: 0
            };
          }
        })
      );
      
      setQuizzes(quizzesWithStats);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load grading data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get pending count (submitted but not graded)
   */
  const getPendingCount = (item: AssignmentWithStats | QuizWithStats) => {
    return item.submittedCount - item.gradedCount;
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
  if (error) {
    return (
      <CourseLayout courseId={courseId!} courseName="">
        <div className="p-6">
          <ErrorMessage message={error} />
        </div>
      </CourseLayout>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName="">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Grading</h1>
          <p className="text-gray-600 mt-1">Review and grade student submissions</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quizzes ({quizzes.length})
            </button>
          </div>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <>
            {assignments.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                <span className="text-6xl mb-4 block">📝</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments</h3>
                <p className="text-gray-600">Create assignments to start grading submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const pendingCount = getPendingCount(assignment);
                  
                  return (
                    <div
                      key={assignment.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left: Assignment info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Due: {formatDueDate(assignment.dueDate)}
                          </p>
                          
                          {/* Statistics */}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">Submitted: </span>
                              <span className="font-semibold text-gray-900">
                                {assignment.submittedCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Graded: </span>
                              <span className="font-semibold text-green-600">
                                {assignment.gradedCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Pending: </span>
                              <span className="font-semibold text-yellow-600">
                                {pendingCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Action button */}
                        <div>
                          <Button
                            variant="primary"
                            onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}/submissions`)}
                          >
                            View Submissions
                          </Button>
                          {pendingCount > 0 && (
                            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <>
            {quizzes.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                <span className="text-6xl mb-4 block">❓</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes</h3>
                <p className="text-gray-600">Create quizzes to start grading submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => {
                  const pendingCount = getPendingCount(quiz);
                  
                  return (
                    <div
                      key={quiz.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left: Quiz info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {quiz.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Due: {formatDueDate(quiz.dueDate)} • Time Limit: {quiz.timeLimit} minutes
                          </p>
                          
                          {/* Statistics */}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">Submitted: </span>
                              <span className="font-semibold text-gray-900">
                                {quiz.submittedCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Graded: </span>
                              <span className="font-semibold text-green-600">
                                {quiz.gradedCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Pending: </span>
                              <span className="font-semibold text-yellow-600">
                                {pendingCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Action button */}
                        <div>
                          <Button
                            variant="primary"
                            onClick={() => navigate(`/teacher/courses/${courseId}/quizzes/${quiz.id}/submissions`)}
                          >
                            View Submissions
                          </Button>
                          {pendingCount > 0 && (
                            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </CourseLayout>
  );
};

export default GradingPage;
