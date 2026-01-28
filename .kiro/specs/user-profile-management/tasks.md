# User Profile Management - Implementation Tasks

## Overview
Implementation tasks for user profile management feature (view profile, edit name, change password).

**References**:
- [Requirements](./requirements.md)
- [Design](./design.md)

---

## Tasks

### 1. Feature: User Profile Management (End-to-End)

**Goal**: Users can view their profile, edit their name, and change their password. Fully working user profile management system.

- [ ] 1. Feature: User Profile Management (End-to-End)
  - Build complete user profile management system with view, edit name, and change password functionality
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

#### 1.1 Domain Layer - User Profile Extensions

- [x] 1.1 Domain Layer - User Profile Extensions
  - Extend existing User entity with profile management methods (no new entities needed)
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 2.4_

- [x] 1.1.1 Verify User entity has updateName method
  - Priority: HIGH
  - Dependencies: None (existing User entity)
  - Can be parallelized: Yes
  - Verify `backend/src/domain/entities/User.ts` has `updateName(name: string)` method
  - Verify name validation (1-100 chars after trim)
  - No changes needed if method exists
  - _Requirements: 1.2, 2.2_

- [x] 1.1.2 Verify User entity has updatePasswordHash method
  - Priority: HIGH
  - Dependencies: None (existing User entity)
  - Can be parallelized: Yes
  - Verify `backend/src/domain/entities/User.ts` has `updatePasswordHash(hash: string)` method
  - No changes needed if method exists
  - _Requirements: 1.3, 2.3, 2.4_

#### 1.2 Infrastructure Layer - No Changes Required

- [x] 1.2 Infrastructure Layer - No Changes Required
  - Existing User repository and password service are sufficient
  - _Requirements: N/A_

- [x] 1.2.1 Verify PrismaUserRepository has required methods
  - Priority: HIGH
  - Dependencies: None (existing repository)
  - Can be parallelized: Yes
  - Verify `backend/src/infrastructure/persistence/repositories/PrismaUserRepository.ts` has:
    - `findById(id: string)` method
    - `save(user: User)` method
  - No changes needed if methods exist
  - _Requirements: N/A_

- [x] 1.2.2 Verify PasswordService has required methods
  - Priority: HIGH
  - Dependencies: None (existing service)
  - Can be parallelized: Yes
  - Verify `backend/src/infrastructure/auth/PasswordService.ts` has:
    - `hash(password: string)` method
    - `verify(password: string, hash: string)` method
  - No changes needed if methods exist
  - _Requirements: 2.3, 2.4, 4.3_

#### 1.3 Application Layer - Profile Use Cases

- [x] 1.3 Application Layer - Profile Use Cases
  - Implement use cases, DTOs, and mappers for profile operations
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.4, 2.5, 4.2, 4.3_

- [x] 1.3.1 Add profile DTOs to UserDTO.ts
  - Priority: HIGH
  - Dependencies: None (extends existing DTOs)
  - Can be parallelized: Yes (with 1.3.2, 1.3.3)
  - Update `backend/src/application/dtos/UserDTO.ts`
  - Add `UserProfileDTO` interface (id, name, email, role, createdAt, updatedAt)
  - Add `UpdateUserProfileDTO` interface (name)
  - Add `ChangePasswordDTO` interface (currentPassword, newPassword, confirmPassword)
  - Add `ChangePasswordResultDTO` interface (success, message)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.3.2 Add toProfileDTO mapper method
  - Priority: HIGH
  - Dependencies: 1.3.1
  - Can be parallelized: Yes (with 1.3.3, 1.3.4, 1.3.5, 1.3.6)
  - Update `backend/src/application/mappers/UserMapper.ts`
  - Add `toProfileDTO()` static method
  - Map User entity to UserProfileDTO (exclude password hash)
  - _Requirements: 1.1_

- [x] 1.3.3 Create user use cases directory
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 1.3.1, 1.3.2)
  - Create `backend/src/application/use-cases/user/` directory
  - _Requirements: N/A_

- [x] 1.3.4 Implement GetCurrentUserProfileUseCase
  - Priority: HIGH
  - Dependencies: 1.3.2, 1.3.3, 1.2.1 (repository verification)
  - Can be parallelized: Yes (with 1.3.5, 1.3.6)
  - Create `backend/src/application/use-cases/user/GetCurrentUserProfileUseCase.ts`
  - Input: userId (from JWT)
  - Output: UserProfileDTO
  - Dependencies: IUserRepository (injected)
  - Flow: Load user → Map to DTO → Return
  - Error handling: User not found (404)
  - Register in DI container as transient
  - _Requirements: 1.1, 4.2_

