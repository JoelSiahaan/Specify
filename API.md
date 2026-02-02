# API Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All protected endpoints require JWT token in HTTP-only cookie (automatically sent by browser).

**Public Endpoints** (no authentication required):
- `POST /api/auth/register`
- `POST /api/auth/login`

**Protected Endpoints**: All other endpoints require authentication.

## Response Format

### Success Response

```json
{
  "id": "uuid",
  "name": "Resource Name",
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

### Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context (optional)"
  }
}
```

## HTTP Status Codes

- `200 OK`: Success (GET, PUT, DELETE)
- `201 Created`: Resource created (POST)
- `400 Bad Request`: Validation error or business rule violation
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: User not authorized for this action
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Unexpected server error

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

**Request Fields**:
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 8 characters
- `name` (string, required): User's full name
- `role` (enum, required): `STUDENT` or `TEACHER`

**Response** (201 Created):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `400 VALIDATION_FAILED`: Invalid input
- `409 DUPLICATE_ENTRY`: Email already exists

---

### Login User

Authenticate user and receive JWT tokens.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "STUDENT"
  }
}
```

**Cookies Set**:
- `access_token`: JWT access token (15 minutes expiry)
- `refresh_token`: JWT refresh token (7 days expiry)

**Error Responses**:
- `401 AUTH_INVALID_CREDENTIALS`: Invalid email or password

---

### Refresh Token

Refresh expired access token using refresh token.

**Endpoint**: `POST /api/auth/refresh`

**Authentication**: Refresh token in cookie

**Response** (200 OK):
```json
{
  "message": "Token refreshed successfully"
}
```

**Cookies Set**:
- `access_token`: New JWT access token (15 minutes expiry)

**Error Responses**:
- `401 AUTH_REFRESH_TOKEN_INVALID`: Invalid refresh token
- `401 AUTH_REFRESH_TOKEN_EXPIRED`: Refresh token expired

---

### Logout User

Logout user and clear tokens.

**Endpoint**: `POST /api/auth/logout`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "createdAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `401 AUTH_REQUIRED`: Authentication required

---

## Course Endpoints

### List Courses

Get list of courses (filtered by user role).

**Endpoint**: `GET /api/courses`

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status (`ACTIVE` or `ARCHIVED`)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Introduction to Programming",
      "description": "Learn programming basics",
      "courseCode": "ABC123",
      "status": "ACTIVE",
      "teacher": {
        "id": "teacher-uuid",
        "name": "John Doe"
      },
      "enrollmentCount": 25,
      "createdAt": "2025-01-13T10:30:00Z"
    }
  ]
}
```

**Behavior**:
- **Students**: See enrolled courses only
- **Teachers**: See own created courses only

---

### Create Course

Create a new course (teacher only).

**Endpoint**: `POST /api/courses`

**Authentication**: Required (Teacher role)

**Request Body**:
```json
{
  "name": "Introduction to Programming",
  "description": "Learn programming basics with Python"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Introduction to Programming",
  "description": "Learn programming basics with Python",
  "courseCode": "ABC123",
  "status": "ACTIVE",
  "teacherId": "teacher-uuid",
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `400 VALIDATION_FAILED`: Invalid input
- `403 FORBIDDEN_ROLE`: User is not a teacher

---

### Get Course Details

Get detailed information about a course.

**Endpoint**: `GET /api/courses/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Introduction to Programming",
  "description": "Learn programming basics",
  "courseCode": "ABC123",
  "status": "ACTIVE",
  "teacher": {
    "id": "teacher-uuid",
    "name": "John Doe",
    "email": "teacher@example.com"
  },
  "enrollmentCount": 25,
  "createdAt": "2025-01-13T10:30:00Z",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `403 NOT_ENROLLED`: Student not enrolled in course
- `404 RESOURCE_NOT_FOUND`: Course not found

---

### Update Course

Update course details (teacher only, owner only).

**Endpoint**: `PUT /api/courses/:id`

**Authentication**: Required (Teacher role, owner)

**Request Body**:
```json
{
  "name": "Updated Course Name",
  "description": "Updated description"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Course Name",
  "description": "Updated description",
  "courseCode": "ABC123",
  "status": "ACTIVE",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `403 NOT_OWNER`: User is not the course owner
- `404 RESOURCE_NOT_FOUND`: Course not found

---

### Archive Course

Archive a course (teacher only, owner only).

**Endpoint**: `POST /api/courses/:id/archive`

**Authentication**: Required (Teacher role, owner)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Course Name",
  "status": "ARCHIVED",
  "updatedAt": "2025-01-13T10:30:00Z"
}
```

**Behavior**:
- Sets course status to `ARCHIVED`
- Closes all assignments and quizzes
- Prevents new enrollments
- Students can still view in read-only mode

**Error Responses**:
- `403 NOT_OWNER`: User is not the course owner
- `404 RESOURCE_NOT_FOUND`: Course not found

---

### Delete Course

Delete an archived course (teacher only, owner only).

**Endpoint**: `DELETE /api/courses/:id`

**Authentication**: Required (Teacher role, owner)

**Response** (200 OK):
```json
{
  "message": "Course deleted successfully"
}
```

