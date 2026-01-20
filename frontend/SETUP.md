# Frontend Setup Documentation

## Overview

The LMS frontend is built with React 19.2, TypeScript, and Vite. This document describes the project structure and setup completed in Task 1.7.

## Technology Stack

- **React**: 19.2.3 (latest)
- **TypeScript**: 5.9.3 (strict mode)
- **Vite**: 7.3.1 (build tool)
- **React Router**: 7.1.3 (navigation)
- **Axios**: 1.7.9 (API client)
- **Tailwind CSS**: 3.4.17 (styling)
- **Vitest**: 3.0.8 (testing)
- **React Testing Library**: 16.1.0 (component testing)

## Project Structure

```
frontend/src/
├── presentation/web/          # Presentation layer (Clean Architecture)
│   ├── components/
│   │   ├── layout/           # Layout components (MainLayout)
│   │   └── shared/           # Reusable UI components (Button, Input, Spinner)
│   ├── pages/                # Page components (HomePage, NotFoundPage)
│   ├── constants/            # App constants
│   │   ├── routes.ts         # Route definitions
│   │   ├── apiEndpoints.ts   # API endpoint URLs
│   │   └── config.ts         # App configuration
│   ├── types/                # TypeScript types
│   │   ├── common.types.ts   # Shared types (enums, interfaces)
│   │   └── user.types.ts     # User-related types
│   ├── services/             # API services
│   │   ├── api.ts            # Axios client configuration
│   │   └── authService.ts    # Authentication API calls
│   └── utils/                # Helper functions
│       ├── dateFormatter.ts  # Date formatting utilities
│       └── fileValidator.ts  # File validation utilities
├── test/                     # Test utilities
├── App.tsx                   # Root component with React Router
├── main.tsx                  # Application entry point
└── index.css                 # Global styles (Tailwind directives)
```

## Key Features Implemented

### 1. React Router Setup

- Configured React Router with `BrowserRouter`
- Created route constants in `constants/routes.ts`
- Implemented `MainLayout` wrapper component
- Added placeholder routes for authentication pages
- Created 404 Not Found page

**Example Usage:**
```typescript
import { ROUTES, buildRoute } from './constants';

// Navigate to a route
<Link to={ROUTES.HOME}>Home</Link>

// Build route with parameters
const courseUrl = buildRoute(ROUTES.STUDENT_COURSE_DETAILS, { courseId: '123' });
```

### 2. API Client Configuration

- Configured Axios with base URL and timeout
- Implemented request/response interceptors
- Added automatic 401 redirect to login
- Configured HTTP-only cookie support (`withCredentials: true`)
- Created typed API methods (get, post, put, delete)

**Example Usage:**
```typescript
import { api } from './services';

// GET request
const courses = await api.get<Course[]>('/api/courses');

// POST request
const newCourse = await api.post<Course>('/api/courses', courseData);
```

### 3. Authentication Service

- Created `authService` with typed methods
- Implemented login, register, logout, refresh, getCurrentUser
- Uses API endpoints from constants

**Example Usage:**
```typescript
import { authService } from './services';

// Login
const response = await authService.login({ email, password });

// Get current user
const user = await authService.getCurrentUser();
```

### 4. Constants and Configuration

- **Routes**: Centralized route definitions with helper function
- **API Endpoints**: All API URLs in one place
- **Config**: App configuration with environment variables
- File upload limits and allowed types
- Token refresh interval

### 5. TypeScript Types

- Common types (enums, interfaces)
- User types (User, LoginRequest, RegisterRequest)
- API response types (ApiResponse, ApiError, PaginatedResponse)
- Enums for CourseStatus, UserRole, SubmissionStatus, etc.

### 6. Utility Functions

**Date Formatting:**
- `formatDate()` - Format date to readable string
- `formatDateTime()` - Format date with time
- `formatRelativeTime()` - Relative time (e.g., "2 hours ago")
- `formatDueDate()` - Context-aware due date formatting
- `isPastDate()`, `isToday()` - Date checks

**File Validation:**
- `validateFile()` - Validate file type and size
- `validateFileType()` - Check allowed file types
- `validateFileSize()` - Check file size limit (10MB)
- `formatFileSize()` - Format bytes to human-readable
- `isImageFile()`, `isDocumentFile()` - File type checks

### 7. Shared Components

**Button Component:**
- Variants: primary, secondary, success, danger
- Sizes: sm, md, lg
- Disabled state support
- Focus ring for accessibility

**Input Component:**
- Label and error message support
- Required field indicator
- Helper text
- Disabled state
- Multiple input types

**Spinner Component:**
- Loading indicator
- Sizes: sm, md, lg
- Accessible with ARIA labels

### 8. Tailwind CSS Configuration

- Custom primary colors (Moodle-inspired):
  - Primary: `#0f6cbf`
  - Primary Dark: `#0a5391`
  - Primary Light: `#3d8fd1`
  - Primary Lighter: `#e3f2fd`
- System font stack
- Responsive design utilities

## Environment Variables

Create `.env` file in frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:5173)

# Build
npm run build        # Type-check and build for production
npm run preview      # Preview production build

# Testing
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript type checking
```

## Development Workflow

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

2. **Run Tests:**
   ```bash
   npm test
   ```

3. **Type Check:**
   ```bash
   npm run type-check
   ```

4. **Lint Code:**
   ```bash
   npm run lint
   ```

## API Integration

The frontend is configured to proxy API requests to the backend:

- Development: `http://localhost:3000` (configurable via `VITE_API_URL`)
- Vite proxy configured in `vite.config.ts`
- All API calls use `/api` prefix
- Cookies sent automatically with `withCredentials: true`

## Testing

- **Framework**: Vitest + React Testing Library
- **Test Files**: `*.test.tsx` or `*.test.ts`
- **Location**: Co-located with source files in `__tests__` directories
- **Coverage**: Run `npm run test:coverage`

**Example Test:**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

## Next Steps

The following features will be implemented in subsequent tasks:

1. **Task 2.5**: Authentication UI (Login, Register pages)
2. **Task 3.5**: Course Management UI
3. **Task 4.5**: Enrollment UI
4. **Task 5.5**: Material Management UI
5. **Task 6.5**: Assignment UI
6. **Task 7.5**: Quiz UI
7. **Task 8.5**: Grading UI
8. **Task 9.5**: Progress & Export UI

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.ts
server: {
  port: 5174
}
```

### Module Not Found

If you see module not found errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Type Errors

If TypeScript shows errors:
```bash
# Rebuild TypeScript
npm run type-check
```

## References

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vitest Documentation](https://vitest.dev/)
