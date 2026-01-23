/**
 * Breadcrumb Component
 * 
 * Moodle-inspired breadcrumb navigation for context awareness.
 * Shows hierarchical path: Home > My Courses > Course Name
 * 
 * Features:
 * - Clickable links for parent pages
 * - Current page (no link)
 * - Separator: >
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string; // undefined = current page (no link)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {/* Link or Text */}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                  {item.label}
                </span>
              )}
              
              {/* Separator */}
              {!isLast && (
                <span className="text-gray-400">›</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
