/**
 * Student Dashboard Component
 * 
 * Placeholder dashboard for students.
 * Displays welcome message with user name.
 * 
 * Requirements:
 * - 3.1: Student dashboard
 * - 4.1: Display enrolled courses (coming soon)
 */

import React from 'react';
import { useAuth } from '../hooks';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome back, {user?.name}!
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
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Student Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Your enrolled courses and assignments will appear here.
          </p>
          <p className="text-sm text-gray-500">
            This feature is coming soon in Course Management (Feature 3).
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
