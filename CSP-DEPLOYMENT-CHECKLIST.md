# CSP Deployment Checklist

## Pre-Deployment Verification

Before deploying the nginx configuration with CSP headers, verify the following:

### 1. Frontend Code Compliance

Check that the React frontend follows CSP-compliant patterns:

- [ ] **No Inline Scripts**: All JavaScript is in external `.js` files
- [ ] **No Inline Styles**: All CSS is in external `.css` files or Tailwind classes
- [ ] **No Inline Event Handlers**: Use `addEventListener` instead of `onclick`, etc.
- [ ] **No `dangerouslySetInnerHTML`**: Or if used, content is sanitized with DOMPurify

### 2. Vite Configuration

Ensure Vite build configuration is CSP-compatible:

- [ ] **No Inline Scripts in HTML**: Check `index.html` template
- [ ] **External Assets**: All JS/CSS bundled as external files
- [ ] **Source Maps**: Configured for production debugging

### 3. Tailwind CSS

Verify Tailwind CSS setup:

- [ ] **PostCSS Processing**: Tailwind generates external CSS file
- [ ] **No Inline Styles**: All styling uses Tailwind classes
- [ ] **Purge Configuration**: Unused styles removed in production

---

## Deployment Steps

### Step 1: Update Domain Name

```bash
# Edit nginx.conf
nano nginx.conf

# Replace lms.example.com with your actual domain (2 locations)
# Line ~10: server_name lms.example.com;
# Line ~20: server_name lms.example.com;
```

### Step 2: Deploy nginx Configuration

```bash
# Copy nginx.conf to deployment location
cp nginx.conf /path/to/deployment/

# Or if using Docker Compose, ensure volume mount is correct:
# volumes:
#   - ./nginx.conf:/etc/nginx/conf.d/default.conf
```

### Step 3: Test Configuration

```bash
# Test nginx configuration syntax
docker-compose exec nginx nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Reload nginx

```bash
# Reload nginx to apply new configuration
docker-compose exec nginx nginx -s reload

# Or restart the container
docker-compose restart nginx
```

### Step 5: Verify CSP Headers

```bash
# Check CSP header is present
curl -I https://your-domain.com

# Look for:
# Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

---

## Post-Deployment Testing

### Browser Testing

1. **Open Browser DevTools** (F12)
2. **Navigate to Console Tab**
3. **Load Application**
4. **Check for CSP Violations**:
   - No errors starting with "Refused to execute inline script..."
   - No errors starting with "Refused to apply inline style..."

### Functional Testing

Test all major features to ensure CSP doesn't break functionality:

- [ ] **Login/Register**: Authentication works
- [ ] **Dashboard**: Loads correctly with all styles
- [ ] **Course List**: Displays courses with images
- [ ] **Course Details**: All content renders properly
- [ ] **Material Upload**: File uploads work
- [ ] **Assignment Submission**: Forms submit successfully
- [ ] **Quiz Taking**: Timer and questions display correctly
- [ ] **Grading**: Grade input and feedback work
- [ ] **Navigation**: All links and buttons function

### CSP Violation Monitoring

Monitor browser console for any CSP violations:

```javascript
// In browser console, check for CSP violations
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy
  });
});
```

---

## Common Issues and Solutions

### Issue 1: Vite Dev Server CSP Errors

**Symptom**: CSP errors in development mode

**Cause**: Vite dev server uses inline scripts for HMR

**Solution**: CSP is for production only. Development uses different configuration.

**Verification**:
```bash
# Development (no CSP enforcement)
npm run dev

# Production build (CSP enforced)
npm run build
npm run preview
```

### Issue 2: React Inline Styles

**Symptom**: Components with inline styles don't render

**Cause**: React components using `style` prop

**Solution**: Replace with Tailwind classes or external CSS

**Example**:
```tsx
// Before (blocked by CSP)
<div style={{ color: 'red' }}>Text</div>

// After (allowed by CSP)
<div className="text-red-600">Text</div>
```

### Issue 3: Third-Party Libraries

**Symptom**: External libraries (charts, editors) don't work

**Cause**: Library uses inline scripts or styles

**Solution**: 
1. Check if library has CSP-compatible mode
2. Use alternative library that supports CSP
3. If necessary, add library's CDN to CSP (last resort)

---

## Rollback Procedure

If CSP causes critical issues in production:

### Option 1: Temporary Relaxation (Emergency)

```nginx
# Add 'unsafe-inline' temporarily (NOT RECOMMENDED)
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  ...
```

**Steps**:
1. Edit nginx.conf
2. Add `'unsafe-inline'` to `script-src` and `style-src`
3. Reload nginx: `docker-compose exec nginx nginx -s reload`
4. Fix underlying issues
5. Remove `'unsafe-inline'` and redeploy

### Option 2: Disable CSP (Emergency Only)

```nginx
# Comment out CSP header
# add_header Content-Security-Policy "..." always;
```

**Steps**:
1. Edit nginx.conf
2. Comment out CSP header line
3. Reload nginx
4. Fix issues
5. Re-enable CSP

**WARNING**: Only use rollback in emergencies. Fix issues and redeploy proper CSP ASAP.

---

## Monitoring and Maintenance

### Regular Checks

- [ ] **Weekly**: Review browser console for CSP violations
- [ ] **Monthly**: Audit CSP policy for unnecessary permissions
- [ ] **Quarterly**: Update CSP based on new features

### CSP Policy Updates

When adding new features that require CSP changes:

1. **Document Reason**: Why is the change needed?
2. **Minimal Scope**: Add only necessary permissions
3. **Test Thoroughly**: Verify no security regressions
4. **Update Documentation**: Record changes in CSP-CONFIGURATION.md

### Security Audits

Periodically audit CSP configuration:

- [ ] **No `'unsafe-inline'`**: Verify strict policy maintained
- [ ] **No `'unsafe-eval'`**: Ensure no dynamic code execution
- [ ] **Minimal Whitelisting**: Only trusted domains allowed
- [ ] **Up-to-Date**: CSP follows current best practices

---

## Success Criteria

CSP implementation is successful when:

✅ All pages load without CSP violations
✅ All functionality works correctly
✅ No inline scripts or styles present
✅ Security headers present in HTTP responses
✅ Browser console shows no CSP errors
✅ Application passes security audit

---

## Support Resources

- **CSP Configuration Guide**: See `CSP-CONFIGURATION.md`
- **Nginx Documentation**: https://nginx.org/en/docs/
- **CSP Validator**: https://csp-evaluator.withgoogle.com/
- **Browser DevTools**: Use Console and Network tabs for debugging

---

## Compliance Verification

This CSP implementation satisfies:

- ✅ **Task 10.3**: CSP headers configured in Nginx
- ✅ **Requirement 20.2**: Input validation and injection attack prevention
- ✅ **Security Best Practices**: Strict CSP without `'unsafe-inline'`
- ✅ **Production-Grade**: Suitable for deployment with 50+ users

---

## Next Steps

After successful CSP deployment:

1. **Monitor**: Watch for CSP violations in production
2. **Document**: Record any CSP customizations
3. **Train**: Educate developers on CSP-compliant coding
4. **Maintain**: Keep CSP policy updated with application changes

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Verified By**: _____________

**Notes**: _____________________________________________
