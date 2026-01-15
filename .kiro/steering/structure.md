# Project Structure

The LMS follows Clean Architecture with four distinct layers: Domain (core business logic), Application (use cases), Infrastructure (external concerns), and Presentation (API and UI).

## Root Configuration
- `package.json` - Dependencies and npm scripts
- `vite.config.ts` - Vite build configuration (frontend)
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node/build tooling TypeScript config
- `eslint.config.js` - ESLint configuration
- `index.html` - Entry HTML file (frontend)
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment variable template

## Source Code (`src/`)

### Domain Layer (`src/domain/`)
Core business logic, framework-independent. No dependencies on outer layers.

```
src/domain/
├── entities/              # Domain Entities (rich objects with business logic)
│   ├── Course.ts         # Course lifecycle, validation, business rules
│   ├── Assignment.ts     # Due date logic, submission rules, grading state
│   ├── Quiz.ts           # Time limit logic, question management
│   ├── Submission.ts     # Submission state, late submission logic
│   ├── Enrollment.ts     # Enrollment validation
│   └── User.ts           # User identity and role management
├── value-objects/        # Value Objects (immutable domain concepts)
│   ├── CourseCode.ts     # Unique course identifier with validation
│   ├── Email.ts          # Email address with validation
│   ├── Grade.ts          # Grade value (0-100) with validation
│   └── TimeLimit.ts      # Quiz time limit with validation
├── services/             # Domain Services (operations spanning multiple entities)
│   ├── CourseCodeGenerator.ts  # Generate unique course codes
│   ├── GradingPolicy.ts        # Grading business rules
│   └── QuizTimingService.ts    # Quiz timer calculations
├── repositories/         # Repository Interfaces (Ports - contracts for data access)
│   ├── ICourseRepository.ts
│   ├── IAssignmentRepository.ts
│   ├── IQuizRepository.ts
│   ├── ISubmissionRepository.ts
│   ├── IEnrollmentRepository.ts
│   └── IUserRepository.ts
├── storage/              # Storage Interfaces (Ports - contracts for file storage)
│   └── IFileStorage.ts
├── events/               # Domain Events (business occurrences - future enhancement)
│   ├── CourseEvents.ts
│   ├── AssignmentEvents.ts
│   └── QuizEvents.ts
└── errors/               # Domain Errors (business rule violations)
    └── DomainErrors.ts
```

### Application Layer (`src/application/`)
Use cases and application logic. Orchestrates domain entities and repositories.

```
src/application/
├── use-cases/            # Use Cases (single-purpose application operations)
│   ├── course/
│   │   ├── CreateCourseUseCase.ts
│   │   ├── UpdateCourseUseCase.ts
│   │   ├── ArchiveCourseUseCase.ts
│   │   ├── DeleteCourseUseCase.ts
│   │   └── GetCourseUseCase.ts
│   ├── enrollment/
│   │   ├── EnrollStudentUseCase.ts
│   │   └── BulkUnenrollUseCase.ts
│   ├── assignment/
│   │   ├── CreateAssignmentUseCase.ts
│   │   ├── SubmitAssignmentUseCase.ts
│   │   └── ListSubmissionsUseCase.ts
│   ├── quiz/
│   │   ├── CreateQuizUseCase.ts
│   │   ├── StartQuizUseCase.ts
│   │   └── SubmitQuizUseCase.ts
│   └── grading/
│       ├── GradeSubmissionUseCase.ts
│       └── ExportGradesUseCase.ts
├── dtos/                 # Data Transfer Objects (input/output data structures)
│   ├── CourseDTO.ts
│   ├── AssignmentDTO.ts
│   ├── QuizDTO.ts
│   └── SubmissionDTO.ts
├── mappers/              # Entity ↔ DTO Mappers (bidirectional conversion)
│   ├── CourseMapper.ts
│   ├── AssignmentMapper.ts
│   └── SubmissionMapper.ts
├── policies/             # Authorization Policies (access control rules)
│   ├── IAuthorizationPolicy.ts
│   └── AuthorizationPolicy.ts
```

### Infrastructure Layer (`src/infrastructure/`)
External concerns and framework-specific implementations. Implements domain interfaces.

```
src/infrastructure/
├── persistence/          # Database Implementation
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema definition
│   │   └── migrations/        # Database migrations
│   └── repositories/          # Repository Implementations (Adapters)
│       ├── PrismaCourseRepository.ts
│       ├── PrismaAssignmentRepository.ts
│       ├── PrismaQuizRepository.ts
│       ├── PrismaSubmissionRepository.ts
│       ├── PrismaEnrollmentRepository.ts
│       └── PrismaUserRepository.ts
├── storage/              # File Storage Implementation
│   ├── LocalFileStorage.ts    # Local filesystem storage (initial deployment)
│   └── S3FileStorage.ts       # AWS S3 storage (future)
├── auth/                 # Authentication Services
│   ├── JWTService.ts          # JWT token generation/validation
│   └── PasswordService.ts     # BCrypt password hashing
└── di/                   # Dependency Injection
    └── container.ts           # TSyringe container configuration
```

### Presentation Layer (`src/presentation/`)
User interface and HTTP communication. Thin layer delegating to application layer.

