/**
 * ProfileInfoCard Component Tests
 * 
 * Tests for the ProfileInfoCard component including:
 * - Rendering profile information
 * - Date formatting
 * - Role badge display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileInfoCard } from '../ProfileInfoCard';
import type { UserProfile } from '../../../types';

describe('ProfileInfoCard', () => {
  const mockProfile: UserProfile = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'STUDENT',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  };

  describe('Rendering', () => {
    it('should render profile information correctly', () => {
      render(<ProfileInfoCard profile={mockProfile} />);
      
      // Check header
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      
      // Check name
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Check email
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      
      // Check role
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      
      // Check member since
      expect(screen.getByText('Member Since')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });

    it('should display teacher role correctly', () => {
      const teacherProfile: UserProfile = {
        ...mockProfile,
        role: 'TEACHER',
      };
      
      render(<ProfileInfoCard profile={teacherProfile} />);
      
      expect(screen.getByText('Teacher')).toBeInTheDocument();
    });

    it('should apply correct styling for student role badge', () => {
      render(<ProfileInfoCard profile={mockProfile} />);
      
      const badge = screen.getByText('Student');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply correct styling for teacher role badge', () => {
      const teacherProfile: UserProfile = {
        ...mockProfile,
        role: 'TEACHER',
      };
      
      render(<ProfileInfoCard profile={teacherProfile} />);
      
      const badge = screen.getByText('Teacher');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Date Formatting', () => {
    it('should format member since date correctly', () => {
      render(<ProfileInfoCard profile={mockProfile} />);
      
      // Date should be formatted as "Jan 1, 2025"
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<ProfileInfoCard profile={mockProfile} />);
      
      // Check for labels
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Member Since')).toBeInTheDocument();
    });
  });
});
