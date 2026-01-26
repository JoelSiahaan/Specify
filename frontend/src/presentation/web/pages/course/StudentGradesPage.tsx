/**
 * StudentGradesPage Component
 * 
 * Student view to see all their grades for assignments and quizzes in a course.
 * 
 * Features:
 * - List all assignments with grades
 * - List all quizzes with grades
 * - Show feedback from teachers
 * - Calculate course average
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CourseLayout } from '../../components/layout';
import { Spinner, ErrorMessage } from '../../components/shared';
import * as assignmentService from '../../services/assignmentService';
import * as quizService from '../../services/quizService';
import { formatDueDate } from '../../utils/dateFormatter';
import type { ApiError } from '../../types';

interface GradeItem {
  id: string;
  title: string;
  type: 'assignment' | 'quiz';
  dueDate: string;
  grade?: number;
  maxGrade: number;
  feedback?: string;
  status: string;
  isLate: boolean;
}

export const StudentGradesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  // State
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'quizzes'>('all');

  // Fetch grades
  useEffect(() => {
    if (courseId) {
      fetchGrades();
    }
  }, [courseId]);

  const fetchGrades = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignments with grades
      const assignmentsData = await assignmentService.listAssignments(courseId);
      const assignmentsList = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData?.data || []);
      const assignmentGrades: GradeItem[] = assignmentsList.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        type: 'assignment' as const,
        dueDate: assignment.dueDate,
        grade: assignment.grade,
        maxGrade: 100,
        feedback: assignment.feedback,
        status: assignment.status || 'NOT_SUBMITTED',
        isLate: assignment.isLate || false
      }));
      
      // Fetch quizzes with grades
      const quizzesData = await quizService.listQuizzes(courseId);
      const quizzesList = Array.isArray(quizzesData) ? quizzesData : (quizzesData?.data || []);
      const quizGrades: GradeItem[] = quizzesList.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        type: 'quiz' as const,
        dueDate: quiz.dueDate,
        grade: quiz.grade,
        maxGrade: 100,
        feedback: quiz.feedback,
        status: quiz.status || 'NOT_SUBMITTED',
        isLate: false
      }));
      
      // Combine and sort by due date
      const allGrades = [...assignmentGrades, ...quizGrades].sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setGrades(allGrades);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate course average
   */
  const calculateAverage = (items: GradeItem[]) => {
    const gradedItems = items.filter(item => item.grade !== undefined && item.grade !== null);
    if (gradedItems.length === 0) return null;
    
    const sum = gradedItems.reduce((acc, item) => acc + (item.grade || 0), 0);
    return Math.round(sum / gradedItems.length);
  };

  /**
   * Filter grades by tab
   */
  const filteredGrades = activeTab === 'all' 
    ? grades 
    : grades.filter(g => g.type === activeTab.slice(0, -1)); // Remove 's' from 'assignments'/'quizzes'

  const average = calculateAverage(filteredGrades);
  const gradedCount = filteredGrades.filter(g => g.grade !== undefined).length;

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
          <h1 className="text-3xl font-semibold text-gray-900">My Grades</h1>
          <p className="text-gray-600 mt-1">View your grades and feedback</p>
        </div>

        {/* Course Average */}
        {average !== null && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Course Average</p>
              <p className="text-5xl font-bold text-primary">{average}</p>
              <p className="text-lg text-gray-500 mt-1">out of 100</p>
              <p className="text-sm text-gray-500 mt-2">
                Based on {gradedCount} graded {gradedCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({grades.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments ({grades.filter(g => g.type === 'assignment').length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quizzes ({grades.filter(g => g.type === 'quiz').length})
            </button>
          </div>
        </div>

        {/* Grades List */}
        {filteredGrades.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Grades Yet</h3>
            <p className="text-gray-600">Your grades will appear here once graded by your teacher.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGrades.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Item info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.type === 'assignment' ? '📝' : '❓'}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Due: {formatDueDate(item.dueDate)}
                    </p>
                    
                    {/* Status */}
                    {item.status === 'NOT_SUBMITTED' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        Not Submitted
                      </span>
                    )}
                    {item.status === 'SUBMITTED' && !item.grade && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        Pending Grade
                      </span>
                    )}
                    {item.isLate && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold ml-2">
                        <span>⚠</span>
                        <span>Late</span>
                      </span>
                    )}
                    
                    {/* Feedback */}
                    {item.feedback && (
                      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Teacher Feedback:</p>
                        <p className="text-sm text-gray-600">{item.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Grade */}
                  <div className="text-right ml-6">
                    {item.grade !== undefined && item.grade !== null ? (
                      <>
                        <span className={`text-3xl font-bold ${
                          item.grade >= 90 ? 'text-green-600' :
                          item.grade >= 75 ? 'text-blue-600' :
                          item.grade >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.grade}
                        </span>
                        <p className="text-xs text-gray-500">/ {item.maxGrade}</p>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Not graded</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CourseLayout>
  );
};

export default StudentGradesPage;