- [x] 1.3.5 Implement UpdateUserProfileUseCase
  - Priority: HIGH
  - Dependencies: 1.3.2, 1.3.3, 1.2.1, 1.1.1 (entity verification)
  - Can be parallelized: Yes (with 1.3.4, 1.3.6)
  - Create `backend/src/application/use-cases/user/UpdateUserProfileUseCase.ts`
  - Input: userId, UpdateUserProfileDTO (name)
  - Output: UserProfileDTO
  - Dependencies: IUserRepository (injected)
  - Flow: Load user → Update name (entity method) → Save → Return DTO
  - Validation: Name 1-100 chars (domain entity validates)
  - Error handling: User not found (404), validation error (400)
  - Register in DI container as transient
  - _Requirements: 1.2, 2.2, 4.2_

- [x] 1.3.6 Implement ChangePasswordUseCase
  - Priority: HIGH
  - Dependencies: 1.3.1, 1.3.3, 1.2.1, 1.2.2 (service verification), 1.1.2 (entity verification)
  - Can be parallelized: Yes (with 1.3.4, 1.3.5)
  - Create `backend/src/application/use-cases/user/ChangePasswordUseCase.ts`
  - Input: userId, ChangePasswordDTO (current, new, confirm)
  - Output: ChangePasswordResultDTO
  - Dependencies: IUserRepository, PasswordService (injected)
  - Flow: Load user → Verify current password → Hash new password → Update entity → Save
  - Validation: Password strength (8+ chars, uppercase, lowercase, number, special), confirm match
  - Security: BCrypt verification and hashing, session remains valid
  - Error handling: User not found (404), wrong password (400), validation error (400)
  - Register in DI container as transient
  - _Requirements: 1.3, 2.3, 2.4, 2.5, 4.3_

- [x] 1.3.7 Create use cases index file
  - Priority: HIGH
  - Dependencies: 1.3.4, 1.3.5, 1.3.6
  - Can be parallelized: No
  - Create `backend/src/application/use-cases/user/index.ts`
  - Export all use cases
  - _Requirements: N/A_

#### 1.4 Presentation Layer - Profile API

- [x] 1.4 Presentation Layer - Profile API
  - Implement API controllers, validation schemas, and routes
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 4.1_

- [x] 1.4.1 Create userSchemas.ts with validation rules
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 1.4.2)
  - Create `backend/src/presentation/api/validators/userSchemas.ts`
  - Import and reuse `NameSchema` from authSchemas (1-100 chars)
  - Create `UpdateProfileRequestSchema` (name field)
  - Create `StrongPasswordSchema` (min 8, max 128, uppercase, lowercase, number, special char)
  - Create `ChangePasswordRequestSchema` (currentPassword, newPassword, confirmPassword)
  - Add refine validation for password match
  - Export TypeScript types
  - _Requirements: 2.2, 2.3_

- [x] 1.4.2 Implement UserController
  - Priority: HIGH
  - Dependencies: 1.3.7 (use cases), 1.4.1 (schemas), 2.4.2 (auth middleware from core-lms), 2.4.3 (error handler), 2.4.4 (validation middleware)
  - Can be parallelized: No
  - Create `backend/src/presentation/api/controllers/UserController.ts`
  - Inject use cases via TSyringe
  - Implement `getProfile()` - GET /api/users/profile
  - Implement `updateProfile()` - PUT /api/users/profile
  - Implement `changePassword()` - PUT /api/users/password
  - Extract userId from req.user (JWT)
  - Validate requests with Zod schemas
  - Return standardized responses (200, 400, 401, 404, 500)
  - _Requirements: 1.1, 1.2, 1.3, 4.1_

- [x] 1.4.3 Add routes to router
  - Priority: HIGH
  - Dependencies: 1.4.2
  - Can be parallelized: No
  - Update `backend/src/presentation/api/routes/index.ts`
  - Add GET /users/profile route with authenticate middleware
  - Add PUT /users/profile route with authenticate middleware
  - Add PUT /users/password route with authenticate middleware
  - _Requirements: 4.1_

- [x] 1.4.4 Register in DI container
  - Priority: HIGH
  - Dependencies: 1.4.2
  - Can be parallelized: No
  - Update `backend/src/infrastructure/di/container.ts`
  - Register GetCurrentUserProfileUseCase as transient
  - Register UpdateUserProfileUseCase as transient
  - Register ChangePasswordUseCase as transient
  - Register UserController
  - _Requirements: N/A_

