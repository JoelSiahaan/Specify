# Design Document: Learning Management System (LMS)

## Overview

The Learning Management System is a web-based platform built with React 19.2 (TypeScript) frontend and a REST API backend using Node.js/Express with Prisma ORM and PostgreSQL database. The system supports two user roles (Student and Teacher) with distinct capabilities for course management, content delivery, and assessment.

### Key Design Decisions

1. **JWT Authentication**: Using JSON Web Tokens for stateless, scalable authentication
   - **Access Token**: Short-lived (15 minutes), stored in HTTP-only cookie
   - **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie
   - **Logout**: Client-side token removal (simple, stateless approach for MVP)
   - **Security**: HTTP-only cookies prevent XSS attacks, short access token lifetime limits exposure
2. **MVC Architecture**: Model-View-Controller pattern for clear separation of concerns
   - Models: Prisma schema and database operations
   - Views: React components
   - Controllers: Express route handlers
3. **Role-based Access Control**: Middleware-based authorization at the API layer
4. **File Storage**: Local filesystem with configurable path (easily migrated to cloud storage)
5. **Rich Text Support**: Store HTML content with sanitization to prevent XSS
6. **Timezone Handling**: Store all timestamps in UTC, convert to user timezone in frontend
7. **Course Lifecycle**: Active → Archived → Deleted (with safeguards at each stage)
8. **Grading Lock**: First grading action closes assignment to prevent late submissions
9. **Manual Grading Only**: All quiz questions (MCQ and essay) require manual point assignment

## Architecture

### System Architecture

```mermaid
graph TB
    Client[React Frontend<br/>Views]
    Router[Express Router<br/>Controllers]
    Auth[JWT Auth<br/>Middleware]
    RBAC[RBAC<br/>Middleware]
    Services[Business Logic<br/>Services]
    Models[Prisma Models<br/>Data Access]
    DB[(PostgreSQL<br/>Database)]
    FS[File Storage]
    
    Client -->|HTTP/JSON + JWT| Router
    Router --> Auth
    Auth --> RBAC
    RBAC --> Services
    Services --> Models
    Models --> DB
    Services --> FS
```

### Technology Stack

- **Frontend**: React 19.2 with TypeScript, Vite 7.2
- **Backend**: Node.js with Express (MVC pattern)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **File Storage**: Local filesystem (configurable)

### MVC Architecture Pattern

The application follows the Model-View-Controller (MVC) pattern:

#### **Model Layer** (Prisma + Database)
- Prisma schema defines data models
- Database operations and queries
- Data validation and constraints
- Transaction management

#### **View Layer** (React Components)
- Authentication views (Login, Register)
- Role-specific dashboards (Student, Teacher)
- Course management interfaces
- Material/Assignment/Quiz views
- Grading and progress interfaces
- Reusable UI components

#### **Controller Layer** (Express Routes + Middleware)
- Route handlers process HTTP requests
- JWT authentication middleware
- Role-based access control middleware
- Input validation and sanitization
- Response formatting
- Error handling

#### **Service Layer** (Business Logic)
- Authentication service (JWT generation, password hashing)
- Course service (CRUD, enrollment, archiving)
- Material service (file upload, content management)
- Assignment service (creation, submission, validation)
- Quiz service (creation, taking, timing)
- Grading service (scoring, feedback, export)
- File service (upload, download, validation)

## Authorization Architecture

### Overview

The LMS implements a three-level authorization strategy to ensure users can only access resources they are permitted to view or modify. Authorization is enforced at multiple layers: middleware for role-based access, and service layer for resource-specific access control.

### Authorization Levels

#### Level 1: Role-Based Access Control (RBAC)

**Enforced by**: RBAC Middleware at API layer

**Purpose**: Ensure users can only access endpoints appropriate for their role.

**Rules**:
- **Teacher-only endpoints**: Create/update/delete courses, materials, assignments, quizzes; grade submissions; export grades
- **Student-only endpoints**: Enroll in courses, submit assignments, take quizzes, view own progress
- **Shared endpoints**: View courses, materials, assignments, quizzes (with different access levels)

**Implementation**:
```mermaid
graph LR
    Request[HTTP Request] --> Auth[Auth Middleware]
    Auth -->|Valid JWT| RBAC[RBAC Middleware]
    Auth -->|Invalid| Reject1[401 Unauthorized]
    RBAC -->|Role Match| Controller[Controller]
    RBAC -->|Role Mismatch| Reject2[403 Forbidden - FORBIDDEN_ROLE]
    Controller --> Service[Service Layer]
```

#### Level 2: Resource Ownership Validation

**Enforced by**: Service Layer

**Purpose**: Ensure teachers can only modify resources they own.

**Rules**:
- Teachers can only update/delete/archive courses they created
- Teachers can only create materials/assignments/quizzes in their own courses
- Teachers can only grade submissions from their own courses
- Teachers can only export grades from their own courses

**Design Approach**:
- Query resource and check ownership
- Verify resource exists (return 404 if not)
- Verify teacherId matches (return 403 if not)
- Proceed with operation

**Key Considerations**:
- Always check existence before ownership
- Clear error codes distinguish "not found" vs "not owner"
- Prevents teachers from accessing other teachers' resources

#### Level 3: Enrollment-Based Access Control

**Enforced by**: Service Layer

**Purpose**: Ensure students can only access resources from courses they are enrolled in.

**Rules**:
- Students can only view course details if enrolled
- Students can only access materials from enrolled courses
- Students can only view/submit assignments from enrolled courses
- Students can only take quizzes from enrolled courses
- Students can only view their own submissions and grades

**Design Approach**:
- Query resource with course relationship
- Check resource existence (404 if not found)
- For teachers: Validate course ownership
- For students: Query enrollment table to verify enrollment
- Return 403 if not enrolled or not owner

**Key Considerations**:
- Enrollment check requires additional database query
- Cache enrollment status for performance
- Clear error messages distinguish between "not found" and "not enrolled"



### Authorization Flow Diagram

```mermaid
graph TB
    Request[HTTP Request with JWT]
    Auth[Auth Middleware<br/>Extract & Validate JWT]
    RBAC[RBAC Middleware<br/>Check Role vs Endpoint]
    Controller[Controller<br/>Parse & Validate Input]
    Service[Service Layer<br/>Check Resource Access]
    DB[(Database<br/>Query with Filters)]
    
    Request --> Auth
    Auth -->|Valid Token| RBAC
    Auth -->|Missing/Invalid/Expired| Reject1[401 Unauthorized<br/>AUTH_TOKEN_*]
    
    RBAC -->|Role Matches| Controller
    RBAC -->|Role Mismatch| Reject2[403 Forbidden<br/>FORBIDDEN_ROLE]
    
    Controller --> Service
    
    Service -->|Check Ownership| OwnerCheck{Is Owner?}
    Service -->|Check Enrollment| EnrollCheck{Is Enrolled?}
    
    OwnerCheck -->|Yes| DB
    OwnerCheck -->|No| Reject3[403 Forbidden<br/>NOT_COURSE_OWNER]
    
    EnrollCheck -->|Yes| DB
    EnrollCheck -->|No| Reject4[403 Forbidden<br/>NOT_ENROLLED_IN_COURSE]
    
    DB --> Response[200 OK<br/>Return Data]
```

