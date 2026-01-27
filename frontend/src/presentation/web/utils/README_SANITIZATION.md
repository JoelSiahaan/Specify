# HTML Sanitization (Client-Side)

## Overview

This module provides client-side HTML sanitization using DOMPurify to prevent XSS (Cross-Site Scripting) attacks. This is a defense-in-depth measure - server-side sanitization is the primary defense.

**Security Requirement**: 20.2 - XSS Prevention

## Usage

### Basic Sanitization

```typescript
import { sanitizeHtml } from '@/utils';

// Sanitize HTML before rendering
const userContent = '<p>Hello <script>alert("XSS")</script></p>';
const clean = sanitizeHtml(userContent);
// Result: '<p>Hello </p>'
```

### Render in React Component

```typescript
import { renderSanitizedHtml } from '@/utils';

function CourseDescription({ description }: { description: string }) {
  return (
    <div {...renderSanitizedHtml(description)} />
  );
}
```

### Alternative: dangerouslySetInnerHTML

```typescript
import { sanitizeHtml } from '@/utils';

function CourseDescription({ description }: { description: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
  );
}
```

### Plain Text Only

```typescript
import { sanitizePlainText } from '@/utils';

// Strip all HTML tags
const text = sanitizePlainText('<p>Hello <b>World</b></p>');
// Result: 'Hello World'
```

### Check for HTML Content

```typescript
import { containsHtml } from '@/utils';

// Check if content contains HTML
const hasHtml = containsHtml(content);

// Conditional rendering
{containsHtml(description) ? (
  <div {...renderSanitizedHtml(description)} />
) : (
  <p>{description}</p>
)}
```

## Where to Apply

Client-side sanitization should be applied when rendering rich text content:

1. **Course descriptions** - When displaying course details
2. **Assignment descriptions** - When displaying assignment details
3. **Quiz questions** - When displaying quiz questions
4. **Material text content** - When displaying text materials
5. **Submission feedback** - When displaying grading feedback

## Component Examples

### Course Card Component

```typescript
import { sanitizeHtml } from '@/utils';

export function CourseCard({ course }: { course: Course }) {
  return (
    <div className="card">
      <h3>{course.name}</h3>
      {course.description && (
        <div 
          className="description"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
        />
      )}
    </div>
  );
}
```

### Assignment Details Component

```typescript
import { renderSanitizedHtml } from '@/utils';

export function AssignmentDetails({ assignment }: { assignment: Assignment }) {
  return (
    <div>
      <h2>{assignment.title}</h2>
      <div className="description" {...renderSanitizedHtml(assignment.description)} />
    </div>
  );
}
```

### Quiz Question Component

```typescript
import { sanitizeHtml } from '@/utils';

export function QuizQuestion({ question }: { question: Question }) {
  return (
    <div className="question">
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.questionText) }} />
      {/* Render options */}
    </div>
  );
}
```

## Allowed HTML Tags

The following HTML tags are allowed (whitelist approach):

- **Text formatting**: `<p>`, `<br>`, `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`
- **Lists**: `<ul>`, `<ol>`, `<li>`
- **Links**: `<a>` (with `href`, `title`, `target`, `rel` attributes)
- **Headings**: `<h1>`, `<h2>`, `<h3>`
- **Code**: `<code>`, `<pre>`

## Blocked Content

The following are automatically removed:

- **Script tags**: `<script>`, `<noscript>`
- **Event handlers**: `onclick`, `onerror`, `onload`, etc.
- **Dangerous URLs**: `javascript:`, `data:`, `vbscript:`
- **Iframes**: `<iframe>`, `<embed>`, `<object>`
- **Style tags**: `<style>` (inline styles are also removed)
- **Form elements**: `<form>`, `<input>`, `<button>`
- **Data attributes**: `data-*` attributes are removed

## Security Features

1. **Whitelist Approach**: Only explicitly allowed tags and attributes are permitted
2. **URL Scheme Validation**: Only `http`, `https`, and `mailto` URLs are allowed
3. **Template Safety**: Template tags are removed
4. **Defense in Depth**: Client-side sanitization is a secondary defense layer

## Testing

Run the sanitization tests:

```bash
npm test htmlSanitizer
```

All tests should pass, including XSS prevention tests.

## Important Notes

1. **Server-side is Primary**: Always sanitize on the server first. Client-side sanitization is a defense-in-depth measure.
2. **Never Trust User Input**: Even with sanitization, never trust user input completely.
3. **Use Sparingly**: Only use `dangerouslySetInnerHTML` when necessary. Prefer plain text rendering when possible.
4. **Consistent Whitelists**: Client-side and server-side whitelists should match for consistency.

## References

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [React Security Best Practices](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- Security Requirement 20.2 in requirements.md
