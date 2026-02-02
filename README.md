# Learning Management System (LMS)

A production-grade Learning Management System built with React 19.2, Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL. The system supports course management, learning materials, assignments, quizzes, and grading workflows for 50+ concurrent users.

**Key Features**: Course management, enrollment, materials (files/text/video links), assignments with late submissions, timed quizzes, manual grading, progress tracking, and grade export.

**Architecture**: Clean Architecture with Domain-Driven Design principles, ensuring maintainability, testability, and scalability.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Development with Docker](#development-with-docker-recommended)
  - [Local Development](#local-development-alternative)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

#### Authentication & Authorization
- User registration with role selection (Student or Teacher)
- Secure login with JWT tokens (HTTP-only cookies)
- Role-based access control (RBAC)
- Session management with access and refresh tokens
- Secure logout

#### Course Management
- Create courses with auto-generated unique course codes
- Edit course details (before due dates)
- Archive courses (auto-closes assignments/quizzes, prevents new enrollments)
- Delete archived courses (cascade deletes all related data)
- Bulk unenroll students from archived courses
- View active and archived courses separately

#### Course Discovery & Enrollment
- Browse and search active courses by name
- Enroll using course codes
- View enrolled courses on dashboard
- Access archived courses in read-only mode

#### Learning Materials
- Upload files (PDF, DOCX, images up to 10MB)
- Add rich text content with formatting
- Link to external videos (YouTube, Vimeo)
- Edit and delete materials
- Students can view and download materials

#### Assignments
- Create assignments with title, description, and due date
- Specify submission types (file upload, text, or both)
- Support rich text descriptions
- Edit assignments only before due date
- Delete assignments anytime
- **Late Submission Policy**: Students can submit after due date until grading starts
- **Grading Workflow**: Starting to grade any submission automatically closes the assignment
- Timezone-aware due dates

#### Quizzes
- Create quizzes with due dates and time limits
- Add multiple choice questions (2+ options, 1 correct answer)
- Add essay questions with rich text
- Edit quizzes only before due date and before any submissions
- Delete quizzes anytime
- **Strict Due Date**: No submissions allowed after due date
- Timed quiz taking with auto-submit on timeout
- Prevent multiple submissions

#### Grading & Feedback
- **Manual Grading**: All grading done by teachers (no auto-grading)
- View all submissions with status (not submitted, submitted, graded, late)
- Grade assignments: assign score (0-100) and text feedback
- Grade quizzes: manually assign points per question
- **Quiz Grading Guiderails**: System warns if points don't sum to 100
- Edit grades after saving
- Grading automatically closes assignments to prevent new submissions

#### Progress & Grade Tracking
- Students view all assignments/quizzes with status
- Highlight overdue items not submitted
- Indicate late submissions with marker
- Display grades and feedback
- Calculate and display course average

#### Grade Export
- Export all course grades to CSV
- Include student info, assignment/quiz names, grades, submission dates
- Include average grade per student
- Show "Not Submitted" or "Pending" for ungraded items

#### Dashboards
- **Student Dashboard**: Enrolled courses with teacher names
- **Teacher Dashboard**: Created courses with enrollment counts
- Quick access to course management

---

## Project Structure

This project follows **Clean Architecture** principles with clear separation between backend and frontend.

```
.
├── backend/              # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── domain/      # Domain Layer (business logic)
│   │   │   ├── entities/        # Domain entities
│   │   │   ├── value-objects/   # Value objects
│   │   │   ├── services/        # Domain services
│   │   │   ├── repositories/    # Repository interfaces
│   │   │   ├── storage/         # Storage interfaces
│   │   │   └── errors/          # Domain errors
│   │   ├── application/ # Application Layer (use cases)
│   │   │   ├── use-cases/       # Use cases
│   │   │   ├── dtos/            # Data Transfer Objects
│   │   │   ├── mappers/         # Entity ↔ DTO mappers
│   │   │   └── policies/        # Authorization policies
│   │   ├── infrastructure/ # Infrastructure Layer
│   │   │   ├── persistence/     # Database (Prisma)
│   │   │   ├── storage/         # File storage
│   │   │   ├── auth/            # Authentication services
│   │   │   └── di/              # Dependency injection
│   │   └── presentation/ # Presentation Layer (API)
│   │       └── api/
│   │           ├── controllers/ # HTTP controllers
│   │           ├── middleware/  # Middleware
│   │           ├── routes/      # Route definitions
│   │           └── validators/  # Request validators
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # Frontend SPA (React 19.2 + TypeScript + Vite)
│   ├── src/
│   │   ├── presentation/web/    # React components and UI
│   │   │   ├── components/
│   │   │   │   ├── shared/      # Reusable UI components
│   │   │   │   └── layout/      # Layout components
│   │   │   ├── services/        # API client services
│   │   │   ├── utils/           # Helper functions
│   │   │   ├── types/           # TypeScript types
│   │   │   └── constants/       # Constants
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── .kiro/              # Kiro specs and configuration
    └── specs/
        └── core-lms/   # LMS feature specifications
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 20.19.0 LTS (Alpine for Docker)
- **Framework**: Express
- **Language**: TypeScript (strict mode, ES2022 target)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies (SameSite=Strict)
- **Password Hashing**: BCrypt (10 salt rounds)
- **Validation**: Zod (schema-first validation)
- **Dependency Injection**: TSyringe (decorator-based)
- **HTML Sanitization**: sanitize-html (server-side XSS prevention)
- **Logging**: Winston (structured JSON logging)
- **File Upload**: Multer (multipart/form-data)
- **Testing**: Jest, fast-check (property-based testing), Supertest

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript (strict mode, ES2022 target)
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **Routing**: React Router
- **HTTP Client**: Axios
- **HTML Sanitization**: DOMPurify (client-side XSS prevention)
- **Testing**: Vitest, React Testing Library

### Infrastructure & Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (single server deployment)
- **Reverse Proxy**: Nginx 1.27 (Alpine)
- **SSL/TLS**: Let's Encrypt (Certbot)
- **Operating System**: Ubuntu 22.04 LTS (server)
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)

### Security
- **SSL/TLS**: Let's Encrypt (TLS 1.2+)
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Rate Limiting**: Nginx rate limiting (10 req/s API, 5 req/m auth)
- **Input Validation**: Zod schemas at presentation layer
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Prevention**: DOMPurify (client) + sanitize-html (server)
- **CSRF Protection**: SameSite=Strict cookies
- **File Upload Security**: Type validation, size limits (10MB), content validation

---

## Getting Started

### Prerequisites

**For Docker Development (Recommended)**:
- Docker 20.10+ and Docker Compose 2.0+
- Git

**For Local Development (Alternative)**:
- Node.js 20.19.0 LTS
- npm (comes with Node.js)
- PostgreSQL 15

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify
```

2. **Install backend dependencies**:
```bash
cd backend
npm install
```

3. **Install frontend dependencies**:
```bash
cd ../frontend
npm install
cd ..
```

### Environment Configuration

#### Backend Environment Variables

Create `.env` file in the `backend` directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://lms_user:your_password@localhost:5432/lms_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Application
NODE_ENV=development
PORT=3000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Monitoring (Optional - Sentry for error tracking)
# SENTRY_DSN=your_sentry_dsn
# SENTRY_ENVIRONMENT=development
```

**Generate Secure Secrets**:
```bash
# Generate JWT Access Secret
openssl rand -base64 32

# Generate JWT Refresh Secret
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24
```

#### Frontend Environment Variables

Create `.env` file in the `frontend` directory:

```bash
# API URL
VITE_API_URL=http://localhost:3000/api
```

#### Docker Environment Variables

For Docker development, create `.env` file in the **root** directory:

```bash
# Database Password
DB_PASSWORD=your_secure_password

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Frontend URL
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:5173
```

**⚠️ Security Warning**:
- Never commit `.env` files to Git
- Store secrets securely (password manager, vault)
- Rotate secrets regularly (every 90 days recommended)
- Use different secrets for development and production

### Development with Docker (Recommended)

**Prerequisites**: 
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Start Docker Desktop (ensure Docker icon in system tray is green)

**Quick Start**:
```bash
# 1. Create .env file in root directory (see Environment Configuration above)
cp .env.example .env
# Edit .env and add your secrets

# 2. Start all services
docker-compose up -d

# 3. Wait ~30 seconds, then run migrations
docker-compose exec backend npx prisma migrate dev --name init

# 4. Generate Prisma Client
docker-compose exec backend npx prisma generate

# 5. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Health Check: http://localhost:3000/health
```

**Common Docker Commands**:
```bash
# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild if dependencies changed
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U lms_user -d lms_dev

# Run Prisma Studio (database GUI)
docker-compose exec backend npx prisma studio

# Run tests
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

**Troubleshooting Docker**:
```bash
# Check container status
docker-compose ps

# Check container logs for errors
docker-compose logs backend

# Restart all services
docker-compose restart

# Clean rebuild (if issues persist)
docker-compose down -v
docker-compose up -d --build
```

### Local Development (Alternative)

**Prerequisites**:
- PostgreSQL 15 installed and running
- Node.js 20.19.0 LTS installed

**Setup Steps**:

1. **Create PostgreSQL database**:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE lms_dev;
CREATE USER lms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lms_dev TO lms_user;
\q
```

2. **Configure environment variables** (see Environment Configuration above)

3. **Run database migrations**:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

4. **Start backend server**:
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3000
```

5. **Start frontend server** (in new terminal):
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

6. **Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/health

**Local Development Commands**:
```bash
# Backend
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration  # Run integration tests
npm run test:property     # Run property-based tests

# Frontend
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run all tests

# Database
cd backend
npx prisma migrate dev       # Create and apply migration
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Open Prisma Studio (database GUI)
npx prisma generate          # Generate Prisma Client
```

---

## Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

### Backend Layers
1. **Domain Layer**: Business entities, value objects, and repository interfaces (framework-independent)
2. **Application Layer**: Use cases, DTOs, and authorization policies
3. **Infrastructure Layer**: Database, file storage, and external services
4. **Presentation Layer**: REST API controllers and middleware

### Frontend Structure
- **Presentation Layer**: React components, services, and utilities

### Dependency Rule
Dependencies point inward: outer layers depend on inner layers, never the reverse.

---

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

### Authentication
All protected endpoints require JWT token in HTTP-only cookie (automatically sent by browser).

### Response Format

**Success Response**:
```json
{
  "id": "uuid",
  "name": "Resource Name",
  "createdAt": "2025-01-13T10:30:00Z"
}
```

**Error Response**:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context (optional)"
  }
}
```

### HTTP Status Codes
- `200 OK`: Success (GET, PUT, DELETE)
- `201 Created`: Resource created (POST)
- `400 Bad Request`: Validation error or business rule violation
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: User not authorized for this action
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Unexpected server error

### API Endpoints

#### Authentication Endpoints

```http
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/refresh         # Refresh access token
POST   /api/auth/logout          # Logout user
GET    /api/auth/me              # Get current user
```

**Example: Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "role": "STUDENT"
}

Response (201 Created):
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "createdAt": "2025-01-13T10:30:00Z"
}
```

