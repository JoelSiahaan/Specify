/**
 * HTML Sanitization Service
 * 
 * Provides server-side HTML sanitization to prevent XSS attacks.
 * Uses sanitize-html library with strict whitelist of allowed tags.
 * 
 * Security Requirement 20.2: XSS Prevention
 * 
 * Applied to:
 * - Course descriptions
 * - Assignment descriptions
 * - Quiz questions and descriptions
 * - Material text content
 * - Submission feedback
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Allowed HTML tags for rich text content
 * 
 * Whitelist approach: Only these tags are allowed, everything else is stripped
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
 */
const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],  // Links with href and target
  '*': ['class'],  // Allow class attribute on all tags for styling
};

/**
 * Allowed URL schemes for links
 * 
 * Prevents javascript: and data: URLs that can execute code
 */
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Sanitization options
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ALLOWED_SCHEMES,
  allowedSchemesByTag: {
    a: ALLOWED_SCHEMES,
  },
  // Disallow iframe, script, style tags
  disallowedTagsMode: 'discard',
  // Enforce target="_blank" and rel="noopener noreferrer" for external links
  transformTags: {
    'a': (_tagName, attribs) => {
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      };
    },
  },
};

/**
 * HTML Sanitizer Service
 * 
 * Provides methods to sanitize HTML content before storage
 */
export class HtmlSanitizer {
  /**
   * Sanitize HTML content
   * 
   * Removes dangerous tags, attributes, and scripts while preserving safe formatting
   * 
   * @param html - Raw HTML content from user input
   * @returns Sanitized HTML safe for storage and rendering
   * 
   * @example
   * ```typescript
   * const sanitizer = new HtmlSanitizer();
   * const clean = sanitizer.sanitize('<p>Hello <script>alert("XSS")</script></p>');
   * // Returns: '<p>Hello </p>'
   * ```
   */
  sanitize(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return sanitizeHtml(html, SANITIZE_OPTIONS);
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
   * const sanitizer = new HtmlSanitizer();
   * const plain = sanitizer.sanitizePlainText('<p>Hello <b>World</b></p>');
   * // Returns: 'Hello World'
   * ```
   */
  sanitizePlainText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  /**
   * Check if content contains dangerous HTML
   * 
   * Returns true if sanitization would modify the content
   * Useful for validation and logging
   * 
   * @param html - HTML content to check
   * @returns True if content contains dangerous HTML
   */
  containsDangerousHtml(html: string): boolean {
    if (!html || typeof html !== 'string') {
      return false;
    }

    const sanitized = this.sanitize(html);
    return html !== sanitized;
  }
}

/**
 * Singleton instance for dependency injection
 */
export const htmlSanitizer = new HtmlSanitizer();
