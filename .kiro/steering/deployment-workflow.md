# Deployment Workflow - AWS EC2 (IP-Only)

## Purpose

This document defines the deployment strategy and infrastructure setup for the production-grade LMS on **AWS EC2 using IP address only (no custom domain)**. The deployment is designed for **50+ concurrent users** with focus on reliability, security, and maintainability without unnecessary complexity.

---

## Scope & Scale

**Target Scale**:
- 50+ concurrent users
- API response time < 500ms
- Single region deployment (AWS)
- Small to medium educational institution

**Production-Grade Principles**:
- ✅ Reliable (99% uptime)
- ✅ Secure (authentication, backups, firewall)
- ✅ Monitored (logging, error tracking)
- ✅ Maintainable (Docker, automated deployment)
- ❌ NOT over-engineered (no Kubernetes, no multi-region, no CDN)
- ⚠️ **HTTP only** (no HTTPS/SSL without domain)

---

## ⚠️ Configuration Checklist (Before Deployment)

**REQUIRED - Must be configured:**
- [ ] **AWS EC2 Instance**: Launch t3.medium with Ubuntu 22.04 LTS
- [ ] **Elastic IP**: Allocate and associate to EC2 (IP tetap)
- [ ] **Security Group**: Configure ports 22 (SSH), 80 (HTTP)
- [ ] **Update nginx.conf**: Remove SSL configuration (HTTP only)
- [ ] **Update .env.production**: Replace domain with EC2 IP address
- [ ] **GitHub Repository**: Already configured → `https://github.com/JoelSiahaan/Specify.git`
- [ ] **File Storage**: Already configured → Local filesystem (`STORAGE_TYPE=local`)
- [ ] **JWT Secrets**: Generate with `openssl rand -base64 32` (2 secrets needed)
- [ ] **Database Password**: Set secure password in `.env.production`

**PENDING DECISIONS - Decide before deployment:**
- [ ] **Sentry Monitoring**: Do you want error tracking? (Optional, free tier available)
  - If YES: Sign up at sentry.io and add `SENTRY_DSN` to `.env.production`
  - If NO: Leave commented out (Winston logging will be used)

**NOT NEEDED - Excluded from IP-only deployment:**
- ❌ **Custom Domain**: Using EC2 IP address directly
- ❌ **Route 53**: No DNS management needed
- ❌ **SSL/HTTPS**: Let's Encrypt requires domain name
- ❌ **Email/SMTP**: Not implemented in initial version
- ❌ **AWS S3**: Using local filesystem instead

