# API Standards

## Purpose

This document defines the REST API standards that ALL features must follow. Consistent API design ensures predictable behavior, easier integration, and better developer experience across the entire application.

---

## REST Conventions

### Resource Naming

**Use Plural Nouns:**
- ✅ `/api/courses` (correct)
- ❌ `/api/course` (wrong)
- ✅ `/api/assignments` (correct)
- ❌ `/api/assignment` (wrong)

**Use Kebab-Case for Multi-Word Resources:**
- ✅ `/api/course-materials` (if needed)
- ❌ `/api/courseMaterials` (wrong)
- ❌ `/api/course_materials` (wrong)

**Resource Hierarchy:**
- Parent-child relationships use nested URLs
- ✅ `/api/courses/:courseId/assignments`
- ✅ `/api/courses/:courseId/materials`
- ✅ `/api/assignments/:assignmentId/submissions`

**Separate Resources for Different Types:**
- When resources have different schemas or behaviors, use separate endpoints
- ✅ `/api/assignment-submissions/:id` (for assignment submissions)
- ✅ `/api/quiz-submissions/:id` (for quiz submissions)
- ❌ `/api/submissions/:id` (ambiguous - which type?)

**Why Separate Submission Endpoints?**
- **Different Schemas**: Assignment submissions have `textContent` and `filePath`, quiz submissions have `answers` array
- **Different Grading Logic**: Assignments graded manually, quizzes can have auto-grading
- **Avoid Route Conflicts**: Prevents ambiguity when both routes exist
- **Clear Intent**: Endpoint name clearly indicates the resource type

### HTTP Methods

**Standard CRUD Operations:**

| Method | Purpose | Example | Success Status |
|--------|---------|---------|----------------|
| GET | Retrieve resource(s) | `GET /api/courses` | 200 OK |
| POST | Create new resource | `POST /api/courses` | 201 Created |
| PUT | Update entire resource | `PUT /api/courses/:id` | 200 OK |
| PATCH | Partial update (not used in initial version) | - | - |
| DELETE | Remove resource | `DELETE /api/courses/:id` | 200 OK |

**Custom Actions:**
- Use POST for non-CRUD operations
- Action name in URL path
- ✅ `POST /api/courses/:id/archive`
- ✅ `POST /api/assignments/:id/submit`
- ✅ `POST /api/quizzes/:id/start`

### URL Structure Patterns

**Pattern 1: Collection Operations**
```
GET    /api/{resource}              # List all resources
POST   /api/{resource}              # Create new resource
```

**Examples:**
```
GET    /api/courses                 # List all courses
POST   /api/courses                 # Create new course
GET    /api/assignments             # List all assignments
POST   /api/assignments             # Create new assignment
```

**Pattern 2: Single Resource Operations**
```
GET    /api/{resource}/:id          # Get one resource
PUT    /api/{resource}/:id          # Update resource
DELETE /api/{resource}/:id          # Delete resource
```

**Examples:**
```
GET    /api/courses/:id             # Get course details
PUT    /api/courses/:id             # Update course
DELETE /api/courses/:id             # Delete course
```

**Pattern 3: Nested Resources**
```
GET    /api/{parent}/:parentId/{child}
POST   /api/{parent}/:parentId/{child}
```

**Examples:**
```
GET    /api/courses/:courseId/assignments
POST   /api/courses/:courseId/materials
GET    /api/assignments/:assignmentId/submissions
```

**Pattern 4: Custom Actions**
```
POST   /api/{resource}/:id/{action}
```

**Examples:**
```
POST   /api/courses/:id/archive
POST   /api/courses/enroll
POST   /api/assignments/:id/submit
POST   /api/quizzes/:id/start
POST   /api/quizzes/:id/autosave
POST   /api/assignment-submissions/:id/grade
POST   /api/quiz-submissions/:id/grade
```

**Pattern 5: Special Endpoints**
```
GET    /api/{resource}/{filter}     # Filtered collection
GET    /api/{resource}/:id/{action} # Resource-specific action
```

**Examples:**
```
GET    /api/courses/archived         # Get archived courses
GET    /api/materials/:id/download   # Download material file
GET    /api/courses/:id/progress     # Get student progress
GET    /api/courses/:id/grades/export # Export grades
```

---

## HTTP Status Codes

### Success Codes (2xx)

| Code | Meaning | When to Use | Example |
|------|---------|-------------|---------|
| 200 OK | Success | GET, PUT, DELETE successful | Get course details |
| 201 Created | Resource created | POST successful | Create new course |
| 204 No Content | Success, no body | DELETE successful (optional) | Delete material |

