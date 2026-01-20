# Learning Management System (LMS)

This application allows students to access learning materials and complete quizzes, while teachers can upload course materials and create and manage quizzes.  
The system uses **Prisma ORM** to interact with the database and **PostgreSQL** as the database management system.  
The frontend is built using **React (Vite)** for fast development and optimized performance.

We will be using **npm**.

## Features

### Authentication & Authorization
- User registration and login
- Role-based access control (Student / Teacher)
- Secure authentication using JWT

### Student Features
- View and download learning materials
- Access course content by subject or class
- Take quizzes and submit answers
- View quiz results and scores
- Track quiz completion history

### Teacher Features
- Upload, update, and delete learning materials
- Create, edit, and delete quizzes
- Manage quiz questions and answers
- Set quiz availability and time limits
- View student submissions and scores

### Quiz Management
- Multiple-choice quizzes
- Automatic grading
- Score calculation and result storage
- Quiz attempt tracking

### Backend & Database
- PostgreSQL database
- Prisma ORM for database modeling and queries
- Relational data management (Users, Courses, Materials, Quizzes, Results)

### Frontend
- React with Vite
- Component-based UI
- Responsive design
- API integration with backend services

### Additional Features
- Error handling and validation
- Loading and empty-state handling
- Clean and modular project structure

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

## Technology Stack

### Backend
- **Runtime**: Node.js 18.20.5 LTS
- **Framework**: Express
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: BCrypt
- **Validation**: Zod
- **Dependency Injection**: TSyringe
- **Logging**: Winston
- **Testing**: Jest, fast-check (property-based testing), Supertest

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS (to be configured)
- **Routing**: React Router (to be configured)
- **HTTP Client**: Axios
- **HTML Sanitization**: DOMPurify
- **Testing**: React Testing Library

## Getting Started

### Prerequisites

**For Docker Development (Recommended)**:
- Docker 20.10+ and Docker Compose 2.0+
- Git

**For Local Development (Alternative)**:
- Node.js 18.20.5 LTS
- npm (comes with Node.js)
- PostgreSQL 15

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Development with Docker (Recommended)

**Prerequisites**: 
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Start Docker Desktop (pastikan icon Docker di system tray berwarna hijau)

**Quick Start**:
```bash
# 1. File .env sudah tersedia, langsung start services
docker-compose up -d

# 2. Tunggu ~30 detik, lalu run migrations
docker-compose exec backend npx prisma migrate dev --name init

# 3. Akses aplikasi
# Frontend: http://localhost:5173
# Backend: http://localhost:3000/health
```

**Common Commands**:
```bash
# Lihat logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart service tertentu
docker-compose restart backend
docker-compose restart frontend

# Rebuild jika ada perubahan dependencies
docker-compose up -d --build
```

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

## Scripts

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## License

ISC

## Author

Joel Siahaan
