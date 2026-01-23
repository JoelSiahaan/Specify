/**
 * DashboardLayout Component
 * 
 * Moodle-inspired two-column layout for dashboard pages.
 * Wraps dashboard content with left sidebar navigation.
 * 
 * Structure:
 * - Left: Sidebar (240px, hidden on mobile)
 * - Right: Main content (flexible width)
 */

import React from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar type="dashboard" />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
