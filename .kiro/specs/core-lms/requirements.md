# Requirements Document

## Introduction

The Learning Management System (LMS) is a web-based platform that enables teachers to create courses, share materials, and create assignments, while allowing students to enroll, access content, and submit work. This production-grade system focuses on core learning and assessment features with a simple, functional interface designed for 50+ concurrent users.

## Glossary

- **System**: The Learning Management System web application
- **User**: Any authenticated person using the system (Student or Teacher)
- **Student**: A user with student role who enrolls in courses and submits assignments
- **Teacher**: A user with teacher role who creates and manages courses
- **Course**: A learning unit containing materials, assignments, and quizzes
- **Course_Code**: A unique identifier for course enrollment
- **Course_Status**: The state of a course (active or archived)
- **Material**: Educational content (files or text) in a course
- **Assignment**: A task requiring file upload, text submission, or both
- **Quiz**: An assessment with multiple choice or essay questions
- **MCQ**: Multiple choice question with one correct answer
- **Essay_Question**: Open-ended question requiring text response
- **Submission**: A student's completed assignment or quiz
- **Grade**: A numerical score (0-100) for a submission
- **Submission_Status**: The state of a submission (not submitted, submitted, graded)
- **Due_Date**: The deadline for submitting an assignment or quiz
- **Time_Limit**: The maximum duration allowed to complete a quiz

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log in to the system, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user provides valid credentials, THE System SHALL authenticate the user and create a session
2. WHEN a user provides invalid credentials, THE System SHALL reject the authentication and return an error
3. WHEN an unauthenticated user attempts to access protected content, THE System SHALL redirect to the login page
4. WHEN an authenticated user makes a request, THE System SHALL authorize the request
5. THE System SHALL assign each user exactly one role (Student or Teacher)
6. THE System SHALL allow users to log out and end their session
7. THE System SHALL allow new users to register with email, password, name, and role selection

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
5. WHEN a Teacher has no created courses, THE System SHALL display a message and course creation option

### Requirement 5: Course Creation and Management

**User Story:** As a teacher, I want to create and manage courses, so that I can organize learning content.

#### Acceptance Criteria

1. WHEN a Teacher creates a course with a name and description, THE System SHALL generate a unique course code and store the course
2. WHEN a course code collision occurs, THE System SHALL regenerate a new unique code
3. WHEN a Teacher updates an active course, THE System SHALL save the changes
4. WHEN a Teacher archives a course, THE System SHALL hide it from active course lists and prevent new enrollments
5. WHEN a Teacher archives a course, THE System SHALL automatically close all open assignments and quizzes to prevent further submissions
6. WHEN a Teacher attempts to delete an active course, THE System SHALL prevent deletion and require archiving first
7. WHEN a Teacher deletes an archived course, THE System SHALL permanently remove the course and all related materials, assignments, quizzes, submissions, and grades
8. THE System SHALL provide a bulk unenroll feature for archived courses
9. THE System SHALL validate that course name is provided
10. THE System SHALL allow teachers to view all their created courses (active and archived separately)
11. THE System SHALL allow students to view archived courses in read-only mode with no submission capabilities

### Requirement 6: Course Discovery and Enrollment

**User Story:** As a student, I want to discover and enroll in courses, so that I can access learning content.

#### Acceptance Criteria

1. WHEN a Student views the course list, THE System SHALL display only active courses with name, teacher, and description
2. THE System SHALL NOT include archived courses in search results
3. THE System SHALL provide a search box to filter active courses by name
4. THE System SHALL indicate which courses the student is already enrolled in
5. WHEN a Student provides a valid course code for an active course, THE System SHALL enroll the student in that course
6. WHEN a Student provides a course code for an archived course, THE System SHALL reject the enrollment and return an error
7. WHEN a Student provides an invalid course code, THE System SHALL reject the enrollment and return an error
8. WHEN a Student is already enrolled, THE System SHALL prevent duplicate enrollment

### Requirement 7: Material Management

**User Story:** As a teacher, I want to add various types of materials to courses, so that students can access learning content.

#### Acceptance Criteria

1. WHEN a Teacher uploads a file to a course, THE System SHALL store the file
2. WHEN a Teacher adds text content to a course, THE System SHALL store the content with rich text formatting
3. WHEN a Teacher adds a video link to a course, THE System SHALL validate and store the URL
4. WHEN a Teacher provides an invalid URL, THE System SHALL reject it and return an error
5. WHEN a file upload exceeds size limit, THE System SHALL reject it and return an error
6. WHEN a Teacher deletes a material, THE System SHALL remove it
7. THE System SHALL allow teachers to edit existing materials
8. THE System SHALL support PDF and image file formats (JPG, PNG, GIF)
9. THE System SHALL enforce a 10MB file size limit for uploads
10. THE System SHALL NOT allow video file uploads
11. THE System SHALL allow links to external video platforms (YouTube, Vimeo)

### Requirement 8: Student Access to Materials

**User Story:** As a student, I want to view course materials, so that I can study.

