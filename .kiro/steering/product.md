# Product Overview

## Product Name
Learning Management System (LMS) - MVP

## Problem Statement
Students need a simple platform to access learning materials, complete assignments and quizzes, while teachers need an easy way to share materials, create assessments, and grade student work.

This MVP focuses on core learning and assessment features with course management, designed to be built in 1 month.

## Why This MVP?
This MVP prioritizes the essential teaching and learning workflow: content delivery, assessment, and feedback. By focusing on manual grading and simple course management, we can deliver a functional LMS quickly while maintaining quality and reliability. Automated features like auto-grading and notifications are deferred to future iterations.

## Target Users
- **Students**: Enroll in courses, access materials, submit assignments and quizzes, track grades
- **Teachers**: Create and manage courses, share materials, create assessments, grade submissions, export grades

## User Journeys

### Teacher Journey
1. Create course with unique code
2. Add learning materials (files, text, video links)
3. Create assignments and quizzes with due dates
4. Students enroll and submit work
5. Grade submissions after due date (grading closes assignment)
6. Export grades for record-keeping
7. Archive course when semester ends

### Student Journey
1. Enroll in course using course code
2. Access materials and study
3. Submit assignments before/after due date (until grading starts)
4. Take timed quizzes before due date
5. View grades and feedback
6. Track progress throughout course

## Value Proposition
- Simple and focused LMS with course-based organization
- Easy course enrollment using course codes
- Flexible assignments (file upload or text submission)
- Timed quizzes with multiple question types
- Manual grading with feedback
- Grade tracking and export capabilities

## Key Business Rules

### Assignment Lifecycle
1. **Creation**: Teacher sets due date (must be in future)
2. **Editing**: Only allowed before due date
3. **Deletion**: Allowed anytime
4. **Submission Window**: Before due date (on-time) or after due date (late) until grading starts
5. **Grading Trigger**: Starting to grade closes assignment permanently
6. **Archiving**: When course archived, all assignments auto-close

### Quiz Lifecycle
1. **Creation**: Teacher sets due date and time limit
2. **Point Distribution**: No predefined points required
3. **Editing**: Only allowed before due date and before any submissions
4. **Deletion**: Allowed anytime
5. **Submission Window**: Strictly before due date only
6. **Grading**: Manual with sum=100 warning as guiderail
7. **Archiving**: When course archived, all quizzes auto-close

### Course Lifecycle
1. **Active**: Open for enrollment, editable
2. **Archived**: No new enrollments, read-only access, all assignments/quizzes closed
3. **Deleted**: Only archived courses can be deleted, cascade deletes all data

### Grading Philosophy
- **Fully Manual**: No automated grading to ensure teacher control and flexibility
- **Consistency Guiderails**: System warns but doesn't block inconsistent grading
- **Feedback-Focused**: Text feedback encouraged for all submissions

## Core Features (MVP)

### Authentication & Access Control
- Secure login with email and password
- User registration with role selection (Student or Teacher)
- Role-based access control for all features
- Session management with logout capability

### Course Management
- Create courses with auto-generated unique course codes
- Edit course details before due dates
- Archive courses (auto-closes all assignments/quizzes, prevents new enrollments)
- Delete archived courses (cascade deletes all related data)
- Bulk unenroll students from archived courses
- View active and archived courses separately

### Course Discovery & Enrollment
- Browse and search active courses by name
- Enroll using course codes
- View enrolled courses on dashboard
- Access archived courses in read-only mode (no submissions)

### Learning Materials
- Upload files (PDF, images up to 10MB)
- Add rich text content
- Link to external videos (YouTube, Vimeo)
- Edit and delete materials
- Students can view and download materials

### Assignments
- Create assignments with title, description, and due date
- Specify submission types (file upload, text, or both)
- Support rich text descriptions
- Edit assignments only before due date
- Delete assignments anytime
- Timezone-aware due dates
- **Late Submission Policy**: Students can submit after due date until grading starts
- **Grading Workflow**: Starting to grade any submission automatically closes the assignment

### Quizzes
- Create quizzes with due dates and time limits
- Add multiple choice questions (2+ options, 1 correct answer)
- Add essay questions with rich text
- Edit quizzes only before due date and before any submissions
- Delete quizzes anytime
- Timezone-aware due dates
- **Strict Due Date**: No submissions allowed after due date
- Timed quiz taking with auto-submit on timeout
- Prevent multiple submissions

### Grading & Feedback
- **Manual Grading**: All grading done by teachers (no auto-grading)
- View all submissions with status (not submitted, submitted, graded, late)
- Grade assignments: assign score (0-100) and text feedback
- Grade quizzes: manually assign points per question
- **Quiz Grading Guiderails**: System warns if points don't sum to 100
- Edit grades after saving
- Grading automatically closes assignments to prevent new submissions

### Progress & Grade Tracking
- Students view all assignments/quizzes with status
- Highlight overdue items not submitted
- Indicate late submissions with marker
- Display grades and feedback
- Calculate and display course average

### Grade Export
- Export all course grades to CSV
- Include student info, assignment/quiz names, grades, submission dates
- Include average grade per student
- Show "Not Submitted" or "Pending" for ungraded items

### Dashboards
- **Student Dashboard**: Enrolled courses with teacher names
- **Teacher Dashboard**: Created courses with enrollment counts
- Quick access to course management

## Non-Goals (Future Enhancements)
- Admin panel and user management
- Automated grading for MCQ (all grading is manual in MVP)
- In-app notifications
- Announcements or discussion forums
- Video streaming or live classes
- Payment systems
- Mobile native applications
- Complex progress tracking or analytics
- Real-time collaboration features

## Success Metrics

### User Adoption
- Teachers can create a complete course (with materials and assignments) in under 15 minutes
- Students can enroll in a course in under 2 minutes
- 90% of users successfully complete their first action without errors

### Core Functionality
- Assignment submission success rate > 95%
- Quiz completion rate (started → submitted) > 90%
- File upload success rate > 98%
- Zero data loss incidents

### Grading Workflow
- Teachers can grade a submission in under 3 minutes
- 80% of submissions graded within 48 hours of due date
- Grade export generates successfully for courses with 100+ students

### System Reliability
- System handles 50+ concurrent users without performance degradation
- API response time < 500ms for 95% of requests
- Zero unauthorized access incidents
- Course archiving completes successfully 100% of the time

## Constraints

### Scope Constraints
- Web-based application only (no mobile native apps)
- Timeline: 1 month for MVP
- Two roles only: Student and Teacher (no admin role)
- Manual grading only (no automated grading)

### Content Constraints
- File uploads: Max 10MB per file
- Supported file formats: PDF, DOCX, images (JPG, PNG, GIF)
- No video file uploads (external links only to YouTube, Vimeo)
- Rich text formatting for descriptions and content

### User Constraints
- Single role per user (cannot be both Student and Teacher)
- Course codes must be unique across system
- One submission per quiz (no retakes)
- Timezone handling for all due dates
