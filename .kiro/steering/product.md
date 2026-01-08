# Product Overview

## Product Name
Learning Management System (LMS) - MVP

## Problem Statement
Students need a simple platform to access learning materials and submit assignments, while teachers need an easy way to share materials, create assignments, and grade student work.

This MVP focuses on core learning and assessment features without unnecessary complexity, designed to be built in 1 month.

## Target Users
- Students
- Teachers

## Value Proposition
- Simple and focused LMS for essential teaching and learning
- Easy course enrollment with course codes
- Straightforward assignment submission and grading
- Clean interface for both students and teachers

## Product Goals
- Allow teachers to create courses and share materials
- Enable students to enroll in courses using course codes
- Allow students to access learning materials
- Enable students to submit assignments
- Allow teachers to grade submissions and provide feedback
- Provide students with grade visibility

## Core Features (MVP)
- User authentication (Student/Teacher roles)
- Course creation with unique course codes
- Course enrollment system
- Material upload (files and text)
- File-based assignments
- Assignment submission
- Manual grading (0-100 scale with feedback)
- Student and teacher dashboards
- Course list and search

## Non-Goals (Future Enhancements)
- Admin panel and user management
- Quizzes with auto-grading
- Text assignments with rich text editor
- Progress tracking
- Announcements and comments
- Notification system
- Video streaming or live classes
- Discussion forums
- Payment systems
- Mobile native applications

## Success Metrics
- Students can enroll in courses and access materials without errors
- Teachers can create courses and assignments easily
- Students can submit assignments successfully
- Teachers can grade submissions efficiently
- Stable role-based access control
- System handles file uploads reliably

## Constraints
- Web-based application
- Frontend: React 19.2 with TypeScript and Vite
- Backend: REST API (Node.js/Express recommended)
- Authentication: Session-based
- ORM: Prisma
- Database: PostgreSQL
- Timeline: 1 month development
- File uploads: Max 10MB, PDF and images only
