/**
 * Maintenance Page Component
 * 
 * Displays maintenance message when system is undergoing maintenance.
 * Requirements: 21.4 - Maintenance mode support
 */

import React from 'react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <span className="text-8xl">🔧</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          System Maintenance
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-6">
          We're currently performing scheduled maintenance to improve your experience.
        </p>

        <p className="text-gray-600 mb-8">
          We'll be back shortly. Thank you for your patience!
        </p>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Need urgent assistance?</strong>
            <br />
            Please contact support at{' '}
            <a 
              href="mailto:support@lms.example.com" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              support@lms.example.com
            </a>
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded transition-colors duration-150"
        >
          Check Again
        </button>

        {/* Timestamp */}
        <p className="text-sm text-gray-500 mt-6">
          Last checked: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
