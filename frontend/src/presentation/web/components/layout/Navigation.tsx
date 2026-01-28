/**
 * Navigation Component
 * 
 * Top navigation bar with role-based links.
 * Follows Moodle-inspired design with primary blue background.
 * 
 * Requirements:
 * - 19.3: Navigation with role-based links
 * - 2.1: Role-based access control
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link
              to={ROUTES.HOME}
              className="text-xl font-semibold hover:text-primary-lighter transition-colors"
            >
              LMS
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {/* Public Links */}
            {!user && (
              <>
                <Link
                  to={ROUTES.HOME}
                  className="hover:text-primary-lighter transition-colors"
                >
                  Home
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="hover:text-primary-lighter transition-colors"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="bg-white text-primary px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            {/* Authenticated Links */}
            {user && (
              <>
                {/* Student Links */}
                {user.role === UserRole.STUDENT && (
                  <>
                    <Link
                      to={ROUTES.STUDENT_DASHBOARD}
                      className="hover:text-primary-lighter transition-colors"
                    >
                      Dashboard
                    </Link>
                  </>
                )}

                {/* Teacher Links */}
                {user.role === UserRole.TEACHER && (
                  <>
                    <Link
                      to={ROUTES.TEACHER_DASHBOARD}
                      className="hover:text-primary-lighter transition-colors"
                    >
                      Dashboard
                    </Link>
                  </>
                )}

                {/* User Menu */}
                <div className="flex items-center gap-4 border-l border-primary-light pl-6">
                  <Link
                    to={ROUTES.PROFILE}
                    className="text-sm hover:text-primary-lighter transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm hover:text-primary-lighter transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
