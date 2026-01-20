/**
 * ErrorMessage Component
 * 
 * Displays error messages with consistent styling.
 */

import React from 'react';

export interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`border-l-4 border-red-500 bg-red-50 p-4 mb-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl" aria-hidden="true">⚠</span>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
