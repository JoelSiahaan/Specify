/**
 * Main Layout Component
 * 
 * Base layout wrapper for all pages with navigation bar.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Outlet />
    </div>
  );
};

export default MainLayout;
