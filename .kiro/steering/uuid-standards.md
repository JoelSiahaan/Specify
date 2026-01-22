---
inclusion: always
---

# UUID Generation Standards

## Purpose

This document defines the standard for UUID generation across the entire codebase. Consistent UUID generation ensures compatibility with testing, security, and Node.js built-in capabilities.

---

## Standard: Use Node.js Built-in `crypto.randomUUID()`

**ALWAYS use Node.js built-in `crypto.randomUUID()` for UUID generation.**

### ✅ CORRECT Usage

```typescript
import { randomUUID } from 'crypto';

// Generate UUID
const userId = randomUUID();
const courseId = randomUUID();
const fileName = `${randomUUID()}.pdf`;
```

### ❌ WRONG Usage

```typescript
// ❌ DO NOT use uuid package
import { v4 as uuidv4 } from 'uuid';
const userId = uuidv4(); // WRONG

// ❌ DO NOT use uuid package
import * as uuid from 'uuid';
const userId = uuid.v4(); // WRONG
```

---

## Why `crypto.randomUUID()` Instead of `uuid` Package?

### 1. **Built-in to Node.js**
- Available in Node.js 14.17.0+ and 16.0.0+
- No external dependency needed
- Reduces package.json bloat
- One less dependency to maintain

### 2. **Cryptographically Secure**
- Uses Node.js crypto module (same as `uuid` package internally)
- Generates RFC 4122 version 4 UUIDs
- Cryptographically strong random values

### 3. **Testing Compatibility**
- Easy to mock in tests using `jest.spyOn()`
- Consistent with existing test patterns in codebase
- All existing tests use `randomUUID` from crypto

### 4. **Performance**
- Native implementation (faster than JavaScript)
- No overhead from external package

### 5. **Consistency**
- All existing code uses `crypto.randomUUID()`
- Maintains codebase consistency

---

## Usage Examples

### Example 1: Generate Entity ID

```typescript
import { randomUUID } from 'crypto';

export class User {
  static create(props: CreateUserProps): User {
    return new User({
      id: randomUUID(),
      email: props.email,
      name: props.name,
      role: props.role,
      passwordHash: props.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
```

### Example 2: Generate Filename

```typescript
import { randomUUID } from 'crypto';
import * as path from 'path';

export class LocalFileStorage {
  async upload(buffer: Buffer, options: UploadOptions): Promise<FileMetadata> {
    const extension = path.extname(options.originalName);
    const storedName = `${randomUUID()}${extension}`;
    
    // ... rest of upload logic
  }
}
```

### Example 3: Testing with Mock

```typescript
import { randomUUID } from 'crypto';

describe('User Repository', () => {
  it('should create a new user', async () => {
    // Arrange
    const userId = randomUUID();
    
    const user = User.create({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: Role.STUDENT,
      passwordHash: 'hashed_password',
    });
    
    // Act
    await repository.save(user);
    
    // Assert
    const foundUser = await repository.findById(userId);
    expect(foundUser).toBeDefined();
  });
});
```

### Example 4: Mocking UUID in Tests

```typescript
import { randomUUID } from 'crypto';

describe('File Upload', () => {
  it('should generate unique filename', () => {
    // Mock randomUUID to return predictable value
    const mockUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
    
    const fileName = `${randomUUID()}.pdf`;
    
    expect(fileName).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf');
  });
});
```

---

## Migration Guide

If you find code using `uuid` package, migrate it:

### Step 1: Remove `uuid` Import

```typescript
// ❌ BEFORE
import { v4 as uuidv4 } from 'uuid';

// ✅ AFTER
import { randomUUID } from 'crypto';
```

### Step 2: Replace Function Calls

```typescript
// ❌ BEFORE
const id = uuidv4();

// ✅ AFTER
const id = randomUUID();
```

### Step 3: Update Tests

```typescript
// ❌ BEFORE
import { v4 as uuidv4 } from 'uuid';
const testId = uuidv4();

// ✅ AFTER
import { randomUUID } from 'crypto';
const testId = randomUUID();
```

---

## Package.json Cleanup

**DO NOT add `uuid` package to dependencies.**

If you see `uuid` in `package.json`, it can be removed:

```json
{
  "dependencies": {
    "uuid": "^13.0.0"  // ❌ Remove this
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0"  // ❌ Remove this too
  }
}
```

**Note**: The `uuid` package is currently in `package.json` but should not be used. It will be removed in a future cleanup.

---

## Exceptions

**There are NO exceptions.** Always use `crypto.randomUUID()`.

---

## Checklist

When writing code that needs UUID generation:

- [ ] Import `randomUUID` from `crypto` module
- [ ] Use `randomUUID()` to generate UUIDs
- [ ] Do NOT import from `uuid` package
- [ ] Do NOT use `uuidv4()` or any uuid package functions
- [ ] Verify tests use `randomUUID` from crypto
- [ ] Mock `crypto.randomUUID` in tests if needed

---

## References

- **Node.js Crypto Documentation**: https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
- **RFC 4122 (UUID Specification)**: https://www.rfc-editor.org/rfc/rfc4122
- **Existing Codebase Examples**:
  - `backend/src/infrastructure/persistence/repositories/__tests__/PrismaUserRepository.test.ts`
  - `backend/src/infrastructure/persistence/repositories/__tests__/PrismaCourseRepository.test.ts`
  - `backend/src/infrastructure/persistence/repositories/__tests__/PrismaMaterialRepository.test.ts`

---

## Summary

**Key Takeaways:**

1. **Always use `crypto.randomUUID()`** - Built-in, secure, consistent
2. **Never use `uuid` package** - External dependency, inconsistent with codebase
3. **Easy to test** - Mock with `jest.spyOn(crypto, 'randomUUID')`
4. **Consistent with existing code** - All tests already use this pattern

**Remember**: Consistency is key. Using `crypto.randomUUID()` everywhere ensures predictable behavior, easier testing, and reduced dependencies.