---

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Containerization](#containerization)
3. [Reverse Proxy](#reverse-proxy)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Configuration](#environment-configuration)
6. [Database Management](#database-management)
7. [File Storage](#file-storage)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security](#security)
10. [Backup & Recovery](#backup--recovery)
11. [Deployment Procedures](#deployment-procedures)

---

## 1. Deployment Architecture

### AWS EC2 Architecture (IP-Only)

```
                    ┌─────────────────┐
                    │   Users (50+)   │
                    └────────┬────────┘
                             │ HTTP (Port 80)
                    ┌────────▼────────┐
                    │  AWS EC2        │
                    │  Elastic IP:    │
                    │  54.123.45.67   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx (80)     │
                    │  - Static files │
                    │  - Reverse proxy│
                    │  - NO SSL       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend (3000) │
                    │  Express + Node │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐ ┌──▼───────────┐ ┌▼──────────┐
     │   PostgreSQL    │ │ File Storage │ │  (Future) │
     │   (5432)        │ │ Local (EBS)  │ │   Redis   │
     └─────────────────┘ └──────────────┘ └───────────┘
```

### AWS EC2 Single Instance Deployment

**Why AWS EC2?**
- 50 concurrent users easily handled by single EC2 instance
- Elastic IP ensures IP address doesn't change
- Simpler to manage and debug than multi-server setup
- Lower cost than managed services
- Can scale vertically if needed (upgrade instance type)

**AWS EC2 Specifications** (Recommended):
- **Instance Type**: t3.medium or t3a.medium
- **vCPUs**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50-100 GB gp3 EBS
- **Network**: Enhanced networking
- **Cost**: ~$30-35/month (with Reserved Instance discount available)

**Components on Single EC2 Instance**:
- Nginx (reverse proxy + static files) - Port 80
- Node.js backend (Express API) - Port 3000
- PostgreSQL database (Docker container)
- File storage (local EBS volume)
- Docker containers for isolation

**Access URL**:
- Frontend: `http://54.123.45.67` (replace with your Elastic IP)
- Backend API: `http://54.123.45.67/api`
- Health Check: `http://54.123.45.67/health`

---

## 2. Containerization

### Docker Configuration

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
# ========================================
# Optimized Multi-Stage Dockerfile
# Node.js TypeScript Backend
# ========================================

ARG NODE_VERSION=20.19.0-alpine
FROM node:${NODE_VERSION} AS base

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# ========================================
# Dependencies Stage
# ========================================
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies with cache mounting
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev && \
    npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# ========================================
# Build Dependencies Stage
# ========================================
FROM base AS build-deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies with cache mounting
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# ========================================
# Build Stage
# ========================================
FROM build-deps AS build

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build TypeScript
RUN npm run build

# ========================================
# Production Stage
# ========================================
ARG NODE_VERSION=20.19.0-alpine
FROM node:${NODE_VERSION} AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# Set optimized environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512 --no-warnings" \
    NPM_CONFIG_LOGLEVEL=silent

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/package*.json ./
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start production server
CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
# ========================================
# Optimized Multi-Stage Dockerfile
# React TypeScript Frontend
# ========================================

ARG NODE_VERSION=20.19.0-alpine
FROM node:${NODE_VERSION} AS base

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# ========================================
# Dependencies Stage
# ========================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install dependencies with cache mounting
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci && \
    npm cache clean --force

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# ========================================
# Build Stage
# ========================================
FROM deps AS build

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build for production
RUN npm run build

# ========================================
# Production Stage with Nginx
# ========================================
ARG NGINX_VERSION=1.27-alpine
FROM nginx:${NGINX_VERSION} AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose (Production - IP-Only)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: lms-postgres
    restart: on-failure:3
    environment:
      POSTGRES_DB: lms_prod
      POSTGRES_USER: lms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lms_user -d lms_prod"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - lms-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        NODE_VERSION: 20.19.0-alpine
    container_name: lms-backend
    restart: on-failure:3
    environment:
      DATABASE_URL: postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: 3000
      FRONTEND_URL: ${FRONTEND_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads:/app/uploads
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:1.27-alpine
    container_name: lms-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

volumes:
  postgres_data:
  uploads:

networks:
  lms-network:
    driver: bridge
```

#### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lms_dev
      POSTGRES_USER: lms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lms_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_dev
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
      - uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  uploads:
```

---

## 3. Reverse Proxy (HTTP-Only)

### Nginx Configuration (No SSL)

**IMPORTANT**: This configuration is for IP-only deployment without SSL/HTTPS.

```nginx
# nginx.conf (HTTP-Only for IP-based deployment)
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 80;
    server_name _;  # Accept any hostname/IP

    # Security Headers (HTTP-only)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/x-javascript;

    # Frontend (Static Files)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/auth {
        limit_req zone=auth_limit burst=5 nodelay;
        
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend:3000/health;
    }
}
```

**Note**: 
- No HTTPS/SSL configuration (requires domain name)
- No redirect from HTTP to HTTPS
- Security headers adjusted for HTTP-only deployment
- Rate limiting still active for API protection

---

## 4. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: lms_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/lms_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/lms_test
      
      - name: Run property-based tests
        run: npm run test:property
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/lms_test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      
      - name: Build and push Backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}-backend
          labels: ${{ steps.meta.outputs.labels }}
      
      - name: Build and push Frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}-frontend
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/lms
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend npx prisma migrate deploy
```

---

## 5. Environment Configuration

### Secrets Generation

**IMPORTANT**: Generate cryptographically secure secrets before deployment.

**Step 1: Generate JWT Secrets**
```bash
# Generate Access Token Secret (32+ characters)
openssl rand -base64 32

# Generate Refresh Token Secret (32+ characters)
openssl rand -base64 32

# Example output:
# 8xK9mP2nQ5rT7vW1yZ3aB4cD6eF8gH0iJ2kL4mN6oP8q
```

**Step 2: Generate Database Password**
```bash
# Generate secure database password
openssl rand -base64 24

# Example output:
# 3nR5tY7uI9oP1aS3dF5gH7jK9l
```

**Step 3: Update .env.production**
```bash
# Copy generated secrets to .env.production
nano .env.production

# Replace placeholders:
JWT_ACCESS_SECRET=<paste_first_secret_here>
JWT_REFRESH_SECRET=<paste_second_secret_here>
DB_PASSWORD=<paste_database_password_here>
```

**⚠️ SECURITY WARNING**:
- Never commit `.env.production` to Git
- Store secrets securely (password manager, vault)
- Rotate secrets regularly (every 90 days recommended)

### Environment Variables (IP-Only Deployment)

```bash
# .env.production
# ========================================
# Production Environment Configuration
# AWS EC2 IP-Only Deployment
# ========================================
# IMPORTANT: Replace 54.123.45.67 with your actual Elastic IP
# ========================================

# Database
DATABASE_URL=postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Database Password (generate with: openssl rand -base64 24)
DB_PASSWORD=<generate_with_openssl_rand_base64_24>

# JWT Secrets (minimum 32 characters, cryptographically random)
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=<generate_with_openssl_rand_base64_32>
JWT_REFRESH_SECRET=<generate_with_openssl_rand_base64_32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage (Local Filesystem on EBS)
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Application
NODE_ENV=production
PORT=3000

# Frontend URL (HTTP-only, replace with your Elastic IP)
FRONTEND_URL=http://54.123.45.67

# CORS (replace with your Elastic IP)
CORS_ORIGIN=http://54.123.45.67

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring (Optional - Sentry for error tracking)
# Decide if you want to use Sentry (free tier available)
# SENTRY_DSN=<your_sentry_dsn>
# SENTRY_ENVIRONMENT=production
```

### Frontend Environment Variables

```bash
# frontend/.env.production
# Replace with your Elastic IP
VITE_API_URL=http://54.123.45.67/api
```

---

## 6. Database Management

### Migration Strategy

```bash
# Run migrations
npx prisma migrate deploy

# Rollback (manual)
# 1. Identify migration to rollback to
# 2. Create rollback SQL script
# 3. Execute in transaction
```

### Backup Strategy

```bash
# Automated daily backups
0 2 * * * pg_dump -U lms_user lms_prod | gzip > /backups/lms_$(date +\%Y\%m\%d).sql.gz

# Retention policy
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Monthly backups: 12 months
```

### Connection Pooling

```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  connection_limit = 10
  pool_timeout = 30
}
```

---

## 7. File Storage

### S3 Configuration

```typescript
// infrastructure/storage/S3FileStorage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3FileStorage implements IFileStorage {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!
      }
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async upload(file: Buffer, path: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: file,
      ContentType: this.getContentType(path)
    });
    
    await this.s3Client.send(command);
    return path;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path
    });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

