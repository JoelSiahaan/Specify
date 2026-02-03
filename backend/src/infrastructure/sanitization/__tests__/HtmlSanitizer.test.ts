/**
 * Unit Tests for HTML Sanitizer
 * 
 * Tests XSS prevention and HTML sanitization
 * Security Requirement 20.2
 */

import { HtmlSanitizer } from '../HtmlSanitizer.js';

describe('HtmlSanitizer', () => {
  let sanitizer: HtmlSanitizer;

  beforeEach(() => {
    sanitizer = new HtmlSanitizer();
  });

  describe('sanitize', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove script tags (XSS prevention)', () => {
      const html = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove onclick attributes (XSS prevention)', () => {
      const html = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).toContain('Click me');
    });

    it('should remove onerror attributes (XSS prevention)', () => {
      const html = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: URLs (XSS prevention)', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove data: URLs (XSS prevention)', () => {
      const html = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('data:');
      expect(result).not.toContain('script');
    });

    it('should allow safe links with http/https', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Link');
    });

    it('should enforce target="_blank" and rel="noopener noreferrer" on links', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should allow lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should allow headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
      expect(result).toContain('<h3>');
    });

    it('should allow code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = sanitizer.sanitize(html);
      
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('should remove iframe tags', () => {
      const html = '<p>Text</p><iframe src="https://evil.com"></iframe>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
      expect(result).toContain('Text');
    });

    it('should remove style tags', () => {
      const html = '<p>Text</p><style>body { display: none; }</style>';
      const result = sanitizer.sanitize(html);
      
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('display: none');
      expect(result).toContain('Text');
    });

    it('should handle empty string', () => {
      const result = sanitizer.sanitize('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizer.sanitize(null as any)).toBe('');
      expect(sanitizer.sanitize(undefined as any)).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const text = 'Just plain text';
      const result = sanitizer.sanitize(text);
      
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
      const result = sanitizer.sanitize(html);
      
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
      const result = sanitizer.sanitizePlainText(html);
      
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
    });

    it('should remove script tags and content', () => {
      const html = 'Text<script>alert("XSS")</script>More';
      const result = sanitizer.sanitizePlainText(html);
      
      expect(result).toBe('TextMore');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should handle plain text', () => {
      const text = 'Just plain text';
      const result = sanitizer.sanitizePlainText(text);
      
      expect(result).toBe('Just plain text');
    });

    it('should handle empty string', () => {
      const result = sanitizer.sanitizePlainText('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizer.sanitizePlainText(null as any)).toBe('');
      expect(sanitizer.sanitizePlainText(undefined as any)).toBe('');
    });
  });

  describe('containsDangerousHtml', () => {
    it('should return true for dangerous HTML', () => {
      const html = '<p>Text</p><script>alert("XSS")</script>';
      const result = sanitizer.containsDangerousHtml(html);
      
      expect(result).toBe(true);
    });

    it('should return true for onclick attributes', () => {
      const html = '<p onclick="alert()">Text</p>';
      const result = sanitizer.containsDangerousHtml(html);
      
      expect(result).toBe(true);
    });

    it('should return false for safe HTML', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizer.containsDangerousHtml(html);
      
      expect(result).toBe(false);
    });

    it('should return false for plain text', () => {
      const text = 'Just plain text';
      const result = sanitizer.containsDangerousHtml(text);
      
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = sanitizer.containsDangerousHtml('');
      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(sanitizer.containsDangerousHtml(null as any)).toBe(false);
      expect(sanitizer.containsDangerousHtml(undefined as any)).toBe(false);
    });
  });
});
