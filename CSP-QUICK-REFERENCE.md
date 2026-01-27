# CSP Quick Reference Guide

## For Developers: Writing CSP-Compliant Code

This is a quick reference for developers working on the LMS frontend. Follow these guidelines to ensure your code complies with the Content Security Policy.

---

## The Golden Rules

### ✅ DO

1. **Use External Files**
   ```tsx
   // ✅ CORRECT
   <script src="/assets/app.js"></script>
   <link rel="stylesheet" href="/assets/styles.css">
   ```

2. **Use Event Listeners**
   ```tsx
   // ✅ CORRECT
   useEffect(() => {
     const button = document.getElementById('myButton');
     button?.addEventListener('click', handleClick);
   }, []);
   ```

3. **Use Tailwind Classes**
   ```tsx
   // ✅ CORRECT
   <div className="text-red-600 font-bold">Text</div>
   ```

4. **Use CSS Modules or External CSS**
   ```tsx
   // ✅ CORRECT
   import styles from './Component.module.css';
   <div className={styles.container}>Content</div>
   ```

### ❌ DON'T

1. **No Inline Scripts**
   ```tsx
   // ❌ WRONG - Blocked by CSP
   <script>
     console.log('Hello');
   </script>
   ```

2. **No Inline Event Handlers**
   ```tsx
   // ❌ WRONG - Blocked by CSP
   <button onClick="handleClick()">Click</button>
   <img onError="handleError()" />
   ```

3. **No Inline Styles**
   ```tsx
   // ❌ WRONG - Blocked by CSP
   <div style={{ color: 'red' }}>Text</div>
   <div style="color: red;">Text</div>
   ```

4. **Avoid `dangerouslySetInnerHTML` When Possible**
   ```tsx
   // ✅ BEST - React auto-escapes (no DOMPurify needed)
   <div>{userInput}</div>
   
   // ✅ GOOD - Use Markdown library for rich text
   import ReactMarkdown from 'react-markdown';
   <ReactMarkdown>{userInput}</ReactMarkdown>
   
   // ⚠️ ONLY IF NECESSARY - Use DOMPurify for HTML content
   import DOMPurify from 'dompurify';
   <div dangerouslySetInnerHTML={{ 
     __html: DOMPurify.sanitize(userInput, {
       ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li'],
       ALLOWED_ATTR: []
     }) 
   }} />
   ```
   
   **Note**: React JSX already protects against XSS for normal content. 
   DOMPurify is ONLY needed when you intentionally render HTML with `dangerouslySetInnerHTML`.

---

## Common Patterns

### Pattern 1: Button Click Handler

```tsx
// ❌ WRONG
<button onclick="handleClick()">Click</button>

// ✅ CORRECT
import { useState } from 'react';

function MyComponent() {
  const handleClick = () => {
    console.log('Clicked!');
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

### Pattern 2: Dynamic Styling

```tsx
// ❌ WRONG
<div style={{ color: isActive ? 'red' : 'blue' }}>Text</div>

// ✅ CORRECT - Conditional classes
<div className={isActive ? 'text-red-600' : 'text-blue-600'}>Text</div>

// ✅ CORRECT - CSS modules
import styles from './Component.module.css';
<div className={isActive ? styles.active : styles.inactive}>Text</div>
```

### Pattern 3: Loading External Scripts

```tsx
// ❌ WRONG - Inline script
<script>
  window.analytics = { track: () => {} };
</script>

// ✅ CORRECT - External file
// Create public/analytics.js
// Then in index.html:
<script src="/analytics.js"></script>
```

### Pattern 4: Rich Text Content (Only When Necessary)

**React JSX Already Protects Against XSS:**
```tsx
// ✅ SAFE - React auto-escapes, no DOMPurify needed
const userInput = '<script>alert("XSS")</script>';
<div>{userInput}</div>
// Output: &lt;script&gt;alert("XSS")&lt;/script&gt; (displayed as text, not executed)
```

**DOMPurify Only Needed for `dangerouslySetInnerHTML`:**
```tsx
// ❌ WRONG - Unsanitized HTML (XSS vulnerability)
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ CORRECT - Sanitized HTML (only when you need to render HTML)
import DOMPurify from 'dompurify';