---

## 8. Monitoring & Logging

### Structured Logging

```typescript
// infrastructure/logging/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'lms-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Health Check Endpoint

```typescript
// presentation/api/controllers/HealthController.ts
export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      });
    }
  }
}
```

### Error Tracking (Optional)

**Sentry Integration** (for production error tracking):

```typescript
// infrastructure/monitoring/sentry.ts
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    tracesSampleRate: 0.1  // 10% of transactions
  });
}

export { Sentry };
```

### Log Monitoring

**Simple Log Monitoring** (no Prometheus/Grafana needed for 50 users):

```bash
# View logs in real-time
docker-compose logs -f backend

# View error logs only
docker-compose logs -f backend | grep ERROR

# View logs from last hour
docker-compose logs --since 1h backend

# Export logs for analysis
docker-compose logs backend > backend-logs.txt
```

---

## 9. Scaling Strategy

### Vertical Scaling (Primary Strategy)

**When to Scale Up**:
- CPU usage consistently > 70%
- Memory usage consistently > 80%
- Response time > 500ms
- Database connection pool exhausted

**Scaling Path**:
1. **Current**: 2-4 cores, 4-8 GB RAM (~$20-40/month)
2. **Medium**: 4-8 cores, 8-16 GB RAM (~$40-80/month)
3. **Large**: 8-16 cores, 16-32 GB RAM (~$80-160/month)

**How to Scale**:
```bash
# 1. Backup database
docker-compose exec postgres pg_dump -U lms_user lms_prod > backup.sql

# 2. Stop services
docker-compose down

# 3. Upgrade server (via hosting provider dashboard)

# 4. Restart services
docker-compose up -d

# 5. Verify health
curl https://lms.example.com/health
```

### Horizontal Scaling (Future Enhancement)

**When Needed** (> 200 concurrent users):
- Add load balancer (Nginx upstream)
- Run multiple backend instances
- Use Redis for session storage
- Consider managed database (AWS RDS, DigitalOcean Managed DB)

**Not Needed for 50 Users**: Single server is sufficient

---

## 9. Security Hardening (IP-Only Deployment)

### AWS Security Group Configuration

```bash
# Inbound Rules
Port 22 (SSH):    Your IP only (e.g., 203.0.113.0/32)
Port 80 (HTTP):   0.0.0.0/0 (all traffic)