**Behavior**:
- Only archived courses can be deleted
- Cascade deletes all related data (materials, assignments, quizzes, submissions, enrollments)

**Error Responses**:
- `400 RESOURCE_ACTIVE`: Course must be archived first
- `403 NOT_OWNER`: User is not the course owner
- `404 RESOURCE_NOT_FOUND`: Course not found

---

### Enroll in Course

Enroll student in a course using course code.

**Endpoint**: `POST /api/courses/enroll`

**Authentication**: Required (Student role)

**Request Body**:
```json
{
  "courseCode": "ABC123"
}
```

**Response** (201 Created):
```json
{
  "id": "enrollment-uuid",
  "courseId": "course-uuid",
  "studentId": "student-uuid",
  "enrolledAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `400 DUPLICATE_ENTRY`: Already enrolled
- `403 FORBIDDEN_ROLE`: User is not a student
- `404 RESOURCE_NOT_FOUND`: Invalid course code
- `409 RESOURCE_ARCHIVED`: Cannot enroll in archived course

---

## Material Endpoints

### List Materials

Get list of materials for a course.

**Endpoint**: `GET /api/courses/:courseId/materials`

**Authentication**: Required (enrolled or owner)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Lecture 1: Introduction",
      "type": "FILE",
      "filePath": "uploads/a1b2c3d4.pdf",
      "fileName": "lecture1.pdf",
      "fileSize": 2500000,
      "createdAt": "2025-01-13T10:30:00Z"
    },
    {
      "id": "uuid",
      "title": "Course Overview",
      "type": "TEXT",
      "content": "<p>Welcome to the course...</p>",
      "createdAt": "2025-01-13T10:30:00Z"
    }
  ]
}
```

**Error Responses**:
- `403 NOT_ENROLLED`: Student not enrolled in course
- `404 RESOURCE_NOT_FOUND`: Course not found

---

### Create Material

Create a new material (teacher only, owner only).

**Endpoint**: `POST /api/courses/:courseId/materials`

**Authentication**: Required (Teacher role, owner)

**Request Body** (File Upload):
```
Content-Type: multipart/form-data

Fields:
- title: "Lecture 1: Introduction"
- type: "FILE"
- file: <binary data>
```

**Request Body** (Text Content):
```json
{
  "title": "Course Overview",
  "type": "TEXT",
  "content": "<p>Welcome to the course...</p>"
}
```

**Request Body** (Video Link):
```json
{
  "title": "Introduction Video",
  "type": "VIDEO_LINK",
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Lecture 1: Introduction",
  "type": "FILE",
  "filePath": "uploads/a1b2c3d4.pdf",
  "fileName": "lecture1.pdf",
  "fileSize": 2500000,
  "createdAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `400 INVALID_FILE_TYPE`: File type not allowed
- `400 INVALID_FILE_SIZE`: File exceeds 10MB limit
- `403 NOT_OWNER`: User is not the course owner

---

### Download Material

Download a material file.

**Endpoint**: `GET /api/materials/:id/download`

**Authentication**: Required (enrolled or owner)

**Response**: File download (binary data)

**Error Responses**:
- `403 NOT_ENROLLED`: Student not enrolled in course
- `404 RESOURCE_NOT_FOUND`: Material not found

---

## Assignment Endpoints

### List Assignments

Get list of assignments for a course.

**Endpoint**: `GET /api/courses/:courseId/assignments`

**Authentication**: Required (enrolled or owner)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Assignment 1: Variables",
      "description": "Complete the exercises",
      "dueDate": "2025-02-01T23:59:59Z",
      "submissionType": "FILE",
      "status": "OPEN",
      "createdAt": "2025-01-13T10:30:00Z"
    }
  ]
}
```

---

### Create Assignment

Create a new assignment (teacher only, owner only).

**Endpoint**: `POST /api/courses/:courseId/assignments`

**Authentication**: Required (Teacher role, owner)

**Request Body**:
```json
{
  "title": "Assignment 1: Variables",
  "description": "Complete the exercises on variables",
  "dueDate": "2025-02-01T23:59:59Z",
  "submissionType": "FILE"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Assignment 1: Variables",
  "description": "Complete the exercises on variables",
  "dueDate": "2025-02-01T23:59:59Z",
  "submissionType": "FILE",
  "status": "OPEN",
  "createdAt": "2025-01-13T10:30:00Z"
}
```

**Error Responses**:
- `400 INVALID_DATE`: Due date must be in the future
- `403 NOT_OWNER`: User is not the course owner

---

### Submit Assignment

Submit an assignment (student only, enrolled).

**Endpoint**: `POST /api/assignments/:id/submit`

**Authentication**: Required (Student role, enrolled)

**Request Body** (File Upload):
```
Content-Type: multipart/form-data

Fields:
- submissionType: "FILE"
- file: <binary data>
```

**Request Body** (Text Submission):
```json
{
  "submissionType": "TEXT",
  "textContent": "My submission text..."
}
```

**Response** (201 Created):
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

**Behavior**:
- Can submit before due date (on-time)
- Can submit after due date until grading starts (late)
- Cannot submit after grading has started

