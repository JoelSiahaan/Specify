# Requirements Document

## Introduction

The Learning Management System (LMS) is a web-based platform that enables teachers to create courses, share materials, and create assignments, while allowing students to enroll, access content, and submit work. This MVP focuses on core learning and assessment features with a simple, functional interface.

## Glossary

- **System**: The Learning Management System web application
- **User**: Any authenticated person using the system (Student or Teacher)
- **Student**: A user with student role who enrolls in courses and submits assignments
- **Teacher**: A user with teacher role who creates and manages courses
- **Course**: A learning unit containing materials and assignments
- **Course_Code**: A unique identifier for course enrollment
- **Material**: Educational content (files or text) in a course
- **Assignment**: A task requiring file submission
- **Submission**: A student's completed assignment file
- **Grade**: A numerical score (0-100) for a submission

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log in to the system, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user provides valid credentials, THE System SHALL authenticate the user and create a session
2. WHEN a user provides invalid credentials, THE System SHALL reject the authentication and return an error
3. WHEN an authenticated user makes a request, THE System SHALL authorize the request
4. THE System SHALL assign each user exactly one role (Student or Teacher)
5. THE System SHALL allow users to log out and end their session

### Requirement 2: Role-Based Access Control

**User Story:** As a system, I want to enforce role-based access, so that users only access appropriate features.

#### Acceptance Criteria

1. WHEN a Student attempts to access teacher-only features, THE System SHALL deny access
2. WHEN a Teacher attempts to access student-only features, THE System SHALL deny access
3. WHEN a user accesses role-appropriate features, THE System SHALL allow the access
4. THE System SHALL enforce role checks on all protected routes

### Requirement 3: Student Dashboard

**User Story:** As a student, I want a dashboard showing my enrolled courses, so that I can access my learning materials.

#### Acceptance Criteria

1. WHEN a Student logs in, THE System SHALL display a dashboard with enrolled courses
2. THE System SHALL display course names and teacher names for each enrolled course
3. THE System SHALL provide links to access each course
4. WHEN a Student has no enrolled courses, THE System SHALL display a message and enrollment option

### Requirement 4: Teacher Dashboard

**User Story:** As a teacher, I want a dashboard showing my courses, so that I can manage my teaching.

#### Acceptance Criteria

1. WHEN a Teacher logs in, THE System SHALL display a dashboard with their created courses
2. THE System SHALL display the number of enrolled students for each course
3. THE System SHALL provide links to manage each course
4. THE System SHALL provide a button to create new courses

### Requirement 5: Course Creation

**User Story:** As a teacher, I want to create courses, so that I can organize learning content.

#### Acceptance Criteria

1. WHEN a Teacher creates a course with a name and description, THE System SHALL generate a unique course code and store the course
2. WHEN a Teacher updates a course, THE System SHALL save the changes
3. WHEN a Teacher deletes a course, THE System SHALL remove the course and all associated content
4. THE System SHALL validate that course name is provided
5. THE System SHALL generate a 6-character alphanumeric course code

### Requirement 6: Course Enrollment

**User Story:** As a student, I want to enroll in courses using a course code, so that I can access content.

#### Acceptance Criteria

1. WHEN a Student provides a valid course code, THE System SHALL enroll the student in that course
2. WHEN a Student provides an invalid course code, THE System SHALL reject the enrollment and return an error
3. WHEN a Student is already enrolled, THE System SHALL prevent duplicate enrollment
4. THE System SHALL display newly enrolled courses on the student dashboard

### Requirement 7: Material Management

**User Story:** As a teacher, I want to add materials to courses, so that students can access learning content.

#### Acceptance Criteria

1. WHEN a Teacher uploads a file to a course, THE System SHALL store the file
2. WHEN a Teacher adds text content to a course, THE System SHALL store the content
3. WHEN a Teacher deletes a material, THE System SHALL remove it
4. THE System SHALL support PDF and image file formats
5. THE System SHALL enforce a 10MB file size limit

### Requirement 8: Student Access to Materials

**User Story:** As a student, I want to view course materials, so that I can study.

#### Acceptance Criteria

1. WHEN a Student accesses an enrolled course, THE System SHALL display all materials
2. THE System SHALL allow students to download files
3. THE System SHALL display text content in readable format
4. WHEN a Student attempts to access a course they are not enrolled in, THE System SHALL deny access

### Requirement 9: Assignment Creation

**User Story:** As a teacher, I want to create assignments, so that students can submit work.

#### Acceptance Criteria

