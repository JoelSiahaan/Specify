# Product Overview

## Product Name
Learning Management System (LMS) - MVP

## Problem Statement
Students need a simple platform to access learning materials, complete assignments and quizzes, while teachers need an easy way to share materials, create assessments, and grade student work.

This MVP focuses on core learning and assessment features with course management, designed to be built in 1 month.

## Target Users
- Students (enroll in courses, access materials, submit work)
- Teachers (create courses, manage content, grade submissions)

## Value Proposition
- Simple and focused LMS with course-based organization
- Easy course enrollment using course codes
- Flexible assignments (file upload or text submission)
- Timed quizzes with multiple question types
- Manual grading with feedback
- Grade tracking and export capabilities

## Product Goals
- Allow teachers to create and manage courses with unique course codes
- Enable students to discover and enroll in courses
- Allow teachers to share various types of learning materials (files, text, video links)
- Enable teachers to create assignments and quizzes with due dates
- Allow students to submit assignments and take timed quizzes
- Provide teachers with tools to grade submissions and provide feedback
- Enable students to track their grades and progress
- Allow teachers to export grades for record-keeping
- Support course archiving and lifecycle management

## Core Features (MVP)
- **Authentication**: Secure login with role-based access (Student, Teacher)
- **Course Management**: Create courses with unique codes, archive/delete courses
- **Course Discovery**: Search and enroll using course codes
- **Materials**: Upload files (PDF, images), add text content, link to videos
- **Assignments**: File-based or text-based submissions with due dates and rich text support
- **Quizzes**: Multiple choice and essay questions with time limits
- **Grading**: Manual grading with feedback for all submission types
- **Grade Export**: CSV export of all course grades
- **Progress View**: Students can see submission status and grades
- **Dashboards**: Role-specific dashboards for students and teachers
- **Course Search**: Filter courses by name

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
- Students can enroll in courses using course codes
- Teachers can create courses and manage materials easily
- Students can submit assignments and quizzes without errors
- Teachers can grade submissions and provide feedback efficiently
- Grade export works correctly with all required data
- System handles concurrent users reliably
- Stable role-based access control
- Course archiving works properly

## Constraints
- Web-based application only
- Frontend: React 19.2 with TypeScript and Vite
- Backend: REST API (Node.js/Express recommended)
- Authentication: Session-based or JWT
- ORM: Prisma
- Database: PostgreSQL
- File storage: Local filesystem or cloud storage
- Timeline: 1 month for MVP
- Two roles only: Student and Teacher
- File uploads: Max 10MB, PDF, DOCX, and images (JPG, PNG, GIF)
- No video file uploads (links to external platforms only)

## Technical Requirements
- Error handling and logging
- Database connection retry logic
- Concurrent request handling
- Input validation and security
- Password hashing
- File type validation
- Maintenance mode support
