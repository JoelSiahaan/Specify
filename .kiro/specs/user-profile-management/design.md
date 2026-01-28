# User Profile Management - Design Document

## Overview

Extension of core LMS to allow users to view and update their profile (name) and change password. Follows Clean Architecture and existing patterns from [core-lms/design.md](../core-lms/design.md).

**Key Principles**:
- Reuse existing User entity, repositories, and services (no modifications)
- Follow SOLID principles (Open/Closed, Dependency Inversion)
- Consistent with existing authentication and validation patterns
- Same UI/UX patterns as core LMS

---

## Architecture

### Clean Architecture Layers

**Domain Layer**: Reuse existing `User` entity (no changes)
- Methods: `updateName()`, `updatePassword()`, `getName()`, `getEmail()`, `getRole()`

**Application Layer**: New use cases
- `GetCurrentUserProfileUseCase` - View profile
- `UpdateUserProfileUseCase` - Update name
- `ChangePasswordUseCase` - Change password with verification

**Infrastructure Layer**: Reuse existing
- `IUserRepository` / `PrismaUserRepository` - Data access
- `PasswordService` - BCrypt hashing and verification

**Presentation Layer**: New endpoints and components
- Backend: `UserController` with 3 endpoints
- Frontend: `ProfilePage` with edit forms

### Dependency Injection

Uses TSyringe (same as core LMS):
```typescript
container.register(GetCurrentUserProfileUseCase, { useClass: GetCurrentUserProfileUseCase });
container.register(UpdateUserProfileUseCase, { useClass: UpdateUserProfileUseCase });
container.register(ChangePasswordUseCase, { useClass: ChangePasswordUseCase });
container.register(UserController, { useClass: UserController });
```

---

## Application Layer

### Use Cases

Location: `backend/src/application/use-cases/user/`

#### 1. GetCurrentUserProfileUseCase
- Input: userId (from JWT)
- Output: UserProfileDTO
- Dependencies: IUserRepository (injected)
- Flow: Load user → Map to DTO → Return

#### 2. UpdateUserProfileUseCase
- Input: userId, UpdateUserProfileDTO (name)
- Output: UserProfileDTO
- Dependencies: IUserRepository (injected)
- Flow: Load user → Update name → Save → Return DTO
- Validation: Name 1-100 chars (reuse NameSchema)

#### 3. ChangePasswordUseCase
- Input: userId, ChangePasswordDTO (current, new, confirm)
- Output: ChangePasswordResultDTO
- Dependencies: IUserRepository, PasswordService (injected)
- Flow: Load user → Verify current password → Hash new password → Save
- Validation: Password strength (same as registration), confirm match
- Security: BCrypt verification and hashing, session remains valid

### DTOs

Add to `backend/src/application/dtos/UserDTO.ts`:
```typescript
export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileDTO {
  name: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResultDTO {
  success: boolean;
  message: string;
}
```

### Mappers

Add to `backend/src/application/mappers/UserMapper.ts`:
```typescript
static toProfileDTO(user: User): UserProfileDTO {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail(),
    role: user.getRole(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt()
  };
}
```

---

## Presentation Layer (Backend)

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/users/profile` | Get current user profile | Required |
| PUT | `/api/users/profile` | Update name | Required |
| PUT | `/api/users/password` | Change password | Required |

**Response Format**: Follows [api-standards.md](../../.kiro/steering/api-standards.md)

### Controller

`backend/src/presentation/api/controllers/UserController.ts`:
- Thin controller pattern (same as core LMS)
- Extract userId from JWT (req.user)
- Validate with Zod schemas
- Delegate to use cases
- Return standardized responses

### Validation Schemas

`backend/src/presentation/api/validators/userSchemas.ts`:
```typescript
// Reuse NameSchema from authSchemas for consistency
export const UpdateProfileRequestSchema = z.object({
  name: NameSchema
});

// Password strength (same as registration)
export const StrongPasswordSchema = z.string()
  .min(8).max(128)
  .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: StrongPasswordSchema,
  confirmPassword: z.string().min(1)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});
