/**
 * Public Route Component
 * 
 * Wrapper component for public routes (login, register, homepage).
 * Redirects authenticated users to their dashboard.
 * 
 * This prevents logged-in users from accessing login/register pages.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import { Spinner } from '../shared';
import { UserRole } from '../../types';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean; // If true, redirect authenticated users to dashboard
}

/**
 * Public Route Component
 * 
 * Allows unauthenticated users to access public pages.
 * Optionally redirects authenticated users to their dashboard.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectAuthenticated = false,
}) => {
  const { user, loading } = useAuth();

  console.log('PublicRoute - redirectAuthenticated:', redirectAuthenticated, 'user:', user, 'loading:', loading);

  // If redirectAuthenticated is false (e.g., homepage), show content immediately
  // Don't wait for authentication check to complete
  if (!redirectAuthenticated) {
    return <>{children}</>;
  }

  // For login/register pages, show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If redirectAuthenticated is true and user is logged in, redirect to dashboard
  if (user) {
    if (user.role === UserRole.STUDENT) {
      return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
    } else if (user.role === UserRole.TEACHER) {
      return <Navigate to={ROUTES.TEACHER_DASHBOARD} replace />;
    }
  }

  // User is not authenticated, show public page (login/register)
  return <>{children}</>;
};

export default PublicRoute;
