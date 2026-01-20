# LMS Frontend

Learning Management System Frontend built with React 19.2, TypeScript, and Vite.

## Tech Stack

- **Framework**: React 19.2
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite 7.2
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Testing**: Vitest, React Testing Library
- **Sanitization**: DOMPurify

## Project Structure

```
src/
├── presentation/
│   └── web/
│       ├── components/      # React components
│       │   ├── auth/        # Authentication pages
│       │   ├── dashboard/   # Dashboard pages
│       │   ├── course/      # Course pages
│       │   ├── material/    # Material pages
│       │   ├── assignment/  # Assignment pages
│       │   ├── quiz/        # Quiz pages
│       │   ├── grading/     # Grading pages
│       │   ├── layout/      # Layout components
│       │   └── shared/      # Reusable UI components
│       ├── hooks/           # Custom React hooks
│       ├── contexts/        # React Context API
│       ├── services/        # API client services
│       ├── utils/           # Helper functions
│       ├── types/           # TypeScript types
│       ├── constants/       # Constants
│       ├── App.tsx          # Main app component
│       ├── main.tsx         # Entry point
│       └── index.css        # Global styles
└── assets/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18.20.5 LTS
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Scripts

- `dev` - Start development server with hot reload
- `build` - Build for production
- `preview` - Preview production build
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint issues
- `type-check` - Run TypeScript type checking
- `test` - Run tests
- `test:watch` - Run tests in watch mode
- `test:coverage` - Run tests with coverage

## Features

- **Authentication**: Login, register, logout
- **Role-Based UI**: Student and teacher dashboards
- **Course Management**: Create, update, archive, delete courses
- **Materials**: Upload files, add text content, video links
- **Assignments**: Create assignments, submit work
- **Quizzes**: Timed quizzes with multiple question types
- **Grading**: Grade submissions, provide feedback
- **Progress Tracking**: View grades and progress

## Design System

- **Colors**: Moodle-inspired blue theme
- **Typography**: System font stack
- **Layout**: Two-column layout with sidebar
- **Components**: Card-based design
- **Responsive**: Desktop-first approach

## Testing

- **Component Tests**: Test React components with React Testing Library
- **Unit Tests**: Test utility functions and helpers
- **Integration Tests**: Test API integration

## License

MIT