**Standard Usage:**
- **GET**: Always return 200 OK with data
- **POST**: Return 201 Created with created resource
- **PUT**: Return 200 OK with updated resource
- **DELETE**: Return 200 OK (or 204 No Content)

### Client Error Codes (4xx)

| Code | Meaning | When to Use | Error Code Example |
|------|---------|-------------|-------------------|
| 400 Bad Request | Invalid input | Validation failed, business rule violated | `VALIDATION_FAILED`, `ASSIGNMENT_CLOSED` |
| 401 Unauthorized | Authentication required | Missing or invalid JWT token | `AUTH_TOKEN_EXPIRED`, `AUTH_REQUIRED` |
| 403 Forbidden | Authorization failed | User not allowed to access resource | `NOT_OWNER`, `NOT_ENROLLED`, `FORBIDDEN_ROLE` |
| 404 Not Found | Resource not found | Resource ID doesn't exist | `RESOURCE_NOT_FOUND`, `COURSE_NOT_FOUND` |
| 409 Conflict | Resource conflict | Duplicate entry, state conflict | `DUPLICATE_ENROLLMENT`, `COURSE_ACTIVE` |

**Error Code Guidelines:**
- Use specific error codes (see error-handling.md)
- Return consistent error format
- Include helpful error messages

### Server Error Codes (5xx)

| Code | Meaning | When to Use | Error Code Example |
|------|---------|-------------|-------------------|
| 500 Internal Server Error | Unexpected error | Database error, unhandled exception | `INTERNAL_ERROR`, `DATABASE_ERROR` |
| 503 Service Unavailable | Service down | Maintenance mode, database unavailable | `SERVICE_UNAVAILABLE` |

**Important:** Never expose internal error details to clients (see error-handling.md)

---

## Request Format

### Content Type

**Standard:**
- `Content-Type: application/json`
- All request bodies must be valid JSON

**File Uploads:**
- `Content-Type: multipart/form-data`
- Used for file uploads (assignments, materials)

### Request Body Structure

**Single Resource Creation:**
```json
{
  "name": "Introduction to Programming",
  "description": "Learn programming basics",
  "dueDate": "2025-02-01T10:00:00Z"
}
```

**Nested Data:**
```json
{
  "title": "Final Exam",
  "description": "Comprehensive exam",
  "dueDate": "2025-03-01T10:00:00Z",
  "timeLimit": 120,
  "questions": [
    {
      "type": "MCQ",
      "questionText": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1
    }
  ]
}
```

**File Upload (multipart/form-data):**
```
POST /api/courses/:courseId/materials
Content-Type: multipart/form-data

Fields:
- title: "Lecture Notes"
- type: "FILE"
- file: <binary data>
```

### Query Parameters

**Pagination (if needed):**
```
GET /api/courses?page=1&limit=20
```

**Filtering:**
```
GET /api/courses?status=ACTIVE
GET /api/submissions?status=GRADED
```

**Sorting (if needed):**
```
GET /api/courses?sort=createdAt&order=desc
```

### Path Parameters

**Resource ID:**
- Always use `:id` for resource identifier
- ✅ `/api/courses/:id`
- ✅ `/api/assignments/:id`

**Parent-Child:**
- Use descriptive parameter names
- ✅ `/api/courses/:courseId/assignments`
- ✅ `/api/assignments/:assignmentId/submissions`

---

## Response Format

### Success Response Structure

**Single Resource:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Introduction to Programming",
  "description": "Learn programming basics",
  "courseCode": "ABC123",
  "status": "ACTIVE",
  "teacherId": "teacher-uuid",
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Collection (List):**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Course 1",
      "courseCode": "ABC123"
    },
    {
      "id": "uuid-2",
      "name": "Course 2",
      "courseCode": "DEF456"
    }
  ]
}
```

**With Pagination (if needed):**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Nested Resources:**
```json
{
  "id": "course-uuid",
  "name": "Introduction to Programming",
  "teacher": {
    "id": "teacher-uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "enrollmentCount": 25
}
```

### Error Response Structure

**Standard Error Format** (see error-handling.md):
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description"
}
```

**With Validation Details:**
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Input validation failed",
  "details": {
    "name": "Name is required",
    "dueDate": "Due date must be in the future"
  }
}
```

**Examples:**
```json
// 400 Bad Request
{
  "code": "ASSIGNMENT_CLOSED",
  "message": "Assignment is closed for submissions"
}