1. WHEN a Teacher creates an assignment, THE System SHALL store the assignment with title, description, and due date
2. THE System SHALL associate the assignment with a course
3. THE System SHALL validate that title and description are provided
4. THE System SHALL allow teachers to edit assignment details
5. THE System SHALL allow teachers to delete assignments

### Requirement 10: Assignment Submission

**User Story:** As a student, I want to submit assignments, so that I can complete coursework.

#### Acceptance Criteria

1. WHEN a Student uploads a file for an assignment, THE System SHALL store the file and create a submission record
2. THE System SHALL record the submission timestamp
3. THE System SHALL allow students to resubmit before grading
4. WHEN a Student submits after the due date, THE System SHALL mark the submission as late
5. THE System SHALL support PDF and common document formats

### Requirement 11: Grading

**User Story:** As a teacher, I want to grade submissions, so that I can provide scores to students.

#### Acceptance Criteria

1. WHEN a Teacher assigns a grade, THE System SHALL validate the grade is between 0 and 100
2. WHEN a Teacher saves a grade, THE System SHALL store the grade with the submission
3. THE System SHALL allow teachers to add text feedback
4. THE System SHALL mark the submission as graded
5. THE System SHALL display graded submissions to students

### Requirement 12: View Submissions

**User Story:** As a teacher, I want to view all submissions for an assignment, so that I can grade student work.

#### Acceptance Criteria

1. WHEN a Teacher views an assignment, THE System SHALL display all student submissions
2. THE System SHALL show submission status (submitted, graded, late)
3. THE System SHALL show student names and submission timestamps
4. THE System SHALL provide links to download submitted files
5. THE System SHALL separate ungraded and graded submissions

### Requirement 13: View Grades

**User Story:** As a student, I want to view my grades, so that I can track my performance.

#### Acceptance Criteria

1. WHEN a Student views a course, THE System SHALL display all graded assignments
2. THE System SHALL show the grade and feedback for each graded assignment
3. THE System SHALL show which assignments are pending grading
4. THE System SHALL calculate and display the average grade for the course
5. WHEN no assignments are graded, THE System SHALL display an appropriate message

### Requirement 14: Course List

**User Story:** As a student, I want to see available courses, so that I can find courses to enroll in.

#### Acceptance Criteria

1. WHEN a Student views the course list, THE System SHALL display all available courses
2. THE System SHALL show course name, teacher name, and description
3. THE System SHALL show the course code for enrollment
4. THE System SHALL indicate which courses the student is already enrolled in
5. THE System SHALL provide a search box to filter courses by name

### Requirement 15: Data Persistence

**User Story:** As a system architect, I want data persisted using Prisma and PostgreSQL, so that data is reliably stored.

#### Acceptance Criteria

1. WHEN any entity is created, THE System SHALL persist it to PostgreSQL using Prisma
2. WHEN any entity is updated, THE System SHALL update the database record
3. WHEN any entity is deleted, THE System SHALL remove the database record
4. THE System SHALL use Prisma migrations for schema changes
5. THE System SHALL maintain referential integrity between related entities

### Requirement 16: REST API

**User Story:** As a frontend developer, I want a REST API, so that I can build the React interface.

#### Acceptance Criteria

1. THE System SHALL expose RESTful endpoints for all operations
2. WHEN an API request succeeds, THE System SHALL return appropriate HTTP status codes (200, 201)
3. WHEN an API request fails, THE System SHALL return appropriate HTTP status codes (400, 401, 403, 404, 500)
4. THE System SHALL accept and return JSON-formatted data
5. THE System SHALL include error messages in error responses

### Requirement 17: Frontend Interface

**User Story:** As a user, I want a clean web interface, so that I can easily use the LMS.

#### Acceptance Criteria

1. WHEN a user navigates to the application, THE System SHALL display a login page for unauthenticated users
2. WHEN a user logs in, THE System SHALL display a role-appropriate dashboard
3. THE System SHALL provide navigation between courses, assignments, and profile
4. THE System SHALL display loading indicators while fetching data
5. WHEN an error occurs, THE System SHALL display user-friendly error messages

### Requirement 18: Security

**User Story:** As a system architect, I want basic security measures, so that user data is protected.

#### Acceptance Criteria

1. THE System SHALL hash all passwords before storing them
2. THE System SHALL validate all user inputs to prevent injection attacks
3. THE System SHALL prevent unauthorized file access
4. THE System SHALL validate file types before accepting uploads
5. THE System SHALL enforce file size limits on all uploads
