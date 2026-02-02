/**
 * HTML Sanitization Utility (Client-Side)
 * 
 * Provides client-side HTML sanitization using DOMPurify to prevent XSS attacks.
 * This is a defense-in-depth measure - server-side sanitization is the primary defense.
 * 
 * Security Requirement 20.2: XSS Prevention
 * 
 * Applied to:
 * - Course descriptions (before rendering)
 * - Assignment descriptions (before rendering)
 * - Quiz questions (before rendering)
 * - Material text content (before rendering)
 * - Submission feedback (before rendering)
 */

import DOMPurify from 'dompurify';

/**
 * Allowed HTML tags for rich text content
 * 
 * Whitelist approach: Only these tags are allowed, everything else is stripped
 * Must match server-side whitelist for consistency
 */
const ALLOWED_TAGS = [
  'p',        // Paragraphs
  'br',       // Line breaks
  'strong',   // Bold text
  'b',        // Bold text (alternative)
  'em',       // Italic text
  'i',        // Italic text (alternative)
  'u',        // Underline
  'ul',       // Unordered lists
  'ol',       // Ordered lists
  'li',       // List items
  'a',        // Links
  'h1', 'h2', 'h3', // Headings
  'code',     // Inline code
  'pre',      // Code blocks
];

/**
 * Allowed HTML attributes per tag
 * 
 * Whitelist approach: Only these attributes are allowed
 * Must match server-side whitelist for consistency
 */
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class'];

/**
 * DOMPurify configuration
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,  // Disallow data-* attributes
  ALLOW_UNKNOWN_PROTOCOLS: false,  // Only allow http, https, mailto
  SAFE_FOR_TEMPLATES: true,  // Remove template tags
} as const;

/**
 * Sanitize HTML content before rendering
 * 
 * Removes dangerous tags, attributes, and scripts while preserving safe formatting
 * 
 * @param html - Raw HTML content from server
 * @returns Sanitized HTML safe for rendering
 * 
 * @example
 * ```typescript
 * const clean = sanitizeHtml('<p>Hello <script>alert("XSS")</script></p>');
 * // Returns: '<p>Hello </p>'
 * 
 * // Use with dangerouslySetInnerHTML
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, PURIFY_CONFIG) as string;
}

/**
 * Sanitize plain text (no HTML allowed)
 * 
 * Strips all HTML tags and returns plain text only
 * Use for fields that should not contain any HTML
 * 
 * @param text - Text that may contain HTML
 * @returns Plain text with all HTML removed
 * 
 * @example
 * ```typescript
 * const plain = sanitizePlainText('<p>Hello <b>World</b></p>');
 * // Returns: 'Hello World'
 * ```
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Check if content contains HTML tags
 * 
 * Returns true if the content contains any HTML tags
 * Useful for conditional rendering
 * 
 * @param content - Content to check
 * @returns True if content contains HTML tags
 */
export function containsHtml(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check for HTML tags using regex
  const htmlTagPattern = /<[^>]+>/;
  return htmlTagPattern.test(content);
}

/**
 * Render sanitized HTML in React component
 * 
 * Helper function to safely render HTML content in React
 * 
 * @param html - HTML content to render
 * @returns Object for dangerouslySetInnerHTML prop
 * 
 * @example
 * ```typescript
 * <div {...renderSanitizedHtml(content)} />
 * ```
 */
export function renderSanitizedHtml(html: string): { dangerouslySetInnerHTML: { __html: string } } {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHtml(html),
    },
  };
}
