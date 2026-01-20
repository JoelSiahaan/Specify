/**
 * Teacher Dashboard Component
 * 
 * Placeholder dashboard for teachers.
 * Displays welcome message with user name.
 * 
 * Requirements:
 * - 4.1: Teacher dashboard
 * - 4.2: Display created courses (coming soon)
 * - 4.3: Create course button (coming soon)
 */

import React from 'react';
import { useAuth } from '../hooks';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Teacher Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Your courses, assignments, and grading tools will appear here.
          </p>
          <p className="text-sm text-gray-500">
            This feature is coming soon in Course Management (Feature 3).
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