**Error Responses**:
- `400 RESOURCE_CLOSED`: Assignment is closed for submissions
- `403 NOT_ENROLLED`: Student not enrolled in course

---

## Quiz Endpoints

### Create Quiz

Create a new quiz (teacher only, owner only).

**Endpoint**: `POST /api/courses/:courseId/quizzes`

**Authentication**: Required (Teacher role, owner)

**Request Body**:
```json
{
  "title": "Midterm Exam",
  "description": "Comprehensive exam covering all topics",
  "dueDate": "2025-03-01T23:59:59Z",
  "timeLimit": 120,
  "questions": [
    {
      "type": "MCQ",
      "questionText": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1
    },
    {
      "type": "ESSAY",
      "questionText": "Explain the concept of variables."
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Midterm Exam",
  "description": "Comprehensive exam",
  "dueDate": "2025-03-01T23:59:59Z",
  "timeLimit": 120,
  "questionCount": 2,
  "createdAt": "2025-01-13T10:30:00Z"
}
```

---

### Start Quiz

Start a quiz attempt (student only, enrolled).

**Endpoint**: `POST /api/quizzes/:id/start`

**Authentication**: Required (Student role, enrolled)

**Response** (200 OK):
```json
{
  "id": "submission-uuid",
  "quizId": "quiz-uuid",
  "studentId": "student-uuid",
  "startedAt": "2025-01-13T10:30:00Z",
  "expiresAt": "2025-01-13T12:30:00Z",
  "questions": [
    {
      "id": "question-uuid",
      "type": "MCQ",
      "questionText": "What is 2+2?",
      "options": ["3", "4", "5"]
    }
  ]
}
```

**Behavior**:
- Timer starts immediately
- Auto-submit when time expires
- Cannot start after due date

---

### Submit Quiz

Submit quiz answers (student only, enrolled).

**Endpoint**: `POST /api/quizzes/:id/submit`

**Authentication**: Required (Student role, enrolled)

**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "question-uuid",
      "answer": "1"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "id": "submission-uuid",
  "quizId": "quiz-uuid",
  "studentId": "student-uuid",
  "submittedAt": "2025-01-13T11:00:00Z",
  "status": "SUBMITTED"
}
```

---

## Grading Endpoints

### Grade Assignment Submission

Grade an assignment submission (teacher only, owner only).

**Endpoint**: `POST /api/assignment-submissions/:id/grade`

**Authentication**: Required (Teacher role, owner)

**Request Body**:
```json
{
  "grade": 85,
  "feedback": "Good work! Consider adding more examples."
}
```

**Response** (200 OK):
```json
{
  "id": "submission-uuid",
  "grade": 85,
  "feedback": "Good work! Consider adding more examples.",
  "status": "GRADED",
  "gradedAt": "2025-01-13T10:30:00Z"
}
```

**Behavior**:
- First grading action closes assignment to prevent new submissions
- Grade must be between 0 and 100

---

### Export Grades

Export all grades for a course to CSV (teacher only, owner only).

**Endpoint**: `GET /api/courses/:id/grades/export`

**Authentication**: Required (Teacher role, owner)

**Response**: CSV file download

**CSV Format**:
```csv
Student Name,Student Email,Assignment/Quiz,Grade,Submission Date,Average
John Doe,john@example.com,Assignment 1,85,2025-01-13,85.0
John Doe,john@example.com,Quiz 1,90,2025-01-14,87.5
```

---

## Error Codes Reference

### Authentication Errors (401)
- `AUTH_REQUIRED`: Authentication required
- `AUTH_TOKEN_INVALID`: Invalid JWT token
- `AUTH_TOKEN_EXPIRED`: Token expired
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_REFRESH_TOKEN_INVALID`: Invalid refresh token
- `AUTH_REFRESH_TOKEN_EXPIRED`: Refresh token expired

### Authorization Errors (403)
- `FORBIDDEN_ROLE`: User role not authorized
- `NOT_OWNER`: User is not the resource owner
- `NOT_ENROLLED`: User is not enrolled in course

### Validation Errors (400)
- `VALIDATION_FAILED`: Input validation failed
- `INVALID_EMAIL`: Email format invalid
- `INVALID_DATE`: Date is in the past or invalid
- `INVALID_FILE_TYPE`: File type not allowed
- `INVALID_FILE_SIZE`: File exceeds 10MB limit

### Business Logic Errors (400/409)
- `RESOURCE_CLOSED`: Resource is closed for modifications
- `RESOURCE_ARCHIVED`: Resource is archived
- `RESOURCE_ACTIVE`: Resource must be archived first
- `DUPLICATE_ENTRY`: Resource already exists

### Not Found Errors (404)
- `RESOURCE_NOT_FOUND`: Requested resource does not exist

### Server Errors (500)
- `INTERNAL_ERROR`: Unexpected server error
- `DATABASE_ERROR`: Database operation failed

---

## Rate Limiting

**API Endpoints**: 10 requests per second
**Authentication Endpoints**: 5 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response Format**:
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

---

For complete API standards and conventions, see `.kiro/steering/api-standards.md`.
