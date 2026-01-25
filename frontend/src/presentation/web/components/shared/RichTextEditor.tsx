/**
 * RichTextEditor Component
 * 
 * Simple rich text editor using textarea with basic formatting support.
 * For initial implementation, uses a textarea. Can be enhanced with libraries like TipTap or React-Quill later.
 * 
 * Features:
 * - Multi-line text input
 * - Character count
 * - Placeholder text
 * - Validation
 * 
 * @example
 * <RichTextEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Enter your submission..."
 *   maxLength={5000}
 * />
 */

import React from 'react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  maxLength = 5000,
  disabled = false,
  className = '',
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className={className}>
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className="w-full p-4 min-h-[200px] max-h-[400px] resize-y focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Text editor"
          aria-invalid={!!error}
          aria-describedby={error ? 'editor-error' : undefined}
        />
        
        {/* Character count */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Plain text editor
          </span>
          <span
            className={`text-xs ${
              isNearLimit ? 'text-yellow-600 font-medium' : 'text-gray-500'
            }`}
          >
            {remainingChars} characters remaining
          </span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <p id="editor-error" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default RichTextEditor;
