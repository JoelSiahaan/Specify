# User Profile Management - Requirements

## Feature Overview

Users need the ability to manage their profile information, specifically updating their name and changing their password. This feature enhances user control and security by allowing them to keep their information current and maintain password security.

## User Stories

### US-1: View Profile Information
**As a** logged-in user (Student or Teacher)  
**I want to** view my profile information  
**So that** I can see my current account details

**Acceptance Criteria:**
1. User can access profile page from navigation menu
2. Profile page displays:
   - Full name
   - Email address (read-only)
   - Role (Student or Teacher, read-only)
   - Account creation date
3. Profile page has clear "Edit Profile" and "Change Password" buttons

---

### US-2: Edit Profile Name
**As a** logged-in user  
**I want to** update my name  
**So that** my profile displays my current or preferred name

**Acceptance Criteria:**
1. User can click "Edit Profile" button to enter edit mode
2. Name field becomes editable
3. User can update their name
4. System validates (same as registration):
   - Name is not empty (after trimming whitespace)
   - Name is between 1-100 characters
   - Whitespace is trimmed before validation
5. User can save changes or cancel
6. On successful save:
   - Profile updates immediately
   - Success message displayed
   - User remains on profile page
7. On validation error:
   - Error message displayed
   - User can correct and retry
8. On cancel:
   - Changes discarded
   - Original name restored

---

### US-3: Change Password
**As a** logged-in user  
**I want to** change my password  
**So that** I can maintain account security

**Acceptance Criteria:**
1. User can click "Change Password" button to open password change form
2. Form requires three fields:
   - Current password
   - New password
   - Confirm new password
3. System validates:
   - Current password is correct
   - New password meets strength requirements (same as registration):
     - Minimum 8 characters
     - Contains at least one uppercase letter
     - Contains at least one lowercase letter
     - Contains at least one number
     - Contains at least one special character
   - New password is different from current password
   - Confirm password matches new password
4. All password fields are masked (type="password")
5. Show/hide password toggle available for each field
6. On successful password change:
   - Password updated in database (BCrypt hashed)
   - Success message displayed
   - User remains logged in (current session valid)
   - Form cleared
7. On validation error:
   - Specific error message displayed
   - User can correct and retry
8. On cancel:
   - Form cleared
   - User returns to profile view

---

## Functional Requirements

### FR-1: Profile View
- Display user profile information in read-only mode by default
- Show email and role as non-editable fields
- Provide clear visual distinction between editable and non-editable fields
- Display account creation date for reference

### FR-2: Name Update
- Allow users to edit their name
- Validate name format and length
- Update name in database on successful validation
- Reflect name change across all user interfaces immediately
- Maintain audit trail (updatedAt timestamp)

### FR-3: Password Change
- Require current password verification before allowing change
- Enforce same password strength requirements as registration
- Hash new password with BCrypt before storage
- Prevent reuse of current password
- Clear password fields after successful change
- Do not invalidate current session (user stays logged in)

### FR-4: Authorization
- Only authenticated users can access profile management
- Users can only edit their own profile
- No admin or teacher can edit other users' profiles (out of scope)

### FR-5: Error Handling
- Display clear, user-friendly error messages
- Validate input on both client and server side
- Handle network errors gracefully
- Provide retry options on failure

---

## Non-Functional Requirements

### NFR-1: Security
- Current password must be verified before password change
- New passwords must be BCrypt hashed (10 salt rounds)
- Password fields must be masked by default
- No password should be logged or exposed in error messages
- Session tokens remain valid after password change (no forced logout)

### NFR-2: Usability
- Profile page accessible from main navigation
- Clear visual feedback for all actions
- Inline validation for immediate feedback
- Confirmation messages for successful updates
- Cancel option available for all edit operations

### NFR-3: Performance
- Profile page loads in < 500ms
- Name update completes in < 1 second
- Password change completes in < 2 seconds (BCrypt hashing time)

### NFR-4: Data Integrity
- Name updates are atomic (all or nothing)
- Password changes are atomic (all or nothing)
- Concurrent updates handled safely
- Database constraints prevent invalid data

