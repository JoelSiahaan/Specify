/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Follows structure.md conventions for custom hooks.
 * 
 * Usage:
 * ```tsx
 * const { user, loading, error, login, logout } = useAuth();
 * ```
 * 
 * Throws error if used outside AuthProvider.
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * useAuth hook
 * 
 * Provides access to authentication state and methods.
 * Must be used within AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