### Access Control Matrix

| Resource | Student (Enrolled) | Student (Not Enrolled) | Teacher (Owner) | Teacher (Not Owner) |
|----------|-------------------|------------------------|-----------------|---------------------|
| **Course Details** | ✅ Read | ❌ 403 NOT_ENROLLED | ✅ Read/Update/Archive/Delete | ❌ 403 NOT_OWNER |
| **Course List** | ✅ Read (all active) | ✅ Read (all active) | ✅ Read (own only) | ✅ Read (own only) |
| **Materials** | ✅ Read/Download | ❌ 403 NOT_ENROLLED | ✅ Create/Read/Update/Delete | ❌ 403 NOT_OWNER |
| **Assignments** | ✅ Read/Submit | ❌ 403 NOT_ENROLLED | ✅ Create/Read/Update/Delete | ❌ 403 NOT_OWNER |
| **Quizzes** | ✅ Read/Take | ❌ 403 NOT_ENROLLED | ✅ Create/Read/Update/Delete | ❌ 403 NOT_OWNER |
| **Submissions (Own)** | ✅ Read | ❌ 403 NOT_ENROLLED | ✅ Read/Grade | ❌ 403 NOT_OWNER |
| **Submissions (Others)** | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ✅ Read/Grade | ❌ 403 NOT_OWNER |
| **Grades (Own)** | ✅ Read | ❌ 403 NOT_ENROLLED | ✅ Read/Update | ❌ 403 NOT_OWNER |
| **Grades (Export)** | ❌ 403 FORBIDDEN_ROLE | ❌ 403 FORBIDDEN_ROLE | ✅ Export | ❌ 403 NOT_OWNER |
| **Enrollment** | ✅ Enroll (if not enrolled) | ✅ Enroll | ❌ 403 FORBIDDEN_ROLE | ❌ 403 FORBIDDEN_ROLE |

### Service Layer Responsibilities

The service layer is the primary enforcement point for resource-level authorization. Each service method must:

1. **Validate Resource Existence**: Check if the requested resource exists before authorization
2. **Validate Ownership** (for teachers): Ensure teacher owns the course/resource
3. **Validate Enrollment** (for students): Ensure student is enrolled in the course
4. **Validate Self-Access** (for personal data): Ensure users only access their own data
5. **Throw Appropriate Errors**: Return specific error codes for different authorization failures

**Service Authorization Responsibilities**:

| Service | Authorization Checks |
|---------|---------------------|
| **CourseService** | - `getCourse()`: Validate teacher ownership OR student enrollment<br/>- `updateCourse()`: Validate teacher ownership<br/>- `archiveCourse()`: Validate teacher ownership<br/>- `deleteCourse()`: Validate teacher ownership + archived status |
| **MaterialService** | - `getMaterial()`: Validate teacher ownership OR student enrollment<br/>- `createMaterial()`: Validate teacher ownership of course<br/>- `updateMaterial()`: Validate teacher ownership of course<br/>- `deleteMaterial()`: Validate teacher ownership of course |
| **AssignmentService** | - `getAssignment()`: Validate teacher ownership OR student enrollment<br/>- `submitAssignment()`: Validate student enrollment<br/>- `listSubmissions()`: Validate teacher ownership |
| **QuizService** | - `getQuiz()`: Validate teacher ownership OR student enrollment<br/>- `startQuiz()`: Validate student enrollment + course not archived<br/>- `submitQuiz()`: Validate student enrollment + active attempt |
| **GradingService** | - `gradeSubmission()`: Validate teacher owns submission's course<br/>- `exportGrades()`: Validate teacher owns course<br/>- `getStudentProgress()`: Validate student is requesting own progress OR teacher owns course |

### Data Access Patterns

Services use specific query patterns to enforce authorization at the database level:

#### Pattern 1: Student Accessing Course Resources

**Design Approach**:
- Query with enrollment join to filter resources
- Only return resources from courses where student is enrolled
- Empty result indicates student is not enrolled

**Key Considerations**:
- Database-level filtering for performance
- Single query validates enrollment and retrieves data
- Prevents unauthorized access at data layer

#### Pattern 2: Teacher Accessing Course Resources

**Design Approach**:
- Query with ownership filter
- Only return resources from courses owned by teacher
- Ensures teachers only see their own course data

**Key Considerations**:
- Database-level filtering for security
- Prevents accidental cross-teacher data access
- Simplifies service layer logic

#### Pattern 3: Listing Resources with Authorization

**Design Approach**:
- Students: Filter by enrollment status and active courses only
- Teachers: Filter by ownership (all statuses)
- Different query patterns based on role

**Key Considerations**:
- Role-specific filtering at database level
- Students see only active courses they're enrolled in
- Teachers see all their courses (active and archived)

#### Pattern 4: Validating Access Before Operations

**Design Approach**:
- Two-step validation: existence check then authorization check
- Step 1: Verify resource exists (return 404 if not)
- Step 2: Verify user has access (return 403 if not)
- Step 3: Perform operation

**Key Considerations**:
- Always check existence before authorization (prevents information leakage)
- Return 404 for non-existent resources regardless of user's authorization
- Clear separation between "not found" and "not authorized"

### Authorization Error Handling

#### Error Categories

**Authentication Errors (401 Unauthorized)**:
- `AUTH_TOKEN_MISSING`: No JWT token provided
- `AUTH_TOKEN_INVALID`: JWT signature invalid or malformed
- `AUTH_TOKEN_EXPIRED`: JWT access token expired (need refresh)
- `AUTH_REFRESH_TOKEN_EXPIRED`: Refresh token expired (need re-login)
- `AUTH_REFRESH_TOKEN_INVALID`: Refresh token invalid or not found

**Authorization Errors (403 Forbidden)**:
- `FORBIDDEN_ROLE`: User role not allowed for this endpoint
- `NOT_COURSE_OWNER`: Teacher attempting to access/modify another teacher's course
- `NOT_ENROLLED_IN_COURSE`: Student attempting to access course they're not enrolled in
- `FORBIDDEN_RESOURCE`: Generic resource access denied

**Resource Errors (404 Not Found)**:
- `RESOURCE_NOT_FOUND`: Requested resource does not exist

#### Error Response Flow

```mermaid
graph TB
    Operation[Service Operation]
    Check1{Resource<br/>Exists?}
    Check2{User Has<br/>Access?}
    Success[Return Data]
    Error404[404 Not Found<br/>RESOURCE_NOT_FOUND]
    Error403[403 Forbidden<br/>NOT_ENROLLED/NOT_OWNER]
    
    Operation --> Check1
    Check1 -->|No| Error404
    Check1 -->|Yes| Check2
    Check2 -->|No| Error403
    Check2 -->|Yes| Success
```

**Error Response Format**:
```json
{
  "error": {
    "code": "NOT_ENROLLED_IN_COURSE",
    "message": "You must be enrolled in this course to access this resource"
  }
}
```

**Security Principle**: Always check resource existence before authorization to prevent information leakage. Return 404 for non-existent resources regardless of user's authorization status.

