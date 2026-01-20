/**
 * Protected Route Component
 * 
 * Wrapper component that requires authentication to access.
 * Redirects to login page if user is not authenticated.
 * 
 * Requirements:
 * - 19.3: Protected routes (authentication required)
 * - 1.3: Authentication required for protected endpoints
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import { Spinner } from '../shared';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Protected Route Component
 * 
 * Protects routes that require authentication.
 * Optionally restricts access to specific roles.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'allowedRoles:', allowedRoles);

  // Show loading spinner while checking authentication
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
