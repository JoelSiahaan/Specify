/**
 * CourseLayout Component
 * 
 * Moodle-inspired two-column layout for course pages.
 * Wraps course content with left sidebar navigation.
 * 
 * Structure:
 * - Left: Course sidebar (240px, hidden on mobile)
 * - Right: Main content (flexible width)
 */

import React from 'react';
import { Sidebar } from './Sidebar';

interface CourseLayoutProps {
  courseId: string;
  courseName: string;
  children: React.ReactNode;
}

export const CourseLayout: React.FC<CourseLayoutProps> = ({ 
  courseId, 
  courseName, 
  children 
}) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar 
        type="course" 
        courseId={courseId} 
        courseName={courseName} 
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
};

export default CourseLayout;
