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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Learning Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A modern platform for teachers and students to manage courses, assignments, and learning materials.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" size="lg">
              Login
            </Button>
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button variant="secondary" size="lg">
              Register
            </Button>
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          <p>Built with React 19.2, TypeScript, and Vite</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