- [x]* 1.4.5 Write API integration tests for profile endpoints
  - Priority: MEDIUM
  - Dependencies: 1.4.3, 1.5 (testing framework from core-lms)
  - Can be parallelized: Yes (with other tests)
  - Create `backend/src/presentation/api/controllers/__tests__/UserController.integration.test.ts`
  - Test GET /api/users/profile - success (200)
  - Test GET /api/users/profile - not authenticated (401)
  - Test PUT /api/users/profile - success (200)
  - Test PUT /api/users/profile - validation error (400)
  - Test PUT /api/users/profile - not authenticated (401)
  - Test PUT /api/users/password - success (200)
  - Test PUT /api/users/password - wrong current password (400)
  - Test PUT /api/users/password - password mismatch (400)
  - Test PUT /api/users/password - not authenticated (401)
  - Use Supertest for HTTP testing
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

#### 1.5 Presentation Layer - Profile Frontend

- [x] 1.5 Presentation Layer - Profile Frontend
  - Implement React components for profile management UI
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 1.5.1 Add user profile types
  - Priority: HIGH
  - Dependencies: 1.4.3 (API routes) or can use mocks
  - Can be parallelized: Yes (with 1.5.2, 1.5.3, 1.5.4)
  - Update `frontend/src/presentation/web/types/user.types.ts`
  - Add `UserProfile` interface (id, name, email, role, createdAt, updatedAt)
  - Add `ChangePasswordResult` interface (success, message)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.5.2 Create userService with API calls
  - Priority: HIGH
  - Dependencies: 1.5.1
  - Can be parallelized: Yes (with 1.5.3, 1.5.4)
  - Create `frontend/src/presentation/web/services/userService.ts`
  - Implement `getProfile()` - GET /api/users/profile
  - Implement `updateProfile(name)` - PUT /api/users/profile
  - Implement `changePassword(current, new, confirm)` - PUT /api/users/password
  - Handle errors and return typed responses
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.5.3 Add API endpoint constants
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 1.5.1, 1.5.2, 1.5.4)
  - Update `frontend/src/presentation/web/constants/apiEndpoints.ts`
  - Add USER_PROFILE: '/users/profile'
  - Add USER_PASSWORD: '/users/password'
  - _Requirements: N/A_

- [x] 1.5.4 Create profile components directory
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 1.5.1, 1.5.2, 1.5.3)
  - Create `frontend/src/presentation/web/components/profile/` directory
  - _Requirements: N/A_

- [x] 1.5.5 Implement ProfileInfoCard component
  - Priority: HIGH
  - Dependencies: 1.5.1, 1.5.4, 2.5.1 (shared components from core-lms)
  - Can be parallelized: Yes (with 1.5.6, 1.5.7)
  - Create `frontend/src/presentation/web/components/profile/ProfileInfoCard.tsx`
  - Display profile information (read-only)
  - Props: profile (UserProfile)
  - Show: name, email, role, member since (formatted date)
  - Styling: Tailwind CSS card (bg-white, border, rounded, shadow-sm, p-6)
  - _Requirements: 1.1, 2.1_

- [x] 1.5.6 Implement EditNameForm component
  - Priority: HIGH
  - Dependencies: 1.5.2, 1.5.4, 2.5.1 (shared components)
  - Can be parallelized: Yes (with 1.5.5, 1.5.7)
  - Create `frontend/src/presentation/web/components/profile/EditNameForm.tsx`
  - Inline form for name editing
  - Props: profile (UserProfile), onSave (callback)
  - Single input field with save button
  - Validation: Name 1-100 chars (client-side)
  - Loading state during save
  - Success/error feedback (toast or inline message)
  - Styling: Tailwind CSS form components
  - _Requirements: 1.2, 2.2, 3.2_

- [x] 1.5.7 Implement ChangePasswordForm component
  - Priority: HIGH
  - Dependencies: 1.5.2, 1.5.4, 2.5.1 (shared components)
  - Can be parallelized: Yes (with 1.5.5, 1.5.6)
  - Create `frontend/src/presentation/web/components/profile/ChangePasswordForm.tsx`
  - Inline form for password change
  - Props: onSuccess (callback)
  - Three password fields: current, new, confirm
  - Show/hide password toggles (eye icon)
  - Validation: Password strength (8+ chars, uppercase, lowercase, number, special), match confirmation
  - Loading state during save
  - Success/error feedback (toast or inline message)
  - Styling: Tailwind CSS form components
  - _Requirements: 1.3, 2.3, 3.2_

- [x] 1.5.8 Create profile components index
  - Priority: HIGH
  - Dependencies: 1.5.5, 1.5.6, 1.5.7
  - Can be parallelized: No
  - Create `frontend/src/presentation/web/components/profile/index.ts`
  - Export all profile components
  - _Requirements: N/A_

