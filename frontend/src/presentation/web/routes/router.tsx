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
import { CreateCourse, UpdateCourse, CourseDetails, ManageCourse, CourseList } from '../components/course';
import { TakeQuiz, QuizResults, QuizSubmissions, QuizSubmissionDetails } from '../components/quiz';
import { ROUTES } from '../constants';
import { UserRole } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
/**
 * Wrapper component for UpdateCourse that extracts courseId from URL params
 */
function UpdateCourseWrapper() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  if (!courseId) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <UpdateCourse
      courseId={courseId}
      onSuccess={() => navigate(ROUTES.TEACHER_DASHBOARD)}
      onCancel={() => navigate(ROUTES.TEACHER_DASHBOARD)}
    />
  );
}

/**
 * Wrapper component for TakeQuiz that extracts params from URL
 */
function TakeQuizWrapper() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();

  if (!courseId || !quizId) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return <TakeQuiz courseId={courseId} quizId={quizId} />;
}

/**
 * Wrapper component for QuizResults that extracts params from URL
 */
function QuizResultsWrapper() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();

  if (!courseId || !quizId) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return <QuizResults courseId={courseId} quizId={quizId} />;
}

/**
 * Wrapper component for QuizSubmissionDetails that validates params
 */
function QuizSubmissionDetailsWrapper() {
  const { courseId, quizId, submissionId } = useParams<{ 
    courseId: string; 
    quizId: string; 
    submissionId: string;
  }>();

  if (!courseId || !quizId || !submissionId) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  // Component uses useParams internally, no need to pass props
  return <QuizSubmissionDetails />;
}

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
              <CourseList />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_COURSE_DETAILS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_QUIZ_TAKE}
          element={
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
              <TakeQuizWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENT_QUIZ_RESULTS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
              <QuizResultsWrapper />
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
          path={ROUTES.TEACHER_CREATE_COURSE}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_EDIT_COURSE}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <UpdateCourseWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_COURSE_DETAILS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_MANAGE_COURSE}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <ManageCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_QUIZ_SUBMISSIONS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <QuizSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TEACHER_QUIZ_SUBMISSION_DETAILS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <QuizSubmissionDetailsWrapper />
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
