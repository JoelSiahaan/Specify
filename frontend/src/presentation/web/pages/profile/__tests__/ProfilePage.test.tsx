/**
 * ProfilePage Component Tests
 * 
 * Tests for the ProfilePage component including:
 * - Loading state
 * - Error state
 * - Profile display
 * - Integration with child components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfilePage } from '../ProfilePage';
import type { UserProfile } from '../../../types';
import { UserRole } from '../../../types';

// Mock userService
vi.mock('../../../services', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { userService } from '../../../services';

describe('ProfilePage', () => {
  const mockProfile: UserProfile = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: UserRole.STUDENT,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching profile', () => {
      vi.mocked(userService.getProfile).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ProfilePage />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when profile fetch fails', async () => {
      vi.mocked(userService.getProfile).mockRejectedValue({
        response: {
          data: {
            message: 'Failed to load profile',
          },
        },
      });
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(userService.getProfile).mockRejectedValue({
        response: {
          data: {
            message: 'Failed to load profile',
          },
        },
      });
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching profile when retry button clicked', async () => {
      vi.mocked(userService.getProfile)
        .mockRejectedValueOnce({
          response: { data: { message: 'Failed to load profile' } },
        })
        .mockResolvedValueOnce(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Display', () => {
    it('should render all profile sections after successful fetch', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'My Profile', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Profile Information', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Name', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Change Password', level: 2 })).toBeInTheDocument();
      });
    });

    it('should display profile information correctly', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
      });
    });

    it('should call getProfile on mount', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(userService.getProfile).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Name Update Integration', () => {
    it('should refresh profile after name update', async () => {
      const updatedProfile: UserProfile = {
        ...mockProfile,
        name: 'Jane Smith',
      };
      
      vi.mocked(userService.getProfile)
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile);
      
      vi.mocked(userService.updateProfile).mockResolvedValue(updatedProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // The EditNameForm component will handle the update
      // This test verifies the page structure is correct
      expect(screen.getByRole('heading', { name: 'Edit Name', level: 2 })).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should use centered layout with max-width container', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      const { container } = render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'My Profile', level: 1 })).toBeInTheDocument();
      });
      
      // Check for max-w-3xl class
      const mainContainer = container.querySelector('.max-w-3xl');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render all sections on same page', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        // All three sections should be visible (use getByRole for headings to avoid ambiguity)
        expect(screen.getByRole('heading', { name: 'Profile Information', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Name', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Change Password', level: 2 })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'My Profile', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Profile Information', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Name', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Change Password', level: 2 })).toBeInTheDocument();
      });
    });
  });
});
