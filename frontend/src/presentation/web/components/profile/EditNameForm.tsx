/**
 * Edit Name Form Component
 * 
 * Inline form for editing user's name.
 * Validates name length (1-100 chars after trim).
 * 
 * Requirements:
 * - 1.2: Edit name
 * - 2.2: Name validation (1-100 chars)
 * - 3.2: Inline form with feedback
 */

import React, { useState } from 'react';
import type { UserProfile } from '../../types';

interface EditNameFormProps {
  profile: UserProfile;
  onSave: (name: string) => Promise<void>;
}

export const EditNameForm: React.FC<EditNameFormProps> = ({ profile, onSave }) => {
  const [name, setName] = useState(profile.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    const trimmedName = (name || '').trim();
    if (trimmedName.length === 0) {
      setError('Name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less');
      return;
    }

    setLoading(true);
    try {
      await onSave(trimmedName);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      // Error from api.ts interceptor has structure: { code, message, details, status }
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Edit Name</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block font-medium text-gray-800 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-10 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
            maxLength={100}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 mt-1">Name updated successfully!</p>
          )}
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            disabled={loading || (name || '').trim() === (profile.name || '')}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Name'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditNameForm;
