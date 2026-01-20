/**
 * Main Layout Component
 * 
 * Base layout wrapper for all pages.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

export default MainLayout;