```

### Routes

Add to `backend/src/presentation/api/routes/index.ts`:
```typescript
router.get('/users/profile', authenticate, userController.getProfile);
router.put('/users/profile', authenticate, userController.updateProfile);
router.put('/users/password', authenticate, userController.changePassword);
```

---

## Presentation Layer (Frontend)

### UI Design

**Access**: Click user name in top navigation → "Profile" option → Navigate to `/profile`

**Layout**: Full-width page (NO sidebar), centered content, max-width container, all forms on same page

```
┌─────────────────────────────────────────────┐
│     Top Navigation Bar                      │
│  [Logo] Dashboard  [🔔] [User ▼]           │
│                         └─ Profile          │
│                            Logout           │
├─────────────────────────────────────────────┤
│                                             │
│     ┌─────────────────────────────┐        │
│     │  Profile Information        │        │
│     │                             │        │
│     │  Name: John Doe             │        │
│     │  Email: john@example.com    │        │
│     │  Role: Student              │        │
│     │  Member since: Jan 13, 2025 │        │
│     └─────────────────────────────┘        │
│                                             │
│     ┌─────────────────────────────┐        │
│     │  Edit Name                  │        │
│     │                             │        │
│     │  Name: [John Doe_______]    │        │
│     │  [Save Changes]             │        │
│     └─────────────────────────────┘        │
│                                             │
│     ┌─────────────────────────────┐        │
│     │  Change Password            │        │
│     │                             │        │
│     │  Current: [••••••••] [👁]   │        │
│     │  New: [••••••••] [👁]       │        │
│     │  Confirm: [••••••••] [👁]   │        │
│     │  [Change Password]          │        │
│     └─────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

**Styling**: Tailwind CSS, Moodle-inspired (see [ui-design-guidelines.md](../../.kiro/steering/ui-design-guidelines.md))
- Card: `bg-white border border-gray-200 rounded shadow-sm p-6 mb-6`
- Button: `bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded`
- Input: `w-full h-10 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary`

### Components

Location: `frontend/src/presentation/web/`

**ProfilePage** (`pages/profile/ProfilePage.tsx`):
- Main page component
- State: profile, loading, error
- Renders all sections on same page:
  - Profile information (read-only card)
  - Edit name form (inline below profile info)
  - Change password form (inline below edit name)
- No modals, no separate pages

**ProfileInfoCard** (`components/profile/ProfileInfoCard.tsx`):
- Display profile information (read-only)
- Props: profile
- Shows: name, email, role, member since

**EditNameForm** (`components/profile/EditNameForm.tsx`):
- Inline form for name editing
- Props: profile, onSave
- Single input field with save button
- Validation: Name 1-100 chars

**ChangePasswordForm** (`components/profile/ChangePasswordForm.tsx`):
- Inline form for password change
- Props: onSuccess
- Three password fields with show/hide toggles
- Validation: Password strength, match confirmation

### Services

Location: `frontend/src/presentation/web/services/userService.ts`

```typescript
export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (name: string): Promise<UserProfile> => {
  const response = await api.put('/users/profile', { name });
  return response.data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> => {
  const response = await api.put('/users/password', {
    currentPassword, newPassword, confirmPassword
  });
  return response.data;
};
```

### Types

Add to `frontend/src/presentation/web/types/user.types.ts`:
```typescript
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
}
```

### Navigation

Update `TopNavigation` component:
- Add "Profile" option to user dropdown menu
- Navigate to `/profile` on click

Add route to `router.tsx`:
```typescript
{
  path: '/profile',
  element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
}
```

---

## Security

Follows [security-policies.md](../../.kiro/steering/security-policies.md):
- JWT authentication required
- User can only access own profile
- Password verified before change
- BCrypt hashing (10 rounds)
- No passwords in logs or errors
- Session remains valid after password change

---

## Testing

Follows [testing-strategy.md](../../.kiro/steering/testing-strategy.md):

**Unit Tests**:
- Use cases: Valid inputs, validation errors, authorization
- Components: Rendering, user interactions, validation

**Integration Tests**:
- API endpoints: Success, validation, authentication, authorization

**Property-Based Tests** (fast-check, 100+ iterations):
- Password change with valid inputs always succeeds
- Password hashing always produces BCrypt hash
- Name validation consistent with registration
- Authorization always enforces user ownership

---

## Database Schema

No changes required. Existing User table supports all operations:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // BCrypt hashed
  name      String   // Editable
  role      Role     // Read-only
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Error Handling

Follows [error-handling.md](../../.kiro/steering/error-handling.md):

**Error Codes**:
- `AUTH_REQUIRED` (401) - Not authenticated
- `VALIDATION_FAILED` (400) - Invalid input
- `INVALID_CURRENT_PASSWORD` (400) - Wrong current password
- `USER_NOT_FOUND` (404) - User not found
- `INTERNAL_ERROR` (500) - Server error

**Error Messages**:
- "Name is required"
- "Current password is incorrect"
- "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
- "Passwords do not match"

---

## Implementation Order

1. Backend: DTOs, mappers, use cases
2. Backend: Controller, validation schemas, routes
3. Backend: Unit tests, integration tests
4. Frontend: Types, services
5. Frontend: Components (ProfileView, EditProfileForm, ChangePasswordModal)
6. Frontend: ProfilePage, routing, navigation
7. Frontend: Component tests
8. Property-based tests
9. End-to-end testing

---

## Summary

This feature extends the core LMS with profile management capabilities while maintaining architectural consistency. It reuses existing infrastructure (User entity, repositories, services) and follows established patterns (Clean Architecture, SOLID, validation, security, UI/UX).

**No Breaking Changes**: All changes are additive (new use cases, endpoints, components).
