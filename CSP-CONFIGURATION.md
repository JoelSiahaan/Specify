# Content Security Policy (CSP) Configuration Guide

## Overview

This document explains the Content Security Policy (CSP) implementation in the LMS nginx configuration. CSP is a critical security feature that helps prevent Cross-Site Scripting (XSS) attacks and other code injection vulnerabilities.

**Requirement**: 20.2 - Input validation and protection against injection attacks

---

## Current CSP Configuration

The LMS implements a **strict CSP policy** with the following directives:

```nginx
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self'; 
  img-src 'self' data:; 
  font-src 'self'; 
  connect-src 'self'; 
  media-src 'self'; 
  object-src 'none'; 
  frame-src 'self'; 
  base-uri 'self'; 
  form-action 'self'; 
  frame-ancestors 'self'; 
  upgrade-insecure-requests;
```

---

## CSP Directives Explained

### Core Directives

#### `default-src 'self'`
- **Purpose**: Default policy for all resource types not explicitly specified
- **Value**: `'self'` - Only allow resources from the same origin
- **Impact**: Blocks all external resources by default

#### `script-src 'self'`
- **Purpose**: Control where JavaScript can be loaded from
- **Value**: `'self'` - Only allow scripts from same origin
- **Security**: **NO `'unsafe-inline'`** - Prevents inline `<script>` tags and `onclick` handlers
- **Impact**: All JavaScript must be in external `.js` files

#### `style-src 'self'`
- **Purpose**: Control where CSS can be loaded from
- **Value**: `'self'` - Only allow stylesheets from same origin
- **Security**: **NO `'unsafe-inline'`** - Prevents inline `<style>` tags and `style` attributes
- **Impact**: All CSS must be in external `.css` files

### Resource Directives

#### `img-src 'self' data:`
- **Purpose**: Control where images can be loaded from
- **Values**: 
  - `'self'` - Same origin images
  - `data:` - Base64-encoded images (data URIs)
- **Use Case**: Allows uploaded images and base64 icons

#### `font-src 'self'`
- **Purpose**: Control where fonts can be loaded from
- **Value**: `'self'` - Only allow fonts from same origin
- **Impact**: Custom fonts must be hosted locally

#### `connect-src 'self'`
- **Purpose**: Control AJAX, WebSocket, and fetch() destinations
- **Value**: `'self'` - Only allow API calls to same origin
- **Impact**: All API endpoints must be on same domain

#### `media-src 'self'`
- **Purpose**: Control where audio/video can be loaded from
- **Value**: `'self'` - Only allow media from same origin
- **Note**: External video links use `frame-src` instead

#### `object-src 'none'`
- **Purpose**: Control plugins (Flash, Java, etc.)
- **Value**: `'none'` - Completely block all plugins
- **Security**: Prevents plugin-based attacks

#### `frame-src 'self'`
- **Purpose**: Control where iframes can be loaded from
- **Value**: `'self'` - Only allow iframes from same origin
- **Note**: For external videos, add trusted domains (see customization below)

### Security Directives

#### `base-uri 'self'`
- **Purpose**: Restrict `<base>` tag URLs
- **Value**: `'self'` - Only allow base URLs from same origin
- **Security**: Prevents base tag hijacking attacks

#### `form-action 'self'`
- **Purpose**: Control where forms can be submitted
- **Value**: `'self'` - Only allow form submissions to same origin
- **Security**: Prevents form hijacking

#### `frame-ancestors 'self'`
- **Purpose**: Control who can embed this site in iframes
- **Value**: `'self'` - Only allow same origin to frame this site
- **Security**: Prevents clickjacking attacks

#### `upgrade-insecure-requests`
- **Purpose**: Automatically upgrade HTTP requests to HTTPS
- **Security**: Ensures all resources load over secure connections

---

## Why No `'unsafe-inline'`?

The LMS **intentionally excludes** `'unsafe-inline'` from `script-src` and `style-src` for maximum security:

### Security Benefits

1. **Prevents XSS Attacks**: Inline scripts are the primary vector for XSS attacks
2. **Blocks Event Handlers**: Prevents malicious `onclick`, `onerror`, etc. attributes
3. **Stops Inline Styles**: Prevents CSS-based attacks and data exfiltration
4. **Forces Best Practices**: Encourages separation of concerns (HTML/CSS/JS)

### Implementation Requirements

To comply with this strict CSP, the LMS frontend must:

✅ **DO**:
- Use external `.js` files for all JavaScript
- Use external `.css` files for all styles
- Use event listeners instead of inline handlers
- Use CSS classes instead of inline styles

❌ **DON'T**:
- Use `<script>` tags in HTML
- Use `onclick`, `onload`, `onerror` attributes
- Use `<style>` tags in HTML
- Use `style` attributes on elements

### Example: Correct Implementation

**❌ WRONG (Blocked by CSP)**:
```html
<!-- Inline script - BLOCKED -->
<script>
  console.log('Hello');
</script>

<!-- Inline event handler - BLOCKED -->
<button onclick="handleClick()">Click</button>

<!-- Inline style - BLOCKED -->
<div style="color: red;">Text</div>
```

**✅ CORRECT (Allowed by CSP)**:
```html
<!-- External script - ALLOWED -->
<script src="/assets/app.js"></script>

<!-- Event listener in external JS - ALLOWED -->
<button id="myButton">Click</button>
<script src="/assets/handlers.js"></script>
<!-- handlers.js: document.getElementById('myButton').addEventListener('click', handleClick); -->

<!-- External stylesheet - ALLOWED -->
<link rel="stylesheet" href="/assets/styles.css">
<div class="text-red">Text</div>
```

