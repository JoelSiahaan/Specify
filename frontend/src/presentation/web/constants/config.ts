/**
 * Application Configuration
 * 
 * Centralized configuration values.
 * Uses environment variables with fallback defaults.
 */

export const CONFIG = {
  // API Configuration
  // In development with Vite proxy, use relative URL (no host)
  // In production, use full URL from environment variable
  API_BASE_URL: import.meta.env.VITE_API_URL || '',
  API_TIMEOUT: 30000, // 30 seconds
  
  // File Upload Configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_FILE_TYPES: {
    DOCUMENTS: ['.pdf', '.docx'] as const,
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif'] as const,
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Session
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // 14 minutes (access token expires in 15 min)
  
  // UI
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
} as const;

/**
 * Get all allowed file extensions
 */
export function getAllowedFileExtensions(): string[] {
  return [
    ...CONFIG.ALLOWED_FILE_TYPES.DOCUMENTS,
    ...CONFIG.ALLOWED_FILE_TYPES.IMAGES,
  ];
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(fileName: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return getAllowedFileExtensions().includes(extension);
}