#### Acceptance Criteria

1. WHEN a Student accesses an enrolled course, THE System SHALL display all materials (files, text, and links)
2. THE System SHALL allow students to download files
3. THE System SHALL display text content with formatting in readable format
4. THE System SHALL display video links as clickable links that open in a new tab
5. WHEN a Student attempts to access a course they are not enrolled in, THE System SHALL deny access

### Requirement 9: Assignment Creation

**User Story:** As a teacher, I want to create assignments with due dates, so that students can submit their work within a specified timeframe.

#### Acceptance Criteria

1. WHEN a Teacher creates an assignment, THE System SHALL store the assignment with title, description, and due date
2. WHEN a Teacher sets a due date in the past, THE System SHALL reject it and return an error
3. THE System SHALL display due dates consistently across different user timezones
4. THE System SHALL allow teachers to specify submission types (file upload, text submission, or both)
5. WHEN file upload is enabled, THE System SHALL allow specification of accepted file formats
6. THE System SHALL support rich text formatting in descriptions
7. THE System SHALL validate that title, description, and due date are provided
8. WHEN a Teacher attempts to edit an assignment after the due date, THE System SHALL prevent the edit and return an error
9. THE System SHALL allow teachers to edit assignments before the due date
10. THE System SHALL allow teachers to delete assignments at any time
11. THE System SHALL allow teachers to view all assignments for a course
12. THE System SHALL calculate and display time remaining until due date

### Requirement 10: Assignment Submission

**User Story:** As a student, I want to submit assignments using files or text, so that I can complete coursework in the format requested.

#### Acceptance Criteria

1. WHEN an assignment allows file upload, THE System SHALL allow students to upload files in the specified formats
2. WHEN an assignment allows text submission, THE System SHALL provide a rich text editor for students
3. WHEN an assignment allows both, THE System SHALL allow students to submit files and text together
4. WHEN a Student submits without required content, THE System SHALL reject the submission and return an error
5. WHEN a Student uploads a file in unsupported format, THE System SHALL reject it and return an error
6. THE System SHALL record the submission timestamp
7. WHEN a Student submits before the due date, THE System SHALL accept the submission
8. WHEN a Student submits after the due date but before grading starts, THE System SHALL accept the submission and mark it as late
9. WHEN a Student attempts to submit after grading has started, THE System SHALL reject the submission and return an error
10. WHEN a Student attempts to resubmit before grading starts, THE System SHALL allow the resubmission and replace the previous submission
11. WHEN a Student attempts to resubmit after grading has started, THE System SHALL reject the resubmission and return an error
12. THE System SHALL allow students to view their own submissions
13. THE System SHALL support PDF, DOCX, and image formats (JPG, PNG) for file uploads

### Requirement 11: Quiz Creation

**User Story:** As a teacher, I want to create quizzes with multiple choice and essay questions, so that I can assess student knowledge.

#### Acceptance Criteria

1. WHEN a Teacher creates a quiz, THE System SHALL store the quiz with title, description, due date, and time limit in minutes
2. WHEN a Teacher sets a quiz due date in the past, THE System SHALL reject it and return an error
3. THE System SHALL display quiz due dates consistently across different user timezones
4. WHEN a Teacher adds an MCQ, THE System SHALL store the question, options, and correct answer
5. WHEN a Teacher adds an essay question, THE System SHALL store the question text
6. THE System SHALL require at least one question per quiz
7. THE System SHALL require at least two options per MCQ
8. THE System SHALL validate that exactly one option is marked as correct for each MCQ
9. THE System SHALL support rich text formatting in essay questions
10. WHEN a quiz has submissions, THE System SHALL prevent editing or deleting questions
11. WHEN a Teacher attempts to edit a quiz after the due date, THE System SHALL prevent the edit and return an error
12. THE System SHALL allow teachers to edit quizzes before the due date and before any submissions
13. THE System SHALL allow teachers to delete entire quizzes at any time
14. THE System SHALL allow teachers to view all quizzes for a course

### Requirement 12: Quiz Taking

**User Story:** As a student, I want to take quizzes within a time limit, so that I can demonstrate my understanding under timed conditions.

#### Acceptance Criteria

1. WHEN a Student views a quiz before starting, THE System SHALL display quiz title, description, time limit, and number of questions
2. WHEN a Student starts a quiz before the due date, THE System SHALL display all questions and start a countdown timer
3. THE System SHALL display remaining time to the student during the quiz
4. WHEN the time limit expires, THE System SHALL automatically submit the quiz
5. WHEN a Student submits before the time limit, THE System SHALL accept the submission
6. WHEN a Student attempts to start a quiz after the due date, THE System SHALL prevent access and display an error
7. THE System SHALL prevent multiple submissions for the same quiz

### Requirement 13: Grading

**User Story:** As a teacher, I want to grade student submissions, so that I can provide scores and feedback.

#### Acceptance Criteria

