/**
 * SubmitAssignment Component Usage Example
 * 
 * This file demonstrates how to use the SubmitAssignment component.
 * This is for documentation purposes only and is not part of the application.
 */

import React from 'react';
import { SubmitAssignment } from './SubmitAssignment';
import type { Submission } from '../../types';

/**
 * Example 1: Basic usage with success callback
 */
export const BasicExample: React.FC = () => {
  const handleSubmitSuccess = (submission: Submission) => {
    console.log('Assignment submitted successfully:', submission);
    // Navigate to submission confirmation page or show success message
  };

  return (
    <SubmitAssignment
      assignmentId="assignment-123"
      onSubmitSuccess={handleSubmitSuccess}
    />
  );
};

/**
 * Example 2: With cancel callback (e.g., in a modal)
 */
export const WithCancelExample: React.FC = () => {
  const handleSubmitSuccess = (submission: Submission) => {
    console.log('Assignment submitted successfully:', submission);
    // Close modal and refresh assignment list
  };

  const handleCancel = () => {
    console.log('Submission cancelled');
    // Close modal without submitting
  };

  return (
    <SubmitAssignment
      assignmentId="assignment-123"
      onSubmitSuccess={handleSubmitSuccess}
      onCancel={handleCancel}
    />
  );
};

/**
 * Example 3: In a route component
 */
export const RouteExample: React.FC = () => {
  const assignmentId = 'assignment-123'; // Get from route params
  
  const handleSubmitSuccess = (submission: Submission) => {
    // Navigate to assignment details page
    window.location.href = `/assignments/${assignmentId}`;
  };

  const handleCancel = () => {
    // Navigate back to assignment list
    window.location.href = `/courses/course-123/assignments`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SubmitAssignment
        assignmentId={assignmentId}
        onSubmitSuccess={handleSubmitSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

/**
 * Features Demonstrated:
 * 
 * 1. File Upload with Progress Indicator
 *    - Drag and drop support
 *    - File type validation
 *    - File size validation (10MB max)
 *    - Upload progress tracking
 * 
 * 2. Rich Text Editor for Text Submissions
 *    - Multi-line text input
 *    - Character count (5000 max)
 *    - Validation
 * 
 * 3. Display Submission Status
 *    - Shows assignment details
 *    - Shows due date
 *    - Shows submission type requirements
 * 
 * 4. Show Late Submission Warning
 *    - Displays warning when past due date
 *    - Indicates submission will be marked as late
 * 
 * 5. Handle Closed Assignment Errors
 *    - Shows error when assignment is closed
 *    - Prevents submission after grading starts
 * 
 * 6. Support for Different Submission Types
 *    - FILE: File upload only
 *    - TEXT: Text submission only
 *    - BOTH: File upload and/or text submission
 * 
 * Requirements Covered:
 * - 10.1: File upload support
 * - 10.2: Text submission support
 * - 10.3: Both file and text support
 * - 10.4: Validation for required content
 * - 10.5: File format validation
 * - 10.6: Submission timestamp recording
 * - 10.7: Accept submission before due date
 * - 10.8: Accept late submission with marker
 * - 10.9: Reject submission after grading starts
 * - 10.12: View own submissions
 */
