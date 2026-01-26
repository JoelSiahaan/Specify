/**
 * LoginPage Component Tests
 * 
 * Tests for the LoginPage component including:
 * - Rendering
 * - Form validation
 * - Form submission
 * - Error handling
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../test/test-utils';
import { LoginPage } from '../auth/LoginPage';
import * as authHooks from '../../hooks/useAuth';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: mockClearError,
    });
  });

  describe('Rendering', () => {
    it('should render login form with all fields', () => {
      renderWithRouter(<LoginPage />);
      
      // Check header
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Check submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      
      // Check register link
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument();
    });

    it('should render with correct input types', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const form = emailInput.closest('form')!;
      
      // Remove HTML5 validation to test custom validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when email format is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should clear field error when user types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      
      // Type in email field
      await user.type(emailInput, 'test@example.com');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct data on valid submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to home after successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock loading state
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: true,
        error: null,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<LoginPage />);
      
      // Check loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      
      // Inputs should be disabled
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      
      // Submit button should be disabled
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication error from context', () => {
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: 'Invalid email or password',
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    it('should clear error when user types', async () => {
      const user = userEvent.setup();
      
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: 'Invalid email or password',
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 't');
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should handle validation errors from API', async () => {
      const user = userEvent.setup();
      
      // Mock login to throw validation error
      mockLogin.mockRejectedValue({
        code: 'VALIDATION_FAILED',
        details: {
          email: 'Email is already registered',
        },
      });
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email is already registered')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have link to register page', () => {
      renderWithRouter(<LoginPage />);
      
      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have required attributes on inputs', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/password/i)).toBeRequired();
    });

    it('should have proper button type', () => {
      renderWithRouter(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
