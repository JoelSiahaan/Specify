/**
 * Test Setup Verification
 * 
 * Verifies that the testing framework is properly configured.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mockUser, mockTeacher, mockCourse } from '../test-utils';

// Simple test component
function TestComponent() {
  return <div>Test Component</div>;
}

describe('Testing Framework Setup', () => {
  describe('Vitest Configuration', () => {
    it('should run basic test', () => {
      expect(true).toBe(true);
    });

    it('should support async tests', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });

    it('should have access to environment variables', () => {
      // Environment variables are available in Vite
      expect(import.meta.env).toBeDefined();
    });
  });

  describe('React Testing Library Integration', () => {
    it('should render components', () => {
      render(<TestComponent />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should support queries', () => {
      render(<TestComponent />);
      const element = screen.getByText('Test Component');
      expect(element).toBeTruthy();
    });
  });

  describe('Test Utilities', () => {
    it('should have mock data available', () => {
      expect(mockUser).toBeDefined();
      expect(mockUser.role).toBe('STUDENT');
      
      expect(mockTeacher).toBeDefined();
      expect(mockTeacher.role).toBe('TEACHER');
      
      expect(mockCourse).toBeDefined();
      expect(mockCourse.status).toBe('ACTIVE');
    });
  });
});
