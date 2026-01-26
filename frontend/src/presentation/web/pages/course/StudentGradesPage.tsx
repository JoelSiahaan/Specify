/**
 * StudentGradesPage Component
 * 
 * Student view to see all their grades for assignments and quizzes in a course.
 * Uses the StudentProgress component to display progress and grades.
 * 
 * Features:
 * - List all assignments with grades
 * - List all quizzes with grades
 * - Show feedback from teachers
 * - Calculate course average
 * - Highlight overdue items
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 16.1-16.8
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { CourseLayout } from '../../components/layout';
import { StudentProgress } from '../../components/progress';

export const StudentGradesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  if (!courseId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Course ID is required</p>
        </div>
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId} courseName="">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-1">View your grades, feedback, and course progress</p>
        </div>

        {/* Student Progress Component */}
        <StudentProgress courseId={courseId} />
      </div>
    </CourseLayout>
  );
};

export default StudentGradesPage;