// 401 Unauthorized
{
  "code": "AUTH_TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again."
}

// 403 Forbidden
{
  "code": "NOT_OWNER",
  "message": "You do not have permission to modify this resource."
}

// 404 Not Found
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "The requested resource was not found."
}

// 500 Internal Server Error
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Data Format Standards

### Date and Time

**Format:** ISO 8601 with UTC timezone
```
"2025-01-13T10:30:00Z"
```

**Fields:**
- `createdAt`: Resource creation timestamp
- `updatedAt`: Last update timestamp
- `dueDate`: Assignment/quiz due date
- `submittedAt`: Submission timestamp
- `startedAt`: Quiz start time
- `completedAt`: Quiz completion time

**Timezone Handling:**
- Server stores all dates in UTC
- Client converts to user's local timezone
- Client sends dates in UTC

### Identifiers

**Format:** UUID v4
```
"a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Why UUID:**
- Security (not predictable like sequential IDs)
- Distributed system compatibility
- No collision risk

### Enums

**Format:** UPPER_SNAKE_CASE
```json
{
  "status": "ACTIVE",
  "role": "TEACHER",
  "submissionType": "FILE",
  "questionType": "MCQ"
}
```

**Common Enums:**
- `CourseStatus`: `ACTIVE`, `ARCHIVED`
- `Role`: `STUDENT`, `TEACHER`
- `SubmissionType`: `FILE`, `TEXT`, `BOTH`
- `SubmissionStatus`: `NOT_SUBMITTED`, `SUBMITTED`, `GRADED`
- `MaterialType`: `FILE`, `TEXT`, `VIDEO_LINK`
- `QuestionType`: `MCQ`, `ESSAY`

### Boolean Values

**Format:** `true` or `false` (lowercase)
```json
{
  "isLate": false,
  "gradingStarted": true
}
```

### Null Values

**Allowed for optional fields:**
```json
{
  "grade": null,           // Not yet graded
  "feedback": null,        // No feedback provided
  "submittedAt": null      // Not yet submitted
}
```

**Not allowed for required fields:**
- Use validation to ensure required fields are present

---

## Authentication

### Authentication Header

**JWT Token in Cookie:**
- Tokens stored in HTTP-only cookies (see security-policies.md)
- Automatically sent with every request
- No manual header required

**Alternative (if needed):**
```
Authorization: Bearer <access_token>
```

### Public Endpoints

**No authentication required:**
```
POST   /api/auth/register
POST   /api/auth/login
```

### Protected Endpoints

**Authentication required:**
- All endpoints except `/api/auth/register` and `/api/auth/login`
- Return 401 Unauthorized if token missing or invalid

### Authorization

**Role-Based:**
- Student-only endpoints (e.g., `/api/courses/enroll`)
- Teacher-only endpoints (e.g., `/api/courses` POST)
- Return 403 Forbidden if role not authorized

**Resource-Based:**
- Owner-only operations (e.g., update course)
- Enrollment-based access (e.g., view course materials)
- Return 403 Forbidden if not authorized

---

## Request Validation

### Validation Strategy

**Layer 1: Presentation Layer (Controllers)**
- Schema validation using Zod
- Type checking, required fields, format validation
- Return 400 Bad Request with validation errors

**Layer 2: Application Layer (Use Cases)**
- Business rule validation
- Authorization checks
- Return 400 Bad Request or 403 Forbidden

**Layer 3: Domain Layer (Entities)**
- Entity invariant validation
- Domain constraints
- Throw domain errors

### Validation Error Format

**Single Field Error:**
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Name is required"
}
```