## Components and Interfaces

### Frontend Components

#### Authentication Components
- `LoginPage`: Email/password login form
- `RegisterPage`: User registration with role selection
- `ProtectedRoute`: HOC for route protection based on authentication

#### Dashboard Components
- `StudentDashboard`: Display enrolled courses, upcoming deadlines
- `TeacherDashboard`: Display created courses, student counts, create course button

#### Course Components
- `CourseList`: Browse and search active courses
- `CourseDetail`: View course materials, assignments, quizzes
- `CourseForm`: Create/edit course (teacher only)
- `EnrollmentForm`: Enroll using course code

#### Material Components
- `MaterialList`: Display all materials in a course
- `MaterialForm`: Add/edit materials (file, text, video link)
- `MaterialViewer`: Render different material types

#### Assignment Components
- `AssignmentList`: Display assignments with status
- `AssignmentForm`: Create/edit assignment (teacher only)
- `AssignmentSubmission`: Submit files or text
- `SubmissionViewer`: View student submissions (teacher)

#### Quiz Components
- `QuizList`: Display quizzes with status
- `QuizForm`: Create/edit quiz with questions (teacher only)
- `QuizTaker`: Take quiz with timer
- `QuizGrader`: Grade quiz submissions (teacher)

#### Grading Components
- `GradingInterface`: Assign grades and feedback
- `GradeExport`: Export grades to CSV
- `StudentProgress`: View grades and progress

### Backend API Endpoints

#### Authentication
```typescript
POST   /api/auth/register        // Register new user
POST   /api/auth/login           // Login user, returns JWT in HTTP-only cookies
POST   /api/auth/refresh         // Refresh JWT access token using refresh token cookie
POST   /api/auth/logout          // Logout user (client-side cookie removal)
GET    /api/auth/me              // Get current user from JWT
```

#### Courses
```typescript
GET    /api/courses              // List active courses (student: all, teacher: own)
GET    /api/courses/archived     // List archived courses (teacher only)
POST   /api/courses              // Create course (teacher only)
GET    /api/courses/:id          // Get course details
PUT    /api/courses/:id          // Update course (teacher only)
DELETE /api/courses/:id          // Delete archived course (teacher only)
POST   /api/courses/:id/archive  // Archive course (teacher only)
POST   /api/courses/enroll       // Enroll in course (student only)
POST   /api/courses/:id/unenroll-bulk // Bulk unenroll (teacher only)
```

#### Materials
```typescript
GET    /api/courses/:courseId/materials     // List materials
POST   /api/courses/:courseId/materials     // Create material (teacher only)
GET    /api/materials/:id                   // Get material
PUT    /api/materials/:id                   // Update material (teacher only)
DELETE /api/materials/:id                   // Delete material (teacher only)
GET    /api/materials/:id/download          // Download file
```

#### Assignments
```typescript
GET    /api/courses/:courseId/assignments   // List assignments
POST   /api/courses/:courseId/assignments   // Create assignment (teacher only)
GET    /api/assignments/:id                 // Get assignment
PUT    /api/assignments/:id                 // Update assignment (teacher only)
DELETE /api/assignments/:id                 // Delete assignment (teacher only)
GET    /api/assignments/:id/submissions     // List submissions (teacher only)
POST   /api/assignments/:id/submit          // Submit assignment (student only)
```

#### Quizzes
```typescript
GET    /api/courses/:courseId/quizzes       // List quizzes
POST   /api/courses/:courseId/quizzes       // Create quiz (teacher only)
GET    /api/quizzes/:id                     // Get quiz
PUT    /api/quizzes/:id                     // Update quiz (teacher only)
DELETE /api/quizzes/:id                     // Delete quiz (teacher only)
POST   /api/quizzes/:id/start               // Start quiz (student only)
POST   /api/quizzes/:id/autosave            // Auto-save answers during quiz (student only)
POST   /api/quizzes/:id/submit              // Submit quiz (student only)
GET    /api/quizzes/:id/submissions         // List submissions (teacher only)
```

#### Grading
```typescript
GET    /api/submissions/:id                 // Get submission details
POST   /api/submissions/:id/grade           // Grade submission (teacher only)
PUT    /api/submissions/:id/grade           // Update grade (teacher only)
GET    /api/courses/:id/grades/export       // Export grades CSV (teacher only)
GET    /api/courses/:id/progress            // Get student progress (student only)
```

### Service Interfaces

#### AuthService
```typescript
interface AuthService {
  register(email: string, password: string, name: string, role: 'STUDENT' | 'TEACHER'): Promise<User>
  login(email: string, password: string): Promise<{ user: User, accessToken: string, refreshToken: string }>
  logout(): void // Client-side only for MVP
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>
  validateToken(token: string): Promise<User | null>
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>
  generateAccessToken(userId: string, role: string): string // 15 min expiry
  generateRefreshToken(userId: string): string // 7 days expiry
}
```

#### CourseService
```typescript
interface CourseService {
  createCourse(teacherId: string, name: string, description: string): Promise<Course>
  generateUniqueCourseCode(maxRetries?: number): Promise<string> // Default 5 retries
  getCourse(courseId: string, userId: string): Promise<Course>
  updateCourse(courseId: string, teacherId: string, updates: Partial<Course>): Promise<Course>
  archiveCourse(courseId: string, teacherId: string): Promise<Course>
  deleteCourse(courseId: string, teacherId: string): Promise<void>
  listActiveCourses(userId: string, role: string): Promise<Course[]>
  listArchivedCourses(teacherId: string): Promise<Course[]>
  searchCourses(query: string, userId: string): Promise<Course[]>
  enrollStudent(studentId: string, courseCode: string): Promise<Enrollment>
  bulkUnenroll(courseId: string, teacherId: string): Promise<number>
}
```

#### MaterialService
```typescript
interface MaterialService {
  createMaterial(courseId: string, teacherId: string, data: MaterialData): Promise<Material>
  updateMaterial(materialId: string, teacherId: string, data: Partial<MaterialData>): Promise<Material>
  deleteMaterial(materialId: string, teacherId: string): Promise<void>
  listMaterials(courseId: string, userId: string): Promise<Material[]>
  getMaterial(materialId: string, userId: string): Promise<Material>
}
```

#### AssignmentService
```typescript
interface AssignmentService {
  createAssignment(courseId: string, teacherId: string, data: AssignmentData): Promise<Assignment>
  updateAssignment(assignmentId: string, teacherId: string, data: Partial<AssignmentData>): Promise<Assignment>
  deleteAssignment(assignmentId: string, teacherId: string): Promise<void>
  listAssignments(courseId: string, userId: string): Promise<Assignment[]>
  getAssignment(assignmentId: string, userId: string): Promise<Assignment>
  submitAssignment(assignmentId: string, studentId: string, data: SubmissionData): Promise<Submission>
  listSubmissions(assignmentId: string, teacherId: string): Promise<Submission[]>
}
```