# Outbound Rules
All traffic:      0.0.0.0/0 (default)
```

### Security Checklist (IP-Only)

- [ ] HTTP-only deployment (no HTTPS without domain)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] Rate limiting enabled (Nginx)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (DOMPurify + sanitize-html)
- [ ] CSRF protection (SameSite=Strict cookies)
- [ ] Secrets stored in environment variables (not in code)
- [ ] Database credentials rotated regularly
- [ ] JWT secrets cryptographically random (32+ characters)
- [ ] File upload validation (type, size, content)
- [ ] API authentication required (except public endpoints)
- [ ] Authorization checks on all protected endpoints
- [ ] Audit logging for sensitive operations
- [ ] Regular security updates (npm audit, dependabot)
- [ ] AWS Security Group configured (only ports 22, 80 open)
- [ ] SSH key-based authentication (disable password login)
- [ ] Elastic IP allocated (IP doesn't change on restart)

**⚠️ Security Limitations without HTTPS:**
- Data transmitted in plain text (not encrypted)
- Vulnerable to man-in-the-middle attacks
- Browsers may show "Not Secure" warning
- Not recommended for production with sensitive data

**Recommendation**: Consider using a free domain (e.g., from Freenom) + Let's Encrypt SSL for better security.

---

## 11. Backup & Recovery

### Backup Strategy

**Database Backups**:
```bash
# Automated daily backups (cron job)
0 2 * * * docker-compose exec -T postgres pg_dump -U lms_user lms_prod | gzip > /backups/lms_$(date +\%Y\%m\%d).sql.gz

# Manual backup
docker-compose exec postgres pg_dump -U lms_user lms_prod > backup.sql

# Retention policy
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Monthly backups: 12 months

# Cleanup old backups (keep last 7 days)
find /backups -name "lms_*.sql.gz" -mtime +7 -delete
```

**File Storage Backups**:
- Local storage: Include `/app/uploads` in server backups
- S3 storage: Enable versioning in S3 bucket settings

**Configuration Backups**:
- Docker configs in Git repository
- Environment variables documented (not committed)
- Nginx configuration in Git

### Disaster Recovery

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 24 hours (daily backups)

**Recovery Procedures**:
```bash
# 1. Restore database from backup
gunzip < /backups/lms_20250113.sql.gz | docker-compose exec -T postgres psql -U lms_user lms_prod

# 2. Restore file uploads (if local storage)
cp -r /backups/uploads /app/uploads

# 3. Restart services
docker-compose restart

# 4. Verify health
curl https://lms.example.com/health
```

---

## 12. Deployment Procedures

### AWS EC2 Setup

#### Step 1: Launch EC2 Instance

```bash
# AWS Console → EC2 → Launch Instance

# 1. Choose AMI
AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type

# 2. Choose Instance Type
Instance Type: t3.medium (2 vCPU, 4 GB RAM)

# 3. Configure Instance
Network: Default VPC
Auto-assign Public IP: Enable

# 4. Add Storage
Size: 50 GB
Volume Type: gp3 (General Purpose SSD)

# 5. Add Tags
Key: Name
Value: LMS-Production

# 6. Configure Security Group
Create new security group:
  - SSH (22): Your IP only
  - HTTP (80): 0.0.0.0/0

# 7. Review and Launch
Select existing key pair or create new one
Download .pem file (keep it safe!)
```

#### Step 2: Allocate Elastic IP

```bash
# AWS Console → EC2 → Elastic IPs

# 1. Allocate Elastic IP address
Click "Allocate Elastic IP address"
Click "Allocate"

# 2. Associate with EC2 instance
Select the Elastic IP
Actions → Associate Elastic IP address
Select your EC2 instance
Click "Associate"

# Note your Elastic IP (e.g., 54.123.45.67)
```

#### Step 3: Connect to EC2

```bash
# Change key permissions
chmod 400 your-key.pem

# SSH to EC2 (replace with your Elastic IP)
ssh -i your-key.pem ubuntu@54.123.45.67
```

### Initial Deployment

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose
sudo apt install docker-compose-plugin -y

# 4. Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# 5. Clone repository
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify

# 6. Create .env.production
nano .env.production
# Paste configuration (see Environment Configuration section)
# IMPORTANT: Replace 54.123.45.67 with your actual Elastic IP

# 7. Update nginx.conf
# Already configured for IP-only deployment (no changes needed)

# 8. Generate JWT secrets
openssl rand -base64 32  # Copy to JWT_ACCESS_SECRET
openssl rand -base64 32  # Copy to JWT_REFRESH_SECRET
openssl rand -base64 24  # Copy to DB_PASSWORD

# Update .env.production with generated secrets

# 9. Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 10. Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 11. Verify deployment
curl http://54.123.45.67/health
# Should return: {"status":"healthy","timestamp":"...","database":"connected"}

# 12. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Verify Deployment

```bash
# 1. Check health endpoint
curl http://54.123.45.67/health

