/**
 * Unit Tests for HTML Sanitizer (Client-Side)
 * 
 * Tests XSS prevention and HTML sanitization using DOMPurify
 * Security Requirement 20.2
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizePlainText, containsHtml, renderSanitizedHtml } from '../htmlSanitizer';

describe('htmlSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(html);
      
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove script tags (XSS prevention)', () => {
      const html = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove onclick attributes (XSS prevention)', () => {
      const html = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).toContain('Click me');
    });

    it('should remove onerror attributes (XSS prevention)', () => {
      const html = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: URLs (XSS prevention)', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should allow safe links with http/https', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(html);
      
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Link');
    });

    it('should allow lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(html);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should allow headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = sanitizeHtml(html);
      
      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
      expect(result).toContain('<h3>');
    });

    it('should allow code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = sanitizeHtml(html);
      
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('should remove iframe tags', () => {
      const html = '<p>Text</p><iframe src="https://evil.com"></iframe>';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
      expect(result).toContain('Text');
    });

    it('should remove style tags', () => {
      const html = '<p>Text</p><style>body { display: none; }</style>';
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('display: none');
      expect(result).toContain('Text');
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const text = 'Just plain text';
      const result = sanitizeHtml(text);
      
      expect(result).toBe('Just plain text');
    });

    it('should handle complex XSS attempt', () => {
      const html = `
        <p>Normal text</p>
        <img src=x onerror="alert('XSS')">
        <script>document.cookie</script>
        <a href="javascript:void(0)">Click</a>
        <div onclick="malicious()">Div</div>
      `;
      const result = sanitizeHtml(html);
      
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('malicious');
      expect(result).toContain('Normal text');
    });
  });

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizePlainText(html);
      
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
    });

    it('should remove script tags and content', () => {
      const html = 'Text<script>alert("XSS")</script>More';
      const result = sanitizePlainText(html);
      
      expect(result).toBe('TextMore');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should handle plain text', () => {
      const text = 'Just plain text';
      const result = sanitizePlainText(text);
      
      expect(result).toBe('Just plain text');
    });

    it('should handle empty string', () => {
      const result = sanitizePlainText('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizePlainText(null as any)).toBe('');
      expect(sanitizePlainText(undefined as any)).toBe('');
    });
  });

  describe('containsHtml', () => {
    it('should return true for HTML content', () => {
      const html = '<p>Hello World</p>';
      const result = containsHtml(html);
      
      expect(result).toBe(true);
    });

    it('should return true for dangerous HTML', () => {
      const html = '<script>alert("XSS")</script>';
      const result = containsHtml(html);
      
      expect(result).toBe(true);
    });

    it('should return false for plain text', () => {
      const text = 'Just plain text';
      const result = containsHtml(text);
      
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = containsHtml('');
      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(containsHtml(null as any)).toBe(false);
      expect(containsHtml(undefined as any)).toBe(false);
    });
  });

  describe('renderSanitizedHtml', () => {
    it('should return object for dangerouslySetInnerHTML', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = renderSanitizedHtml(html);
      
      expect(result).toHaveProperty('dangerouslySetInnerHTML');
      expect(result.dangerouslySetInnerHTML).toHaveProperty('__html');
      expect(result.dangerouslySetInnerHTML.__html).toContain('<p>');
      expect(result.dangerouslySetInnerHTML.__html).toContain('Hello');
    });

    it('should sanitize dangerous HTML', () => {
      const html = '<p>Text</p><script>alert("XSS")</script>';
      const result = renderSanitizedHtml(html);
      
      expect(result.dangerouslySetInnerHTML.__html).not.toContain('<script>');
      expect(result.dangerouslySetInnerHTML.__html).not.toContain('alert');
      expect(result.dangerouslySetInnerHTML.__html).toContain('Text');
    });

    it('should handle empty string', () => {
      const result = renderSanitizedHtml('');
      
      expect(result.dangerouslySetInnerHTML.__html).toBe('');
    });
  });
});
