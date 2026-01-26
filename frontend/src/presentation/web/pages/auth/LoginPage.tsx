/**
 * Login Page Component
 * 
 * User login page with email and password authentication.
 * Follows Moodle-inspired design with centered card layout.
 * 
 * Requirements:
 * - 1.1: User login
 * - 1.2: JWT authentication
 * - 19.2: Form validation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, ErrorMessage, Spinner } from '../../components/shared';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import type { LoginRequest } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, loading, error: authError, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  
  // UI state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear auth error
    if (authError) {
      clearError();
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      // Call login via useAuth hook
      await login(formData);
      
      // Login successful - PublicRoute will handle redirect automatically
      // based on user role in AuthContext
    } catch (err: any) {
      // Handle validation errors
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(err.details);
      }
      // Other errors are handled by AuthContext and displayed via authError
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {authError && <ErrorMessage message={authError} />}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={fieldErrors.email}
              required
              disabled={loading}
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={fieldErrors.password}
              required
              disabled={loading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
