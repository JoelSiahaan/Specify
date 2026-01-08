# Technology Stack

## Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **Package Manager**: npm (required)

## Backend (Planned)
- **ORM**: Prisma
- **Database**: PostgreSQL

## Code Quality
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins
- **TypeScript**: Strict mode enabled with ES2022 target

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
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
