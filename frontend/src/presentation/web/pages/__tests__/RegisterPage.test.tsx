/**
 * RegisterPage Component Tests
 * 
 * Tests for the RegisterPage component including:
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
import { RegisterPage } from '../RegisterPage';
import * as authHooks from '../../hooks/useAuth';
import { UserRole } from '../../types';

// Mock useAuth hook
const mockRegister = vi.fn();
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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: mockClearError,
    });
  });

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      renderWithRouter(<RegisterPage />);
      
      // Check header
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText('Register to get started with the LMS')).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
      
      // Check submit button
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      
      // Check login link
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in here/i })).toBeInTheDocument();
    });

    it('should render with correct input types', () => {
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have Student as default role', () => {
      renderWithRouter(<RegisterPage />);
      
      const roleSelect = screen.getByLabelText(/i am a/i) as HTMLSelectElement;
      expect(roleSelect.value).toBe(UserRole.STUDENT);
    });

    it('should render show password checkbox', () => {
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation to test custom validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when name is too short', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'A');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when email format is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should clear field error when user types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const form = nameInput.closest('form')!;
      
      // Remove HTML5 validation
      form.setAttribute('novalidate', 'true');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Type in name field
      await user.type(nameInput, 'Test User');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Show Password Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const passwordInput = screen.getByLabelText(/^password/i);
      const showPasswordCheckbox = screen.getByLabelText(/show password/i);
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click show password
      await user.click(showPasswordCheckbox);
      
      // Password should be visible
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
      
      // Click again to hide
      await user.click(showPasswordCheckbox);
      
      // Password should be hidden again
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('Role Selection', () => {
    it('should allow selecting Student role', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const roleSelect = screen.getByLabelText(/i am a/i);
      
      await user.selectOptions(roleSelect, UserRole.STUDENT);
      
      expect((roleSelect as HTMLSelectElement).value).toBe(UserRole.STUDENT);
    });

    it('should allow selecting Teacher role', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      
      const roleSelect = screen.getByLabelText(/i am a/i);
      
      await user.selectOptions(roleSelect, UserRole.TEACHER);
      
      expect((roleSelect as HTMLSelectElement).value).toBe(UserRole.TEACHER);
    });
  });

  describe('Form Submission', () => {
    it('should call register with correct data on valid submission', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const roleSelect = screen.getByLabelText(/i am a/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.selectOptions(roleSelect, UserRole.TEACHER);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: UserRole.TEACHER,
        });
      });
    });

    it('should navigate to login page after successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state during submission', async () => {
      // Mock loading state
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: true,
        error: null,
        login: vi.fn(),
        register: mockRegister,
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<RegisterPage />);
      
      // Check loading state
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      
      // Inputs should be disabled
      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password/i)).toBeDisabled();
      expect(screen.getByLabelText(/i am a/i)).toBeDisabled();
      
      // Submit button should be disabled
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication error from context', () => {
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: 'Email is already registered',
        login: vi.fn(),
        register: mockRegister,
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByText('Email is already registered')).toBeInTheDocument();
    });

    it('should clear error when user types', async () => {
      const user = userEvent.setup();
      
      vi.mocked(authHooks.useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: 'Email is already registered',
        login: vi.fn(),
        register: mockRegister,
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        clearError: mockClearError,
      });
      
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'T');
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should handle validation errors from API', async () => {
      const user = userEvent.setup();
      
      // Mock register to throw validation error
      mockRegister.mockRejectedValue({
        code: 'VALIDATION_FAILED',
        details: {
          email: 'Email is already registered',
        },
      });
      
      renderWithRouter(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email is already registered')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have link to login page', () => {
      renderWithRouter(<RegisterPage />);
      
      const loginLink = screen.getByRole('link', { name: /sign in here/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
    });

    it('should have required attributes on inputs', () => {
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByLabelText(/full name/i)).toBeRequired();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/^password/i)).toBeRequired();
      expect(screen.getByLabelText(/i am a/i)).toBeRequired();
    });

    it('should have proper button type', () => {
      renderWithRouter(<RegisterPage />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have helper text for password requirements', () => {
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });
});
