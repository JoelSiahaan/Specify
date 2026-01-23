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

