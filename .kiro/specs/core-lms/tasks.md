# Implementation Plan: Learning Management System (LMS)

## Overview

This implementation plan follows a **feature-by-feature (vertical slice)** approach. Each feature is built end-to-end through all architectural layers (Domain → Infrastructure → Application → API → Frontend) before moving to the next feature. This ensures working, demoable features at each step and catches bugs early within feature scope.

## Task Metadata Format

Each task includes the following metadata:
- **Priority**: Task importance level (CRITICAL, VERY HIGH, HIGH, MEDIUM-HIGH, MEDIUM, MEDIUM-LOW, LOW)
- **Dependencies**: Tasks that must be completed before this task (format: task number)
- **Can be parallelized**: Whether this task can be done in parallel with other tasks (Yes/No)

**Priority Scale:**
- **CRITICAL**: Blocker for all other tasks, must complete first
- **VERY HIGH**: Very important, dependency for many tasks
- **HIGH**: Important, dependency for several tasks
- **MEDIUM-HIGH**: Fairly important, has some dependencies
- **MEDIUM**: Standard, limited dependencies
- **MEDIUM-LOW**: Less important, can be deferred
- **LOW**: Optional or can be done anytime

**Architecture Layers (per feature):**
- Domain Layer: Business entities and rules (framework-independent)
- Infrastructure Layer: Database, file storage, external services
- Application Layer: Use cases and application logic
- Presentation Layer: REST API controllers and React UI

**Key Technologies:**
- Backend: Node.js 18.20.5, Express, TypeScript, Prisma, PostgreSQL
- Frontend: React 19.2, TypeScript, Vite
- Testing: Jest, fast-check (property-based testing), Supertest
- Authentication: JWT with HTTP-only cookies
- File Storage: Local filesystem (initial), S3 (future)
- Dependency Injection: TSyringe

**Feature Implementation Order:**
1. Project Setup & Infrastructure
2. Authentication Feature (login, register, sessions)
3. Course Management Feature (create, update, archive, delete courses)
4. Enrollment Feature (search, enroll in courses)
5. Material Management Feature (upload, view, download materials)
6. Assignment Feature (create assignments, submit, late submissions)
7. Quiz Feature (create quizzes, take quizzes, timer)
8. Grading Feature (grade submissions, optimistic locking)
9. Progress & Export Feature (student progress, grade export)
10. Production Deployment

---

## Task Priority and Dependency Guide

### Dependency Rules

**General Rules:**
1. **Domain Layer** tasks depend on: Project setup (1.3 Prisma)
2. **Infrastructure Layer** tasks depend on: Domain entities + Prisma setup
3. **Application Layer** tasks depend on: Domain + Infrastructure layers
4. **Presentation API** tasks depend on: Application layer
5. **Presentation Frontend** tasks depend on: API layer (or can work in parallel with mock data)
6. **Tests** depend on: The code they're testing

**Common Dependencies:**
- **Domain Entities**: 1.3 (Prisma setup), can be parallelized with other entities
- **Repository Interfaces**: Corresponding domain entity, can be parallelized
- **Prisma Models**: 1.3 + domain entity, cannot be parallelized (migrations run sequentially)
- **Repository Implementations**: Prisma model + interface + 1.4 (TSyringe), cannot be parallelized
- **Use Cases**: Domain entities + repositories + DTOs + policies, can be parallelized if independent
- **API Controllers**: Use cases + middleware + schemas, can be parallelized (different controllers)
- **Frontend Components**: API endpoints (or mocks), can be parallelized
- **Tests**: Code being tested + 1.5 (testing framework), can be parallelized

### Parallelization Guidelines

**Can be Parallelized: Yes**
- Multiple domain entities, value objects, repository interfaces
- Multiple independent use cases
- Multiple API controllers
- Multiple frontend components
- All tests

**Can be Parallelized: No**
- Sequential setup tasks (1.1 → 1.2 → 1.3)
- Prisma migrations (must run one at a time)
- Repository implementations (depend on migrations)
- Middleware that depends on other middleware
- Components that share state

### Quick Reference: Priority by Task Type

| Task Type | Typical Priority |
|-----------|------------------|
| Domain Entity | VERY HIGH |
| Value Object | HIGH |
| Domain Service | HIGH |
| Repository Interface | VERY HIGH |
| Prisma Model | CRITICAL |
| Repository Implementation | VERY HIGH |
| DTO/Mapper | HIGH |
| Authorization Policy | CRITICAL |
| Use Case | HIGH |
| Validation Schema | HIGH |
| Middleware | VERY HIGH |
| API Controller | HIGH |
| Frontend Component (Core) | MEDIUM-HIGH |
| Frontend Component (UI) | MEDIUM |
| Property Test | MEDIUM (LOW if optional) |
| Integration Test | MEDIUM (LOW if optional) |
| Component Test | MEDIUM (LOW if optional) |
| Feature Checkpoint | HIGH |
| Security Implementation | CRITICAL |
| Logging/Monitoring | VERY HIGH |
| Deployment Task | HIGH to CRITICAL |

---

## Feature Dependency Table

This table shows which features depend on other features and which features can be parallelized.

| Feature | Depend Pada (Harus Selesai Dulu) | Blocks (Fitur yang Menunggu) | Can Parallelize With |
|---------|-----------------------------------|-------------------------------|----------------------|
| **1. Project Setup** | None | All features (2-13) | None (must complete first) |
| **2. Authentication** | 1. Project Setup | All features (3-13) | None (must complete second) |
| **3. Course Management** | 1, 2 | 4, 5, 6, 7 | 10, 11 |
| **4. Enrollment** | 1, 2, 3 | None | 5, 6, 7, 10, 11 |
| **5. Material Management** | 1, 2, 3 | None | 4, 6, 7, 10, 11 |
| **6. Assignment** | 1, 2, 3 | 8 | 4, 5, 7, 10, 11 |
| **7. Quiz** | 1, 2, 3 | 8 | 4, 5, 6, 10, 11 |
| **8. Grading** | 1, 2, 3, 6, 7 | 9 | 10, 11 |
| **9. Progress & Export** | 1, 2, 3, 8 | None | 10, 11 |
| **10. Security** | 1, 2 | None | 3, 4, 5, 6, 7, 8, 9, 11 |
| **11. Error Handling** | 1, 2 | None | 3, 4, 5, 6, 7, 8, 9, 10 |
| **12. Final Testing** | All (1-11) | 13 | None (must complete before deployment) |
| **13. Production Deployment** | All (1-12) | None | None (final step) |

### Feature Dependency Chain (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH (Sequential)                    │
└─────────────────────────────────────────────────────────────────┘

1. Project Setup (CRITICAL - Blocks everything)
   ↓
2. Authentication (CRITICAL - Blocks everything)
   ↓
3. Course Management (Foundation for content features)
   ↓
   ├─→ 4. Enrollment ────────────────────────┐
   ├─→ 5. Material Management ───────────────┤
   ├─→ 6. Assignment ─────────┐              │
   └─→ 7. Quiz ───────────────┤              │
                              ↓              │
                         8. Grading          │
                              ↓              │
                         9. Progress & Export│
                                             ↓
                                    12. Final Testing
                                             ↓
                                    13. Production Deployment

┌─────────────────────────────────────────────────────────────────┐
│                  PARALLEL OPPORTUNITIES                          │
└─────────────────────────────────────────────────────────────────┘

After Course Management (3) completes:
┌──────────────────────────────────────────────────────────────┐
│  4. Enrollment  │  5. Materials  │  6. Assignment  │  7. Quiz │
└──────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓               ↓
         └────────────────┴────────────────┴───────────────┘
                              ↓
                         8. Grading
                              ↓
                         9. Progress & Export

