# Environment Variables

This document describes all environment variables used in the LMS application.

## Table of Contents

- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [Docker Environment Variables](#docker-environment-variables)
- [Production Environment Variables](#production-environment-variables)
- [Generating Secrets](#generating-secrets)
- [Environment File Examples](#environment-file-examples)

---

## Backend Environment Variables

### Database Configuration

**DATABASE_URL** (required)
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://user:password@host:port/database?options`
- **Development**: `postgresql://lms_user:password@localhost:5432/lms_dev`
- **Production**: `postgresql://lms_user:password@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30`
- **Example**: `postgresql://lms_user:SecurePass123@localhost:5432/lms_dev`

**DATABASE_POOL_MIN** (optional)
- **Description**: Minimum number of database connections in pool
- **Default**: 2
- **Range**: 1-10
- **Example**: `2`

**DATABASE_POOL_MAX** (optional)
- **Description**: Maximum number of database connections in pool
- **Default**: 10
- **Range**: 5-20
- **Example**: `10`

### JWT Configuration

**JWT_ACCESS_SECRET** (required)
- **Description**: Secret key for signing JWT access tokens
- **Requirements**: Minimum 32 characters, cryptographically random
- **Generate**: `openssl rand -base64 32`
- **Example**: `8xK9mP2nQ5rT7vW1yZ3aB4cD6eF8gH0iJ2kL4mN6oP8q`
- **⚠️ Security**: Never commit to Git, rotate every 90 days

**JWT_REFRESH_SECRET** (required)
- **Description**: Secret key for signing JWT refresh tokens
- **Requirements**: Minimum 32 characters, cryptographically random, different from access secret
- **Generate**: `openssl rand -base64 32`
- **Example**: `9yL0nQ3oR6sU8wX2zA5bC7dE9fG1hI3jK5lM7nO9pQ1r`
- **⚠️ Security**: Never commit to Git, rotate every 90 days

**JWT_ACCESS_EXPIRY** (optional)
- **Description**: Access token expiration time
- **Default**: `15m`
- **Format**: Time string (e.g., `15m`, `1h`, `1d`)
- **Recommended**: `15m` (15 minutes)
- **Example**: `15m`

**JWT_REFRESH_EXPIRY** (optional)
- **Description**: Refresh token expiration time
- **Default**: `7d`
- **Format**: Time string (e.g., `7d`, `30d`)
- **Recommended**: `7d` (7 days)
- **Example**: `7d`

### File Storage Configuration

**STORAGE_TYPE** (optional)
- **Description**: File storage backend type
- **Default**: `local`
- **Options**: `local`, `s3` (future)
- **Example**: `local`

**UPLOAD_DIR** (optional)
- **Description**: Directory for file uploads (local storage only)
- **Default**: `./uploads`
- **Format**: Relative or absolute path
- **Example**: `./uploads` or `/app/uploads`

**MAX_FILE_SIZE** (optional)
- **Description**: Maximum file upload size in bytes
- **Default**: `10485760` (10MB)
- **Range**: 1MB - 50MB
- **Example**: `10485760` (10MB)

### Application Configuration

**NODE_ENV** (required)
- **Description**: Node.js environment mode
- **Options**: `development`, `production`, `test`
- **Development**: `development`
- **Production**: `production`
- **Example**: `development`

**PORT** (optional)
- **Description**: Backend server port
- **Default**: `3000`
- **Range**: 1024-65535
- **Example**: `3000`

**FRONTEND_URL** (required)
- **Description**: Frontend application URL (for CORS)
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`
- **Example**: `http://localhost:5173`

**CORS_ORIGIN** (required)
- **Description**: Allowed CORS origin
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`
- **Example**: `http://localhost:5173`

### Logging Configuration

**LOG_LEVEL** (optional)
- **Description**: Logging level
- **Default**: `info`
- **Options**: `error`, `warn`, `info`, `debug`
- **Development**: `debug`
- **Production**: `info`
- **Example**: `info`

**LOG_FORMAT** (optional)
- **Description**: Log output format
- **Default**: `json`
- **Options**: `json`, `simple`
- **Recommended**: `json` (structured logging)
- **Example**: `json`

### Monitoring Configuration (Optional)

**SENTRY_DSN** (optional)
- **Description**: Sentry Data Source Name for error tracking
- **Format**: `https://...@sentry.io/...`
- **Example**: `https://abc123@o123456.ingest.sentry.io/7890123`
- **Note**: Leave empty to disable Sentry

**SENTRY_ENVIRONMENT** (optional)
- **Description**: Sentry environment name
- **Options**: `development`, `production`
- **Example**: `production`

---

## Frontend Environment Variables

### API Configuration

**VITE_API_URL** (required)
- **Description**: Backend API base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`
- **Example**: `http://localhost:3000/api`
- **Note**: Must include `/api` path

---

## Docker Environment Variables

For Docker Compose, create `.env` file in **root** directory:

**DB_PASSWORD** (required)
- **Description**: PostgreSQL database password
- **Generate**: `openssl rand -base64 24`
- **Example**: `3nR5tY7uI9oP1aS3dF5gH7jK9l`
- **⚠️ Security**: Never commit to Git

**JWT_ACCESS_SECRET** (required)
- **Description**: JWT access token secret
- **Generate**: `openssl rand -base64 32`
- **Example**: `8xK9mP2nQ5rT7vW1yZ3aB4cD6eF8gH0iJ2kL4mN6oP8q`

**JWT_REFRESH_SECRET** (required)
- **Description**: JWT refresh token secret
- **Generate**: `openssl rand -base64 32`
- **Example**: `9yL0nQ3oR6sU8wX2zA5bC7dE9fG1hI3jK5lM7nO9pQ1r`

**FRONTEND_URL** (required)
- **Description**: Frontend URL for CORS
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`
- **Example**: `http://localhost:5173`

**CORS_ORIGIN** (required)
- **Description**: Allowed CORS origin
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`
- **Example**: `http://localhost:5173`

---

## Production Environment Variables

For production deployment, create `.env.production` file:

### Complete Production Configuration

```bash
# Database Configuration
DATABASE_URL=postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Database Password (generate with: openssl rand -base64 24)
DB_PASSWORD=<generate_secure_password>

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=<generate_access_secret>
JWT_REFRESH_SECRET=<generate_refresh_secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage (Local Filesystem on EBS)
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Application
NODE_ENV=production
PORT=3000

# Frontend URL (HTTPS with your domain)
FRONTEND_URL=https://yourdomain.com

# CORS (HTTPS with your domain)
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring (Optional - Sentry for error tracking)
# SENTRY_DSN=<your_sentry_dsn>
# SENTRY_ENVIRONMENT=production
```

**Important**: Replace `yourdomain.com` with your actual domain.

---

## Generating Secrets

### Generate JWT Secrets

```bash
# Generate JWT Access Secret (32+ characters)
openssl rand -base64 32

# Generate JWT Refresh Secret (32+ characters)
openssl rand -base64 32
```

### Generate Database Password

```bash
# Generate secure database password (24+ characters)
openssl rand -base64 24
```

### Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as template (without actual secrets)

2. **Use different secrets for each environment**
   - Development secrets ≠ Production secrets
   - Access secret ≠ Refresh secret

3. **Store secrets securely**
   - Use password manager (1Password, LastPass, Bitwarden)
   - Use secrets management service (AWS Secrets Manager, HashiCorp Vault)
   - Never share secrets via email or chat

4. **Rotate secrets regularly**
   - Rotate every 90 days (recommended)
   - Rotate immediately if compromised
   - Update all environments when rotating

5. **Use strong secrets**
   - Minimum 32 characters for JWT secrets
   - Minimum 24 characters for database password
   - Use cryptographically random generation (openssl)
   - Avoid predictable patterns

---

## Environment File Examples

### Development (.env)

```bash
# Backend (.env in backend directory)
DATABASE_URL=postgresql://lms_user:dev_password@localhost:5432/lms_dev
JWT_ACCESS_SECRET=dev_access_secret_min_32_chars_12345678
JWT_REFRESH_SECRET=dev_refresh_secret_min_32_chars_87654321
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
LOG_FORMAT=json

# Frontend (.env in frontend directory)
VITE_API_URL=http://localhost:3000/api
```

### Docker Development (.env in root)

```bash
DB_PASSWORD=dev_password
JWT_ACCESS_SECRET=dev_access_secret_min_32_chars_12345678
JWT_REFRESH_SECRET=dev_refresh_secret_min_32_chars_87654321
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Production (.env.production)

```bash
# Use generated secrets (see Generating Secrets section)
DATABASE_URL=postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DB_PASSWORD=<generated_with_openssl_rand_base64_24>
JWT_ACCESS_SECRET=<generated_with_openssl_rand_base64_32>
JWT_REFRESH_SECRET=<generated_with_openssl_rand_base64_32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
LOG_FORMAT=json
# SENTRY_DSN=<your_sentry_dsn>
# SENTRY_ENVIRONMENT=production
```

---

## Environment Variable Validation

The application validates environment variables on startup:

### Required Variables

If any required variable is missing, the application will fail to start with an error message:

```
Error: Missing required environment variable: JWT_ACCESS_SECRET
```

### Invalid Values

If any variable has an invalid value, the application will fail to start:

```
Error: Invalid JWT_ACCESS_SECRET: must be at least 32 characters
```

### Validation Rules

- **JWT_ACCESS_SECRET**: Minimum 32 characters
- **JWT_REFRESH_SECRET**: Minimum 32 characters, different from access secret
- **DATABASE_URL**: Valid PostgreSQL connection string
- **PORT**: Valid port number (1024-65535)
- **MAX_FILE_SIZE**: Positive integer
- **NODE_ENV**: One of `development`, `production`, `test`
- **LOG_LEVEL**: One of `error`, `warn`, `info`, `debug`

---

## Troubleshooting

### Issue: Application won't start

**Solution**: Check environment variables are set correctly

```bash
# Backend
cd backend
cat .env

# Verify required variables are present
# - DATABASE_URL
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
```

### Issue: Database connection failed

**Solution**: Check DATABASE_URL is correct

```bash
# Test database connection
psql "postgresql://lms_user:password@localhost:5432/lms_dev"

# If connection fails, check:
# - PostgreSQL is running
# - Database exists
# - User has correct permissions
# - Password is correct
```

### Issue: JWT token invalid

**Solution**: Check JWT secrets are set and match

```bash
# Verify JWT secrets are set
echo $JWT_ACCESS_SECRET
echo $JWT_REFRESH_SECRET

# Ensure secrets are:
# - At least 32 characters
# - Different from each other
# - Same across all backend instances
```

### Issue: CORS errors

**Solution**: Check CORS_ORIGIN matches frontend URL

```bash
# Backend .env
CORS_ORIGIN=http://localhost:5173

# Frontend .env
VITE_API_URL=http://localhost:3000/api

# Ensure:
# - CORS_ORIGIN matches frontend URL exactly
# - No trailing slash
# - Protocol matches (http vs https)
```

---

## Additional Resources

- **Environment Variables Best Practices**: https://12factor.net/config
- **OpenSSL Documentation**: https://www.openssl.org/docs/
- **Prisma Connection String**: https://www.prisma.io/docs/reference/database-reference/connection-urls
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
