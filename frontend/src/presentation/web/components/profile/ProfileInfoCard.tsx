/**
 * Profile Info Card Component
 * 
 * Displays user profile information in read-only format.
 * Shows name, email, role, and member since date.
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 2.1: Display profile data
 */

import React from 'react';
import type { UserProfile } from '../../types';
import { formatDate } from '../../utils/dateFormatter';

interface ProfileInfoCardProps {
  profile: UserProfile;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ profile }) => {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
      
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Name
          </label>
          <p className="text-base text-gray-900">{profile.name}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <p className="text-base text-gray-900">{profile.email}</p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Role
          </label>
          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
            profile.role === 'TEACHER' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {profile.role === 'TEACHER' ? 'Teacher' : 'Student'}
          </span>
        </div>

        {/* Member Since */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Member Since
          </label>
          <p className="text-base text-gray-900">{formatDate(profile.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
