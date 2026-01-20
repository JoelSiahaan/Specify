/**
 * App Component
 * 
 * Root application component with React Router configuration.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './presentation/web/components/layout';
import { HomePage, NotFoundPage } from './presentation/web/pages';
import { ROUTES } from './presentation/web/constants';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public routes */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          
          {/* Placeholder routes for authentication (will be implemented in task 2.5) */}
          <Route path={ROUTES.LOGIN} element={<div className="p-8 text-center">Login Page - Coming Soon</div>} />
          <Route path={ROUTES.REGISTER} element={<div className="p-8 text-center">Register Page - Coming Soon</div>} />
          
          {/* Error routes */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
