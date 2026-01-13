# Technology Stack

## Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **Package Manager**: npm (required)
- **HTML Sanitization**: DOMPurify (client-side XSS prevention)

## Backend
- **Runtime**: Node.js with Express
- **API Style**: REST API
- **Architecture**: Clean Architecture with DDD principles
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **Password Hashing**: BCrypt (industry standard)
- **ORM**: Prisma (PostgreSQL)
- **Database**: PostgreSQL
- **File Storage**: Local filesystem (initial deployment) or cloud storage (S3, etc.)
- **File Upload**: Multer (Express middleware for multipart/form-data)
- **Dependency Injection**: TSyringe (TypeScript-first, decorator-based)
- **Validation**: Zod (TypeScript type inference, schema-first validation)
- **HTML Sanitization**: sanitize-html (server-side validation)
- **CORS**: cors package with SameSite=Strict cookies
- **Logging**: Winston (structured logging, multiple transports)

## Testing
- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check ^3.0.0 (minimum 100 iterations per test)
- **API Testing**: Supertest for HTTP endpoint testing
- **Database Testing**: In-memory PostgreSQL or dedicated test database

## Code Quality
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins
- **TypeScript**: Strict mode enabled with ES2022 target

## Security Requirements
- Password hashing (bcrypt or argon2)
- Input validation and sanitization
- Protection against injection attacks
- File type validation before upload
- File size limit enforcement (10MB)
- Secure file access control

## System Requirements
- Error handling and logging
- Database connection retry logic (up to 3 retries)
- Concurrent request handling
- Maintenance mode support
- Database connection validation before requests

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm test             # Run tests
```

## TypeScript Configuration
- Strict mode enabled
- No unused locals/parameters allowed
- JSX mode: react-jsx (automatic runtime)
- Module resolution: bundler mode
- Target: ES2022

## Code Style
- ESLint enforces recommended rules for JS, TypeScript, React Hooks
- React Refresh plugin for fast HMR
- Strict TypeScript checking with no-fallthrough and no-unchecked-side-effects