```
src/presentation/
├── api/                  # REST API (Backend)
│   ├── controllers/      # HTTP Controllers (thin request handlers)
│   │   ├── AuthController.ts
│   │   ├── CourseController.ts
│   │   ├── AssignmentController.ts
│   │   ├── QuizController.ts
│   │   └── GradingController.ts
│   ├── middleware/       # HTTP Middleware
│   │   ├── AuthenticationMiddleware.ts  # JWT validation
│   │   ├── ErrorHandlerMiddleware.ts    # Centralized error handling
│   │   └── ValidationMiddleware.ts      # Request validation
│   ├── routes/           # Route Definitions
│   │   └── index.ts      # Express router configuration
│   └── validators/       # Request Validators
│       └── schemas.ts    # Zod validation schemas
└── web/                  # React Frontend (SPA)
    ├── components/       # React Components
    │   ├── auth/         # Authentication views
    │   │   ├── LoginPage.tsx
    │   │   └── RegisterPage.tsx
    │   ├── dashboard/    # Role-specific dashboards
    │   │   ├── StudentDashboard.tsx
    │   │   └── TeacherDashboard.tsx
    │   ├── course/       # Course management
    │   │   ├── CourseList.tsx
    │   │   ├── CourseDetails.tsx
    │   │   └── CreateCourse.tsx
    │   ├── material/     # Material views
    │   │   ├── MaterialList.tsx
    │   │   └── MaterialViewer.tsx
    │   ├── assignment/   # Assignment views
    │   │   ├── AssignmentList.tsx
    │   │   ├── AssignmentDetails.tsx
    │   │   └── SubmitAssignment.tsx
    │   ├── quiz/         # Quiz views
    │   │   ├── QuizList.tsx
    │   │   ├── TakeQuiz.tsx
    │   │   └── QuizResults.tsx
    │   ├── grading/      # Grading interfaces
    │   │   ├── SubmissionList.tsx
    │   │   └── GradeSubmission.tsx
    │   └── shared/       # Reusable UI components
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       └── Modal.tsx
    ├── hooks/            # Custom React hooks
    │   ├── useAuth.ts
    │   └── useCourse.ts
    ├── services/         # API client services
    │   └── api.ts        # Axios/fetch wrapper
    ├── App.tsx           # Main application component
    ├── App.css           # App-specific styles
    ├── main.tsx          # Application entry point
    └── index.css         # Global styles
```

## Testing Structure (`src/**/__tests__/`)

Tests are co-located with source code in `__tests__` directories.

```
src/
├── domain/
│   ├── entities/
│   │   └── __tests__/
│   │       ├── Course.test.ts              # Unit tests
│   │       └── Course.properties.test.ts   # Property-based tests
│   └── services/
│       └── __tests__/
│           └── CourseCodeGenerator.test.ts
├── application/
│   └── use-cases/
│       └── course/
│           └── __tests__/
│               └── CreateCourseUseCase.test.ts  # Use case tests with mocks
├── infrastructure/
│   └── persistence/
│       └── repositories/
│           └── __tests__/
│               └── PrismaCourseRepository.test.ts  # Integration tests
└── presentation/
    ├── api/
    │   └── controllers/
    │       └── __tests__/
    │           └── CourseController.test.ts  # API integration tests
    └── web/
        └── components/
            └── __tests__/
                └── LoginPage.test.tsx  # Component tests
```

## Public Assets (`public/`)
Static files served directly (e.g., `vite.svg`, favicon)

## Build Output
- `dist/` - Production build output (gitignored)
- `node_modules/` - Dependencies (gitignored)
- `uploads/` - Uploaded files (gitignored, local storage only)

## Configuration Files
- `.gitignore` - Git ignore patterns
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment variable template
- `prisma/schema.prisma` - Database schema
- `jest.config.js` - Jest testing configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `vite.config.ts` - Vite build configuration

## Conventions

### General
- TypeScript strict mode enabled
- ES2022 target for modern JavaScript features
- Module resolution: bundler mode

### Backend (API)
- Controllers are thin, delegate to use cases
- Use cases contain business logic orchestration
- Domain entities contain business rules
- Repository pattern for data access
- Dependency injection with TSyringe
- JWT authentication with HTTP-only cookies

### Frontend (React)
- React components use `.tsx` extension
- Functional components with hooks (modern React patterns)
- StrictMode enabled in production
- Component files typically export default
- Custom hooks for reusable logic
- API client services for backend communication

### Testing
- Unit tests: `*.test.ts` (specific examples, edge cases)
- Property tests: `*.properties.test.ts` (universal properties, 100+ iterations)
- Integration tests: `*.integration.test.ts` (database, API endpoints)
- Tests co-located with source code in `__tests__` directories
- Jest with React Testing Library for frontend
- fast-check for property-based testing
- Supertest for API testing

### File Naming
- PascalCase for classes and components: `Course.ts`, `LoginPage.tsx`
- camelCase for functions and variables: `createCourse()`, `userId`
- kebab-case for CSS files: `app-styles.css`
- UPPER_SNAKE_CASE for constants: `MAX_FILE_SIZE`

### Clean Architecture Rules
- Dependencies point inward (outer layers depend on inner layers)
- Domain layer is framework-independent (no Prisma, Express, React)
- Infrastructure implements domain interfaces (Dependency Inversion)
- Use cases orchestrate domain entities and repositories
- Controllers delegate to use cases (thin presentation layer)
