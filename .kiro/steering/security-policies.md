# Security Guidelines

## Purpose

This document defines the security standards that ALL features must follow. Consistent security practices ensure protection against common vulnerabilities and maintain data integrity across the entire application.

---

## Security Philosophy

The LMS implements **Defense in Depth** security strategy, validating security at multiple layers:
- **Domain Layer**: Input validation and business rule enforcement
- **Application Layer**: Authorization policy enforcement
- **Infrastructure Layer**: SQL injection prevention, secure data access
- **Presentation Layer**: Authentication, file upload security, CSRF protection

**Key Principles:**
1. **Security by Design**: Security considerations integrated from the start, not added later
2. **Least Privilege**: Users and processes have minimum necessary permissions
3. **Defense in Depth**: Multiple layers of security controls
4. **Fail Securely**: Errors default to denying access, not granting it
5. **Never Trust User Input**: All input validated and sanitized

---

## Authentication Requirements

### JWT Token-Based Authentication

**Token Configuration:**
- **Access Token**: Short-lived (15 minutes), stored in HTTP-only cookie
- **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie
- **Secret Requirements**: Minimum 32 characters, cryptographically random
- **Separate Secrets**: Access token secret ≠ Refresh token secret

**Cookie Security:**
- **HTTP-only**: Prevents JavaScript access (XSS protection)
- **SameSite=Strict**: Prevents cross-site request forgery (CSRF protection)
- **Secure Flag**: HTTPS-only in production
- **Path**: Scoped to `/api` to limit exposure

**Token Lifecycle:**
1. **Login**: Generate access + refresh tokens, set HTTP-only cookies
2. **Request**: Access token validated on every protected endpoint
3. **Refresh**: Expired access token refreshed using valid refresh token
4. **Logout**: Client-side cookie removal (stateless approach for MVP)

**Security Trade-offs:**
- ✅ **Benefit**: Stateless, horizontally scalable, no server-side session storage
- ⚠️ **Limitation**: Access tokens remain valid until expiration (mitigated by 15-minute lifetime)
- 🔮 **Future Enhancement**: Token blacklist using Redis for immediate revocation

### Password Security

**Hashing:**
- **Algorithm**: BCrypt (industry standard, resistant to rainbow tables)
- **Salt Rounds**: 10 (balance between security and performance)
- **Never Plain Text**: Passwords hashed before storage, never logged or exposed

**Password Requirements:**
- Minimum length enforced at application layer
- Complexity requirements (optional for MVP, recommended for production)
- Password reset flow (future enhancement)

**Security Rules:**
- ✅ **DO**: Hash passwords with BCrypt before storage
- ✅ **DO**: Use unique salt per password (BCrypt handles automatically)
- ❌ **DON'T**: Log passwords or password hashes
- ❌ **DON'T**: Expose password hashes in API responses
- ❌ **DON'T**: Send passwords in error messages

---

## Authorization Requirements

### Role-Based Access Control (RBAC)

**Roles:**
- **Student**: Enroll in courses, submit assignments, take quizzes, view own grades
- **Teacher**: Create courses, manage materials, grade submissions, export grades

**Authorization Strategy:**
- **Application Layer**: Policy-based authorization checks before business logic
- **Pure Functions**: Authorization policies are stateless: `(user, resource, context) => boolean`
- **Fail Securely**: Deny access by default, explicit allow required

**Authorization Flow:**
```
1. Authentication Middleware validates JWT token
2. Controller extracts user from token
3. Use Case loads necessary data
4. Use Case checks authorization policy
5. If authorized → execute business logic
6. If not authorized → throw ForbiddenError (403)
```

**Common Authorization Patterns:**
- **Role-based**: Check user role (Student vs Teacher)
- **Resource-based**: Check resource ownership (teacher owns course)
- **Enrollment-based**: Check student enrollment (student enrolled in course)

**Security Rules:**
- ✅ **DO**: Check authorization before executing business logic
- ✅ **DO**: Use authorization policies (pure functions)
- ✅ **DO**: Return 403 Forbidden for authorization failures
- ❌ **DON'T**: Expose resource existence in authorization errors (use 404 if not found)
- ❌ **DON'T**: Skip authorization checks for "internal" operations

