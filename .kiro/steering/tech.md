# Technology Stack

## Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **Package Manager**: npm (required)
- **CSS Framework**: Tailwind CSS (utility-first CSS framework)
- **HTML Sanitization**: DOMPurify (client-side XSS prevention)

## Backend
- **Runtime**: Node.js 18.20.5 LTS with Express
- **Language**: TypeScript (strict mode enabled)
- **API Style**: REST API
- **Architecture**: Clean Architecture with DDD principles
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **Password Hashing**: BCrypt (industry standard)
- **ORM**: Prisma (PostgreSQL)
- **Database**: PostgreSQL 15
- **File Storage**: Local filesystem (production deployment)
- **File Upload**: Multer (Express middleware for multipart/form-data)
- **Dependency Injection**: TSyringe (TypeScript-first, decorator-based)
- **Validation**: Zod (TypeScript type inference, schema-first validation)
- **HTML Sanitization**: sanitize-html (server-side validation)
- **CORS**: cors package with SameSite=Strict cookies
- **Logging**: Winston (structured logging, multiple transports)

## Infrastructure & Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (single server deployment)
- **Reverse Proxy**: Nginx 1.27 (Alpine)
- **SSL/TLS**: Let's Encrypt (Certbot)
- **Operating System**: Ubuntu 22.04 LTS (server)
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Server Specs**: 2-4 cores, 4-8 GB RAM, 50-100 GB SSD
- **Hosting**: DigitalOcean, Linode, or Hetzner (recommended)

## Testing
- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check ^3.0.0 (minimum 100 iterations per test)
- **API Testing**: Supertest for HTTP endpoint testing
- **Database Testing**: In-memory PostgreSQL or dedicated test database

## Monitoring & Observability
- **Logging**: Winston (structured JSON logging)
- **Error Tracking**: Sentry (optional, free tier available)
- **Health Checks**: Built-in health check endpoints
- **Log Aggregation**: Docker logs (docker-compose logs)

## Security & Compliance
- **SSL/TLS**: Let's Encrypt (TLS 1.2+)
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Rate Limiting**: Nginx rate limiting (10 req/s API, 5 req/m auth)
- **Password Hashing**: BCrypt (10 salt rounds)
- **Input Validation**: Zod schemas at presentation layer
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Prevention**: DOMPurify (client) + sanitize-html (server)
- **CSRF Protection**: SameSite=Strict cookies
- **File Upload Security**: Type validation, size limits (10MB), content validation

## Code Quality
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins
- **TypeScript**: Strict mode enabled with ES2022 target
- **Code Formatting**: Consistent style enforced by ESLint

## Backup & Recovery
- **Database Backups**: Automated daily backups with pg_dump
- **Backup Retention**: 7 days (daily), 4 weeks (weekly), 12 months (monthly)
- **File Storage Backups**: Server-level backups for local filesystem
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

## Scalability Strategy
- **Current Scale**: 50+ concurrent users
- **Vertical Scaling**: Primary strategy (upgrade server specs)
- **Horizontal Scaling**: Future enhancement (> 200 users)
- **Database Connection Pooling**: Prisma with 10 connections max
- **Caching**: Future enhancement (Redis for session storage)

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

## Version Specifications

### Node.js & npm
- **Node.js**: 18.20.5 LTS (Alpine for Docker)
- **npm**: Latest version bundled with Node.js
- **Package Manager**: npm (required, no yarn or pnpm)

### Docker Images
- **Node.js Base**: `node:18.20.5-alpine`
- **Nginx**: `nginx:1.27-alpine`
- **PostgreSQL**: `postgres:15-alpine`

### Key Dependencies (Backend)
- **Express**: Latest stable
- **Prisma**: Latest stable
- **TypeScript**: Latest stable
- **TSyringe**: Latest stable
- **Zod**: Latest stable
- **Winston**: Latest stable
- **BCrypt**: Latest stable
- **jsonwebtoken**: Latest stable

### Key Dependencies (Frontend)
- **React**: 19.2
- **Vite**: 7.2
- **TypeScript**: Latest stable
- **Tailwind CSS**: Latest stable
- **React Testing Library**: Latest stable
- **DOMPurify**: Latest stable

### Testing Dependencies
- **Jest**: Latest stable
- **fast-check**: ^3.0.0
- **Supertest**: Latest stable

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm test             # Run tests
```

### Docker (Development)
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend sh    # Shell into backend container
docker-compose exec postgres psql -U lms_user -d lms_dev  # Access database
```

### Docker (Production)
```bash
docker-compose -f docker-compose.prod.yml up -d           # Start production
docker-compose -f docker-compose.prod.yml down            # Stop production
docker-compose -f docker-compose.prod.yml logs -f backend # View logs
docker-compose exec backend npx prisma migrate deploy     # Run migrations
```

### Database Management
```bash
npx prisma migrate dev           # Create and apply migration (dev)
npx prisma migrate deploy        # Apply migrations (production)
npx prisma studio                # Open Prisma Studio (database GUI)
npx prisma generate              # Generate Prisma Client
```

### SSL Certificate Management
```bash
sudo certbot certonly --standalone -d your-domain.com  # Generate certificate
sudo certbot renew                                     # Renew certificate
sudo certbot certificates                              # List certificates
```

## TypeScript Configuration
- Strict mode enabled
- No unused locals/parameters allowed
- JSX mode: react-jsx (automatic runtime)
- Module resolution: bundler mode
- Target: ES2022

## Production Environment

### Server Requirements
- **Operating System**: Ubuntu 22.04 LTS
- **CPU**: 2-4 cores (minimum)
- **RAM**: 4-8 GB (minimum)
- **Storage**: 50-100 GB SSD
- **Network**: 100 Mbps
- **Estimated Cost**: $20-40/month

### Recommended Hosting Providers
- **DigitalOcean**: Droplets with managed backups
- **Linode**: Compute instances with block storage
- **Hetzner**: Cloud servers (cost-effective)

### Network Configuration
- **Ports**: 80 (HTTP), 443 (HTTPS), 22 (SSH)
- **Firewall**: UFW or cloud provider firewall
- **DNS**: A record pointing to server IP
- **SSL**: Let's Encrypt with auto-renewal

### Environment Variables (Production)
```bash
# Required
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
DB_PASSWORD=<secure password>
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Optional
SENTRY_DSN=<sentry dsn>
LOG_LEVEL=info
```

## Development Environment

### Local Development Requirements
- **Node.js**: 18.20.5 LTS
- **Docker**: Latest stable
- **Docker Compose**: Latest stable
- **Git**: Latest stable
- **Code Editor**: VS Code (recommended)

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Prisma
- Docker
- GitLens

## Repository Information
- **GitHub**: https://github.com/JoelSiahaan/Specify
- **Branch Strategy**: main (production), develop (development)
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)

## Code Style
- ESLint enforces recommended rules for JS, TypeScript, React Hooks
- React Refresh plugin for fast HMR
- Strict TypeScript checking with no-fallthrough and no-unchecked-side-effects