---

## Business Rules

### BR-1: Name Validation
- Name must be 1-100 characters long (after trimming whitespace)
- Name cannot be empty or only whitespace
- Name is trimmed before storage
- Same validation rules as registration

### BR-2: Password Validation
- Current password must match stored hash
- New password must meet strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- New password must be different from current password
- Confirm password must exactly match new password

### BR-3: Email and Role Immutability
- Email cannot be changed (used as unique identifier)
- Role cannot be changed (security constraint)
- These fields are displayed as read-only

### BR-4: Session Management
- Password change does not invalidate current session
- User remains logged in after password change
- Future enhancement: Option to logout all other sessions

---

## User Interface Requirements

### UI-1: Profile Page Layout
- Two-column layout (consistent with LMS design)
- Left sidebar: Main navigation
- Main content area: Profile information and edit forms
- Breadcrumb: Home > Profile

### UI-2: Profile View Mode
- Card-based layout for profile information
- Clear section headers
- Read-only fields visually distinct (grayed out)
- Action buttons: "Edit Profile" and "Change Password"

### UI-3: Edit Profile Form
- Inline editing (no separate page)
- Name field becomes editable
- Save and Cancel buttons
- Validation errors displayed inline
- Success message displayed as toast notification

### UI-4: Change Password Form
- Modal dialog or separate card
- Three password fields (current, new, confirm)
- Show/hide password toggles
- Password strength indicator (optional)
- Save and Cancel buttons
- Validation errors displayed inline
- Success message displayed as toast notification

---

## API Endpoints

### GET /api/users/profile
- Get current user's profile information
- Returns: User object (id, name, email, role, createdAt, updatedAt)
- Auth: Required (JWT token)
- Status: 200 OK, 401 Unauthorized

### PUT /api/users/profile
- Update current user's name
- Body: { name: string }
- Returns: Updated user object
- Auth: Required (JWT token)
- Status: 200 OK, 400 Bad Request, 401 Unauthorized

### PUT /api/users/password
- Change current user's password
- Body: { currentPassword: string, newPassword: string, confirmPassword: string }
- Returns: Success message
- Auth: Required (JWT token)
- Status: 200 OK, 400 Bad Request, 401 Unauthorized

---

## Out of Scope

The following features are explicitly out of scope for this initial implementation:

1. **Email Change**: Email is used as unique identifier and cannot be changed
2. **Role Change**: Role is security-critical and cannot be self-modified
3. **Profile Photo**: No image upload or avatar functionality
4. **Email Verification**: No email verification flow for changes
5. **Logout All Sessions**: Password change does not invalidate other sessions
6. **Profile History**: No audit log of profile changes visible to user
7. **Account Deletion**: Users cannot delete their own accounts
8. **Two-Factor Authentication**: No 2FA setup in profile
9. **Privacy Settings**: No privacy or notification preferences
10. **Admin Profile Management**: Admins cannot edit other users' profiles

---

## Success Metrics

### User Adoption
- 80% of users access profile page within first month
- 50% of users update their name at least once
- 30% of users change their password at least once

### Functionality
- Profile view loads successfully 99% of the time
- Name update success rate > 95%
- Password change success rate > 90%
- Zero unauthorized profile access incidents

### Usability
- Users can update name in < 30 seconds
- Users can change password in < 60 seconds
- < 5% of users contact support for profile issues

---

## Dependencies

### Technical Dependencies
- Existing authentication system (JWT tokens)
- Existing user repository and database schema
- BCrypt password hashing service
- Existing authorization policies

### Feature Dependencies
- User must be logged in (authentication required)
- User entity must exist in database
- Password service must be available

---

## Constraints

### Technical Constraints
- Must use existing Clean Architecture structure
- Must follow existing security policies
- Must use Prisma ORM for database access
- Must use BCrypt for password hashing (10 salt rounds)

### Business Constraints
- Email cannot be changed (unique identifier)
- Role cannot be changed (security constraint)
- Password change does not force logout (user experience)