---

## Data Validation Rules

### Input Validation Strategy

**Validation Layers:**
1. **Presentation Layer**: Request schema validation (Zod)
2. **Application Layer**: Business rule validation (Use Cases)
3. **Domain Layer**: Entity invariant validation (Domain Entities)

**Validation Principles:**
- **Whitelist Approach**: Define what is allowed, reject everything else
- **Type Safety**: Use TypeScript and Zod for compile-time and runtime type checking
- **Fail Fast**: Validate early, return clear error messages

### Domain-Specific Validation

**Email Validation:**
- Format: RFC 5322 compliant email format
- Uniqueness: Enforce unique constraint at database level
- Case-insensitive: Normalize to lowercase before storage

**Course Code Validation:**
- Format: 6-character alphanumeric (A-Z, 0-9)
- Uniqueness: Database constraint prevents duplicates
- Generation: Retry up to 5 times on collision

**Grade Validation:**
- Range: 0-100 (inclusive)
- Type: Numeric (float or integer)
- Required: Cannot be null for graded submissions

**Date Validation:**
- Due Dates: Must be in the future when created
- Timezone: Store in UTC, convert to user timezone in frontend
- Format: ISO 8601 (`2025-01-13T10:30:00Z`)

**File Validation:**
- Type: Whitelist allowed MIME types
- Size: Maximum 10MB per file
- Name: Sanitize file names to prevent path traversal

---

## Input Sanitization Standards

### HTML Sanitization (XSS Prevention)

**Client-Side Sanitization:**
- **Library**: DOMPurify
- **When**: Before rendering user-generated HTML in browser
- **Configuration**: Allow safe HTML tags only (p, strong, em, ul, ol, li, a)

**Server-Side Sanitization:**
- **Library**: sanitize-html
- **When**: Before storing user-generated HTML in database
- **Configuration**: Strict whitelist of allowed tags and attributes

**Rich Text Fields:**
- Course descriptions
- Assignment descriptions
- Quiz questions
- Material content (text type)
- Submission feedback

**Security Rules:**
- ✅ **DO**: Sanitize all user-generated HTML before storage
- ✅ **DO**: Sanitize again before rendering (defense in depth)
- ✅ **DO**: Use Content Security Policy (CSP) headers
- ❌ **DON'T**: Trust user input, even from authenticated users
- ❌ **DON'T**: Use `dangerouslySetInnerHTML` without sanitization

### SQL Injection Prevention

**ORM Protection:**
- **Library**: Prisma ORM
- **Mechanism**: Parameterized queries (prepared statements)
- **Automatic**: Prisma handles SQL escaping automatically

**Security Rules:**
- ✅ **DO**: Use Prisma for all database queries
- ✅ **DO**: Use Prisma's query builder (type-safe)
- ❌ **DON'T**: Use raw SQL queries unless absolutely necessary
- ❌ **DON'T**: Concatenate user input into SQL strings
- ❌ **DON'T**: Trust user input in database queries

### Path Traversal Prevention

**File Operations:**
- **Validation**: Reject paths containing `..`, `./`, `~/`
- **Normalization**: Use `path.normalize()` and `path.resolve()`
- **Whitelist**: Only allow files in designated upload directory

**Security Rules:**
- ✅ **DO**: Validate file paths before file operations
- ✅ **DO**: Use absolute paths for file storage
- ✅ **DO**: Store files outside web root
- ❌ **DON'T**: Trust user-provided file paths
- ❌ **DON'T**: Allow directory traversal in file downloads

---

## File Upload Security

### Allowed File Types

**Whitelist Approach:**
- **Documents**: PDF (`.pdf`), DOCX (`.docx`)
- **Images**: JPEG (`.jpg`, `.jpeg`), PNG (`.png`), GIF (`.gif`)
- **Validation**: Check MIME type AND file extension

**Rejected File Types:**
- **Executables**: `.exe`, `.sh`, `.bat`, `.cmd`, `.com`
- **Scripts**: `.js`, `.php`, `.py`, `.rb`, `.pl`
- **Archives**: `.zip`, `.rar`, `.tar`, `.gz` (optional, can be allowed if needed)
- **Videos**: No video file uploads (use external links only)

