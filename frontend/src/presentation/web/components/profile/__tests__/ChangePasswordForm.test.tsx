/**
 * ChangePasswordForm Component Tests
 * 
 * Tests for the ChangePasswordForm component including:
 * - Rendering
 * - Password validation
 * - Password strength requirements
 * - Show/hide password toggles
 * - Form submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from '../ChangePasswordForm';

// Mock userService
vi.mock('../../../services', () => ({
  userService: {
    changePassword: vi.fn(),
  },
}));

import { userService } from '../../../services';

describe('ChangePasswordForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all password fields', () => {
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByRole('heading', { name: 'Change Password', level: 2 })).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('should show password strength requirements', () => {
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText(/must be 8\+ characters/i)).toBeInTheDocument();
    });

    it('should disable submit button when fields are empty', () => {
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all fields filled', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      
      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle current password visibility', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
      
      // Find and click the toggle button (eye icon with emoji text)
      const toggleButtons = screen.getAllByRole('button', { name: '👁️‍🗨️' });
      await user.click(toggleButtons[0]);
      
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Password Validation', () => {
    it('should show error when current password is empty', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'Short1!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'Short1!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('should show error when password missing uppercase', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'newpass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should show error when password missing lowercase', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NEWPASS123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NEWPASS123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    it('should show error when password missing number', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPassword!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('should show error when password missing special character', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/must contain at least one special character/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'DifferentPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call changePassword with correct data on valid submission', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      });
      
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(userService.changePassword).toHaveBeenCalledWith({
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      expect(screen.getByText('Changing Password...')).toBeInTheDocument();
    });

    it('should show success message and clear form after successful change', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      });
      
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });
      
      // Form should be cleared
      expect(screen.getByLabelText(/current password/i)).toHaveValue('');
      expect(screen.getByLabelText(/^new password$/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
    });

    it('should call onSuccess after successful change', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      });
      
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'OldPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 4000 });
    });

    it('should show error message on change failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockRejectedValue({
        response: {
          data: {
            message: 'Current password is incorrect',
          },
        },
      });
      
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByLabelText(/current password/i), 'WrongPass123!');
      await user.type(screen.getByLabelText(/^new password$/i), 'NewPass123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass123!');
      await user.click(screen.getByRole('button', { name: /change password/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('should have proper button type', () => {
      render(<ChangePasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