# 2. Check frontend (open in browser)
http://54.123.45.67

# 3. Check backend API
curl http://54.123.45.67/api/health

# 4. Check Docker containers
docker ps

# Should see 3 containers running:
# - lms-nginx
# - lms-backend
# - lms-postgres
```

### Rolling Update

```bash
# 1. SSH to EC2
ssh -i your-key.pem ubuntu@54.123.45.67

# 2. Navigate to project directory
cd Specify

# 3. Pull latest code
git pull origin main

# 4. Rebuild images
docker-compose -f docker-compose.prod.yml build

# 5. Update services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d

# 6. Run migrations (if any)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 7. Verify health
curl http://54.123.45.67/health

# 8. Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Rollback Procedure

```bash
# 1. Identify previous version
git log --oneline

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Rollback database (if needed)
gunzip < /backups/lms_<date>.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U lms_user lms_prod

# 5. Verify health
curl http://54.123.45.67/health
```

### Maintenance Mode

```bash
# 1. Create maintenance page
cat > /tmp/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Maintenance</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>System Maintenance</h1>
  <p>We'll be back shortly. Thank you for your patience.</p>
</body>
</html>
EOF

# 2. Copy to nginx html directory
docker cp /tmp/maintenance.html lms-nginx:/usr/share/nginx/html/maintenance.html

# 3. Update nginx config to serve maintenance page
# Add to nginx.conf before other locations:
# location / {
#   return 503;
# }
# error_page 503 /maintenance.html;

# 4. Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# 5. Perform maintenance

# 6. Remove maintenance mode (revert nginx config)
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Cost Estimation (AWS EC2 IP-Only)

### Monthly Costs

| Item | Specification | Cost (USD) |
|------|---------------|------------|
| EC2 t3.medium | 2 vCPU, 4 GB RAM, On-Demand | $30.37 |
| EBS gp3 | 50 GB storage | $4.00 |
| Elastic IP | 1 IP (attached to running instance) | $0.00 |
| Data Transfer Out | ~10 GB/month | $0.90 |
| **Total** | | **~$35-40/month** |

### Cost Optimization Options

**1. Reserved Instances** (1-year commitment):
- EC2 t3.medium: ~$18/month (40% savings)
- Total: ~$23-28/month

**2. Savings Plans** (flexible commitment):
- EC2 Compute Savings Plan: ~20-30% savings
- Total: ~$25-32/month

**3. Spot Instances** (not recommended for production):
- Up to 70% savings but can be terminated
- Only for non-critical workloads

### Comparison with Other Hosting

| Provider | Specs | Cost/Month |
|----------|-------|------------|
| AWS EC2 (On-Demand) | 2 vCPU, 4 GB | $35-40 |
| AWS EC2 (Reserved) | 2 vCPU, 4 GB | $23-28 |
| DigitalOcean | 2 vCPU, 4 GB | $24 |
| Linode | 2 vCPU, 4 GB | $24 |
| Hetzner | 2 vCPU, 4 GB | $12-15 |

**Recommendation**: 
- Start with On-Demand for flexibility
- Switch to Reserved Instance after 3-6 months if usage is stable
- Consider DigitalOcean/Linode for simpler management at similar cost

---

## Summary

This deployment workflow provides:

✅ **AWS EC2 Deployment**: Single t3.medium instance with Elastic IP
✅ **IP-Only Access**: No domain required (HTTP-only)
✅ **Simple Architecture**: Docker Compose (no Kubernetes)
✅ **Containerization**: Docker for consistent environments
✅ **Reverse Proxy**: Nginx for HTTP, static files, and rate limiting
✅ **CI/CD**: Automated testing and deployment with GitHub Actions
✅ **Monitoring**: Structured logging with Winston, health checks
✅ **Security**: Rate limiting, input validation, authentication (⚠️ no HTTPS)
✅ **Backup**: Automated daily database backups
✅ **Scalability**: Vertical scaling path for growth
✅ **Cost-Effective**: ~$35-40/month for 50 concurrent users

**Production-Grade for 50 Users**: Reliable, monitored, and maintainable without over-engineering.

**⚠️ Security Note**: HTTP-only deployment is less secure than HTTPS. Consider using a free domain + Let's Encrypt SSL for production with sensitive data.

**Access URLs** (replace with your Elastic IP):
- Frontend: `http://54.123.45.67`
- Backend API: `http://54.123.45.67/api`
- Health Check: `http://54.123.45.67/health`