**Multiple Field Errors:**
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Input validation failed",
  "details": {
    "name": "Name is required",
    "dueDate": "Due date must be in the future",
    "timeLimit": "Time limit must be positive"
  }
}
```

---

## API Versioning

### Current Strategy

**Initial Version:** No versioning
- All endpoints at `/api/*`
- No version prefix

**Future:** URL versioning (when breaking changes needed)
```
/api/v1/courses
/api/v2/courses
```

**Breaking Changes:**
- Changes that break existing clients
- Require new API version
- Examples: Remove field, change field type, change response structure

**Non-Breaking Changes:**
- Can be added to existing version
- Examples: Add optional field, add new endpoint

---

## Endpoint Catalog

### Authentication Endpoints

```
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/refresh         # Refresh access token
POST   /api/auth/logout          # Logout user
GET    /api/auth/me              # Get current user
```

### Course Endpoints

```
GET    /api/courses              # List courses (filtered by role)
GET    /api/courses/archived     # List archived courses (teacher only)
POST   /api/courses              # Create course (teacher only)
GET    /api/courses/:id          # Get course details
PUT    /api/courses/:id          # Update course (teacher only)
DELETE /api/courses/:id          # Delete course (teacher only)
POST   /api/courses/:id/archive  # Archive course (teacher only)
POST   /api/courses/enroll       # Enroll in course (student only)
POST   /api/courses/:id/unenroll-bulk # Bulk unenroll (teacher only)
```

### Material Endpoints

```
GET    /api/courses/:courseId/materials     # List materials
POST   /api/courses/:courseId/materials     # Create material (teacher only)
GET    /api/materials/:id                   # Get material details
PUT    /api/materials/:id                   # Update material (teacher only)
DELETE /api/materials/:id                   # Delete material (teacher only)
GET    /api/materials/:id/download          # Download material file
```

### Assignment Endpoints

```
GET    /api/courses/:courseId/assignments   # List assignments
POST   /api/courses/:courseId/assignments   # Create assignment (teacher only)
GET    /api/assignments/:id                 # Get assignment details
PUT    /api/assignments/:id                 # Update assignment (teacher only)
DELETE /api/assignments/:id                 # Delete assignment (teacher only)
GET    /api/assignments/:id/submissions     # List submissions (teacher only)
POST   /api/assignments/:id/submit          # Submit assignment (student only)
```

### Quiz Endpoints

```
GET    /api/courses/:courseId/quizzes       # List quizzes
POST   /api/courses/:courseId/quizzes       # Create quiz (teacher only)
GET    /api/quizzes/:id                     # Get quiz details
PUT    /api/quizzes/:id                     # Update quiz (teacher only)
DELETE /api/quizzes/:id                     # Delete quiz (teacher only)
POST   /api/quizzes/:id/start               # Start quiz (student only)
POST   /api/quizzes/:id/autosave            # Auto-save answers (student only)
POST   /api/quizzes/:id/submit              # Submit quiz (student only)
GET    /api/quizzes/:id/submissions         # List quiz submissions (teacher only)
```

### Grading Endpoints

```
GET    /api/assignment-submissions/:id        # Get assignment submission details
POST   /api/assignment-submissions/:id/grade  # Grade assignment submission (teacher only)
PUT    /api/assignment-submissions/:id/grade  # Update assignment grade (teacher only)
GET    /api/quiz-submissions/:id              # Get quiz submission details
POST   /api/quiz-submissions/:id/grade        # Grade quiz submission (teacher only)
PUT    /api/quiz-submissions/:id/grade        # Update quiz grade (teacher only)
GET    /api/courses/:id/grades/export         # Export grades CSV (teacher only)
GET    /api/courses/:id/progress              # Get student progress (student only)
```

---

## Request/Response Examples

### Example 1: Create Course

**Request:**
```http
POST /api/courses
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "name": "Introduction to Programming",
  "description": "Learn programming basics with Python"
}
```

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Introduction to Programming",
  "description": "Learn programming basics with Python",
  "courseCode": "ABC123",
  "status": "ACTIVE",
  "teacherId": "teacher-uuid",
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

### Example 2: Submit Assignment

**Request:**
```http
POST /api/assignments/:id/submit
Content-Type: multipart/form-data
Cookie: access_token=<jwt>

Fields:
- submissionType: "FILE"
- file: <binary data>
```

**Response (201 Created):**
```json
{
  "id": "submission-uuid",
  "assignmentId": "assignment-uuid",
  "studentId": "student-uuid",
  "submittedAt": "2025-01-13T10:30:00Z",
  "status": "SUBMITTED",
  "isLate": false,
  "filePath": "uploads/a1b2c3d4.pdf",
  "fileName": "assignment.pdf"
}
```

### Example 3: Validation Error

**Request:**
```http
POST /api/courses
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "description": "Missing name field"
}
```

**Response (400 Bad Request):**
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Input validation failed",
  "details": {
    "name": "Name is required"
  }
}
```

### Example 4: Authorization Error

**Request:**
```http
PUT /api/courses/:id
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "name": "Updated Course Name"
}
```

**Response (403 Forbidden):**
```json
{
  "code": "NOT_OWNER",
  "message": "You do not have permission to modify this resource."
}
```

### Example 5: List with Nested Data

**Request:**
```http
GET /api/courses
Cookie: access_token=<jwt>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "course-uuid-1",
      "name": "Introduction to Programming",
      "courseCode": "ABC123",
      "status": "ACTIVE",
      "teacher": {
        "id": "teacher-uuid",
        "name": "John Doe"
      },
      "enrollmentCount": 25
    },
    {
      "id": "course-uuid-2",
      "name": "Advanced Algorithms",
      "courseCode": "DEF456",
      "status": "ACTIVE",
      "teacher": {
        "id": "teacher-uuid",
        "name": "John Doe"
      },
      "enrollmentCount": 18
    }
  ]
}
```

---

## Best Practices

### DO ✅

1. **Use Standard HTTP Methods**
   - GET for retrieval, POST for creation, PUT for update, DELETE for removal

2. **Return Appropriate Status Codes**
   - 200/201 for success, 400 for validation, 401 for auth, 403 for authorization, 404 for not found

3. **Use Consistent Naming**
   - Plural nouns for resources, kebab-case for multi-word

4. **Include Timestamps**
   - Always include `createdAt` and `updatedAt` in responses

5. **Use UUID for IDs**
   - Security and distributed system compatibility

6. **Validate All Input**
   - Use Zod schemas at presentation layer

7. **Return Created Resource**
   - POST endpoints return the created resource with 201 status

8. **Use Nested URLs for Relationships**
   - `/api/courses/:courseId/assignments` for parent-child

9. **Follow Error Format**
   - Always use `{ code, message, details? }` format

10. **Document with Examples**
    - Provide request/response examples for complex endpoints

### DON'T ❌

1. **Don't Use Verbs in URLs**
   - ❌ `/api/getCourses`, `/api/createCourse`
   - ✅ `GET /api/courses`, `POST /api/courses`

2. **Don't Mix Naming Conventions**
   - ❌ `/api/courses` and `/api/assignment` (inconsistent plural/singular)
   - ✅ `/api/courses` and `/api/assignments`

3. **Don't Expose Internal Errors**
   - ❌ Return database errors or stack traces
   - ✅ Return generic error messages (see error-handling.md)

4. **Don't Use Sequential IDs**
   - ❌ `/api/courses/1`, `/api/courses/2` (predictable, security risk)
   - ✅ `/api/courses/a1b2c3d4-e5f6-7890` (UUID)

5. **Don't Skip Validation**
   - Always validate input at presentation layer

6. **Don't Return Sensitive Data**
   - Never return passwords, tokens, or internal system details

7. **Don't Use Inconsistent Status Codes**
   - Always use standard HTTP status codes

8. **Don't Ignore Authorization**
   - Always check authorization before business logic

9. **Don't Mix Response Formats**
   - Always use consistent JSON structure

10. **Don't Forget Error Handling**
    - Handle all error scenarios with appropriate status codes

---

## Testing API Endpoints

### Test Checklist

For each endpoint, test:

**Success Scenarios:**
- [ ] Valid request returns correct status code
- [ ] Response format matches specification
- [ ] Created/updated resource returned correctly
- [ ] Timestamps included in response

**Validation Scenarios:**
- [ ] Missing required fields return 400
- [ ] Invalid format returns 400 with details
- [ ] Business rule violations return 400

**Authentication Scenarios:**
- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Expired token returns 401

**Authorization Scenarios:**
- [ ] Wrong role returns 403
- [ ] Non-owner access returns 403
- [ ] Non-enrolled access returns 403

**Not Found Scenarios:**
- [ ] Invalid resource ID returns 404

**Error Scenarios:**
- [ ] Database errors return 500
- [ ] Unexpected errors return 500
- [ ] Error format matches specification

---

## Summary

**Key Takeaways:**

1. **Consistency**: All endpoints follow same patterns and conventions
2. **REST Principles**: Use standard HTTP methods and status codes
3. **Clear Structure**: Predictable URL patterns for all resources
4. **Error Handling**: Consistent error format across all endpoints
5. **Validation**: Input validated at multiple layers
6. **Security**: Authentication and authorization on all protected endpoints
7. **Documentation**: All endpoints documented with examples

**Remember**: Consistent API design improves developer experience, reduces bugs, and makes the codebase easier to maintain. Always follow these standards when implementing new endpoints.

---

## References

- **REST API Design**: https://restfulapi.net/
- **HTTP Status Codes**: https://httpstatuses.com/
- **JSON API Specification**: https://jsonapi.org/
- **Error Handling**: See error-handling.md
- **Security**: See security-policies.md
