# Error Handling Standards

## Purpose

This document defines the error handling standards that ALL features must follow. Consistent error handling improves debugging, user experience, and API reliability.

---

## Error Response Format

All API errors MUST follow a consistent format with error code, message, and optional details.

### Response Structure

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context (optional)"
  }
}
```

### Fields

- **code** (required): Machine-readable error identifier (UPPER_SNAKE_CASE)
- **message** (required): Human-readable error description
- **details** (optional): Additional context for debugging or validation errors

---

## Standard Error Categories

### Authentication Errors (401 Unauthorized)

User authentication failed or is missing.

**Error Codes:**
- `AUTH_REQUIRED`: Authentication required for this endpoint
- `AUTH_TOKEN_MISSING`: No authentication token provided
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_TOKEN_EXPIRED`: JWT access token expired
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_REFRESH_TOKEN_INVALID`: Refresh token is invalid or revoked
- `AUTH_REFRESH_TOKEN_EXPIRED`: Refresh token expired

**HTTP Status:** 401

**Example:**
```json
{
  "code": "AUTH_TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again."
}
```

---

### Authorization Errors (403 Forbidden)

User is authenticated but not authorized for this action.

**Error Codes:**
- `FORBIDDEN_ROLE`: User role not authorized for this action
- `FORBIDDEN_RESOURCE`: User not authorized to access this resource
- `NOT_OWNER`: User is not the resource owner
- `NOT_ENROLLED`: User is not enrolled or member
- `NOT_MEMBER`: User is not a member of this group

**HTTP Status:** 403

**Example:**
```json
{
  "code": "NOT_OWNER",
  "message": "You do not have permission to modify this resource."
}
```

---

### Validation Errors (400 Bad Request)

Input validation failed.

**Error Codes:**
- `VALIDATION_FAILED`: Input validation failed
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `INVALID_FORMAT`: Field format is invalid
- `INVALID_EMAIL`: Email format invalid
- `INVALID_URL`: URL format invalid
- `INVALID_DATE`: Date is in the past or invalid format
- `INVALID_FILE_TYPE`: File type not allowed
- `INVALID_FILE_SIZE`: File exceeds size limit
- `INVALID_RANGE`: Value outside allowed range

**HTTP Status:** 400

**Example:**
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Input validation failed",
  "details": {
    "email": "Invalid email format",
    "age": "Must be between 0 and 120"
  }
}
```

---

### Business Logic Errors (400 Bad Request / 409 Conflict)

Business rule violation or invalid state transition.

**Error Codes:**
- `RESOURCE_CLOSED`: Resource is closed for modifications
- `RESOURCE_ARCHIVED`: Resource is archived
- `RESOURCE_ACTIVE`: Resource must be archived first
- `DUPLICATE_ENTRY`: Resource already exists
- `INVALID_STATE`: Invalid state transition
- `OPERATION_NOT_ALLOWED`: Operation not allowed in current state
- `QUOTA_EXCEEDED`: User quota exceeded
- `DEPENDENCY_EXISTS`: Cannot delete due to dependencies

**HTTP Status:** 400 (invalid request) or 409 (conflict)

**Example:**
```json
{
  "code": "RESOURCE_CLOSED",
  "message": "This resource is closed and cannot accept new submissions."
}
```

---

### Not Found Errors (404 Not Found)

Requested resource does not exist.

**Error Codes:**
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `USER_NOT_FOUND`: User not found
- `ENDPOINT_NOT_FOUND`: API endpoint not found

**HTTP Status:** 404

**Example:**
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "The requested resource was not found."
}
```

---

### Server Errors (500 Internal Server Error)

Unexpected server error.

**Error Codes:**
- `INTERNAL_ERROR`: Unexpected server error
- `DATABASE_ERROR`: Database operation failed
- `FILE_SYSTEM_ERROR`: File operation failed
- `EXTERNAL_SERVICE_ERROR`: External service call failed
- `CONFIGURATION_ERROR`: Server configuration error

**HTTP Status:** 500

**Example:**
```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Important**: Never expose internal system details in error messages for security reasons.

---

## Error Handling Strategy

### Frontend Error Handling

**1. Network Errors**
- Display "Connection failed" message
- Provide retry option
- Show offline indicator

**2. Validation Errors (400)**
- Show field-specific error messages
- Highlight invalid fields
- Provide correction guidance

**3. Authentication Errors (401)**
- Redirect to login page
- Clear stored tokens
- Show session expired message

**4. Authorization Errors (403)**
- Show "Access Denied" message
- Explain why access was denied
- Provide navigation to allowed areas

**5. Not Found Errors (404)**
- Show "Resource Not Found" message
- Provide navigation back
- Suggest similar resources

**6. Server Errors (500)**
- Display user-friendly error message
- Log error details for debugging
- Provide support contact information

---

### Backend Error Handling

**1. Input Validation**
- Validate all inputs before processing
- Use schema validation (Zod, Joi, etc.)
- Return specific validation errors