#### Course Endpoints

```http
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

**Example: Create Course**
```http
POST /api/courses
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "name": "Introduction to Programming",
  "description": "Learn programming basics with Python"
}

Response (201 Created):
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

#### Material Endpoints

```http
GET    /api/courses/:courseId/materials     # List materials
POST   /api/courses/:courseId/materials     # Create material (teacher only)
GET    /api/materials/:id                   # Get material details
PUT    /api/materials/:id                   # Update material (teacher only)
DELETE /api/materials/:id                   # Delete material (teacher only)
GET    /api/materials/:id/download          # Download material file
```

#### Assignment Endpoints

```http
GET    /api/courses/:courseId/assignments   # List assignments
POST   /api/courses/:courseId/assignments   # Create assignment (teacher only)
GET    /api/assignments/:id                 # Get assignment details
PUT    /api/assignments/:id                 # Update assignment (teacher only)
DELETE /api/assignments/:id                 # Delete assignment (teacher only)
GET    /api/assignments/:id/submissions     # List submissions (teacher only)
POST   /api/assignments/:id/submit          # Submit assignment (student only)
```

**Example: Submit Assignment**
```http
POST /api/assignments/:id/submit
Content-Type: multipart/form-data
Cookie: access_token=<jwt>

Fields:
- submissionType: "FILE"
- file: <binary data>

Response (201 Created):
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

#### Quiz Endpoints

```http
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

