/**
 * Input Component
 * 
 * Reusable input component with label and error handling.
 */

import React from 'react';

export interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'url';
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  maxLength,
}) => {
  const inputClasses = `w-full h-10 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-primary'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block font-medium text-gray-800 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={inputClasses}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-600 mt-1">{helperText}</p>}
    </div>
  );
};

export default Input;
