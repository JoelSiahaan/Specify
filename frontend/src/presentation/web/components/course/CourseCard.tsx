/**
 * Course Card Component
 * 
 * Displays course information in a card format.
 * Used in student and teacher dashboards.
 * 
 * Requirements:
 * - 3.1: Display enrolled courses
 * - 3.2: Show teacher names
 * - 4.1: Teacher dashboard with enrollment counts
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../types';

interface CourseCardProps {
  course: Course;
  linkTo: string;
  showEnrollmentCount?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  linkTo,
  showEnrollmentCount = false 
}) => {
  return (
    <Link 
      to={linkTo}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Header with status badge */}
      <div className="bg-primary p-4 text-white">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold">{course.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            course.status === 'ACTIVE' 
              ? 'bg-green-500' 
              : 'bg-gray-500'
          }`}>
            {course.status}
          </span>
        </div>
        <p className="text-sm text-blue-100 mt-1">{course.courseCode}</p>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {course.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
        )}
        
        {/* Footer info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          {course.teacherName && (
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>{course.teacherName}</span>
            </div>
          )}
          {showEnrollmentCount && course.enrollmentCount !== undefined && (
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span>{course.enrollmentCount} students</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