#### QuizService
```typescript
interface QuizService {
  createQuiz(courseId: string, teacherId: string, data: QuizData): Promise<Quiz>
  updateQuiz(quizId: string, teacherId: string, data: Partial<QuizData>): Promise<Quiz>
  deleteQuiz(quizId: string, teacherId: string): Promise<void>
  listQuizzes(courseId: string, userId: string): Promise<Quiz[]>
  getQuiz(quizId: string, userId: string): Promise<Quiz>
  startQuiz(quizId: string, studentId: string): Promise<QuizAttempt>
  autoSaveAnswers(attemptId: string, answers: Partial<Answer>[]): Promise<void> // Auto-save during quiz
  submitQuiz(quizId: string, studentId: string, answers: Answer[]): Promise<Submission>
  autoSubmitOnTimeout(attemptId: string): Promise<Submission> // Auto-submit when timer expires
  listSubmissions(quizId: string, teacherId: string): Promise<Submission[]>
}
```

#### GradingService
```typescript
interface GradingService {
  gradeSubmission(submissionId: string, teacherId: string, grade: number, feedback?: string): Promise<Submission>
  updateGrade(submissionId: string, teacherId: string, grade: number, feedback?: string): Promise<Submission>
  gradeQuizQuestion(submissionId: string, questionId: string, points: number, teacherId: string): Promise<void>
  calculateQuizTotal(submissionId: string): Promise<{ total: number, warning: string | null }> // Returns total and warning if sum ≠ 100
  exportGrades(courseId: string, teacherId: string): Promise<string> // Returns CSV content
  getStudentProgress(courseId: string, studentId: string): Promise<ProgressData>
  lockAssignmentForGrading(assignmentId: string): Promise<void> // Sets gradingStarted flag with transaction
}
```

#### FileService
```typescript
interface FileService {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> // Returns file path
  deleteFile(filePath: string): Promise<void>
  validateFileType(mimeType: string, allowedTypes: string[]): boolean
  validateFileSize(size: number, maxSize: number): boolean
  getFile(filePath: string): Promise<Buffer>
}
```

## Data Models

### Database Schema (Prisma)

```prisma
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  passwordHash  String
  name          String
  role          Role
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relations
  createdCourses Course[]     @relation("TeacherCourses")
  enrollments    Enrollment[]
  submissions    Submission[]
  refreshTokens  RefreshToken[]
}

enum Role {
  STUDENT
  TEACHER
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token]) // For token validation lookup
}

model Course {
  id          String        @id @default(uuid())
  name        String
  description String
  courseCode  String        @unique
  status      CourseStatus  @default(ACTIVE)
  teacherId   String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  // Relations
  teacher     User          @relation("TeacherCourses", fields: [teacherId], references: [id])
  enrollments Enrollment[]
  materials   Material[]
  assignments Assignment[]
  quizzes     Quiz[]
  
  @@index([teacherId])
  @@index([status])
}

enum CourseStatus {
  ACTIVE
  ARCHIVED
}

model Enrollment {
  id         String   @id @default(uuid())
  studentId  String
  courseId   String
  enrolledAt DateTime @default(now())
  
  student User   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course  Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
}

model Material {
  id          String       @id @default(uuid())
  courseId    String
  type        MaterialType
  title       String
  content     String?      // For TEXT type or video URL
  filePath    String?      // For FILE type
  fileName    String?
  fileSize    Int?
  mimeType    String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@index([courseId])
}

enum MaterialType {
  FILE
  TEXT
  VIDEO_LINK
}

model Assignment {
  id              String           @id @default(uuid())
  courseId        String
  title           String
  description     String
  dueDate         DateTime
  submissionType  SubmissionType
  allowedFormats  String[]         // For file uploads
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  gradingStarted  Boolean          @default(false)
  
  course      Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  submissions Submission[]
  
  @@index([courseId])
  @@index([dueDate])
}

enum SubmissionType {
  FILE
  TEXT
  BOTH
}

model Quiz {
  id          String       @id @default(uuid())
  courseId    String
  title       String
  description String
  dueDate     DateTime
  timeLimit   Int          // In minutes
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  course      Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions   Question[]
  submissions Submission[]
  
  @@index([courseId])
  @@index([dueDate])
}

model Question {
  id           String       @id @default(uuid())
  quizId       String
  type         QuestionType
  questionText String
  options      String[]     // For MCQ
  correctAnswer Int?        // Index for MCQ
  order        Int
  createdAt    DateTime     @default(now())
  
  quiz    Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers Answer[]
  
  @@index([quizId])
}

enum QuestionType {
  MCQ
  ESSAY
}

model Submission {
  id            String           @id @default(uuid())
  studentId     String
  assignmentId  String?
  quizId        String?
  submittedAt   DateTime         @default(now())
  status        SubmissionStatus @default(SUBMITTED)
  isLate        Boolean          @default(false)
  grade         Float?
  feedback      String?
  version       Int              @default(1) // For optimistic locking
  
  // For assignment submissions
  filePath      String?
  fileName      String?
  textContent   String?
  
  // For quiz submissions
  startedAt     DateTime?
  completedAt   DateTime?
  
  student    User        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  assignment Assignment? @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  quiz       Quiz?       @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers    Answer[]
  
  @@index([studentId])
  @@index([assignmentId])
  @@index([quizId])
}

enum SubmissionStatus {
  NOT_SUBMITTED
  SUBMITTED
  GRADED
}

model Answer {
  id           String   @id @default(uuid())
  submissionId String
  questionId   String
  answerText   String?  // For essay or MCQ (stores selected option text)
  selectedOption Int?   // For MCQ (index)
  points       Float?   // Manually assigned by teacher
  createdAt    DateTime @default(now())
  
  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  question   Question   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@unique([submissionId, questionId])
  @@index([submissionId])
  @@index([questionId])
}
```

### Key Data Model Decisions

1. **UUID Primary Keys**: For security and distributed system compatibility
2. **Cascade Deletes**: Automatic cleanup of related data when parent is deleted (following Prisma best practices)
3. **Unique Constraints**: Prevent duplicate enrollments and course codes
4. **Enum Types**: Type-safe status and role management
5. **Nullable Fields**: Support different submission types and optional grading
6. **Timestamps**: Track creation and updates for audit trails
7. **Indexes**: Optimize common queries (userId, courseId, dueDate lookups)
8. **Grading Lock Flag**: `gradingStarted` on Assignment prevents late submissions
9. **Quiz Timing**: Store `startedAt` and `completedAt` for time limit enforcement
10. **Manual Points**: `points` field on Answer for teacher-assigned scores
11. **Refresh Tokens**: Separate table for JWT refresh token management with expiration

## Critical Flows and Edge Cases

### JWT Logout Flow

**Challenge**: JWT tokens are stateless and cannot be "invalidated" server-side once issued.

**Solution**:
1. **Logout Process**:
   - Client calls `/api/auth/logout` with refresh token
   - Server marks refresh token as revoked in database (soft delete or revoked flag)
   - Client removes both access and refresh tokens from cookies
   - Access token remains valid until expiration (short-lived: 15 minutes)
   
2. **Token Refresh**:
   - Server checks if refresh token exists and is not revoked before issuing new access token
   - Revoked refresh tokens cannot generate new access tokens