#### Grading Endpoints

```http
GET    /api/assignment-submissions/:id        # Get assignment submission details
POST   /api/assignment-submissions/:id/grade  # Grade assignment submission (teacher only)
PUT    /api/assignment-submissions/:id/grade  # Update assignment grade (teacher only)
GET    /api/quiz-submissions/:id              # Get quiz submission details
POST   /api/quiz-submissions/:id/grade        # Grade quiz submission (teacher only)
PUT    /api/quiz-submissions/:id/grade        # Update quiz grade (teacher only)
GET    /api/courses/:id/grades/export         # Export grades CSV (teacher only)
GET    /api/courses/:id/progress              # Get student progress (student only)
```

**Example: Grade Assignment**
```http
POST /api/assignment-submissions/:id/grade
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "grade": 85,
  "feedback": "Good work! Consider adding more examples."
}

Response (200 OK):
{
  "id": "submission-uuid",
  "grade": 85,
  "feedback": "Good work! Consider adding more examples.",
  "status": "GRADED",
  "gradedAt": "2025-01-13T10:30:00Z"
}
```

### Error Codes

**Authentication Errors (401)**:
- `AUTH_REQUIRED`: Authentication required
- `AUTH_TOKEN_INVALID`: Invalid JWT token
- `AUTH_TOKEN_EXPIRED`: Token expired
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password

