/**
 * Home Page Component
 * 
 * Landing page for the LMS application.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/shared';
import { ROUTES } from '../constants';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-2xl w-full">
        {/* Responsive Heading: 3xl on mobile, 4xl on tablet, 5xl on desktop */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Learning Management System
        </h1>
        
        {/* Responsive Paragraph: base on mobile, lg on tablet, xl on desktop */}
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 px-4">
          A modern platform for teachers and students to manage courses, assignments, and learning materials.
        </p>
        
        {/* Responsive Button Layout: stacked on mobile, side-by-side on tablet+ */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
          <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
          <Link to={ROUTES.REGISTER} className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Register
            </Button>
          </Link>
        </div>
        
        {/* Footer text */}
        <div className="mt-12 text-xs sm:text-sm text-gray-500">
          <p>Built with React 19.2, TypeScript, and Vite</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
