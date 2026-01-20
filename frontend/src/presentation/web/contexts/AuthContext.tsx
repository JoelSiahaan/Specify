/**
 * Authentication Context
 * 
 * Provides global authentication state and methods to the application.
 * Follows structure.md conventions for React Context usage.
 * 
 * State Management:
 * - user: Current authenticated user (null if not authenticated)
 * - loading: Loading state for auth operations
 * - error: Error message from auth operations
 * 
 * Methods:
 * - login: Authenticate user with email and password
 * - register: Register new user
 * - logout: Clear authentication state
 * - getCurrentUser: Fetch current user from API
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import type { User, LoginRequest, RegisterRequest } from '../types';

/**
 * Authentication context state
 */
interface AuthContextState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * 
 * Wraps the application to provide authentication state and methods.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current user on mount
   * 
   * This runs when the app loads to check if user is already authenticated.
   * If user is not authenticated (401), we silently ignore it - this is expected behavior.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err: any) {
        // User not authenticated - this is expected, not an error
        // Don't set error state, just set user to null
        setUser(null);
        console.log('User not authenticated on mount');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      // Return successfully - component can now redirect
    } catch (err: any) {
      // Map error codes to user-friendly messages
      if (err.code === 'AUTH_INVALID_CREDENTIALS') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      throw err; // Re-throw for component-level handling
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await authService.register(data);
      // After registration, user needs to login
    } catch (err: any) {
      // Map error codes to user-friendly messages
      if (err.code === 'DUPLICATE_ENTRY') {
        setError('An account with this email already exists.');
      } else if (err.code === 'VALIDATION_FAILED') {
        setError('Please check your input and try again.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      throw err; // Re-throw for component-level handling
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      // Logout errors are less critical, just clear local state
      setUser(null);
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user
   */
  const getCurrentUser = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      setUser(null);
      setError('Failed to fetch user information.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextState = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