### File Size Limits

**Maximum Size**: 10MB per file

**Enforcement:**
- **Presentation Layer**: Multer middleware configuration
- **Client-Side**: HTML5 file input validation (user feedback)
- **Server-Side**: Reject files exceeding limit (400 Bad Request)

**Error Handling:**
- Return `INVALID_FILE_SIZE` error code
- Include maximum allowed size in error message

### File Validation Process

**Step 1: Pre-Upload Validation (Client)**
- Check file size before upload
- Check file extension
- Provide immediate user feedback

**Step 2: Upload Validation (Server)**
- Validate MIME type (from file content, not extension)
- Validate file size
- Validate file extension
- Reject if any validation fails

**Step 3: Storage**
- Generate unique file name (UUID + original extension)
- Store in designated upload directory
- Save file metadata to database

**Step 4: Access Control**
- Verify user authorization before file download
- Check enrollment (students) or ownership (teachers)
- Return 403 Forbidden if not authorized

### File Storage Security

**Storage Location:**
- **MVP**: Local filesystem outside web root
- **Production**: Cloud storage (S3) with signed URLs

**File Naming:**
- **Format**: `{uuid}.{extension}` (e.g., `a1b2c3d4-e5f6-7890.pdf`)
- **Reason**: Prevents file name collisions and path traversal

**Access Control:**
- Files not directly accessible via URL
- Download through API endpoint with authorization check
- Temporary signed URLs for cloud storage (future)

---

## Vulnerability Prevention

### Cross-Site Scripting (XSS)

**Prevention Measures:**
- **HTTP-only Cookies**: Prevent JavaScript access to tokens
- **Input Sanitization**: DOMPurify (client) + sanitize-html (server)
- **Content Security Policy**: Restrict script sources
- **Output Encoding**: Escape user-generated content

**Testing:**
- Inject XSS payloads in all text inputs
- Verify sanitization removes malicious scripts
- Test with common XSS vectors

### Cross-Site Request Forgery (CSRF)

**Prevention Measures:**
- **SameSite=Strict Cookies**: Prevent cross-site cookie sending
- **CORS Configuration**: Restrict allowed origins
- **Token-based Auth**: JWT tokens in HTTP-only cookies

**Testing:**
- Attempt cross-site requests
- Verify SameSite policy blocks requests
- Test with different origins

### SQL Injection

**Prevention Measures:**
- **Prisma ORM**: Parameterized queries (automatic)
- **No Raw SQL**: Avoid raw SQL queries
- **Input Validation**: Validate all user input

**Testing:**
- Inject SQL payloads in all inputs
- Verify Prisma escapes malicious SQL
- Test with common SQL injection vectors

### Path Traversal

**Prevention Measures:**
- **Path Validation**: Reject `..`, `./`, `~/` in paths
- **Path Normalization**: Use `path.resolve()`
- **Whitelist Directory**: Only allow files in upload directory

**Testing:**
- Attempt directory traversal in file paths
- Verify validation blocks malicious paths
- Test with common traversal vectors

---

## Secure Coding Practices

### Password Handling

✅ **DO**:
- Hash passwords with BCrypt before storage
- Use minimum 10 salt rounds
- Validate password strength at registration
- Never log passwords or password hashes

❌ **DON'T**:
- Store passwords in plain text
- Expose password hashes in API responses
- Send passwords in error messages
- Log passwords in any form

### Token Handling

✅ **DO**:
- Store tokens in HTTP-only cookies
- Use separate secrets for access and refresh tokens
- Validate token signature and expiration
- Revoke refresh tokens on logout

❌ **DON'T**:
- Store tokens in localStorage (XSS vulnerable)
- Use same secret for all tokens
- Trust expired tokens
- Expose token secrets in code or logs

### Error Messages

✅ **DO**:
- Return generic error messages to users
- Log detailed errors server-side
- Use error codes for client handling
- Sanitize error messages

❌ **DON'T**:
- Expose stack traces to users
- Reveal database errors to users
- Include sensitive data in error messages
- Leak system information in errors

### Database Security