**Authorization Errors (403)**:
- `FORBIDDEN_ROLE`: User role not authorized
- `NOT_OWNER`: User is not the resource owner
- `NOT_ENROLLED`: User is not enrolled in course

**Validation Errors (400)**:
- `VALIDATION_FAILED`: Input validation failed
- `INVALID_EMAIL`: Email format invalid
- `INVALID_DATE`: Date is in the past or invalid
- `INVALID_FILE_TYPE`: File type not allowed
- `INVALID_FILE_SIZE`: File exceeds 10MB limit

**Business Logic Errors (400/409)**:
- `RESOURCE_CLOSED`: Resource is closed for modifications
- `RESOURCE_ARCHIVED`: Resource is archived
- `DUPLICATE_ENTRY`: Resource already exists
- `INVALID_STATE`: Invalid state transition

**Not Found Errors (404)**:
- `RESOURCE_NOT_FOUND`: Requested resource does not exist

**Server Errors (500)**:
- `INTERNAL_ERROR`: Unexpected server error
- `DATABASE_ERROR`: Database operation failed

For complete API documentation, see `.kiro/steering/api-standards.md`.

---

## Testing

### Backend Testing

**Test Types**:
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints and database operations
- **Property-Based Tests**: Test universal properties with randomized inputs (100+ iterations)

**Run Tests**:
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- Course.test.ts

# Run tests matching pattern
npm test -- Course

# Run with coverage
npm test -- --coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run property-based tests only
npm run test:property
```

**Test Database**:
- Tests use dedicated test database (port 5433)
- Apply migrations before running tests:
```bash
$env:DATABASE_URL="postgresql://lms_test_user:test_password@localhost:5433/lms_test"
npx prisma migrate deploy
```

### Frontend Testing

**Test Types**:
- **Component Tests**: Test React components with React Testing Library
- **Unit Tests**: Test services, utilities, and hooks

**Run Tests**:
```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test -- LoginPage.test.tsx