3. **Security Trade-off**:
   - Access tokens remain valid for their lifetime even after logout
   - Mitigated by short expiration time (15 minutes)
   - For higher security, implement token blacklist (Redis cache)

### Quiz Timer and Network Issues

**Challenge**: Students may lose connection during quiz, browser may crash, or tab may close.

**Solution**:
1. **Auto-Save Mechanism**:
   - Frontend auto-saves answers every 30 seconds to backend
   - Endpoint: `POST /api/quizzes/:id/autosave`
   - Stores partial answers in Submission record
   
2. **Timer Tracking**:
   - Server stores `startedAt` timestamp when quiz begins
   - Server calculates remaining time based on `startedAt + timeLimit`
   - Client timer is for UX only, server is source of truth
   
3. **Reconnection Handling**:
   - When student reconnects, fetch current answers and remaining time from server
   - If time expired, auto-submit with saved answers
   - Grace period: 5 seconds after timeout for final submission
   
4. **Browser Crash Recovery**:
   - On page reload, check if active quiz attempt exists
   - Resume quiz with saved answers and remaining time
   - If time expired, show "Quiz auto-submitted" message

### Grading Lock and Concurrency

**Challenge**: Prevent race conditions when grading starts or when concurrent operations occur.

**Design Approach**:

1. **Assignment Grading Lock**:
   - Use database transaction to ensure atomicity
   - When first grade is saved, set `gradingStarted` flag on assignment
   - Check flag status before allowing new submissions
   - Transaction prevents race condition between checking and setting flag

2. **Submission Validation**:
   - Check `gradingStarted` flag before accepting submission
   - Use transaction to re-check flag inside transaction scope
   - Reject submission if flag is set
   - Return appropriate error code

3. **Quiz Grading**:
   - Quizzes don't have `gradingStarted` flag (by design)
   - Once submitted, quiz cannot be resubmitted (enforced by unique constraint)
   - Teachers can grade at any time after submission

**Key Considerations**:
- Database transactions ensure atomicity
- Double-check pattern prevents race conditions
- Clear error messages for rejected submissions

3. **Quiz Grading**:
   - Quizzes don't have `gradingStarted` flag (by design)
   - Once submitted, quiz cannot be resubmitted (enforced by unique constraint)
   - Teachers can grade at any time after submission

### Course Code Generation with Retry Limit

**Challenge**: Ensure unique course codes even with collisions, but prevent infinite loops.

**Design Approach**:
- Generate random 6-character alphanumeric code
- Check uniqueness against database
- Retry up to 5 times if collision occurs
- Return error if all retries fail

**Rationale**:
- 6 characters alphanumeric = 36^6 = 2.1 billion combinations
- Collision probability is extremely low
- 5 retries is more than sufficient
- If all retries fail, it's likely a system issue (return error to user)

**Key Considerations**:
- Configurable retry limit
- Clear error message for generation failure
- Log collision events for monitoring

### File Upload Timeout and Progress

**Challenge**: Large files (up to 10MB) may timeout on slow connections.

**Solution**:
1. **Timeout Configuration**:
   - Set Express timeout to 5 minutes for upload endpoints
   - Configure multer with appropriate limits
   
2. **Progress Tracking** (Frontend):
   - Use XMLHttpRequest or Fetch API with progress events
   - Show upload progress bar to user
   - Allow cancellation
   
3. **Chunked Upload** (Future Enhancement):
   - For MVP, single upload with extended timeout
   - For production, consider chunked upload for files > 5MB

4. **Retry Mechanism**:
   - Frontend retries failed uploads once automatically
   - User can manually retry if needed

### Concurrent Grading Prevention

**Challenge**: Two teachers (or same teacher in two tabs) grading same submission simultaneously.

**Design Approach**:

1. **Optimistic Locking**:
   - Add `version` field to Submission model
   - Increment version on each update
   - Check version before update to detect concurrent modifications
   - If version mismatch, reject update with error

2. **UI Indication**:
   - Show "Last updated by [teacher] at [time]" on grading page
   - Warn if submission was recently modified

**Key Considerations**:
- Optimistic locking prevents data loss from concurrent updates
- Version field tracks modification history
- Clear error messages guide users to refresh and retry

### Archive Course Flow

**Challenge**: Archiving must close all assignments/quizzes and prevent submissions atomically.

**Design Approach**:

1. **Atomic Operation**:
   - Use database transaction to ensure all-or-nothing operation
   - Update course status to ARCHIVED
   - Close all assignments by setting `gradingStarted` flag
   - Validate course ownership before operation

2. **Quiz Handling**:
   - Quizzes are closed by due date check, not by flag
   - Students cannot start quiz if course is archived (checked at quiz start)
   - Existing quiz attempts can be completed

**Key Considerations**:
- Transaction ensures atomicity
- Prevents race conditions during archiving
**Key Considerations**:
- Transaction ensures atomicity
- Prevents race conditions during archiving
- Clear separation between assignment and quiz closing mechanisms

3. **Validation in Quiz Start**:
   - Check course status before allowing quiz start
   - Reject if course is archived
   - Return appropriate error code



## Error Handling

### Error Response Format

All API errors follow a consistent format with error code, message, and optional details for debugging.

**Response Structure**:
- `code`: Machine-readable error identifier
- `message`: Human-readable error description
- `details`: Optional additional context (validation errors, field-specific messages)

### Error Categories

#### Authentication Errors (401)
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_TOKEN_EXPIRED`: JWT access token expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_TOKEN_MISSING`: No authentication token provided
- `AUTH_REFRESH_TOKEN_EXPIRED`: Refresh token expired
- `AUTH_REFRESH_TOKEN_INVALID`: Refresh token is invalid or revoked
- `AUTH_REQUIRED`: Authentication required for this endpoint

#### Authorization Errors (403)
- `FORBIDDEN_ROLE`: User role not authorized for this action
- `FORBIDDEN_RESOURCE`: User not authorized to access this resource

#### Validation Errors (400)
- `VALIDATION_FAILED`: Input validation failed
- `INVALID_FILE_TYPE`: File type not allowed
- `INVALID_FILE_SIZE`: File exceeds size limit
- `INVALID_URL`: URL format invalid
- `INVALID_DATE`: Date is in the past or invalid format
- `INVALID_GRADE`: Grade not between 0-100
- `MISSING_REQUIRED_FIELD`: Required field not provided

#### Business Logic Errors (400/409)
- `COURSE_CODE_INVALID`: Course code not found
- `COURSE_ARCHIVED`: Cannot enroll in archived course
- `COURSE_ACTIVE`: Cannot delete active course (must archive first)
- `DUPLICATE_ENROLLMENT`: Student already enrolled
- `ASSIGNMENT_CLOSED`: Assignment closed for submissions
- `ASSIGNMENT_PAST_DUE`: Cannot edit assignment after due date
- `QUIZ_PAST_DUE`: Cannot start quiz after due date
- `QUIZ_ALREADY_SUBMITTED`: Quiz already submitted
- `QUIZ_HAS_SUBMISSIONS`: Cannot edit quiz with submissions
- `SUBMISSION_MISSING_CONTENT`: Required submission content missing
- `SUBMISSION_AFTER_GRADING`: Cannot submit after grading started
- `RESUBMISSION_NOT_ALLOWED`: Cannot resubmit after grading started
- `TIME_LIMIT_EXCEEDED`: Quiz time limit exceeded