### UI Constraints
- Must follow existing Moodle-inspired design system
- Must use Tailwind CSS for styling
- Must be responsive (desktop, tablet, mobile)
- Must be accessible (WCAG 2.1 AA)

---

## Risks and Mitigations

### Risk 1: Password Change Breaks Session
**Mitigation**: Ensure password change does not invalidate current JWT token. Only hash and store new password, do not touch session management.

### Risk 2: Concurrent Profile Updates
**Mitigation**: Use database transactions and optimistic locking (updatedAt timestamp check).

### Risk 3: Weak Password Validation
**Mitigation**: Enforce same password strength requirements as registration. Validate on both client and server.

### Risk 4: Current Password Exposure
**Mitigation**: Never log or expose passwords. Use BCrypt comparison for verification. Mask all password fields.

### Risk 5: Name Injection Attacks
**Mitigation**: Validate and sanitize name input. Use parameterized queries (Prisma handles this).

---

## Future Enhancements

Potential features for future iterations:

1. **Profile Photo Upload**: Allow users to upload and display profile pictures
2. **Email Change with Verification**: Allow email changes with verification flow
3. **Logout All Sessions**: Option to invalidate all sessions on password change
4. **Password History**: Prevent reuse of last N passwords
5. **Profile Activity Log**: Show history of profile changes
6. **Two-Factor Authentication**: Add 2FA setup in profile settings
7. **Privacy Settings**: Control visibility of profile information
8. **Account Deletion**: Allow users to delete their accounts
9. **Export Profile Data**: GDPR compliance - export all user data
10. **Social Login Integration**: Link social accounts to profile

---

## Acceptance Testing Scenarios

### Scenario 1: View Profile
1. User logs in
2. User clicks "Profile" in navigation
3. Profile page displays with correct information
4. Email and role are read-only
5. Edit Profile and Change Password buttons are visible

### Scenario 2: Update Name Successfully
1. User navigates to profile page
2. User clicks "Edit Profile"
3. User changes name to "John Smith"
4. User clicks "Save"
5. Success message displayed
6. Profile updates with new name
7. Name change reflected in navigation

### Scenario 3: Update Name with Validation Error
1. User navigates to profile page
2. User clicks "Edit Profile"
3. User clears name field (empty)
4. User clicks "Save"
5. Error message: "Name is required"
6. User enters valid name
7. Save succeeds

### Scenario 4: Cancel Name Edit
1. User navigates to profile page
2. User clicks "Edit Profile"
3. User changes name
4. User clicks "Cancel"
5. Original name restored
6. No changes saved

### Scenario 5: Change Password Successfully
1. User navigates to profile page
2. User clicks "Change Password"
3. User enters current password
4. User enters new password (meets requirements)
5. User confirms new password
6. User clicks "Save"
7. Success message displayed
8. User remains logged in
9. Form cleared

### Scenario 6: Change Password with Wrong Current Password
1. User navigates to profile page
2. User clicks "Change Password"
3. User enters incorrect current password
4. User enters new password
5. User confirms new password
6. User clicks "Save"
7. Error message: "Current password is incorrect"
8. User can retry

### Scenario 7: Change Password with Weak New Password
1. User navigates to profile page
2. User clicks "Change Password"
3. User enters current password
4. User enters weak new password ("12345678")
5. User confirms new password
6. User clicks "Save"
7. Error message: "Password must contain uppercase, lowercase, number, and special character"
8. User enters strong password
9. Save succeeds

### Scenario 8: Change Password with Mismatched Confirmation
1. User navigates to profile page
2. User clicks "Change Password"
3. User enters current password
4. User enters new password
5. User enters different confirm password
6. User clicks "Save"
7. Error message: "Passwords do not match"
8. User corrects confirm password
9. Save succeeds

---

## Notes

- This feature is a natural extension of the existing authentication system
- Implementation should follow existing Clean Architecture patterns
- Security is paramount - all password operations must be secure
- User experience should be smooth and intuitive
- No breaking changes to existing functionality