Independent (Can run in parallel with ANY feature after Auth):
┌──────────────────────────────────────────────────────────────┐
│  10. Security Implementation  │  11. Error Handling & Logging │
└──────────────────────────────────────────────────────────────┘
```

### Key Blockers

**Major Blocking Points:**
1. **Project Setup (1)** → Blocks ALL features (must complete first)
2. **Authentication (2)** → Blocks ALL features (must complete second)
3. **Course Management (3)** → Blocks Enrollment, Materials, Assignments, Quizzes
4. **Assignments (6) + Quizzes (7)** → Block Grading (both must complete)
5. **Grading (8)** → Blocks Progress & Export
6. **Final Testing (12)** → Blocks Production Deployment

**Independent Features (No Blockers):**
- **Security (10)**: Can start after Authentication (2), runs in parallel with all content features
- **Error Handling (11)**: Can start after Authentication (2), runs in parallel with all content features

---

## Tasks

### 1. Project Setup and Infrastructure

- [ ] 1.1 Initialize project structure with TypeScript configuration
  - Priority: CRITICAL
  - Dependencies: None
  - Can be parallelized: No
  - Create backend and frontend directories
  - Configure tsconfig.json for strict mode
  - Set up ESLint and Prettier
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 1.2 Set up Docker for local development
  - Priority: CRITICAL
  - Dependencies: 1.1
  - Can be parallelized: No
  - Create docker-compose.yml for development environment
  - Configure PostgreSQL service with health checks
  - Configure backend service with hot reload
  - Configure frontend service with Vite dev server
  - Create .env.example template with all required variables
  - Document how to start development environment
  - _Requirements: 17.1, 17.5_

- [ ] 1.3 Set up Prisma ORM and PostgreSQL database
  - Priority: CRITICAL
  - Dependencies: 1.1, 1.2
  - Can be parallelized: No
  - Install Prisma and PostgreSQL client
  - Create initial Prisma schema structure
  - Configure database connection (using Docker PostgreSQL)
  - Generate Prisma Client
  - Test database connection
  - _Requirements: 17.1, 17.5_

- [ ] 1.4 Configure dependency injection with TSyringe
  - Priority: VERY HIGH
  - Dependencies: 1.1
  - Can be parallelized: Yes (with 1.2, 1.3)
  - Install TSyringe
  - Create DI container configuration file
  - Set up singleton and transient registration patterns
  - _Requirements: 17.4_

- [ ] 1.5 Set up testing framework
  - Priority: VERY HIGH
  - Dependencies: 1.1
  - Can be parallelized: Yes (with 1.2, 1.3, 1.4)
  - Install Jest, fast-check, Supertest, React Testing Library
  - Configure Jest for TypeScript
  - Create test utilities and helpers
  - _Requirements: All (testing infrastructure)_

- [ ] 1.6 Initialize Express server with middleware
  - Priority: VERY HIGH
  - Dependencies: 1.1, 1.2, 1.3, 1.4
  - Can be parallelized: No
  - Create Express app with TypeScript
  - Configure CORS with SameSite=Strict
  - Set up body parser and cookie parser
  - Create health check endpoint
  - Test server starts successfully in Docker
  - _Requirements: 18.1, 18.2, 18.3, 21.7_

- [ ] 1.7 Set up React project with Vite
  - Priority: VERY HIGH
  - Dependencies: 1.1, 1.2
  - Can be parallelized: Yes (with 1.3, 1.4, 1.5, 1.6)
  - Initialize React 19.2 with TypeScript
  - Configure Vite build tool
  - Set up React Router for navigation
  - Configure API client (Axios or Fetch)
  - Create basic app structure
  - _Requirements: 19.1_


### 2. Feature: Authentication (End-to-End)

**Goal**: Users can register, login, logout, and access protected routes. Fully working authentication system.

#### 2.1 Domain Layer - Authentication Entities

- [ ] 2.1.1 Create User domain entity
  - Priority: VERY HIGH
  - Dependencies: 1.3 (Prisma setup)
  - Can be parallelized: Yes (with 2.1.3, 2.1.4)
  - Implement User entity with id, email, name, role, password hash
  - Add role validation (Student or Teacher only)
  - Implement entity methods for user operations
  - _Requirements: 1.5, 2.1, 2.2_

- [ ]* 2.1.2 Write property test for User entity
  - Priority: MEDIUM
  - Dependencies: 2.1.1, 1.5 (testing framework)
  - Can be parallelized: Yes (with other tests)
  - **Property 1: Role assignment**
  - **Validates: Requirements 1.5**
  - For any user, the role must be either Student or Teacher

- [ ] 2.1.3 Create Email value object
  - Priority: HIGH
  - Dependencies: None
  - Can be parallelized: Yes (with 2.1.1, 2.1.4)
  - Implement Email value object (RFC 5322 validation)
  - _Requirements: 1.7_

- [ ] 2.1.4 Define IUserRepository interface
  - Priority: VERY HIGH
  - Dependencies: 2.1.1 (User entity)
  - Can be parallelized: Yes (with 2.1.3)
  - Create IUserRepository interface (Port)
  - Define methods: save, findById, findByEmail, delete
  - _Requirements: 17.1, 17.2, 17.3_


#### 2.2 Infrastructure Layer - Authentication Services

- [ ] 2.2.1 Add User model to Prisma schema
  - Define User model with all fields
  - Add unique constraint on email
  - Configure UUID primary key
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 2.2.2 Implement PrismaUserRepository
  - Create PrismaUserRepository implementing IUserRepository
  - Implement all CRUD operations
  - Register in DI container as singleton
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 2.2.3 Write integration tests for PrismaUserRepository
  - Test CRUD operations
  - Test unique email constraint
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 2.2.4 Implement JWT authentication service
  - Create JWTService with token generation and validation
  - Implement access token (15 min expiry)
  - Implement refresh token (7 day expiry)
  - Use separate secrets for access and refresh tokens
  - Register in DI container as singleton
  - _Requirements: 1.1, 1.4_

- [ ]* 2.2.5 Write property test for JWT token lifecycle
  - **Property 8: Token expiration**
  - **Validates: Requirements 1.1, 1.2**
  - For any valid token, it becomes invalid after expiry time

- [ ] 2.2.6 Implement password hashing service
  - Create BCryptPasswordService with hash and verify methods
  - Use 10 salt rounds
  - Register in DI container as singleton
  - _Requirements: 1.1, 1.2, 20.1_

- [ ]* 2.2.7 Write property test for password hashing
  - **Property 9: Password hash uniqueness**
  - **Validates: Requirements 20.1**
  - For any password, hashing twice produces different hashes (due to salt)

#### 2.3 Application Layer - Authentication Use Cases

- [ ] 2.3.1 Create authentication DTOs
  - Create UserDTO, CreateUserDTO, LoginDTO
  - Create UserMapper with toDTO and toDomain methods
  - _Requirements: 18.4_

- [ ] 2.3.2 Implement RegisterUserUseCase
  - Validate email format and uniqueness
  - Hash password before storage
  - Create user with selected role
  - Return user DTO
  - Register in DI container as transient
  - _Requirements: 1.7, 20.1_

- [ ]* 2.3.3 Write property test for user registration
  - **Property 11: Email uniqueness**
  - **Validates: Requirements 1.7**
  - For any two users, they cannot have the same email address

- [ ] 2.3.4 Implement LoginUserUseCase
  - Validate credentials
  - Generate access and refresh tokens
  - Return tokens and user DTO
  - Register in DI container as transient
  - _Requirements: 1.1, 1.2_

- [ ]* 2.3.5 Write property test for login authentication
  - **Property 12: Valid credentials create session**
  - **Validates: Requirements 1.1**
  - For any valid user credentials, authentication succeeds and creates tokens

- [ ] 2.3.6 Implement RefreshTokenUseCase
  - Validate refresh token
  - Generate new access token
  - Return new access token
  - Register in DI container as transient
  - _Requirements: 1.4_

- [ ] 2.3.7 Implement LogoutUserUseCase
  - Clear tokens (client-side removal)
  - Return success response
  - Register in DI container as transient
  - _Requirements: 1.6_


#### 2.4 Presentation Layer - Authentication API

- [ ] 2.4.1 Create Zod validation schemas for authentication
  - Create schemas for register, login requests
  - Define validation rules (email format, password length, role)
  - _Requirements: 18.4, 20.2_

- [ ] 2.4.2 Implement authentication middleware
  - Create AuthenticationMiddleware to validate JWT tokens
  - Extract user from token and attach to request
  - Return 401 for invalid/expired tokens
  - _Requirements: 1.3, 1.4_

- [ ] 2.4.3 Implement error handler middleware
  - Create ErrorHandlerMiddleware for centralized error handling
  - Map domain errors to HTTP status codes
  - Return consistent error response format
  - Log errors with context (Winston)
  - Never expose internal details
  - _Requirements: 18.3, 21.3, 21.2_

- [ ] 2.4.4 Implement validation middleware
  - Create ValidationMiddleware using Zod schemas
  - Validate request body, query params, path params
  - Return 400 with validation errors
  - _Requirements: 18.4, 20.2_

- [ ] 2.4.5 Implement AuthController
  - POST /api/auth/register - RegisterUserUseCase
  - POST /api/auth/login - LoginUserUseCase
  - POST /api/auth/refresh - RefreshTokenUseCase
  - POST /api/auth/logout - LogoutUserUseCase
  - GET /api/auth/me - Get current user
  - Set HTTP-only cookies for tokens
  - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7_

- [ ]* 2.4.6 Write API integration tests for authentication
  - Test register endpoint (success and validation errors)
  - Test login endpoint (success and invalid credentials)
  - Test refresh token endpoint
  - Test logout endpoint
  - Test protected endpoint with authentication middleware
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 2.5 Presentation Layer - Authentication Frontend

- [ ] 2.5.1 Create shared UI components
  - Create Button component
  - Create Input component
  - Create ErrorMessage component
  - Create LoadingSpinner component
  - _Requirements: 19.4, 19.5_

- [ ] 2.5.2 Implement LoginPage component
  - Create login form with email and password
  - Implement form validation
  - Handle authentication errors
  - Store tokens in HTTP-only cookies
  - Redirect to dashboard on success
  - _Requirements: 1.1, 1.2, 19.2_

- [ ] 2.5.3 Implement RegisterPage component
  - Create registration form with email, password, name, role
  - Implement form validation
  - Handle registration errors
  - Redirect to login on success
  - _Requirements: 1.7, 19.2_

- [ ] 2.5.4 Implement navigation and routing
  - Create navigation bar with role-based links
  - Set up React Router routes
  - Implement protected routes (authentication required)
  - Handle 404 Not Found
  - _Requirements: 19.3_

- [ ] 2.5.5 Create placeholder dashboards
  - Create StudentDashboard component (placeholder)
  - Create TeacherDashboard component (placeholder)
  - Display welcome message with user name
  - _Requirements: 3.1, 4.1_

- [ ]* 2.5.6 Write React component tests for authentication
  - Test LoginPage component
  - Test RegisterPage component
  - Test form validation
  - Test error handling
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 2.6 Feature Checkpoint - Authentication

- [ ] 2.6.1 Run all authentication tests
  - Run all domain entity tests
  - Run all infrastructure tests
  - Run all use case tests
  - Run all API integration tests
  - Run all React component tests
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7, 20.1_

- [ ] 2.6.2 Manual end-to-end testing
  - Test user registration flow
  - Test login flow
  - Test logout flow
  - Test token refresh
  - Test protected route access
  - Verify authentication works end-to-end
  - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7_

**✅ DELIVERABLE**: Fully working authentication system. Users can register, login, logout, and access protected routes.



### 3. Feature: Course Management (End-to-End)

**Goal**: Teachers can create, update, archive, and delete courses. Students can view courses. Fully working course management system.

#### 3.1 Domain Layer - Course Entities

- [ ] 3.1.1 Create Course domain entity
  - Implement Course entity with id, name, description, courseCode, status, teacherId
  - Add status validation (Active or Archived)
  - Implement archive() and delete() methods with business rules
  - _Requirements: 5.1, 5.4, 5.6, 5.7_

- [ ]* 3.1.2 Write property test for Course lifecycle
  - **Property 2: Course state transitions**
  - **Validates: Requirements 5.4, 5.6, 5.7**
  - For any course, Active → Archived → Deleted is the only valid transition path

- [ ] 3.1.3 Create CourseCode value object
  - Implement CourseCode value object (6-character alphanumeric validation)
  - _Requirements: 5.1_

- [ ] 3.1.4 Create CourseCodeGenerator domain service
  - Implement CourseCodeGenerator service with retry logic (max 5 attempts)
  - _Requirements: 5.1, 5.2_

- [ ]* 3.1.5 Write property test for CourseCodeGenerator
  - **Property 7: Code generation retry limit**
  - **Property 13: Course code uniqueness with retry**
  - **Validates: Requirements 5.1, 5.2**
  - For any code generation with collisions, max 5 retries before failure

- [ ] 3.1.6 Define ICourseRepository interface
  - Create ICourseRepository interface (Port)
  - Define methods: save, findById, findByTeacherId, findByCode, delete, update
  - _Requirements: 17.1, 17.2, 17.3_

#### 3.2 Infrastructure Layer - Course Persistence

- [ ] 3.2.1 Add Course model to Prisma schema
  - Define Course model with all fields
  - Add unique constraint on courseCode
  - Add foreign key to User (teacher)
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 3.2.2 Implement PrismaCourseRepository
  - Create PrismaCourseRepository implementing ICourseRepository
  - Implement all CRUD operations
  - Register in DI container as singleton
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 3.2.3 Write integration tests for PrismaCourseRepository
  - Test CRUD operations
  - Test unique courseCode constraint
  - Test relationship with User
  - _Requirements: 17.1, 17.2, 17.3_

#### 3.3 Application Layer - Course Use Cases

- [ ] 3.3.1 Create course DTOs and mappers
  - Create CourseDTO, CreateCourseDTO, UpdateCourseDTO
  - Create CourseMapper with toDTO and toDomain methods
  - _Requirements: 18.4_

- [ ] 3.3.2 Create authorization policy interface
  - Define IAuthorizationPolicy interface
  - Define policy methods (canAccessCourse, canModifyCourse, etc.)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.3.3 Implement authorization policy
  - Create AuthorizationPolicy implementing IAuthorizationPolicy
  - Implement role-based checks (Student vs Teacher)
  - Implement resource-based checks (ownership)
  - Implement pure functions: (user, resource, context) => boolean
  - Register in DI container as singleton
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.3.4 Write unit tests for authorization policies
  - Test role-based access control
  - Test resource ownership validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.3.5 Implement CreateCourseUseCase
  - Validate teacher role
  - Generate unique course code with retry logic
  - Create course entity
  - Save to repository
  - Return course DTO
  - Register in DI container as transient
  - _Requirements: 5.1, 5.2, 5.9_

- [ ] 3.3.6 Implement UpdateCourseUseCase
  - Validate teacher ownership
  - Validate course is active
  - Update course entity
  - Save to repository
  - Return updated course DTO
  - Register in DI container as transient
  - _Requirements: 5.3_

- [ ] 3.3.7 Implement ArchiveCourseUseCase
  - Validate teacher ownership
  - Validate course is not already archived
  - Archive course (set status to ARCHIVED)
  - Return archived course DTO
  - Register in DI container as transient
  - _Requirements: 5.4, 5.5_

- [ ] 3.3.8 Implement DeleteCourseUseCase
  - Validate teacher ownership
  - Validate course is archived
  - Delete course from repository
  - Return success response
  - Register in DI container as transient
  - _Requirements: 5.6, 5.7_

- [ ] 3.3.9 Implement ListCoursesUseCase
  - Filter by role (teacher sees own, student sees enrolled)
  - Filter by status (active/archived)
  - Return course DTOs
  - Register in DI container as transient
  - _Requirements: 5.10, 6.1_


#### 3.4 Presentation Layer - Course API

- [ ] 3.4.1 Create Zod validation schemas for courses
  - Create schemas for create, update course requests
  - Define validation rules
  - _Requirements: 18.4, 20.2_

- [ ] 3.4.2 Implement CourseController
  - GET /api/courses - ListCoursesUseCase
  - GET /api/courses/archived - ListCoursesUseCase (archived filter)
  - POST /api/courses - CreateCourseUseCase (teacher only)
  - GET /api/courses/:id - GetCourseUseCase
  - PUT /api/courses/:id - UpdateCourseUseCase (teacher only)
  - DELETE /api/courses/:id - DeleteCourseUseCase (teacher only)
  - POST /api/courses/:id/archive - ArchiveCourseUseCase (teacher only)
  - _Requirements: 5.1, 5.3, 5.4, 5.6, 5.7, 5.10_

- [ ]* 3.4.3 Write API integration tests for courses
  - Test all course endpoints
  - Test authorization (teacher-only operations)
  - Test validation errors
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 3.5 Presentation Layer - Course Frontend

- [ ] 3.5.1 Update Teacher Dashboard
  - Display created courses with enrollment counts
  - Add "Create Course" button
  - Provide links to manage each course
  - Handle empty state (no created courses)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.5.2 Implement CreateCourse component
  - Create form for course name and description
  - Handle form submission
  - Display course code after creation
  - Handle errors
  - _Requirements: 5.1, 5.9_

- [ ] 3.5.3 Implement UpdateCourse component
  - Create form for updating course details
  - Handle form submission
  - Handle errors
  - _Requirements: 5.3_

- [ ] 3.5.4 Implement CourseDetails component
  - Display course information
  - Add archive/delete actions (teacher only)
  - Handle course lifecycle (active → archived → deleted)
  - _Requirements: 5.4, 5.6, 5.7, 5.10_

- [ ]* 3.5.5 Write React component tests for courses
  - Test CreateCourse component
  - Test UpdateCourse component
  - Test CourseDetails component
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 3.6 Feature Checkpoint - Course Management

- [ ] 3.6.1 Run all course management tests
  - Run all domain entity tests
  - Run all infrastructure tests
  - Run all use case tests
  - Run all API integration tests
  - Run all React component tests
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10_

- [ ] 3.6.2 Manual end-to-end testing
  - Test course creation flow (teacher)
  - Test course update flow (teacher)
  - Test course archive flow (teacher)
  - Test course delete flow (teacher)
  - Test course listing (teacher and student views)
  - Verify course management works end-to-end
  - _Requirements: 5.1, 5.3, 5.4, 5.6, 5.7, 5.10_

**✅ DELIVERABLE**: Fully working course management system. Teachers can create, update, archive, and delete courses. Students can view courses.



### 4. Feature: Enrollment (End-to-End)

**Goal**: Students can search for courses and enroll using course codes. Teachers can bulk unenroll students. Fully working enrollment system.

#### 4.1 Domain Layer - Enrollment Entities

- [ ] 4.1.1 Create Enrollment domain entity
  - Implement Enrollment entity with id, courseId, studentId, enrolledAt
  - Add duplicate enrollment prevention logic
  - _Requirements: 6.5, 6.8_

- [ ]* 4.1.2 Write property test for enrollment
  - **Property 15: No duplicate enrollments**
  - **Validates: Requirements 6.8**
  - For any student and course, only one enrollment can exist

- [ ] 4.1.3 Define IEnrollmentRepository interface
  - Create IEnrollmentRepository interface (Port)
  - Define methods: save, findByStudentAndCourse, findByCourse, deleteAllByCourse
  - _Requirements: 17.1, 17.2, 17.3_

#### 4.2 Infrastructure Layer - Enrollment Persistence

- [ ] 4.2.1 Add Enrollment model to Prisma schema
  - Define Enrollment model with all fields
  - Add unique constraint on (studentId, courseId)
  - Add foreign keys to User and Course
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 4.2.2 Implement PrismaEnrollmentRepository
  - Create PrismaEnrollmentRepository implementing IEnrollmentRepository
  - Implement all operations
  - Register in DI container as singleton
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 4.2.3 Write integration tests for PrismaEnrollmentRepository
  - Test CRUD operations
  - Test unique constraint on (studentId, courseId)
  - Test relationships
  - _Requirements: 17.1, 17.2, 17.3_

#### 4.3 Application Layer - Enrollment Use Cases

- [ ] 4.3.1 Create enrollment DTOs and mappers
  - Create EnrollmentDTO
  - Create EnrollmentMapper with toDTO and toDomain methods
  - _Requirements: 18.4_

- [ ] 4.3.2 Implement EnrollStudentUseCase
  - Validate student role
  - Validate course code exists and is active
  - Check for duplicate enrollment
  - Create enrollment entity
  - Save to repository
  - Return enrollment DTO
  - Register in DI container as transient
  - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [ ] 4.3.3 Implement SearchCoursesUseCase
  - Filter active courses only
  - Search by course name
  - Return course DTOs with enrollment status
  - Register in DI container as transient
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.3.4 Implement BulkUnenrollUseCase
  - Validate teacher ownership
  - Validate course is archived
  - Remove all enrollments
  - Return success response
  - Register in DI container as transient
  - _Requirements: 5.8_

#### 4.4 Presentation Layer - Enrollment API

- [ ] 4.4.1 Create Zod validation schemas for enrollment
  - Create schemas for enroll request (course code)
  - Define validation rules
  - _Requirements: 18.4, 20.2_

- [ ] 4.4.2 Update CourseController with enrollment endpoints
  - POST /api/courses/enroll - EnrollStudentUseCase (student only)
  - POST /api/courses/:id/unenroll-bulk - BulkUnenrollUseCase (teacher only)
  - GET /api/courses/search - SearchCoursesUseCase
  - _Requirements: 6.5, 5.8, 6.1_

- [ ]* 4.4.3 Write API integration tests for enrollment
  - Test enroll endpoint
  - Test search endpoint
  - Test bulk unenroll endpoint
  - Test authorization
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 4.5 Presentation Layer - Enrollment Frontend

- [ ] 4.5.1 Update Student Dashboard
  - Display enrolled courses with teacher names
  - Provide links to access each course
  - Handle empty state (no enrolled courses)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.5.2 Implement CourseList component (search and enroll)
  - Create search interface
  - Display course list with search results
  - Show course details (name, teacher, description)
  - Show enrollment status
  - Add "Enroll" button with course code input
  - Handle enrollment errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ]* 4.5.3 Write React component tests for enrollment
  - Test CourseList component
  - Test search functionality
  - Test enrollment flow
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 4.6 Feature Checkpoint - Enrollment

- [ ] 4.6.1 Run all enrollment tests
  - Run all domain entity tests
  - Run all infrastructure tests
  - Run all use case tests
  - Run all API integration tests
  - Run all React component tests
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 5.8_

- [ ] 4.6.2 Manual end-to-end testing
  - Test course search flow (student)
  - Test enrollment flow with course code (student)
  - Test duplicate enrollment prevention
  - Test bulk unenroll flow (teacher)
  - Verify enrollment works end-to-end
  - _Requirements: 6.1, 6.5, 6.8, 5.8_

**✅ DELIVERABLE**: Fully working enrollment system. Students can search and enroll in courses. Teachers can bulk unenroll students.



### 5. Feature: Material Management (End-to-End)

**Goal**: Teachers can upload files, add text content, and link videos. Students can view and download materials. Fully working material management system.

#### 5.1 Domain Layer - Material Entities

- [ ] 5.1.1 Create Material domain entity
  - Implement Material entity with id, courseId, title, type, content/filePath
  - Add type validation (FILE, TEXT, VIDEO_LINK)
  - Implement content validation based on type
  - _Requirements: 7.1, 7.2, 7.3, 7.10, 7.11_

- [ ] 5.1.2 Define IFileStorage interface (Port)
  - Create IFileStorage interface with upload, download, delete methods
  - Define file metadata structure
  - _Requirements: 7.1, 7.9, 20.3_

- [ ] 5.1.3 Define IMaterialRepository interface
  - Create IMaterialRepository interface (Port)
  - Define methods: save, findById, findByCourse, delete, update
  - _Requirements: 17.1, 17.2, 17.3_

#### 5.2 Infrastructure Layer - Material Persistence and Storage

- [ ] 5.2.1 Add Material model to Prisma schema
  - Define Material model with all fields
  - Add foreign key to Course
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 5.2.2 Implement PrismaMaterialRepository
  - Create PrismaMaterialRepository implementing IMaterialRepository
  - Implement all CRUD operations
  - Register in DI container as singleton
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 5.2.3 Write integration tests for PrismaMaterialRepository
  - Test CRUD operations
  - Test relationship with Course
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 5.2.4 Implement LocalFileStorage adapter
  - Create LocalFileStorage implementing IFileStorage
  - Implement upload with unique filename generation (UUID + extension)
  - Implement download with path validation
  - Implement delete with error handling
  - Add path traversal prevention
  - Register in DI container as singleton
  - _Requirements: 7.1, 7.9, 20.3_

- [ ]* 5.2.5 Write integration tests for file storage
  - Test file upload and retrieval
  - Test file deletion
  - Test path traversal prevention
  - Test file size limit enforcement
  - _Requirements: 7.9, 20.3, 20.5_

#### 5.3 Application Layer - Material Use Cases

- [ ] 5.3.1 Create material DTOs and mappers
  - Create MaterialDTO, CreateMaterialDTO, UpdateMaterialDTO
  - Create MaterialMapper with toDTO and toDomain methods
  - _Requirements: 18.4_

- [ ] 5.3.2 Implement CreateMaterialUseCase
  - Validate teacher ownership of course
  - Validate material type (FILE, TEXT, VIDEO_LINK)
  - For FILE: upload to storage, validate size and format
  - For TEXT: sanitize HTML content (install sanitize-html)
  - For VIDEO_LINK: validate URL format
  - Create material entity
  - Save to repository
  - Return material DTO
  - Register in DI container as transient
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 7.9, 7.10, 7.11, 20.2_

- [ ]* 5.3.3 Write property test for file upload validation
  - **Property 16: File size limit enforcement**
  - **Validates: Requirements 7.5, 7.9, 20.5**
  - For any file upload, files exceeding 10MB are rejected

- [ ] 5.3.4 Implement UpdateMaterialUseCase
  - Validate teacher ownership
  - Update material entity
  - Handle file replacement if needed
  - Save to repository
  - Return updated material DTO
  - Register in DI container as transient
  - _Requirements: 7.7_

- [ ] 5.3.5 Implement DeleteMaterialUseCase
  - Validate teacher ownership
  - Delete file from storage if FILE type
  - Delete material from repository
  - Return success response
  - Register in DI container as transient
  - _Requirements: 7.6_

- [ ] 5.3.6 Implement ListMaterialsUseCase
  - Validate enrollment or ownership
  - Return material DTOs for course
  - Register in DI container as transient
  - _Requirements: 8.1_

- [ ] 5.3.7 Implement DownloadMaterialUseCase
  - Validate enrollment or ownership
  - Validate material is FILE type
  - Return file from storage
  - Register in DI container as transient
  - _Requirements: 8.2, 20.3_

#### 5.4 Presentation Layer - Material API

- [ ] 5.4.1 Create Zod validation schemas for materials
  - Create schemas for create, update material requests
  - Define validation rules
  - _Requirements: 18.4, 20.2_

- [ ] 5.4.2 Implement MaterialController
  - GET /api/courses/:courseId/materials - ListMaterialsUseCase
  - POST /api/courses/:courseId/materials - CreateMaterialUseCase (teacher only)
  - GET /api/materials/:id - GetMaterialUseCase
  - PUT /api/materials/:id - UpdateMaterialUseCase (teacher only)
  - DELETE /api/materials/:id - DeleteMaterialUseCase (teacher only)
  - GET /api/materials/:id/download - DownloadMaterialUseCase
  - Use Multer middleware for file uploads
  - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7, 8.1, 8.2_

- [ ]* 5.4.3 Write API integration tests for materials
  - Test all material endpoints
  - Test file upload
  - Test authorization
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

- [ ]* 5.4.4 Write security tests for file upload
  - Test file type validation (whitelist: PDF, DOCX, JPG, PNG, GIF)
  - Test file size limit (10MB)
  - Test path traversal prevention
  - _Requirements: 20.3, 20.4, 20.5_


#### 5.5 Presentation Layer - Material Frontend

- [ ] 5.5.1 Implement MaterialList component
  - Display list of materials for a course
  - Show material type icons (file, text, video)
  - Add download button for files
  - Add edit/delete buttons (teacher only)
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 5.5.2 Implement CreateMaterial component
  - Create form with material type selector
  - For FILE: file upload with progress bar and retry mechanism
  - For TEXT: rich text editor
  - For VIDEO_LINK: URL input
  - Handle form submission
  - Handle errors
  - _Requirements: 7.1, 7.2, 7.3, 21.6_

- [ ] 5.5.3 Implement UpdateMaterial component
  - Create form for updating material
  - Handle file replacement
  - Handle errors
  - _Requirements: 7.7_

- [ ] 5.5.4 Create FileUpload shared component
  - Implement file upload with progress bar
  - Add retry mechanism for failed uploads
  - Display file size validation errors
  - _Requirements: 19.4, 19.5, 21.6_

- [ ]* 5.5.5 Write React component tests for materials
  - Test MaterialList component
  - Test CreateMaterial component
  - Test FileUpload component
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 5.6 Feature Checkpoint - Material Management

- [ ] 5.6.1 Run all material management tests
  - Run all domain entity tests
  - Run all infrastructure tests (including file storage)
  - Run all use case tests
  - Run all API integration tests
  - Run all security tests (file upload)
  - Run all React component tests
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 8.1, 8.2, 20.3, 20.4, 20.5_

- [ ] 5.6.2 Manual end-to-end testing
  - Test file upload flow (teacher)
  - Test text content creation (teacher)
  - Test video link creation (teacher)
  - Test material update flow (teacher)
  - Test material delete flow (teacher)
  - Test material viewing (student)
  - Test file download (student)
  - Verify material management works end-to-end
  - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7, 8.1, 8.2_

**✅ DELIVERABLE**: Fully working material management system. Teachers can upload files, add text, and link videos. Students can view and download materials.



### 6. Feature: Assignment Management & Submission (End-to-End)

**Goal**: Teachers can create assignments. Students can submit assignments (with late submission support). Fully working assignment system.

#### 6.1 Domain Layer - Assignment Entities

- [ ] 6.1.1 Create Assignment domain entity
  - Implement Assignment entity with id, title, description, dueDate, submissionType, gradingStarted
  - Add due date validation (must be in future)
  - Implement startGrading() method to lock assignment
  - _Requirements: 9.1, 9.2, 9.8, 10.9_

- [ ]* 6.1.2 Write property test for Assignment grading lock
  - **Property 3: Grading lock prevents submissions**
  - **Validates: Requirements 10.9, 13.1**

- [ ] 6.1.3 Create Submission domain entity
  - Implement Submission entity with id, assignmentId, studentId, content, grade, isLate, version
  - Add grade validation (0-100 range)
  - Implement late submission detection logic
  - Add version field for optimistic locking
  - _Requirements: 10.6, 10.8, 13.3, 13.4, 21.5_

- [ ]* 6.1.4 Write property tests for Submission
  - **Property 5: Grade range validation**
  - **Property 18: Late submission marking**
  - **Property 19: Grading lock prevents submissions**
  - **Validates: Requirements 13.3, 10.8, 10.9, 10.11_

- [ ] 6.1.5 Create Grade value object
  - Implement Grade value object (0-100 range validation)
  - _Requirements: 13.3_

- [ ] 6.1.6 Define IAssignmentRepository and ISubmissionRepository interfaces
  - Create repository interfaces (Ports)
  - _Requirements: 17.1, 17.2, 17.3_

#### 6.2 Infrastructure Layer - Assignment Persistence

- [ ] 6.2.1 Add Assignment and Submission models to Prisma schema
  - Define models with all fields
  - Add version field to Submission for optimistic locking
  - Add foreign keys
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5, 21.5_

- [ ] 6.2.2 Implement Prisma repositories
  - Create PrismaAssignmentRepository
  - Create PrismaSubmissionRepository
  - Register in DI container as singletons
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 6.2.3 Write integration tests for repositories
  - Test CRUD operations
  - Test relationships
  - _Requirements: 17.1, 17.2, 17.3_

#### 6.3 Application Layer - Assignment Use Cases

- [ ] 6.3.1 Create DTOs and mappers
  - Create AssignmentDTO, SubmissionDTO, and related DTOs
  - Create mappers
  - _Requirements: 18.4_

- [ ] 6.3.2 Implement CreateAssignmentUseCase
  - Validate teacher ownership, due date in future, submission type
  - Create and save assignment
  - Register in DI container as transient
  - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.7_

- [ ]* 6.3.3 Write property test for assignment due date
  - **Property 17: Due date validation**
  - **Validates: Requirements 9.2**

- [ ] 6.3.4 Implement UpdateAssignmentUseCase
  - Validate ownership, due date not passed
  - Update assignment
  - Register in DI container as transient
  - _Requirements: 9.8, 9.9_

- [ ] 6.3.5 Implement DeleteAssignmentUseCase
  - Validate ownership, delete assignment
  - Register in DI container as transient
  - _Requirements: 9.10_

- [ ] 6.3.6 Implement ListAssignmentsUseCase
  - Validate enrollment or ownership
  - Return assignments with submission status
  - Register in DI container as transient
  - _Requirements: 9.11, 9.12_

- [ ] 6.3.7 Implement SubmitAssignmentUseCase
  - Validate student enrollment, assignment not closed
  - Validate submission type matches
  - For FILE: upload to storage, validate format
  - For TEXT: sanitize HTML content
  - Check if late (after due date)
  - Create or update submission
  - Register in DI container as transient
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.13_

- [ ] 6.3.8 Implement GetSubmissionUseCase
  - Validate student owns submission or teacher owns course
  - Return submission DTO
  - Register in DI container as transient
  - _Requirements: 10.12_

#### 6.4 Presentation Layer - Assignment API

- [ ] 6.4.1 Create Zod validation schemas for assignments
  - Create schemas for create, update, submit requests
  - _Requirements: 18.4, 20.2_

- [ ] 6.4.2 Implement AssignmentController
  - GET /api/courses/:courseId/assignments - ListAssignmentsUseCase
  - POST /api/courses/:courseId/assignments - CreateAssignmentUseCase (teacher)
  - GET /api/assignments/:id - GetAssignmentUseCase
  - PUT /api/assignments/:id - UpdateAssignmentUseCase (teacher)
  - DELETE /api/assignments/:id - DeleteAssignmentUseCase (teacher)
  - POST /api/assignments/:id/submit - SubmitAssignmentUseCase (student)
  - Use Multer for file uploads
  - _Requirements: 9.1, 9.8, 9.10, 9.11, 10.1_

- [ ]* 6.4.3 Write API integration tests for assignments
  - Test all endpoints, authorization, validation
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 6.5 Presentation Layer - Assignment Frontend

- [ ] 6.5.1 Implement CreateAssignment component (teacher)
  - Form with title, description, due date, submission type
  - Rich text editor for description
  - Timezone-aware due date picker
  - _Requirements: 9.1, 9.2_

- [ ] 6.5.2 Implement UpdateAssignment component (teacher)
  - Form for updating assignment
  - _Requirements: 9.8, 9.9_

- [ ] 6.5.3 Implement AssignmentList component
  - Display assignments with status
  - Show time remaining until due date
  - Highlight overdue items
  - _Requirements: 9.11, 9.12_

- [ ] 6.5.4 Implement SubmitAssignment component (student)
  - File upload with progress indicator
  - Rich text editor for text submissions
  - Display submission status
  - Show late submission warning
  - Handle closed assignment errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.12_

- [ ]* 6.5.5 Write React component tests for assignments
  - Test all assignment components
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 6.6 Feature Checkpoint - Assignment Management

- [ ] 6.6.1 Run all assignment tests
  - Run all tests (domain, infrastructure, application, API, frontend)
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 9.1-9.12, 10.1-10.13_

- [ ] 6.6.2 Manual end-to-end testing
  - Test assignment creation (teacher)
  - Test assignment update/delete (teacher)
  - Test assignment submission (student, on-time and late)
  - Test closed assignment prevention
  - Verify assignment system works end-to-end
  - _Requirements: 9.1, 9.8, 10.1, 10.8, 10.9_

**✅ DELIVERABLE**: Fully working assignment system. Teachers create assignments, students submit (with late submission support).



### 7. Feature: Quiz Management & Taking (End-to-End)

**Goal**: Teachers can create quizzes with MCQ and essay questions. Students can take timed quizzes with auto-save and auto-submit. Fully working quiz system.

#### 7.1 Domain Layer - Quiz Entities

- [ ] 7.1.1 Create Quiz domain entity
  - Implement Quiz entity with id, title, description, dueDate, timeLimit, questions
  - Add due date validation (must be in future)
  - Add time limit validation (positive integer)
  - Implement canEdit() method (before due date and no submissions)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 7.1.2 Write property test for Quiz editing rules
  - **Property 4: Quiz editing restrictions**
  - **Validates: Requirements 11.6, 11.7**
  - For any quiz, editing is only allowed before due date and before any submissions

- [ ] 7.1.3 Create Question value objects
  - Implement MCQQuestion value object (questionText, options, correctAnswer)
  - Implement EssayQuestion value object (questionText)
  - Add validation for MCQ (2+ options, valid correctAnswer index)
  - _Requirements: 11.3, 11.4_

- [ ] 7.1.4 Create QuizSubmission domain entity
  - Implement QuizSubmission entity with id, quizId, studentId, answers, startedAt, submittedAt, grade
  - Add timer validation logic
  - Implement auto-submit logic (when time expires)
  - Add version field for optimistic locking
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

- [ ]* 7.1.5 Write property tests for Quiz
  - **Property 6: Quiz timer enforcement**
  - **Property 20: Quiz submission deadline**
  - **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**
  - For any quiz submission, time limit is enforced and auto-submit occurs on timeout

- [ ] 7.1.6 Create QuizTimingService domain service
  - Implement calculateRemainingTime() method
  - Implement isExpired() method
  - _Requirements: 12.2, 12.3, 12.4, 12.5_

- [ ] 7.1.7 Define IQuizRepository and IQuizSubmissionRepository interfaces
  - Create repository interfaces (Ports)
  - _Requirements: 17.1, 17.2, 17.3_

#### 7.2 Infrastructure Layer - Quiz Persistence

- [ ] 7.2.1 Add Quiz and QuizSubmission models to Prisma schema
  - Define models with all fields
  - Store questions as JSON
  - Add version field to QuizSubmission for optimistic locking
  - Add foreign keys
  - Generate and run migration
  - _Requirements: 17.1, 17.4, 17.5, 21.5_

- [ ] 7.2.2 Implement Prisma repositories
  - Create PrismaQuizRepository
  - Create PrismaQuizSubmissionRepository
  - Handle JSON serialization for questions and answers
  - Register in DI container as singletons
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 7.2.3 Write integration tests for repositories
  - Test CRUD operations
  - Test JSON serialization
  - Test relationships
  - _Requirements: 17.1, 17.2, 17.3_

#### 7.3 Application Layer - Quiz Use Cases

- [ ] 7.3.1 Create DTOs and mappers
  - Create QuizDTO, QuizSubmissionDTO, QuestionDTO, AnswerDTO
  - Create mappers
  - _Requirements: 18.4_

- [ ] 7.3.2 Implement CreateQuizUseCase
  - Validate teacher ownership, due date in future, time limit positive
  - Validate questions (MCQ has 2+ options, valid correctAnswer)
  - Create and save quiz
  - Register in DI container as transient
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 7.3.3 Write property test for quiz validation
  - **Property 21: Quiz question validation**
  - **Validates: Requirements 11.3, 11.4**
  - For any MCQ question, it must have 2+ options and valid correctAnswer index

- [ ] 7.3.4 Implement UpdateQuizUseCase
  - Validate ownership, quiz can be edited (before due date and no submissions)
  - Update quiz
  - Register in DI container as transient
  - _Requirements: 11.6, 11.7_

- [ ] 7.3.5 Implement DeleteQuizUseCase
  - Validate ownership, delete quiz
  - Register in DI container as transient
  - _Requirements: 11.8_

- [ ] 7.3.6 Implement ListQuizzesUseCase
  - Validate enrollment or ownership
  - Return quizzes with submission status
  - Register in DI container as transient
  - _Requirements: 11.9_

- [ ] 7.3.7 Implement StartQuizUseCase
  - Validate student enrollment, quiz not past due date
  - Check for existing submission (prevent multiple attempts)
  - Create quiz submission with startedAt timestamp
  - Return quiz DTO with questions (without correct answers for MCQ)
  - Register in DI container as transient
  - _Requirements: 12.1, 12.2, 12.3, 12.9_

- [ ] 7.3.8 Implement AutoSaveQuizAnswersUseCase
  - Validate student owns submission, quiz not expired
  - Update answers in submission
  - Register in DI container as transient
  - _Requirements: 12.4, 12.5_

- [ ] 7.3.9 Implement SubmitQuizUseCase
  - Validate student owns submission, quiz not expired
  - Validate submission is before due date
  - Save final answers
  - Set submittedAt timestamp
  - Register in DI container as transient
  - _Requirements: 12.6, 12.7, 12.8, 12.10_

#### 7.4 Presentation Layer - Quiz API

- [ ] 7.4.1 Create Zod validation schemas for quizzes
  - Create schemas for create, update, start, autosave, submit requests
  - _Requirements: 18.4, 20.2_

- [ ] 7.4.2 Implement QuizController
  - GET /api/courses/:courseId/quizzes - ListQuizzesUseCase
  - POST /api/courses/:courseId/quizzes - CreateQuizUseCase (teacher)
  - GET /api/quizzes/:id - GetQuizUseCase
  - PUT /api/quizzes/:id - UpdateQuizUseCase (teacher)
  - DELETE /api/quizzes/:id - DeleteQuizUseCase (teacher)
  - POST /api/quizzes/:id/start - StartQuizUseCase (student)
  - POST /api/quizzes/:id/autosave - AutoSaveQuizAnswersUseCase (student)
  - POST /api/quizzes/:id/submit - SubmitQuizUseCase (student)
  - GET /api/quizzes/:id/submissions - ListQuizSubmissionsUseCase (teacher)
  - _Requirements: 11.1, 11.6, 11.8, 11.9, 12.1, 12.4, 12.6_

- [ ]* 7.4.3 Write API integration tests for quizzes
  - Test all endpoints, authorization, validation
  - Test timer enforcement
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 7.5 Presentation Layer - Quiz Frontend

- [ ] 7.5.1 Implement CreateQuiz component (teacher)
  - Form with title, description, due date, time limit
  - Question builder for MCQ and essay questions
  - Rich text editor for descriptions
  - Timezone-aware due date picker
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 7.5.2 Implement UpdateQuiz component (teacher)
  - Form for updating quiz
  - Show editing restrictions (before due date and no submissions)
  - _Requirements: 11.6, 11.7_

- [ ] 7.5.3 Implement QuizList component
  - Display quizzes with status
  - Show time remaining until due date
  - Highlight overdue items
  - _Requirements: 11.9_

- [ ] 7.5.4 Implement TakeQuiz component (student)
  - Display quiz questions
  - Implement countdown timer (visible to student)
  - Auto-save answers to localStorage every 30 seconds
  - Auto-save answers to server every 2 minutes
  - Auto-submit when timer expires
  - Prevent multiple submissions
  - Handle network errors gracefully (retry auto-save)
  - Show submission confirmation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

- [ ] 7.5.5 Implement QuizResults component (student)
  - Display submitted quiz with answers
  - Show grade and feedback (after grading)
  - _Requirements: 12.10_

- [ ]* 7.5.6 Write React component tests for quizzes
  - Test CreateQuiz component
  - Test TakeQuiz component (including timer and auto-save)
  - Test QuizResults component
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 7.6 Feature Checkpoint - Quiz Management

- [ ] 7.6.1 Run all quiz tests
  - Run all tests (domain, infrastructure, application, API, frontend)
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 11.1-11.9, 12.1-12.10_

- [ ] 7.6.2 Manual end-to-end testing
  - Test quiz creation (teacher)
  - Test quiz update/delete (teacher)
  - Test quiz taking with timer (student)
  - Test auto-save functionality
  - Test auto-submit on timeout
  - Test multiple submission prevention
  - Verify quiz system works end-to-end
  - _Requirements: 11.1, 11.6, 12.1, 12.4, 12.6, 12.9_

**✅ DELIVERABLE**: Fully working quiz system. Teachers create quizzes, students take timed quizzes with auto-save and auto-submit.



### 8. Feature: Grading (End-to-End)

**Goal**: Teachers can grade assignment submissions and quiz submissions with optimistic locking. Students can view grades and feedback. Fully working grading system.

#### 8.1 Application Layer - Grading Use Cases

- [ ] 8.1.1 Implement GradeSubmissionUseCase (Assignment)
  - Validate teacher ownership
  - Validate submission exists
  - Implement optimistic locking (check version field)
  - Assign grade (0-100) and feedback
  - Lock assignment (set gradingStarted = true) on first grade
  - Update submission with new version
  - Return graded submission DTO
  - Register in DI container as transient
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 21.5_

- [ ]* 8.1.2 Write property test for grading with optimistic locking
  - **Property 22: Optimistic locking prevents concurrent grading**
  - **Validates: Requirements 21.5**
  - For any submission, concurrent grading attempts are detected and rejected

- [ ] 8.1.3 Implement UpdateGradeUseCase
  - Validate teacher ownership
  - Implement optimistic locking
  - Update grade and feedback
  - Update submission with new version
  - Return updated submission DTO
  - Register in DI container as transient
  - _Requirements: 13.6_

- [ ] 8.1.4 Implement GradeQuizSubmissionUseCase
  - Validate teacher ownership
  - Manually assign points per question
  - Warn if total points ≠ 100 (guiderail, not blocking)
  - Save grade and feedback
  - Return graded quiz submission DTO
  - Register in DI container as transient
  - _Requirements: 13.7, 13.8, 13.9_

- [ ] 8.1.5 Implement ListSubmissionsUseCase
  - Validate teacher ownership
  - Return all submissions with status (not submitted, submitted, graded, late)
  - Register in DI container as transient
  - _Requirements: 13.10_

#### 8.2 Presentation Layer - Grading API

- [ ] 8.2.1 Create Zod validation schemas for grading
  - Create schemas for grade submission requests
  - _Requirements: 18.4, 20.2_

- [ ] 8.2.2 Implement GradingController
  - GET /api/assignments/:id/submissions - ListSubmissionsUseCase (teacher)
  - GET /api/submissions/:id - GetSubmissionUseCase
  - POST /api/submissions/:id/grade - GradeSubmissionUseCase (teacher)
  - PUT /api/submissions/:id/grade - UpdateGradeUseCase (teacher)
  - GET /api/quizzes/:id/submissions - ListQuizSubmissionsUseCase (teacher)
  - POST /api/quiz-submissions/:id/grade - GradeQuizSubmissionUseCase (teacher)
  - _Requirements: 13.1, 13.6, 13.7, 13.10_

- [ ]* 8.2.3 Write API integration tests for grading
  - Test all grading endpoints
  - Test optimistic locking (concurrent grading)
  - Test authorization
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3, 21.5_

#### 8.3 Presentation Layer - Grading Frontend

- [ ] 8.3.1 Implement SubmissionList component (teacher)
  - Display all submissions with status
  - Filter by status (not submitted, submitted, graded, late)
  - Show late submission indicator
  - Provide links to grade each submission
  - _Requirements: 13.10_

- [ ] 8.3.2 Implement GradeSubmission component (teacher)
  - Display submission content
  - Form for grade (0-100) and feedback
  - Rich text editor for feedback
  - Handle optimistic locking errors (version mismatch)
  - Show warning if another teacher is grading concurrently
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 21.5_

- [ ] 8.3.3 Implement GradeQuizSubmission component (teacher)
  - Display quiz questions and student answers
  - Form for assigning points per question
  - Show total points and warn if ≠ 100
  - Rich text editor for feedback
  - _Requirements: 13.7, 13.8, 13.9_

- [ ] 8.3.4 Update student views to show grades
  - Display grades and feedback in AssignmentList
  - Display grades and feedback in QuizResults
  - _Requirements: 14.1, 14.2_

- [ ]* 8.3.5 Write React component tests for grading
  - Test SubmissionList component
  - Test GradeSubmission component
  - Test optimistic locking error handling
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 8.4 Feature Checkpoint - Grading

- [ ] 8.4.1 Run all grading tests
  - Run all tests (application, API, frontend)
  - Run all property-based tests (100+ iterations each)
  - Verify all tests pass
  - _Requirements: 13.1-13.10, 21.5_

- [ ] 8.4.2 Manual end-to-end testing
  - Test assignment grading (teacher)
  - Test quiz grading (teacher)
  - Test grade update (teacher)
  - Test optimistic locking (concurrent grading)
  - Test grade viewing (student)
  - Verify grading system works end-to-end
  - _Requirements: 13.1, 13.6, 13.7, 14.1, 21.5_

**✅ DELIVERABLE**: Fully working grading system. Teachers grade submissions with optimistic locking, students view grades and feedback.



### 9. Feature: Progress & Export (End-to-End)

**Goal**: Students can view their progress. Teachers can export grades to CSV. Fully working progress tracking and grade export.

#### 9.1 Application Layer - Progress & Export Use Cases

- [ ] 9.1.1 Implement GetStudentProgressUseCase
  - Validate student enrollment
  - Calculate course average from all graded items
  - Return progress DTO with assignments, quizzes, grades, average
  - Register in DI container as transient
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 9.1.2 Implement ExportGradesUseCase
  - Validate teacher ownership
  - Generate CSV with student info, assignment/quiz names, grades, submission dates
  - Include average grade per student
  - Show "Not Submitted" or "Pending" for ungraded items
  - Return CSV file
  - Register in DI container as transient
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

#### 9.2 Presentation Layer - Progress & Export API

- [ ] 9.2.1 Implement progress and export endpoints
  - GET /api/courses/:id/progress - GetStudentProgressUseCase (student)
  - GET /api/courses/:id/grades/export - ExportGradesUseCase (teacher)
  - _Requirements: 14.1, 15.1_

- [ ]* 9.2.2 Write API integration tests for progress and export
  - Test progress endpoint
  - Test export endpoint
  - Test authorization
  - Use Supertest
  - _Requirements: 18.1, 18.2, 18.3_

#### 9.3 Presentation Layer - Progress & Export Frontend

- [ ] 9.3.1 Implement StudentProgress component
  - Display all assignments and quizzes with status
  - Show grades and feedback
  - Highlight overdue items not submitted
  - Display course average
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 9.3.2 Implement ExportGrades button (teacher)
  - Add "Export Grades" button to course details
  - Download CSV file
  - _Requirements: 15.1_

- [ ]* 9.3.3 Write React component tests for progress
  - Test StudentProgress component
  - Use React Testing Library
  - _Requirements: 19.1, 19.2, 19.5_

#### 9.4 Feature Checkpoint - Progress & Export

- [ ] 9.4.1 Run all progress and export tests
  - Run all tests (application, API, frontend)
  - Verify all tests pass
  - _Requirements: 14.1-14.5, 15.1-15.5_

- [ ] 9.4.2 Manual end-to-end testing
  - Test student progress view
  - Test grade export (teacher)
  - Verify CSV format and content
  - Verify progress tracking works end-to-end
  - _Requirements: 14.1, 15.1_

**✅ DELIVERABLE**: Fully working progress tracking and grade export. Students view progress, teachers export grades to CSV.



### 10. Security Implementation

**Goal**: Implement all security requirements including input sanitization, file upload security, and security testing.

- [ ] 10.1 Implement HTML sanitization
  - Install DOMPurify (client-side) and sanitize-html (server-side)
  - Sanitize all rich text content before storage (server-side)
  - Sanitize all rich text content before rendering (client-side)
  - Apply to: course descriptions, assignment descriptions, quiz questions, material text content, submission feedback
  - _Requirements: 20.2_

- [ ] 10.2 Implement file upload security
  - Validate file types (whitelist: PDF, DOCX, JPG, PNG, GIF)
  - Validate file size (max 10MB)
  - Validate file content (not just extension)
  - Reject executable files (.exe, .sh, .bat, .js, .php, etc.)
  - Apply to: material uploads, assignment submissions
  - _Requirements: 20.3, 20.4, 20.5_

- [ ] 10.3 Implement Content Security Policy (CSP) headers
  - Configure CSP headers in Nginx
  - Restrict script sources
  - Restrict style sources
  - _Requirements: 20.2_

- [ ]* 10.4 Write security tests
  - Test XSS prevention (inject malicious scripts)
  - Test file upload security (executable files, oversized files)
  - Test SQL injection prevention (Prisma parameterized queries)
  - Test path traversal prevention (file downloads)
  - Test CSRF protection (SameSite=Strict cookies)
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ]* 10.5 Run security audit
  - Run npm audit for dependency vulnerabilities
  - Review all authentication and authorization checks
  - Review all input validation
  - Review all file operations
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_



### 11. Error Handling and Logging

**Goal**: Implement robust error handling, logging, and system reliability features.

- [ ] 11.1 Implement database connection retry logic
  - Add retry logic for database connections (up to 3 retries)
  - Exponential backoff between retries
  - Log connection failures
  - _Requirements: 21.1_

- [ ] 11.2 Implement Winston logging
  - Configure Winston with structured JSON logging
  - Set up log levels (error, warn, info, debug)
  - Configure log transports (console, file)
  - Add request/response logging middleware
  - Log all errors with context (user ID, request path, timestamp)
  - Never log sensitive data (passwords, tokens)
  - _Requirements: 21.2, 21.3_

- [ ] 11.3 Implement maintenance mode
  - Create maintenance mode flag in environment variables
  - Add middleware to return 503 Service Unavailable when in maintenance mode
  - Create maintenance page for frontend
  - _Requirements: 21.4_

- [ ] 11.4 Verify concurrent request handling
  - Test with multiple concurrent requests
  - Verify database connection pooling works correctly
  - Verify no race conditions in critical operations
  - _Requirements: 21.5_

- [ ]* 11.5 Write error handling tests
  - Test database connection retry
  - Test error logging
  - Test maintenance mode
  - _Requirements: 21.1, 21.2, 21.4_



### 12. Final Integration and Testing

**Goal**: Run comprehensive test suite, perform end-to-end testing, and ensure all requirements are met.

- [ ]* 12.1 Run full test suite
  - Run all unit tests
  - Run all integration tests
  - Run all property-based tests (100+ iterations each)
  - Run all API tests
  - Run all React component tests
  - Verify 80% code coverage minimum
  - _Requirements: All_

- [ ]* 12.2 Perform end-to-end testing
  - Test complete user journeys (teacher and student)
  - Test all features in sequence
  - Test error scenarios
  - Test edge cases
  - _Requirements: All_

- [ ]* 12.3 Performance testing
  - Test with 50+ concurrent users
  - Verify API response time < 500ms
  - Verify database connection pooling
  - _Requirements: 21.5_

- [ ]* 12.4 Security audit
  - Review all authentication and authorization
  - Review all input validation
  - Review all file operations
  - Run security tests
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 12.5 Documentation
  - Update README with setup instructions
  - Document API endpoints
  - Document environment variables
  - Document deployment procedures
  - _Requirements: All_



### 13. Production Deployment

**Goal**: Deploy the LMS to production with CI/CD pipeline, monitoring, and automated backups.

- [ ] 13.1 Set up GitHub Actions CI/CD pipeline
  - Create workflow for automated testing
  - Create workflow for building Docker images
  - Create workflow for deploying to production
  - Push images to GitHub Container Registry
  - _Requirements: 17.1, 17.5_

- [ ] 13.2 Configure production environment
  - Set up production server (Ubuntu 22.04 LTS)
  - Install Docker and Docker Compose
  - Configure firewall (ports 80, 443, 22)
  - Set up SSH key-based authentication
  - _Requirements: 17.5_

- [ ] 13.3 Configure Docker for production
  - Create docker-compose.prod.yml
  - Configure PostgreSQL with persistent volumes
  - Configure backend with production settings
  - Configure Nginx with SSL/TLS
  - _Requirements: 17.5_

- [ ] 13.4 Set up SSL certificates
  - Install Certbot
  - Generate Let's Encrypt SSL certificate
  - Configure Nginx with SSL
  - Set up auto-renewal cron job
  - _Requirements: 18.1, 18.2_

- [ ] 13.5 Configure environment variables
  - Create .env.production file
  - Generate JWT secrets (32+ characters)
  - Set database credentials
  - Set CORS origin
  - Set frontend URL
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 13.6 Run database migrations
  - Deploy Prisma migrations to production
  - Verify database schema
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 13.7 Set up automated backups
  - Create backup script for PostgreSQL
  - Set up daily backup cron job
  - Configure backup retention (7 days, 4 weeks, 12 months)
  - Test backup restoration
  - _Requirements: 21.1_

- [ ] 13.8 Configure monitoring
  - Set up Winston logging in production
  - Configure log rotation
  - Set up health check endpoint monitoring
  - (Optional) Set up Sentry for error tracking
  - _Requirements: 21.2, 21.3_

- [ ] 13.9 Deploy to production
  - Pull latest code from GitHub
  - Build Docker images
  - Start services with docker-compose
  - Run database migrations
  - Verify deployment
  - _Requirements: 17.5_

- [ ] 13.10 Post-deployment verification
  - Test all features in production
  - Verify SSL certificate
  - Verify backups are running
  - Verify logging is working
  - Monitor for errors
  - _Requirements: All_



## Notes

### Optional Tasks

Tasks marked with `*` are optional and can be skipped for faster MVP delivery:
- Property-based tests (recommended but not blocking)
- Integration tests (recommended but not blocking)
- React component tests (recommended but not blocking)
- Security tests (recommended but not blocking)
- Performance tests (recommended but not blocking)

However, **all security requirements (Requirement 20) must be implemented**, even if tests are skipped.

### Requirements Traceability

Each task references specific requirements from requirements.md using the format `_Requirements: X.Y_`. This ensures:
- All requirements are implemented
- No unnecessary features are added
- Easy verification of requirement coverage

### Checkpoint Strategy

After each complete feature (Sections 2-9), run a **Feature Checkpoint**:
1. Run all tests for that feature (domain, infrastructure, application, API, frontend)
2. Run all property-based tests (100+ iterations each)
3. Perform manual end-to-end testing
4. Verify the feature works completely before moving to the next feature

This ensures:
- Working, demoable features at each step
- Bugs are caught early within feature scope
- Confidence in the codebase before adding complexity

### Property-Based Tests

All property-based tests must run **minimum 100 iterations** to ensure statistical confidence. Use fast-check configuration:

```typescript
fc.assert(
  fc.asyncProperty(
    // generators
    async (input) => {
      // test implementation
    }
  ),
  { numRuns: 100 }
)
```

### Clean Architecture Within Features

Each feature maintains Clean Architecture principles:
- **Domain Layer**: Business entities and rules (framework-independent)
- **Infrastructure Layer**: Database, file storage, external services
- **Application Layer**: Use cases and application logic
- **Presentation Layer**: REST API controllers and React UI

Dependencies point inward: Presentation → Application → Domain ← Infrastructure

### Vertical Slice Benefits

The feature-by-feature approach provides:
- ✅ **Working features faster**: See results after each feature
- ✅ **Early bug detection**: Catch bugs within feature scope
- ✅ **Better demos**: Show working features to stakeholders
- ✅ **Easier debugging**: Smaller scope to investigate issues
- ✅ **Incremental progress**: Clear milestones and deliverables
- ✅ **Reduced risk**: Each feature is tested end-to-end before moving on



## Implementation Order Summary

1. **Project Setup** (Section 1): Docker, database, testing framework, Express, React
2. **Authentication** (Section 2): Register, login, logout, JWT tokens
3. **Course Management** (Section 3): Create, update, archive, delete courses
4. **Enrollment** (Section 4): Search, enroll in courses
5. **Material Management** (Section 5): Upload files, add text, link videos
6. **Assignment** (Section 6): Create assignments, submit (with late submission)
7. **Quiz** (Section 7): Create quizzes, take timed quizzes (with auto-save)
8. **Grading** (Section 8): Grade submissions (with optimistic locking)
9. **Progress & Export** (Section 9): View progress, export grades
10. **Security** (Section 10): Input sanitization, file upload security
11. **Error Handling** (Section 11): Logging, retry logic, maintenance mode
12. **Final Testing** (Section 12): Full test suite, end-to-end testing
13. **Production Deployment** (Section 13): CI/CD, Docker, SSL, backups

**Total Estimated Tasks**: ~200 tasks (including optional tests)
**Estimated Timeline**: 8-12 weeks for full implementation (depending on team size and optional task inclusion)

---

**Ready to implement!** Start with Section 1 (Project Setup) and work through each feature sequentially. Each feature checkpoint ensures working, demoable functionality before moving forward.
