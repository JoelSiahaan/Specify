# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Learning Management System (LMS).

## Workflows

### 1. CI - Test and Build (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **backend-test**: Runs backend tests with PostgreSQL
  - ESLint code quality checks
  - TypeScript type checking
  - Unit tests with coverage
  - Integration tests
  - Uploads coverage to Codecov

- **frontend-test**: Runs frontend tests
  - ESLint code quality checks
  - TypeScript type checking
  - Component tests with coverage
  - Production build verification
  - Uploads coverage to Codecov

- **security-audit**: Scans dependencies for vulnerabilities
  - Backend npm audit
  - Frontend npm audit

**Status Badge:**
```markdown
![CI Status](https://github.com/JoelSiahaan/Specify/workflows/CI%20-%20Test%20and%20Build/badge.svg)
```

### 2. Build and Deploy (`build-deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Jobs:**
- **build**: Builds and pushes Docker images
  - Builds backend Docker image
  - Builds frontend Docker image
  - Pushes to GitHub Container Registry (ghcr.io)
  - Uses Docker layer caching for faster builds

- **deploy**: Deploys to production (placeholder)
  - Currently shows deployment instructions
  - Uncomment SSH deployment steps when server is ready
  - Runs database migrations
  - Performs health checks

**Container Registry:**
- Backend: `ghcr.io/joelsiahaan/specify/backend:latest`
- Frontend: `ghcr.io/joelsiahaan/specify/frontend:latest`

**Status Badge:**
```markdown
![Build Status](https://github.com/JoelSiahaan/Specify/workflows/Build%20and%20Deploy/badge.svg)
```

### 3. Security Scanning (`security.yml`)

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Manual workflow dispatch

**Jobs:**
- **dependency-scan**: Scans npm dependencies
  - Runs `npm audit` on backend and frontend
  - Uploads audit results as artifacts
  - Fails on high/critical vulnerabilities

- **docker-scan**: Scans Docker images (manual only)
  - Uses Trivy to scan for vulnerabilities
  - Scans both backend and frontend images
  - Uploads SARIF results

**Status Badge:**
```markdown
![Security Status](https://github.com/JoelSiahaan/Specify/workflows/Security%20Scanning/badge.svg)
```

## Dependabot Configuration

**File:** `dependabot.yml`

**Updates:**
- Backend npm dependencies (weekly, Monday 2 AM)
- Frontend npm dependencies (weekly, Monday 2 AM)
- GitHub Actions (weekly, Monday 2 AM)
- Docker base images (weekly, Monday 2 AM)

**Settings:**
- Ignores major version updates by default
- Opens max 10 PRs for npm, 5 for others
- Auto-assigns reviewer: JoelSiahaan
- Labels PRs appropriately

## Required GitHub Secrets

### For Production Deployment (Optional)

Add these secrets in GitHub repository settings when ready to deploy:

```
PROD_HOST          # Production server IP or hostname
PROD_USER          # SSH username (e.g., ubuntu)
PROD_SSH_KEY       # Private SSH key for authentication
PROD_SSH_PORT      # SSH port (default: 22)
```

### For Notifications (Optional)

```
SLACK_WEBHOOK_URL  # Slack webhook for notifications
DISCORD_WEBHOOK    # Discord webhook for notifications
```

## Setting Up Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value
4. Secrets are encrypted and not visible after creation

## Enabling Production Deployment

To enable automatic deployment to production:

1. **Set up production server:**
   - Follow instructions in `DEPLOYMENT.md`
   - Install Docker and Docker Compose
   - Clone repository to `/opt/lms`
   - Configure `.env.production`

2. **Add GitHub secrets:**
   - `PROD_HOST`: Your server IP or domain
   - `PROD_USER`: SSH username (usually `ubuntu`)
   - `PROD_SSH_KEY`: Your private SSH key

3. **Uncomment deployment steps:**
   - Edit `.github/workflows/build-deploy.yml`
   - Uncomment the `environment` section
   - Uncomment the SSH deployment step
   - Uncomment the health check step

4. **Test deployment:**
   - Push to `main` branch
   - Monitor workflow in Actions tab
   - Verify deployment at your domain

## Workflow Status

Check workflow status:
- GitHub repository → Actions tab
- View logs for each workflow run
- Download artifacts (coverage, audit results)

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act-cli  # Windows

# Run CI workflow
act push

# Run specific job
act -j backend-test

# Run with secrets
act -s GITHUB_TOKEN=your_token
```

## Troubleshooting

### Build Failures

**Backend tests fail:**
- Check PostgreSQL service is running
- Verify DATABASE_URL is correct
- Check test database migrations

**Frontend tests fail:**
- Check Node.js version matches (20.19.0)
- Verify all dependencies installed
- Check for TypeScript errors

**Docker build fails:**
- Check Dockerfile syntax
- Verify base image availability
- Check build context paths

### Deployment Failures

**SSH connection fails:**
- Verify PROD_HOST is correct
- Check SSH key is valid
- Ensure port 22 is open

**Health check fails:**
- Check application logs
- Verify services are running
- Check database connection

**Migration fails:**
- Check database is accessible
- Verify migration files are valid
- Check for schema conflicts

## Best Practices

1. **Always run tests locally before pushing**
   ```bash
   cd backend && npm test
   cd frontend && npm test
   ```

2. **Keep workflows fast**
   - Use caching for dependencies
   - Run jobs in parallel when possible
   - Use Docker layer caching

3. **Monitor workflow runs**
   - Check Actions tab regularly
   - Fix failing workflows promptly
   - Review security scan results

4. **Update dependencies regularly**
   - Review Dependabot PRs weekly
   - Test updates in develop branch first
   - Merge to main after verification

5. **Secure secrets**
   - Never commit secrets to repository
   - Rotate secrets regularly (every 90 days)
   - Use environment-specific secrets

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [Codecov Documentation](https://docs.codecov.com/)

## Support

For issues with workflows:
1. Check workflow logs in Actions tab
2. Review this README
3. Check DEPLOYMENT.md for deployment issues
4. Open an issue in the repository
