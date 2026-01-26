/**
 * Register Page Component
 * 
 * User registration page with email, password, name, and role selection.
 * Follows Moodle-inspired design with centered card layout.
 * 
 * Requirements:
 * - 1.7: User registration with role selection
 * - 19.2: Form validation
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, ErrorMessage, Spinner } from '../../components/shared';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import type { RegisterRequest } from '../../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login, loading, error: authError, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    name: '',
    role: UserRole.STUDENT, // Default to STUDENT
  });
  
  // UI state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    // Name validation
    if (!formData.name) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Role validation
    if (!formData.role) {
      errors.role = 'Role is required';
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
      // Call register via useAuth hook
      await register(formData);
      
      // After successful registration, automatically login the user
      await login({
        email: formData.email,
        password: formData.password,
      });
      
      // Redirect to dashboard based on role
      // Use setTimeout to ensure user state is updated
      setTimeout(() => {
        if (formData.role === UserRole.STUDENT) {
          navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
        } else if (formData.role === UserRole.TEACHER) {
          navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
        } else {
          // Fallback to home if role is unknown
          navigate(ROUTES.HOME, { replace: true });
        }
      }, 100);
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
              Create Account
            </h1>
            <p className="text-gray-600">
              Register to get started with the LMS
            </p>
          </div>

          {/* Error Message */}
          {authError && <ErrorMessage message={authError} />}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={fieldErrors.name}
              required
              disabled={loading}
            />

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
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password (min. 8 characters)"
              error={fieldErrors.password}
              helperText="Password must be at least 8 characters"
              required
              disabled={loading}
            />

            {/* Show Password Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700">
                Show password
              </label>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block font-medium text-gray-800 mb-2">
                I am a <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading}
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.TEACHER}>Teacher</option>
              </select>
              {fieldErrors.role && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.role}</p>
              )}
            </div>

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
                  <span>Creating account...</span>
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
