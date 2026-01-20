# LMS Backend

Learning Management System Backend API built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime**: Node.js 18.20.5 LTS
- **Framework**: Express
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod
- **Testing**: Jest, fast-check, Supertest
- **DI**: TSyringe

## Project Structure

```
src/
├── domain/              # Domain Layer (business logic)
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Value objects
│   ├── services/        # Domain services
│   ├── repositories/    # Repository interfaces
│   ├── storage/         # Storage interfaces
│   └── errors/          # Domain errors
├── application/         # Application Layer (use cases)
│   ├── use-cases/       # Use cases
│   ├── dtos/            # Data transfer objects
│   ├── mappers/         # Entity ↔ DTO mappers
│   └── policies/        # Authorization policies
├── infrastructure/      # Infrastructure Layer (external concerns)
│   ├── persistence/     # Database implementation
│   ├── storage/         # File storage implementation
│   ├── auth/            # Authentication services
│   └── di/              # Dependency injection
└── presentation/        # Presentation Layer (API)
    └── api/             # REST API
        ├── controllers/ # HTTP controllers
        ├── middleware/  # HTTP middleware
        ├── routes/      # Route definitions
        └── validators/  # Request validators
```

## Getting Started

### Prerequisites

- Node.js 18.20.5 LTS
- PostgreSQL 15
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Development

```bash
# Start development server with hot reload
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

# Start production server
npm start
```

## Scripts

- `dev` - Start development server with hot reload
- `build` - Build TypeScript to JavaScript
- `start` - Start production server
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint issues
- `type-check` - Run TypeScript type checking
- `test` - Run tests
- `test:watch` - Run tests in watch mode
- `test:coverage` - Run tests with coverage

## Architecture

This project follows Clean Architecture principles with four distinct layers:

1. **Domain Layer**: Core business logic, framework-independent
2. **Application Layer**: Use cases and application logic
3. **Infrastructure Layer**: External concerns (database, file storage)
4. **Presentation Layer**: API controllers and UI

Dependencies flow inward: Presentation → Application → Domain

## Testing

- **Unit Tests**: Test domain entities and use cases
- **Property-Based Tests**: Test universal properties with fast-check
- **Integration Tests**: Test API endpoints with Supertest
- **Minimum 100 iterations** for property-based tests

## License

MIT