---

## Customization Guide

### Adding External Video Support

The LMS allows external video links (YouTube, Vimeo) as per requirements. To enable iframe embedding:

**Current Configuration**:
```nginx
frame-src 'self';
```

**Updated Configuration** (for external videos):
```nginx
frame-src 'self' https://www.youtube.com https://player.vimeo.com;
```

**Steps**:
1. Edit `nginx.conf`
2. Locate the `Content-Security-Policy` header
3. Update `frame-src` directive
4. Reload nginx: `docker-compose exec nginx nginx -s reload`

### Adding External Fonts (Google Fonts, etc.)

If you need to use external fonts:

**Current Configuration**:
```nginx
font-src 'self';
```

**Updated Configuration**:
```nginx
font-src 'self' https://fonts.gstatic.com;
style-src 'self' https://fonts.googleapis.com;
```

**Note**: This is NOT recommended. Host fonts locally for better performance and privacy.

### Adding CDN Support

If you use a CDN for static assets:

**Current Configuration**:
```nginx
script-src 'self';
style-src 'self';
img-src 'self' data:;
```

**Updated Configuration**:
```nginx
script-src 'self' https://cdn.example.com;
style-src 'self' https://cdn.example.com;
img-src 'self' data: https://cdn.example.com;
```

---

## Testing CSP Configuration

### Browser Console

1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Look for CSP violation errors:
   ```
   Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'"
   ```

### CSP Violation Reports

CSP violations appear in browser console with detailed information:
- **Blocked URI**: What resource was blocked
- **Violated Directive**: Which CSP rule was violated
- **Source File**: Where the violation occurred

### Testing Checklist

- [ ] All pages load without CSP errors
- [ ] JavaScript functionality works correctly
- [ ] Styles render properly
- [ ] Images display correctly
- [ ] Forms submit successfully
- [ ] External videos embed (if configured)
- [ ] No inline scripts or styles present

---

## CSP Reporting (Future Enhancement)

For production monitoring, you can add CSP violation reporting:

```nginx
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self'; 
  report-uri /api/csp-report;
```

This sends violation reports to `/api/csp-report` endpoint for logging and analysis.

**Implementation**:
1. Create CSP report endpoint in backend
2. Log violations to Winston
3. Monitor for security issues
4. Adjust CSP policy as needed

---

## Troubleshooting

### Issue: Inline Styles Not Working

**Symptom**: Elements with `style` attribute don't render correctly

**Cause**: CSP blocks inline styles

**Solution**: Move styles to external CSS file or use CSS classes

**Example**:
```html
<!-- Before (blocked) -->
<div style="color: red;">Text</div>

<!-- After (allowed) -->
<div class="text-red">Text</div>
```

### Issue: Event Handlers Not Working

**Symptom**: `onclick`, `onload` handlers don't execute

**Cause**: CSP blocks inline event handlers

**Solution**: Use `addEventListener` in external JavaScript

**Example**:
```html
<!-- Before (blocked) -->
<button onclick="handleClick()">Click</button>

<!-- After (allowed) -->
<button id="myButton">Click</button>
<script src="/assets/app.js"></script>
<!-- app.js: document.getElementById('myButton').addEventListener('click', handleClick); -->
```

### Issue: Third-Party Scripts Blocked

**Symptom**: External scripts (analytics, etc.) don't load

**Cause**: CSP only allows same-origin scripts

**Solution**: Add trusted domains to `script-src`

**Example**:
```nginx
script-src 'self' https://www.googletagmanager.com;
```

**Warning**: Only add trusted domains. Each addition increases attack surface.

---

## Security Best Practices

### ✅ DO

1. **Keep CSP Strict**: Avoid `'unsafe-inline'` and `'unsafe-eval'`
2. **Use External Files**: Separate HTML, CSS, and JavaScript
3. **Test Thoroughly**: Check all pages for CSP violations
4. **Monitor Violations**: Log CSP reports in production
5. **Update Carefully**: Test CSP changes before deployment
6. **Document Changes**: Record why domains were added to CSP

### ❌ DON'T

1. **Don't Use `'unsafe-inline'`**: Defeats CSP security benefits
2. **Don't Use `'unsafe-eval'`**: Allows dangerous code execution
3. **Don't Use `*` Wildcards**: Too permissive, allows any domain
4. **Don't Add Untrusted Domains**: Only whitelist verified sources
5. **Don't Ignore Violations**: CSP errors indicate security issues
6. **Don't Disable CSP**: Even in development, keep CSP enabled

---

## Compliance

This CSP configuration ensures compliance with:

- ✅ **Requirement 20.2**: Input validation and injection attack prevention
- ✅ **OWASP Top 10**: Protection against XSS attacks
- ✅ **Security Best Practices**: Defense in depth strategy
- ✅ **Production-Grade Security**: Suitable for 50+ concurrent users

---

## References

- **MDN CSP Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **OWASP CSP Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- **Can I Use CSP**: https://caniuse.com/contentsecuritypolicy

---

## Summary

The LMS implements a **strict Content Security Policy** that:

1. ✅ Blocks all inline scripts and styles
2. ✅ Restricts resources to same origin
3. ✅ Prevents XSS and injection attacks
4. ✅ Enforces HTTPS for all resources
5. ✅ Protects against clickjacking
6. ✅ Disables dangerous plugins

This configuration provides **production-grade security** while maintaining functionality for the LMS's core features.
