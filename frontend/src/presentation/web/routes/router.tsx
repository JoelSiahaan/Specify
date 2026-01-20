/**
 * Router Configuration
 * 
 * Centralized route configuration using React Router.
 * Separates routing logic from App.tsx for better scalability.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, ProtectedRoute, PublicRoute } from '../components/layout';
import { 
  HomePage, 
  NotFoundPage, 
  LoginPage, 
  RegisterPage, 
  ForbiddenPage,
  StudentDashboard,
  TeacherDashboard
} from '../pages';
import { ROUTES } from '../constants';
import { UserRole } from '../types';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes - redirect authenticated users to dashboard */}
        <Route 
          path={ROUTES.HOME} 
          element={
            <PublicRoute redirectAuthenticated={true}>
              <HomePage />
            </PublicRoute>
          } 
        />
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <PublicRoute redirectAuthenticated={true}>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path={ROUTES.REGISTER} 
          element={
            <PublicRoute redirectAuthenticated={true}>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        
        {/* Student protected routes */}
        <Route
          path={ROUTES.STUDENT_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_COURSES}
          element={
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
              <div className="p-8 text-center">Student Courses - Coming Soon</div>
            </ProtectedRoute>
          }
        />
        
        {/* Teacher protected routes */}
        <Route
          path={ROUTES.TEACHER_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_COURSES}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <div className="p-8 text-center">Teacher Courses - Coming Soon</div>
            </ProtectedRoute>
          }
        />
        
        {/* Error routes */}
        <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Route>
    </Routes>
  );
}
