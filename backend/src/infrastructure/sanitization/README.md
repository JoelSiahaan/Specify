# HTML Sanitization

## Overview

This module provides server-side HTML sanitization to prevent XSS (Cross-Site Scripting) attacks. It uses the `sanitize-html` library with a strict whitelist of allowed tags and attributes.

**Security Requirement**: 20.2 - XSS Prevention

## Usage

### Basic Sanitization

```typescript
import { htmlSanitizer } from '@/infrastructure/sanitization';

// Sanitize HTML content before storage
const userInput = '<p>Hello <script>alert("XSS")</script></p>';
const clean = htmlSanitizer.sanitize(userInput);
// Result: '<p>Hello </p>'
```

### Plain Text Only

```typescript
// Strip all HTML tags
const text = htmlSanitizer.sanitizePlainText('<p>Hello <b>World</b></p>');
// Result: 'Hello World'
```

### Check for Dangerous Content

```typescript
// Check if content contains dangerous HTML
const isDangerous = htmlSanitizer.containsDangerousHtml(userInput);
if (isDangerous) {
  logger.warn('Dangerous HTML detected', { userId, content: userInput });
}
```

## Where to Apply

HTML sanitization should be applied to all rich text fields:

1. **Course descriptions** - When creating or updating courses
2. **Assignment descriptions** - When creating or updating assignments
3. **Quiz questions** - When creating or updating quizzes
4. **Material text content** - When creating or updating text materials
5. **Submission feedback** - When grading submissions

## Integration with Use Cases

### Example: CreateCourseUseCase

```typescript
import { htmlSanitizer } from '@/infrastructure/sanitization';

export class CreateCourseUseCase {
  async execute(dto: CreateCourseDTO, userId: string): Promise<CourseDTO> {
    // Sanitize description before creating entity
    const sanitizedDescription = dto.description 
      ? htmlSanitizer.sanitize(dto.description)
      : undefined;

    const course = Course.create({
      name: dto.name,
      description: sanitizedDescription,
      teacherId: userId,
    });

    await this.courseRepo.save(course);
    return CourseMapper.toDTO(course);
  }
}
```

### Example: GradeSubmissionUseCase

```typescript
import { htmlSanitizer } from '@/infrastructure/sanitization';

export class GradeSubmissionUseCase {
  async execute(dto: GradeSubmissionDTO, userId: string): Promise<SubmissionDTO> {
    // Sanitize feedback before storage
    const sanitizedFeedback = dto.feedback
      ? htmlSanitizer.sanitize(dto.feedback)
      : undefined;

    submission.grade(dto.grade, sanitizedFeedback);
    await this.submissionRepo.save(submission);
    
    return SubmissionMapper.toDTO(submission);
  }
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

## Security Features

1. **Whitelist Approach**: Only explicitly allowed tags and attributes are permitted
2. **URL Scheme Validation**: Only `http`, `https`, and `mailto` URLs are allowed
3. **Automatic Link Safety**: External links automatically get `target="_blank"` and `rel="noopener noreferrer"`
4. **Defense in Depth**: Server-side sanitization is the primary defense, client-side is secondary

## Testing

Run the sanitization tests:

```bash
npm test -- HtmlSanitizer
```

All tests should pass, including XSS prevention tests.

## Client-Side Sanitization

The frontend also has a sanitization utility using DOMPurify. See `frontend/src/presentation/web/utils/htmlSanitizer.ts` for client-side usage.

**Important**: Server-side sanitization is the primary defense. Client-side sanitization is a defense-in-depth measure.

## References

- [sanitize-html Documentation](https://www.npmjs.com/package/sanitize-html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- Security Requirement 20.2 in requirements.md