✅ **DO**:
- Use UUID primary keys (security + distributed compatibility)
- Enforce unique constraints at database level
- Use database transactions for multi-step operations
- Validate data before database operations

❌ **DON'T**:
- Use sequential integer IDs (predictable, information leakage)
- Trust application-level uniqueness checks only
- Skip transaction boundaries for critical operations
- Store sensitive data without encryption

### Logging Security

✅ **DO**:
- Log authentication attempts (success and failure)
- Log authorization failures
- Log security-relevant events
- Use structured logging (JSON format)

❌ **DON'T**:
- Log passwords or tokens
- Log sensitive user data (credit cards, SSN)
- Log full request/response bodies (may contain secrets)
- Expose logs to unauthorized users

---

## Security Testing Requirements

### Test Coverage

**All security requirements (Requirement 20) must have corresponding tests:**
- Password hashing (20.1)
- Input validation (20.2)
- File access control (20.3)
- File type validation (20.4)
- File size limits (20.5)

**All authentication endpoints must have security tests:**
- Valid credentials accepted
- Invalid credentials rejected
- Expired tokens rejected
- Tampered tokens rejected

**All authorization checks must have tests:**
- Role-based access control
- Resource ownership validation
- Enrollment-based access

### Security Test Types

**Unit Tests** (Application Layer):
- Authorization policy tests
- Input validation tests
- Business rule enforcement

**Integration Tests** (Infrastructure + Presentation):
- Password hashing verification
- SQL injection prevention
- File upload security
- JWT token validation

**Security Scenarios**:
- XSS injection attempts
- SQL injection attempts
- Path traversal attempts
- CSRF attempts
- Unauthorized access attempts

### Continuous Security

**CI/CD Pipeline:**
- Run security tests on every commit
- Automated vulnerability scanning (npm audit)
- Static code analysis (ESLint security plugins)

**Regular Reviews:**
- Security test suite execution
- Dependency vulnerability checks
- Manual penetration testing for critical flows

---

## Security Checklist

Use this checklist when implementing new features:

### Authentication & Authorization
- [ ] JWT tokens stored in HTTP-only cookies
- [ ] Passwords hashed with BCrypt before storage
- [ ] Authorization checked before business logic
- [ ] Role-based access control enforced
- [ ] Resource ownership validated

### Input Validation
- [ ] All inputs validated at presentation layer (Zod)
- [ ] Business rules validated at application layer
- [ ] Entity invariants validated at domain layer
- [ ] HTML sanitized (DOMPurify + sanitize-html)
- [ ] SQL injection prevented (Prisma ORM)

### File Security
- [ ] File types validated (whitelist approach)
- [ ] File size limits enforced (10MB max)
- [ ] File paths validated (no path traversal)
- [ ] File access requires authorization
- [ ] Dangerous file types rejected

### Error Handling
- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side
- [ ] No sensitive data in error messages
- [ ] No stack traces exposed to users

### Testing
- [ ] Security tests written for all security requirements
- [ ] Authentication tests cover all scenarios
- [ ] Authorization tests cover all access patterns
- [ ] Input validation tests cover malicious inputs
- [ ] File upload tests cover security scenarios

---

## Security Incident Response

### When Security Issue Discovered

1. **Assess Severity**: Critical, High, Medium, Low
2. **Immediate Action**: Disable affected feature if critical
3. **Fix**: Implement security patch
4. **Test**: Verify fix with security tests
5. **Deploy**: Emergency deployment if critical
6. **Review**: Post-mortem to prevent recurrence

### Security Contact

For security vulnerabilities, contact: [security@example.com]

---

## References

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **BCrypt**: https://en.wikipedia.org/wiki/Bcrypt
- **Content Security Policy**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## Summary

**Key Takeaways:**

1. **Defense in Depth**: Security validated at multiple layers
2. **Never Trust Input**: All user input validated and sanitized
3. **Fail Securely**: Errors default to denying access
4. **Test Everything**: All security requirements have tests
5. **Continuous Monitoring**: Security tests in CI/CD pipeline

**Remember**: Security is not a feature, it's a requirement. Every feature must follow these security guidelines to protect user data and maintain system integrity.