1. WHEN a Teacher starts grading any submission for an assignment, THE System SHALL automatically close the assignment to prevent further submissions
2. WHEN a Teacher views a submission, THE System SHALL display all submitted content (files, text, or quiz answers)
3. WHEN a Teacher assigns a grade, THE System SHALL validate the grade is between 0 and 100
4. WHEN a Teacher saves a grade, THE System SHALL store the grade with the submission
5. THE System SHALL allow teachers to edit grades after saving
6. THE System SHALL allow teachers to add text feedback
7. THE System SHALL mark the submission as graded
8. FOR quiz submissions, THE System SHALL allow teachers to manually assign points per question
9. FOR quiz submissions, WHEN the sum of assigned points does not equal 100, THE System SHALL display a warning to the teacher
10. FOR quiz submissions, THE System SHALL calculate the total score based on the manually assigned points per question

### Requirement 14: View Submissions

**User Story:** As a teacher, I want to view all submissions for an assignment or quiz, so that I can grade student work.

#### Acceptance Criteria

1. WHEN a Teacher views an assignment or quiz, THE System SHALL display all student submissions
2. THE System SHALL show submission status (not submitted, submitted, graded, late)
3. THE System SHALL show student names and submission timestamps
4. THE System SHALL provide links to view submitted content
5. THE System SHALL separate ungraded and graded submissions

### Requirement 15: Grade Export

**User Story:** As a teacher, I want to export grades for all students in a course, so that I can analyze performance and maintain records.

#### Acceptance Criteria

1. WHEN a Teacher requests a grade export for a course, THE System SHALL generate a CSV file with all student grades
2. THE System SHALL include student name, email, assignment/quiz name, grade, and submission date in the export
3. THE System SHALL include average grade per student in the export
4. THE System SHALL allow teachers to download the exported file
5. THE System SHALL include both graded and ungraded items in the export (showing "Not Submitted" or "Pending" for ungraded)

### Requirement 16: Student Progress View

**User Story:** As a student, I want to see my progress and grades, so that I can track my performance.

#### Acceptance Criteria

1. WHEN a Student views a course, THE System SHALL display all assignments and quizzes with their status
2. THE System SHALL show "Not Submitted" for items without submissions
3. THE System SHALL show "Submitted" for items awaiting grading
4. THE System SHALL show "Graded" with the grade and feedback for completed items
5. THE System SHALL highlight overdue items that are not submitted
6. THE System SHALL indicate late submissions with a late marker
7. THE System SHALL calculate and display the average grade for the course
8. WHEN no items are graded, THE System SHALL display an appropriate message

### Requirement 17: Data Persistence

**User Story:** As a system architect, I want data reliably stored and maintained, so that no data is lost.

#### Acceptance Criteria

1. WHEN any entity is created, THE System SHALL persist it to the database
2. WHEN any entity is updated, THE System SHALL update the stored data
3. WHEN any entity is deleted, THE System SHALL remove it from storage
4. THE System SHALL maintain data consistency between related entities
5. THE System SHALL support database schema evolution

### Requirement 18: API Interface

**User Story:** As a frontend developer, I want a well-defined API, so that I can build the user interface.

#### Acceptance Criteria

1. THE System SHALL expose endpoints for all operations
2. WHEN an API request succeeds, THE System SHALL return success indicators
3. WHEN an API request fails, THE System SHALL return error indicators with descriptive messages
4. THE System SHALL accept and return structured data
5. THE System SHALL provide consistent response formats

### Requirement 19: Frontend Interface

**User Story:** As a user, I want a clean web interface, so that I can easily use the LMS.

#### Acceptance Criteria

1. WHEN a user navigates to the application, THE System SHALL display a login page for unauthenticated users
2. WHEN a user logs in, THE System SHALL display a role-appropriate dashboard
3. THE System SHALL provide navigation between courses, assignments, quizzes, and profile
4. THE System SHALL display loading indicators while fetching data
5. WHEN an error occurs, THE System SHALL display user-friendly error messages

### Requirement 20: Security

**User Story:** As a system architect, I want basic security measures, so that user data is protected.

#### Acceptance Criteria

1. THE System SHALL hash all passwords before storing them
2. THE System SHALL validate all user inputs to prevent injection attacks
3. THE System SHALL prevent unauthorized file access
4. THE System SHALL validate file types before accepting uploads
5. THE System SHALL enforce file size limits on all uploads

### Requirement 21: System Availability

**User Story:** As a user, I want the system to be available and reliable, so that I can access it when needed.

#### Acceptance Criteria

1. WHEN the database connection fails, THE System SHALL retry the connection up to 3 times before returning an error
2. WHEN an API endpoint encounters an error, THE System SHALL log the error with timestamp and context
3. THE System SHALL return appropriate error responses without exposing internal system details
4. WHEN the system is under maintenance, THE System SHALL display a maintenance message to users
5. THE System SHALL handle concurrent user requests without data corruption
6. WHEN file uploads are in progress, THE System SHALL prevent timeout errors for files under the size limit
7. THE System SHALL validate database connections before processing requests