**2. Database Errors**
- Retry connection up to 3 times
- Log error with context
- Return generic error to user

**3. File Operations**
- Validate before upload
- Clean up on failure
- Return specific error message

**4. Transaction Rollback**
- Use database transactions for multi-step operations
- Automatic rollback on error
- Log transaction failures

**5. Error Logging**
- Log all errors with timestamp
- Include user context (user ID, not sensitive data)
- Include stack trace for debugging
- Use structured logging (JSON format)

**6. Sanitize Responses**
- Never expose internal system details
- Never expose stack traces to users
- Never expose database errors to users
- Use generic messages for server errors

---

## Error Classes

### Domain Errors (Domain Layer)

Business rule violations:

```typescript
// domain/errors/DomainErrors.ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidStateError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}
```

### Application Errors (Application Layer)

Application-level errors:

```typescript
// application/errors/ApplicationErrors.ts
export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(code: string = 'AUTH_REQUIRED') {
    super(code, 'Authentication required', 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(code: string = 'FORBIDDEN_RESOURCE') {
    super(code, 'Access denied', 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(code: string = 'RESOURCE_NOT_FOUND') {
    super(code, 'Resource not found', 404);
  }
}

export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super('VALIDATION_FAILED', message, 400);
  }
}
```

### Infrastructure Errors (Infrastructure Layer)

Infrastructure-level errors:

```typescript
// infrastructure/errors/InfrastructureErrors.ts
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public readonly originalError: Error) {
    super(message);
    this.name = 'FileSystemError';
  }
}
```

---

## Error Handler Middleware

### Global Error Handler (Presentation Layer)

```typescript
// presentation/api/middleware/ErrorHandlerMiddleware.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Handle known application errors
  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error instanceof ValidationError ? error.details : undefined
    });
  }

  // Handle domain errors
  if (error instanceof DomainError) {
    return res.status(400).json({
      code: 'BUSINESS_RULE_VIOLATION',
      message: error.message
    });
  }

  // Handle database errors
  if (error instanceof DatabaseError) {
    return res.status(500).json({
      code: 'DATABASE_ERROR',
      message: 'A database error occurred. Please try again later.'
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  });
}
```

---

## Error Handling Patterns

### Pattern 1: Try-Catch in Use Cases

```typescript
export class CreateOrderUseCase {
  async execute(dto: CreateOrderDTO, userId: string): Promise<OrderDTO> {
    try {
      // Load data
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new UnauthorizedError();
      }

      // Check authorization
      if (!this.policy.canCreateOrder(user)) {
        throw new ForbiddenError('INSUFFICIENT_PERMISSIONS');
      }

      // Execute business logic
      const order = Order.create(dto);
      await this.orderRepo.save(order);

      return OrderMapper.toDTO(order);
    } catch (error) {
      // Domain errors are thrown as-is
      if (error instanceof DomainError) {
        throw error;
      }

      // Application errors are thrown as-is
      if (error instanceof ApplicationError) {
        throw error;
      }

      // Wrap unexpected errors
      logger.error('Unexpected error in CreateOrderUseCase', { error });
      throw new ApplicationError('INTERNAL_ERROR', 'Failed to create order', 500);
    }
  }
}
```

### Pattern 2: Validation Before Processing

```typescript
export class UpdateProductUseCase {
  async execute(dto: UpdateProductDTO, userId: string): Promise<ProductDTO> {
    // Validate input
    const validation = UpdateProductSchema.safeParse(dto);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid input',
        validation.error.flatten().fieldErrors
      );
    }

    // Continue with business logic
    // ...
  }
}
```

### Pattern 3: Database Error Handling

```typescript
export class PrismaUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    try {
      const dbUser = await this.prisma.user.upsert({
        where: { id: user.getId() },
        create: this.toDatabase(user),
        update: this.toDatabase(user)
      });
      return this.toDomain(dbUser);
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        throw new ApplicationError(
          'DUPLICATE_ENTRY',
          'A user with this email already exists',
          409
        );
      }

      // Wrap other database errors
      throw new DatabaseError('Failed to save user', error);
    }
  }
}
```

### Pattern 4: File Operation Error Handling

```typescript
export class LocalFileStorage implements IFileStorage {
  async upload(file: Buffer, path: string): Promise<string> {
    try {
      const fullPath = join(this.baseDir, path);
      await fs.writeFile(fullPath, file);
      return path;
    } catch (error) {
      // Handle specific file system errors
      if (error.code === 'ENOSPC') {
        throw new ApplicationError(
          'STORAGE_FULL',
          'Storage space is full',
          507
        );
      }

      if (error.code === 'EACCES') {
        throw new ApplicationError(
          'STORAGE_PERMISSION_DENIED',
          'Permission denied',
          500
        );
      }

      // Wrap other file system errors
      throw new FileSystemError('Failed to upload file', error);
    }
  }
}
```

---

## Logging Best Practices

### What to Log

**✅ DO Log:**
- All errors with stack traces
- User context (user ID, not sensitive data)
- Request context (path, method, timestamp)
- Error category and code
- Relevant business context