# Run tests matching pattern
npm test -- Login

# Run with coverage
npm test -- --coverage
```

### Test Coverage

**Target Coverage**:
- Overall: 80%+
- Critical paths: 90%+
- Domain layer: 95%+

**View Coverage Report**:
```bash
# Backend
cd backend
npm test -- --coverage
open coverage/lcov-report/index.html

# Frontend
cd frontend
npm test -- --coverage
open coverage/index.html
```

---

## Deployment

### Production Deployment (AWS EC2 with Let's Encrypt SSL)

**Prerequisites**:
- AWS EC2 instance (t3.medium or higher)
- Domain name (required for Let's Encrypt SSL)
- Elastic IP allocated and associated
- Security Group configured (ports 22, 80, 443)

**Deployment Steps**:

1. **Connect to EC2**:
```bash
ssh -i your-key.pem ubuntu@<your-elastic-ip>
```

2. **Install Docker**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker
```

3. **Clone repository**:
```bash
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify
```

4. **Configure environment**:
```bash
# Create .env.production
nano .env.production

# Add production configuration (see Environment Configuration)
# IMPORTANT: Replace yourdomain.com with your actual domain
```

5. **Generate secrets**:
```bash
# Generate JWT secrets
openssl rand -base64 32  # Copy to JWT_ACCESS_SECRET
openssl rand -base64 32  # Copy to JWT_REFRESH_SECRET
openssl rand -base64 24  # Copy to DB_PASSWORD
```

6. **Build and start services**:
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

7. **Install Certbot and generate SSL certificate**:
```bash
# Stop Nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Generate SSL certificate (automatically configures Nginx)
sudo certbot --nginx -d yourdomain.com

# Restart Nginx with SSL
docker-compose -f docker-compose.prod.yml start nginx

# Set up auto-renewal (certificates expire every 90 days)
echo "0 0 * * * certbot renew --quiet" | sudo crontab -

# Test auto-renewal
sudo certbot renew --dry-run
```

8. **Run database migrations**:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

9. **Verify deployment**:
```bash
# Check health endpoint
curl https://yourdomain.com/health

# Check Docker containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Access URLs** (replace with your domain):
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`
- Health Check: `https://yourdomain.com/health`

### CI/CD Pipeline

**GitHub Actions Workflow**:
- Automated testing on every push
- Build Docker images on main branch
- Push images to GitHub Container Registry
- Deploy to production server

**Setup GitHub Secrets**:
```
PROD_HOST: EC2 Elastic IP
PROD_USER: ubuntu
PROD_SSH_KEY: Private SSH key
```

### Monitoring & Logging

**View Logs**:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Error logs only
docker-compose -f docker-compose.prod.yml logs -f backend | grep ERROR
```

**Health Check**:
```bash
curl https://yourdomain.com/health
```

**Error Tracking** (Optional):
- Configure Sentry DSN in `.env.production`
- Automatic error reporting and alerting

### Backup & Recovery

**Database Backups**:
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U lms_user lms_prod > backup.sql

# Automated daily backups (cron job)
0 2 * * * docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U lms_user lms_prod | gzip > /backups/lms_$(date +\%Y\%m\%d).sql.gz
```

**Restore from Backup**:
```bash
gunzip < /backups/lms_20250113.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U lms_user lms_prod
```

**File Storage Backups**:
- Local storage: Include `/app/uploads` in server backups
- Retention: 7 days (daily), 4 weeks (weekly), 12 months (monthly)

For complete deployment documentation, see `.kiro/steering/deployment-workflow.md`.

---

## Scripts

### Backend Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Type-check and build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration  # Run integration tests
npm run test:property     # Run property-based tests
npm test -- --coverage    # Run tests with coverage

