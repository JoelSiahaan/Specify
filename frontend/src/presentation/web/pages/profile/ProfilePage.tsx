/**
 * Profile Page Component
 * 
 * Main page for user profile management.
 * Displays profile info, edit name form, and change password form.
 * All sections on same page (no modals, no separate pages).
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 1.2: Edit name
 * - 1.3: Change password
 * - 3.1: Full-width layout
 * - 3.2: Inline forms with feedback
 */

import React, { useState, useEffect } from 'react';
import { userService } from '../../services';
import { ProfileInfoCard, EditNameForm, ChangePasswordForm } from '../../components/profile';
import { useAuth } from '../../hooks';
import type { UserProfile } from '../../types';

export const ProfilePage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSave = async (name: string) => {
    const updatedProfile = await userService.updateProfile({ name });
    setProfile(updatedProfile);
    // Update AuthContext so Navigation shows new name immediately
    await getCurrentUser();
  };

  const handlePasswordSuccess = () => {
    // Password changed successfully, no need to refresh profile
    // Session remains valid
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border-2 border-red-500 rounded-lg p-6 bg-red-50 text-center max-w-md">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Profile</h3>
          <p className="text-red-700 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={fetchProfile}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">My Profile</h1>
        
        <div className="space-y-6">
          {/* Profile Info Card */}
          <ProfileInfoCard profile={profile} />

          {/* Edit Name Form */}
          <EditNameForm profile={profile} onSave={handleNameSave} />

          {/* Change Password Form */}
          <ChangePasswordForm onSuccess={handlePasswordSuccess} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