**❌ DON'T Log:**
- Passwords or secrets
- Credit card numbers
- Personal identifiable information (PII)
- Full request/response bodies (may contain sensitive data)

### Structured Logging

```typescript
// Use structured logging (JSON format)
logger.error('Order creation failed', {
  error: error.message,
  stack: error.stack,
  userId: user.id,
  orderId: order.id,
  timestamp: new Date().toISOString(),
  code: error.code
});
```

### Log Levels

- **ERROR**: Errors that need immediate attention
- **WARN**: Warnings that should be investigated
- **INFO**: Important business events
- **DEBUG**: Detailed debugging information

---

## Testing Error Handling

### Unit Tests

Test error scenarios in use cases:

```typescript
describe('CreateOrderUseCase', () => {
  it('should throw UnauthorizedError when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(createOrderDTO, 'user-id')
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw ForbiddenError when user cannot create order', async () => {
    const user = createUser({ role: Role.GUEST });
    mockUserRepo.findById.mockResolvedValue(user);
    mockPolicy.canCreateOrder.mockReturnValue(false);

    await expect(
      useCase.execute(createOrderDTO, user.id)
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ValidationError for invalid input', async () => {
    const invalidDTO = { ...createOrderDTO, items: [] };

    await expect(
      useCase.execute(invalidDTO, 'user-id')
    ).rejects.toThrow(ValidationError);
  });
});
```

### Integration Tests

Test error responses in API:

```typescript
describe('POST /api/orders', () => {
  it('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(createOrderDTO);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      code: 'AUTH_REQUIRED',
      message: 'Authentication required'
    });
  });

  it('should return 403 when user cannot create order', async () => {
    const token = generateToken({ role: Role.GUEST });
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(createOrderDTO);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('should return 400 for validation errors', async () => {
    const token = generateToken({ role: Role.USER });
    const invalidDTO = { ...createOrderDTO, items: [] };
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDTO);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.details).toBeDefined();
  });
});
```

---

## Best Practices

### ✅ DO

1. **Use specific error codes**
   ```typescript
   throw new ForbiddenError('NOT_OWNER');
   throw new ValidationError('Invalid input', { email: 'Invalid format' });
   ```

2. **Log errors with context**
   ```typescript
   logger.error('Order creation failed', {
     error: error.message,
     userId: user.id,
     orderId: order.id
   });
   ```

3. **Sanitize error messages**
   ```typescript
   // ✅ CORRECT
   throw new ApplicationError('DATABASE_ERROR', 'A database error occurred');
   
   // ❌ WRONG
   throw new Error(`SQL error: ${sqlError.message}`);
   ```

4. **Use appropriate HTTP status codes**
   - 400: Bad Request (validation, business logic)
   - 401: Unauthorized (authentication)
   - 403: Forbidden (authorization)
   - 404: Not Found
   - 409: Conflict (duplicate, state conflict)
   - 500: Internal Server Error

5. **Provide helpful error messages**
   ```typescript
   throw new ValidationError('Invalid email format. Please use a valid email address.');
   ```

### ❌ DON'T

1. **Don't expose internal details**
   ```typescript
   // ❌ WRONG
   throw new Error(`Database connection failed: ${dbError.stack}`);
   
   // ✅ CORRECT
   throw new ApplicationError('DATABASE_ERROR', 'A database error occurred');
   ```

2. **Don't log sensitive data**
   ```typescript
   // ❌ WRONG
   logger.error('Login failed', { password: user.password });
   
   // ✅ CORRECT
   logger.error('Login failed', { userId: user.id });
   ```

3. **Don't swallow errors**
   ```typescript
   // ❌ WRONG
   try {
     await this.orderRepo.save(order);
   } catch (error) {
     // Silent failure
   }
   
   // ✅ CORRECT
   try {
     await this.orderRepo.save(order);
   } catch (error) {
     logger.error('Failed to save order', { error });
     throw error;
   }
   ```

4. **Don't use generic error messages**
   ```typescript
   // ❌ WRONG
   throw new Error('Something went wrong');
   
   // ✅ CORRECT
   throw new ValidationError('Email format is invalid');
   ```

5. **Don't mix error types**
   ```typescript
   // ❌ WRONG
   throw new Error('User not found'); // Should be NotFoundError
   
   // ✅ CORRECT
   throw new NotFoundError('USER_NOT_FOUND');
   ```

---

## Summary

**Key Takeaways:**

1. **Consistent Format**: All errors follow the same JSON structure
2. **Specific Codes**: Use machine-readable error codes
3. **Appropriate Status**: Use correct HTTP status codes
4. **Sanitize Messages**: Never expose internal details
5. **Log Everything**: Log errors with context for debugging
6. **Test Errors**: Test all error scenarios
7. **User-Friendly**: Provide helpful messages to users

**Remember**: Good error handling improves debugging, user experience, and system reliability. Always handle errors gracefully and provide meaningful feedback.