#### Not Found Errors (404)
- `RESOURCE_NOT_FOUND`: Requested resource does not exist

#### Server Errors (500)
- `DATABASE_ERROR`: Database operation failed
- `FILE_SYSTEM_ERROR`: File operation failed
- `INTERNAL_ERROR`: Unexpected server error

### Error Handling Strategy

#### Frontend Error Handling
1. **Network Errors**: Display "Connection failed" message with retry option
2. **Validation Errors**: Show field-specific error messages
3. **Authorization Errors**: Redirect to login or show access denied message
4. **Server Errors**: Display user-friendly error message and log details

#### Backend Error Handling
1. **Input Validation**: Validate all inputs before processing
2. **Database Errors**: Retry connection up to 3 times, log error with context
3. **File Operations**: Validate before upload, clean up on failure
4. **Transaction Rollback**: Use database transactions for multi-step operations
5. **Error Logging**: Log all errors with timestamp, user context, and stack trace
6. **Sanitize Responses**: Never expose internal system details in error messages

#### Specific Error Scenarios

**Course Code Collision**:
- Retry generation up to 5 times
- If all retries fail, return server error

**File Upload Failure**:
- Validate file type and size before upload
- Clean up partial uploads on failure
- Return specific error message

**Concurrent Grading**:
- Use database transactions to prevent race conditions
- Lock assignment when first grade is saved

**Quiz Timer Expiration**:
- Frontend countdown with auto-submit
- Backend validates submission time
- Accept submission if within grace period (5 seconds)

**Database Connection Loss**:
- Retry connection 3 times with exponential backoff
- Return maintenance mode message if all retries fail

## Testing Strategy

### Testing Approach

The LMS will use a dual testing approach combining unit tests for specific examples and property-based tests for universal correctness properties. This ensures both concrete functionality and general correctness across all inputs.

### Testing Framework

- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check (JavaScript/TypeScript PBT library)
- **API Testing**: Supertest
- **Database Testing**: In-memory PostgreSQL or test database

### Test Configuration

- **Property Tests**: Minimum 100 iterations per test
- **Test Isolation**: Each test uses fresh database state
- **Mock Strategy**: Minimize mocking, prefer integration testing
- **Coverage Target**: 80% code coverage minimum

### Unit Testing Focus

Unit tests validate specific examples, edge cases, and error conditions:

1. **Authentication**: Valid/invalid credentials, session expiration
2. **Course Management**: Create, update, archive, delete flows
3. **Enrollment**: Valid/invalid course codes, duplicate enrollment
4. **File Upload**: Valid/invalid file types and sizes
5. **Assignment Submission**: Before/after due date, with/without grading
6. **Quiz Taking**: Timer expiration, answer submission
7. **Grading**: Valid/invalid grades, feedback storage
8. **Error Handling**: All error scenarios return correct error codes

### Property-Based Testing Focus

Property tests validate universal properties across all inputs:

1. **Data Integrity**: Operations preserve required invariants
2. **Round-Trip Properties**: Serialization/deserialization consistency
3. **Idempotence**: Operations that should have same effect when repeated
4. **Authorization**: Role checks work for all users and resources
5. **Validation**: Input validation correctly rejects invalid data
6. **State Transitions**: Valid state changes for all entities

### Test Organization

```
src/
  services/
    __tests__/
      auth.test.ts           # Unit tests
      auth.properties.test.ts # Property tests
      course.test.ts
      course.properties.test.ts
  api/
    __tests__/
      auth.api.test.ts       # API integration tests
      course.api.test.ts
  components/
    __tests__/
      LoginPage.test.tsx     # Component tests
      CourseList.test.tsx
```

### Property Test Tagging

Each property test must reference its design document property:

```typescript
// Feature: core-lms, Property 1: Authentication round-trip
test('valid user credentials authenticate and create valid session', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        name: fc.string({ minLength: 1 }),
        role: fc.constantFrom('STUDENT', 'TEACHER')
      }),
      async (userData) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

- **API Endpoints**: Test all endpoints with valid and invalid inputs
- **Database Operations**: Verify CRUD operations and constraints
- **File Operations**: Test upload, download, and deletion
- **Authentication Flow**: Test login, session management, logout
- **Authorization Flow**: Test role-based access control

### End-to-End Testing Considerations

While E2E testing is not part of the MVP scope, the following scenarios should be validated manually:

1. Complete student enrollment and assignment submission flow
2. Complete teacher course creation and grading flow
3. Quiz taking with timer expiration
4. Grade export functionality
5. Course archiving and deletion flow



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated to avoid redundancy:

1. **Authentication and Session Management**: Properties 1.1, 1.4, and 1.6 can be combined into comprehensive authentication flow properties
2. **Role-Based Access Control**: Properties 2.1, 2.2, and 2.3 overlap and can be consolidated into a single RBAC property
3. **Course Lifecycle**: Properties 5.4, 5.5, 5.6, and 5.7 describe related state transitions that can be combined
4. **Submission Timing**: Properties 10.7, 10.8, and 10.9 describe different time-based submission scenarios that can be unified
5. **Data Persistence**: Properties 17.1, 17.2, and 17.3 describe CRUD operations that can be combined into persistence properties
6. **Dashboard Display**: Properties 3.1/3.2 and 4.1/4.2 describe similar data display patterns that can be generalized

The following properties represent the consolidated, non-redundant set of correctness properties:

### Authentication and Authorization Properties

**Property 1: Authentication creates valid JWT tokens**
*For any* valid user credentials (email, password, name, role), when a user registers and then logs in, the system should return valid JWT access and refresh tokens that can be used to authorize subsequent requests.
**Validates: Requirements 1.1, 1.4, 1.7**

**Property 2: Invalid credentials are rejected**
*For any* invalid credential combination (wrong password, non-existent email, malformed input), authentication should fail and return an appropriate error without creating tokens.
**Validates: Requirements 1.2**

**Property 3: Unauthenticated access is denied**
*For any* protected endpoint, requests without valid JWT tokens should be rejected and return an authentication error.
**Validates: Requirements 1.3**

**Property 4: Token expiration invalidates access**
*For any* expired JWT access token, requests using that token should be rejected with a token expired error, requiring token refresh.
**Validates: Requirements 1.6**

**Property 5: Refresh token mechanism works**
*For any* valid refresh token, the system should generate a new access token, and the new token should authorize requests.
**Validates: Requirements 1.6**

**Property 6: Users have exactly one role**
*For any* user in the system, the user should have exactly one role (either STUDENT or TEACHER), never zero roles or multiple roles.
**Validates: Requirements 1.5**

**Property 7: Role-based access control is enforced**
*For any* user and any endpoint, access should be granted if and only if the user's role matches the endpoint's required role. Students should be denied access to teacher-only endpoints, teachers should be denied access to student-only endpoints, and users should be granted access to role-appropriate endpoints.
**Validates: Requirements 2.1, 2.2, 2.3**

### Course Management Properties

**Property 8: Course creation generates unique codes**
*For any* valid course data (name, description, teacher), creating a course should generate a unique course code that doesn't collide with existing codes, and the course should be stored with ACTIVE status.
**Validates: Requirements 5.1**

**Property 9: Course updates are persisted**
*For any* active course and any valid update data, updating the course should persist the changes and the updated data should be retrievable.
**Validates: Requirements 5.3**

**Property 9: Course archiving transitions state correctly**
*For any* active course, when archived, the course should: (1) change status to ARCHIVED, (2) not appear in active course lists, (3) reject new enrollment attempts, (4) close all open assignments and quizzes to prevent submissions, and (5) allow students to view in read-only mode.
**Validates: Requirements 5.4, 5.5, 5.11**

**Property 10: Active courses cannot be deleted**
*For any* course with ACTIVE status, deletion attempts should be rejected with an error requiring archiving first.
**Validates: Requirements 5.6**

**Property 11: Archived course deletion cascades**
*For any* archived course, deletion should permanently remove the course and all related data (materials, assignments, quizzes, submissions, grades, enrollments).
**Validates: Requirements 5.7**

**Property 12: Course name validation**
*For any* course creation or update attempt without a name, the operation should be rejected with a validation error.
**Validates: Requirements 5.9**

**Property 13: Course filtering by status**
*For any* teacher, listing courses should correctly separate active and archived courses, with each course appearing in exactly one list based on its status.
**Validates: Requirements 5.10**

**Property 14: Bulk unenrollment works**
*For any* archived course with enrolled students, bulk unenrollment should remove all enrollments and students should no longer have access to the course.
**Validates: Requirements 5.8**

### Course Discovery and Enrollment Properties

**Property 15: Active course list filtering**
*For any* student viewing the course list, only courses with ACTIVE status should be displayed, each with name, teacher name, and description. Archived courses should never appear in the list or search results.
**Validates: Requirements 6.1, 6.2**

**Property 16: Course search filters correctly**
*For any* search query, the results should contain only active courses whose names match the query (case-insensitive), and all results should include name, teacher, and description.
**Validates: Requirements 6.3**

**Property 17: Enrollment status is accurate**
*For any* student and any course in the course list, the enrollment indicator should correctly reflect whether the student is enrolled in that course.
**Validates: Requirements 6.4**

**Property 18: Valid course code enrollment succeeds**
*For any* student and any valid course code for an active course, if the student is not already enrolled, enrollment should succeed and the student should gain access to the course.
**Validates: Requirements 6.5**

**Property 19: Invalid enrollment attempts are rejected**
*For any* student and any invalid course code (non-existent, archived course, or already enrolled), enrollment should be rejected with an appropriate error.
**Validates: Requirements 6.6, 6.7, 6.8**

### Material Management Properties

**Property 20: File materials are stored**
*For any* valid file (PDF, JPG, PNG, GIF under 10MB), when uploaded by a teacher to a course, the file should be stored and retrievable by enrolled students.
**Validates: Requirements 7.1**

**Property 21: Text materials preserve formatting**
*For any* rich text content, when stored as a material, the formatting should be preserved and correctly displayed when retrieved.
**Validates: Requirements 7.2, 7.3**

**Property 22: Invalid materials are rejected**
*For any* invalid material (invalid URL, oversized file, video file upload, unsupported file type), the creation should be rejected with a descriptive error.
**Validates: Requirements 7.4, 7.10**

**Property 23: Material updates and deletions work**
*For any* existing material, teachers should be able to update its content or delete it, and changes should be immediately reflected.
**Validates: Requirements 7.6, 7.7**

### Student Material Access Properties

**Property 24: Enrolled students access all materials**
*For any* student enrolled in a course, accessing the course should display all materials (files, text, video links) with correct rendering and download capabilities.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Property 25: Non-enrolled students are denied access**
*For any* student not enrolled in a course, attempts to access course materials should be denied with an authorization error.
**Validates: Requirements 8.5**

### Assignment Management Properties

**Property 26: Assignment creation stores all data**
*For any* valid assignment data (title, description, future due date, submission type, allowed formats), creating an assignment should store all fields and make the assignment available to enrolled students.
**Validates: Requirements 9.1, 9.4, 9.5, 9.6, 9.7**

**Property 27: Past due dates are rejected**
*For any* assignment creation or update with a due date in the past, the operation should be rejected with a validation error.
**Validates: Requirements 9.2**

**Property 28: Due dates are timezone-consistent**
*For any* assignment due date, the date should be stored in UTC and correctly converted to the user's timezone when displayed, maintaining consistency across different timezones.
**Validates: Requirements 9.3**

**Property 29: Assignment editing respects constraints**
*For any* assignment, editing should be allowed only before the due date, and should be rejected after the due date with an error.
**Validates: Requirements 9.8, 9.9**

**Property 30: Assignment deletion always works**
*For any* assignment, deletion should succeed regardless of due date or submission status, removing the assignment and all related submissions.
**Validates: Requirements 9.10**

**Property 31: Time remaining calculation is accurate**
*For any* assignment with a future due date, the calculated time remaining should accurately reflect the difference between current time and due date.
**Validates: Requirements 9.12**

### Assignment Submission Properties

**Property 32: Valid submissions are accepted**
*For any* assignment and any student submission with required content (file in allowed format, text, or both as specified), if submitted before the due date and before grading starts, the submission should be accepted and stored with a timestamp.
**Validates: Requirements 10.1, 10.3, 10.6, 10.7**

**Property 33: Invalid submissions are rejected**
*For any* submission missing required content or with files in unsupported formats, the submission should be rejected with a descriptive error.
**Validates: Requirements 10.4, 10.5**

**Property 34: Late submissions are marked**
*For any* submission made after the due date but before grading starts, the submission should be accepted and marked with `isLate = true`.
**Validates: Requirements 10.8**

**Property 35: Submissions after grading are rejected**
*For any* assignment where grading has started (`gradingStarted = true`), new submissions and resubmissions should be rejected with an error.
**Validates: Requirements 10.9, 10.11**

**Property 36: Resubmission replaces previous**
*For any* student with an existing submission, if resubmitting before grading starts, the new submission should replace the previous one (only one submission per student per assignment).
**Validates: Requirements 10.10**

**Property 37: Students access own submissions**
*For any* student and any assignment, the student should be able to view their own submission if it exists, but not other students' submissions.
**Validates: Requirements 10.12**

### Quiz Management Properties

**Property 38: Quiz creation stores all data**
*For any* valid quiz data (title, description, future due date, time limit, questions), creating a quiz should store all fields including MCQ options/correct answers and essay question text.
**Validates: Requirements 11.1, 11.4, 11.5, 11.9**

**Property 39: Quiz validation enforces constraints**
*For any* quiz creation or update, the system should reject: (1) past due dates, (2) quizzes without questions, (3) MCQs with fewer than 2 options, (4) MCQs without exactly one correct answer.
**Validates: Requirements 11.2, 11.6, 11.7, 11.8**

**Property 40: Quiz due dates are timezone-consistent**
*For any* quiz due date, the date should be stored in UTC and correctly converted to the user's timezone when displayed, maintaining consistency across different timezones.
**Validates: Requirements 11.3**

**Property 41: Quiz editing respects constraints**
*For any* quiz, editing should be allowed only before the due date and before any submissions exist, and should be rejected otherwise with an error.
**Validates: Requirements 11.10, 11.11, 11.12**

**Property 42: Quiz deletion always works**
*For any* quiz, deletion should succeed regardless of due date or submission status, removing the quiz and all related submissions.
**Validates: Requirements 11.13**

### Quiz Taking Properties

**Property 43: Quiz preview shows metadata**
*For any* quiz before starting, students should see title, description, time limit, and number of questions without seeing the actual questions.
**Validates: Requirements 12.1**

**Property 44: Quiz start displays questions and timer**
*For any* quiz started before the due date, all questions should be displayed and a countdown timer should begin tracking the time limit.
**Validates: Requirements 12.2**

**Property 45: Quiz auto-submits on timeout**
*For any* quiz in progress, when the time limit expires, the quiz should be automatically submitted with whatever answers have been provided.
**Validates: Requirements 12.4**

**Property 46: Early quiz submission is accepted**
*For any* quiz in progress, if the student submits before the time limit expires, the submission should be accepted with all provided answers.
**Validates: Requirements 12.5**

**Property 47: Quiz access after due date is denied**
*For any* quiz after its due date, attempts to start the quiz should be rejected with an error.
**Validates: Requirements 12.6**

**Property 48: Multiple quiz submissions are prevented**
*For any* student and any quiz, after submitting once, attempts to submit again should be rejected (idempotence).
**Validates: Requirements 12.7**

### Grading Properties

**Property 49: First grading locks assignment**
*For any* assignment, when a teacher grades the first submission, the assignment's `gradingStarted` flag should be set to true, preventing all future submissions and resubmissions.
**Validates: Requirements 13.1**

**Property 50: Submission content is displayed**
*For any* submission, teachers should be able to view all submitted content (files, text, or quiz answers) when grading.
**Validates: Requirements 13.2**

**Property 51: Grade validation enforces range**
*For any* grading attempt, grades outside the range 0-100 should be rejected with a validation error.
**Validates: Requirements 13.3**

**Property 52: Grades and feedback are stored**
*For any* valid grade (0-100) and optional feedback, saving the grade should store both values with the submission and mark the submission status as GRADED.
**Validates: Requirements 13.4, 13.6, 13.7**

**Property 53: Grades can be updated**
*For any* graded submission, teachers should be able to update the grade and feedback, and the new values should replace the old ones.
**Validates: Requirements 13.5**

**Property 54: Quiz question points are stored**
*For any* quiz submission, teachers should be able to manually assign points to each question, and these points should be stored with the answer.
**Validates: Requirements 13.8**

**Property 55: Quiz grading displays warning for inconsistent totals**
*For any* quiz submission where the sum of manually assigned question points does not equal 100, the system should display a warning to the teacher indicating the discrepancy.
**Validates: Requirements 13.9**

**Property 56: Quiz total equals sum of question points**
*For any* quiz submission with manually assigned question points, the total grade should equal the sum of all question points.
**Validates: Requirements 13.10**

### Submission Viewing Properties

**Property 57: Teachers view all submissions**
*For any* assignment or quiz, teachers should be able to view all student submissions with status (not submitted, submitted, graded, late), student names, and timestamps.
**Validates: Requirements 14.1, 14.2, 14.3**

**Property 58: Submission links are provided**
*For any* submission, teachers should have access to links to view the submitted content (files, text, or quiz answers).
**Validates: Requirements 14.4**

**Property 59: Submissions are separated by grading status**
*For any* assignment or quiz, the submission list should correctly separate ungraded and graded submissions.
**Validates: Requirements 14.5**

### Grade Export Properties

**Property 60: Grade export generates complete CSV**
*For any* course, exporting grades should generate a CSV file containing all students, all assignments/quizzes, with student name, email, item name, grade (or "Not Submitted"/"Pending"), submission date, and average grade per student.
**Validates: Requirements 15.1, 15.2, 15.3, 15.5**

**Property 61: Grade export is downloadable**
*For any* generated grade export, teachers should be able to download the CSV file.
**Validates: Requirements 15.4**

### Student Progress Properties

**Property 62: Student progress shows all items**
*For any* student enrolled in a course, viewing progress should display all assignments and quizzes with correct status ("Not Submitted", "Submitted", "Graded"), grades, feedback, overdue indicators, and late markers.
**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**

**Property 63: Course average is calculated correctly**
*For any* student with graded items in a course, the displayed average grade should equal the mean of all graded item scores.
**Validates: Requirements 16.7**

### Data Persistence Properties

**Property 64: Entity CRUD operations persist**
*For any* entity type (User, Course, Material, Assignment, Quiz, Submission), create, update, and delete operations should correctly persist changes to the database, and subsequent reads should reflect those changes.
**Validates: Requirements 17.1, 17.2, 17.3**

**Property 65: Referential integrity is maintained**
*For any* related entities (e.g., Course and Enrollments, Assignment and Submissions), operations should maintain referential integrity, with cascade deletes removing related data and foreign key constraints preventing orphaned records.
**Validates: Requirements 17.4**

### API Response Properties

**Property 66: Success responses are consistent**
*For any* successful API request, the response should include success indicators and follow a consistent format with the requested data.
**Validates: Requirements 18.2**

**Property 67: Error responses are consistent**
*For any* failed API request, the response should include an error code, descriptive message, and follow a consistent error format without exposing internal system details.
**Validates: Requirements 18.3, 18.5, 21.3**

### Security Properties

**Property 68: Passwords are hashed**
*For any* user registration or password update, the password should never be stored in plain text; only the hashed version should be persisted.
**Validates: Requirements 20.1**

**Property 69: Input validation prevents injection**
*For any* user input, the system should sanitize and validate the input to prevent SQL injection, XSS, and other injection attacks.
**Validates: Requirements 20.2**

**Property 70: File access is authorized**
*For any* file access request, the system should verify the user is authorized (enrolled in the course or owns the submission) before allowing download.
**Validates: Requirements 20.3**

**Property 71: File uploads are validated**
*For any* file upload, the system should validate file type against allowed types and file size against the 10MB limit, rejecting invalid uploads.
**Validates: Requirements 20.4, 20.5**

### System Availability Properties

**Property 72: Database connection retry works**
*For any* database connection failure, the system should retry up to 3 times before returning an error to the user.
**Validates: Requirements 21.1**

**Property 73: Errors are logged**
*For any* API error, the system should log the error with timestamp, user context, and error details for debugging.
**Validates: Requirements 21.2**

**Property 74: Concurrent requests don't corrupt data**
*For any* set of concurrent requests modifying the same data, the system should use transactions and locking to prevent data corruption and maintain consistency.
**Validates: Requirements 21.5**

**Property 75: File uploads don't timeout**
*For any* file upload under the 10MB size limit, the upload should complete without timeout errors.
**Validates: Requirements 21.6**

**Property 76: Database connections are validated**
*For any* API request, the system should validate the database connection is active before processing the request.
**Validates: Requirements 21.7**