- [x] 1.5.9 Create profile page directory
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes
  - Create `frontend/src/presentation/web/pages/profile/` directory
  - _Requirements: N/A_

- [x] 1.5.10 Implement ProfilePage component
  - Priority: HIGH
  - Dependencies: 1.5.8, 1.5.9
  - Can be parallelized: No
  - Create `frontend/src/presentation/web/pages/profile/ProfilePage.tsx`
  - Main page component
  - State: profile, loading, error
  - Fetch profile on mount using userService.getProfile()
  - Render all sections on same page (no modals, no separate pages):
    - ProfileInfoCard (top)
    - EditNameForm (middle)
    - ChangePasswordForm (bottom)
  - Full-width layout (no sidebar)
  - Centered content with max-width container (max-w-3xl)
  - Handle loading state (spinner)
  - Handle error state (error message)
  - Refresh profile after name update
  - Show success message after password change
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [x] 1.5.11 Update TopNavigation with profile link
  - Priority: HIGH
  - Dependencies: 1.5.10
  - Can be parallelized: Yes (with 1.5.12, 1.5.13)
  - Update `frontend/src/presentation/web/components/layout/TopNavigation.tsx`
  - Add "Profile" option to user dropdown menu
  - Navigate to `/profile` on click
  - _Requirements: 3.3_

- [x] 1.5.12 Add profile route
  - Priority: HIGH
  - Dependencies: 1.5.10
  - Can be parallelized: Yes (with 1.5.11, 1.5.13)
  - Update `frontend/src/presentation/web/routes/router.tsx`
  - Add `/profile` route
  - Wrap with ProtectedRoute (authentication required)
  - Render ProfilePage component
  - _Requirements: 3.3, 4.1_

- [x] 1.5.13 Add profile route constant
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 1.5.11, 1.5.12)
  - Update `frontend/src/presentation/web/constants/routes.ts`
  - Add PROFILE: '/profile' constant
  - _Requirements: N/A_

- [x]* 1.5.14 Write React component tests for profile
  - Priority: MEDIUM
  - Dependencies: 1.5.10, 1.5 (testing framework from core-lms)
  - Can be parallelized: Yes (with other tests)
  - Create `frontend/src/presentation/web/components/profile/__tests__/` directory
  - Create `ProfileInfoCard.test.tsx` - test renders profile information correctly
  - Create `EditNameForm.test.tsx` - test name validation and save
  - Create `ChangePasswordForm.test.tsx` - test password validation and change
  - Create `frontend/src/presentation/web/pages/profile/__tests__/` directory
  - Create `ProfilePage.test.tsx` - test page integration
  - Use React Testing Library
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3_

#### 1.6 Feature Checkpoint - User Profile Management

- [ ] 1.6 Feature Checkpoint - User Profile Management
  - Run all tests and perform end-to-end validation
  - _Requirements: All (1.1-4.4)_

- [ ] 1.6.1 Run all user profile management tests
  - Priority: HIGH
  - Dependencies: All Section 1 tasks (1.1.x - 1.5.x)
  - Can be parallelized: No
  - Run all use case unit tests
  - Run all API integration tests
  - Run all React component tests
  - Run all property-based tests (if implemented, 100+ iterations each)
  - Verify all tests pass
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.4, 4.2, 4.3_

- [ ] 1.6.2 Manual end-to-end testing
  - Priority: HIGH
  - Dependencies: 1.6.1
  - Can be parallelized: No
  - Test view profile information (name, email, role, member since)
  - Test edit name successfully (valid name)
  - Test edit name with validation errors (empty, too long)
  - Test change password successfully (valid passwords)
  - Test change password with wrong current password
  - Test change password with mismatched passwords
  - Test change password with weak password
  - Test session remains valid after password change
  - Test unauthorized access returns 401
  - Test UI displays correctly on desktop (1024px+)
  - Test UI displays correctly on mobile (< 768px)
  - Verify all acceptance criteria (1.1-4.4)
  - _Requirements: All (1.1-4.4)_

**✅ DELIVERABLE**: Fully working user profile management system. Users can view their profile, edit their name, and change their password.

---

## Notes

- **Reuse Existing Code**: NameSchema from authSchemas.ts, User entity methods (updateName, updatePasswordHash), existing repositories and services
- **No Modifications**: User entity, repositories, and password service remain unchanged
- **All Additive**: New use cases, endpoints, and components only
- **UI Layout**: All forms on same page (no modals, no separate pages)
- **Security**: JWT authentication, BCrypt hashing, no passwords in logs
