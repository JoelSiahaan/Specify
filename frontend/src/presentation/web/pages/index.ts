/**
 * Pages Index
 * 
 * Re-export all page components for easy importing.
 */

// Auth pages
export { LoginPage, RegisterPage } from './auth';

// Dashboard pages
export { HomePage, StudentDashboard, TeacherDashboard } from './dashboard';

// Course pages
export { AssignmentsPage, QuizzesPage, MaterialsPage, SubmissionsPage, GradingPage, StudentGradesPage } from './course';

// Error pages
export { NotFoundPage, ForbiddenPage } from './error';
export { MaintenancePage } from './error/MaintenancePage';
