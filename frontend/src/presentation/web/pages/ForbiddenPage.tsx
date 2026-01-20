/**
 * Forbidden Page Component
 * 
 * 403 Forbidden error page.
 * Displayed when user tries to access a resource they don't have permission for.
 * 
 * Requirements:
 * - 19.3: Handle 403 Forbidden
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuth } from '../hooks';
import { UserRole } from '../types';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();

  // Determine home route based on user role
  const homeRoute = user
    ? user.role === UserRole.STUDENT
      ? ROUTES.STUDENT_DASHBOARD
      : ROUTES.TEACHER_DASHBOARD
    : ROUTES.HOME;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-4">🚫</div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            to={homeRoute}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