# Database
npx prisma migrate dev       # Create and apply migration (development)
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Open Prisma Studio (database GUI)
npx prisma generate          # Generate Prisma Client
```

### Frontend Scripts

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Type-check and build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm test             # Run all tests
npm test -- --coverage    # Run tests with coverage
```

### Docker Scripts

```bash
# Development
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f            # View logs (all services)
docker-compose logs -f backend    # View backend logs
docker-compose restart backend    # Restart backend service
docker-compose up -d --build      # Rebuild and start

# Production
docker-compose -f docker-compose.prod.yml up -d           # Start production
docker-compose -f docker-compose.prod.yml down            # Stop production
docker-compose -f docker-compose.prod.yml logs -f backend # View logs
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy  # Run migrations

# Database Access
docker-compose exec postgres psql -U lms_user -d lms_dev  # Access database
docker-compose exec backend npx prisma studio              # Open Prisma Studio
```

---

## Contributing

### Development Workflow

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**:
```bash
git add .
git commit -m "feat: add your feature description"
```

3. **Run tests**:
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

4. **Push and create pull request**:
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: Consistent style enforced by ESLint
- **Testing**: All features must have tests

### Pull Request Guidelines

- Ensure all tests pass
- Update documentation if needed
- Follow code style guidelines
- Write clear commit messages
- Reference related issues

---

## Project Structure

For detailed project structure, see `.kiro/steering/structure.md`.

**Key Directories**:
```
.
├── backend/              # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── domain/      # Domain Layer (business logic)
│   │   ├── application/ # Application Layer (use cases)
│   │   ├── infrastructure/ # Infrastructure Layer
│   │   └── presentation/ # Presentation Layer (API)
│   ├── prisma/          # Database schema and migrations
│   └── uploads/         # File uploads (gitignored)
│
├── frontend/            # Frontend SPA (React 19.2 + TypeScript + Vite)
│   ├── src/
│   │   └── presentation/web/    # React components and UI
│   └── dist/            # Build output (gitignored)
│
├── .kiro/              # Kiro specs and configuration
│   ├── specs/          # Feature specifications
│   └── steering/       # Project guidelines
│
├── docker-compose.yml       # Docker Compose (development)
├── docker-compose.prod.yml  # Docker Compose (production)
└── nginx.conf              # Nginx configuration
```

---

## Documentation

### Additional Documentation

- **API Standards**: `.kiro/steering/api-standards.md`
- **Security Policies**: `.kiro/steering/security-policies.md`
- **Testing Strategy**: `.kiro/steering/testing-strategy.md`
- **Error Handling**: `.kiro/steering/error-handling.md`
- **Deployment Workflow**: `.kiro/steering/deployment-workflow.md`
- **UI Design Guidelines**: `.kiro/steering/ui-design-guidelines.md`
- **Project Structure**: `.kiro/steering/structure.md`
- **Technology Stack**: `.kiro/steering/tech.md`
- **Product Overview**: `.kiro/steering/product.md`

### Specifications

- **Requirements**: `.kiro/specs/core-lms/requirements.md`
- **Design**: `.kiro/specs/core-lms/design.md`
- **Tasks**: `.kiro/specs/core-lms/tasks.md`

---

## Troubleshooting

### Common Issues

**Issue: Docker containers won't start**
```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs

# Clean rebuild
docker-compose down -v
docker-compose up -d --build
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Issue: Prisma Client not generated**
```bash
# Generate Prisma Client
cd backend
npx prisma generate

# Or in Docker
docker-compose exec backend npx prisma generate
```

**Issue: Port already in use**
```bash
# Find process using port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

**Issue: Tests failing**
```bash
# Clear test database
$env:DATABASE_URL="postgresql://lms_test_user:test_password@localhost:5433/lms_test"
npx prisma migrate reset

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

---

## Support

For issues, questions, or contributions:
- **GitHub Issues**: https://github.com/JoelSiahaan/Specify/issues
- **Email**: joel.siahaan@example.com

---

## License

ISC

## Author

Joel Siahaan