function RichTextDisplay({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target']
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Better Alternative - Use Markdown:**
```tsx
// ✅ BEST - Use Markdown library (no DOMPurify needed)
import ReactMarkdown from 'react-markdown';

function RichTextDisplay({ content }: { content: string }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
```

**When to Use Each Approach:**
- **Plain Text**: Use `{content}` - React auto-escapes ✅
- **Rich Text (Markdown)**: Use ReactMarkdown library ✅
- **Rich Text (HTML)**: Use DOMPurify + `dangerouslySetInnerHTML` ⚠️

### Pattern 5: Image Loading

```tsx
// ✅ CORRECT - Same origin
<img src="/assets/logo.png" alt="Logo" />

// ✅ CORRECT - Data URI (base64)
<img src="data:image/png;base64,iVBORw0KG..." alt="Icon" />

// ❌ WRONG - External domain (blocked by CSP)
<img src="https://external.com/image.png" alt="External" />
```

---

## React-Specific Guidelines

### useState and useEffect

```tsx
// ✅ CORRECT - React hooks
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Setup event listeners here
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') setCount(c => c + 1);
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);
  
  return <div>Count: {count}</div>;
}
```

### Conditional Rendering

```tsx
// ✅ CORRECT - Conditional classes
function StatusBadge({ status }: { status: string }) {
  const className = status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';
  
  return <span className={`px-2 py-1 rounded ${className}`}>{status}</span>;
}
```

### Form Handling

```tsx
// ✅ CORRECT - React form handling
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Login
      </button>
    </form>
  );
}
```

---

## Tailwind CSS Best Practices

### Use Utility Classes

```tsx
// ✅ CORRECT - Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

### Conditional Classes

```tsx
// ✅ CORRECT - Conditional Tailwind classes
function Button({ variant }: { variant: 'primary' | 'secondary' }) {
  const baseClasses = 'px-4 py-2 rounded font-medium';
  const variantClasses = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  
  return <button className={`${baseClasses} ${variantClasses}`}>Click</button>;
}
```

### Custom Styles (When Needed)

```tsx
// ✅ CORRECT - External CSS module
// Component.module.css
.customAnimation {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Component.tsx
import styles from './Component.module.css';
<div className={styles.customAnimation}>Content</div>
```

---

## Testing for CSP Compliance

### Browser DevTools

1. Open DevTools (F12)
2. Go to Console tab
3. Look for CSP violation errors:
   ```
   Refused to execute inline script because it violates the following 
   Content Security Policy directive: "script-src 'self'"
   ```

### Automated Testing

```tsx
// Test that no inline styles are present
describe('CSP Compliance', () => {
  it('should not have inline styles', () => {
    const { container } = render(<MyComponent />);
    const elementsWithStyle = container.querySelectorAll('[style]');
    expect(elementsWithStyle.length).toBe(0);
  });
  
  it('should not have inline event handlers', () => {
    const { container } = render(<MyComponent />);
    const elementsWithOnClick = container.querySelectorAll('[onclick]');
    expect(elementsWithOnClick.length).toBe(0);
  });
});
```

---

## Common Mistakes and Fixes

### Mistake 1: Inline Style in Component

```tsx
// ❌ WRONG
function Card() {
  return <div style={{ padding: '16px', backgroundColor: 'white' }}>Content</div>;
}

// ✅ FIX
function Card() {
  return <div className="p-4 bg-white">Content</div>;
}
```

### Mistake 2: Event Handler Attribute

```tsx
// ❌ WRONG
<button onclick="alert('Hello')">Click</button>

// ✅ FIX
function MyComponent() {
  const handleClick = () => alert('Hello');
  return <button onClick={handleClick}>Click</button>;
}
```

### Mistake 3: Dynamic Inline Style

```tsx
// ❌ WRONG
<div style={{ width: `${progress}%` }}>Progress</div>

// ✅ FIX - Use CSS variable
<div 
  className="progress-bar" 
  style={{ '--progress': `${progress}%` } as React.CSSProperties}
>
  Progress
</div>

// In CSS file:
.progress-bar {
  width: var(--progress);
}
```

### Mistake 4: Third-Party Library with Inline Styles

```tsx
// ❌ PROBLEM - Library uses inline styles
import SomeLibrary from 'some-library';

// ✅ FIX - Find CSP-compatible alternative
import BetterLibrary from 'better-library'; // Supports external CSS

// OR configure library to use external styles
<SomeLibrary useExternalStyles={true} />
```

---

## Checklist for New Components

Before committing new code, verify:

- [ ] No inline `<script>` tags
- [ ] No inline `<style>` tags
- [ ] No `style` attributes on elements
- [ ] No `onclick`, `onload`, `onerror` attributes
- [ ] All JavaScript in external files or React components
- [ ] All CSS in external files or Tailwind classes
- [ ] Event handlers use React's `onClick`, `onChange`, etc.
- [ ] Rich text content is sanitized with DOMPurify
- [ ] No CSP violations in browser console

---

## Getting Help

### CSP Violation Error?

1. **Read the error message** - It tells you what was blocked
2. **Check the source** - Find where the violation occurred
3. **Fix the code** - Use patterns from this guide
4. **Test again** - Verify no more violations

### Need to Add External Resource?

1. **Check if necessary** - Can you host it locally?
2. **Review security** - Is the source trustworthy?
3. **Update CSP** - Add domain to appropriate directive
4. **Document change** - Record why it was added
5. **Test thoroughly** - Ensure no security regressions

### Resources

- **Full Documentation**: See `CSP-CONFIGURATION.md`
- **Deployment Guide**: See `CSP-DEPLOYMENT-CHECKLIST.md`
- **MDN CSP Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## Summary

**Remember**: CSP protects users from XSS attacks. Follow these simple rules:

1. ✅ Use external files for JavaScript and CSS
2. ✅ Use React event handlers (onClick, onChange, etc.)
3. ✅ Use Tailwind classes for styling
4. ✅ Sanitize user-generated HTML with DOMPurify
5. ❌ Never use inline scripts, styles, or event handlers

**When in doubt**: Check browser console for CSP violations and fix them before committing code.
