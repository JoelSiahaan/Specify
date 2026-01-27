# Maintenance Mode Guide

## Overview

The LMS now supports maintenance mode, which allows you to temporarily disable the application while performing updates, backups, or other maintenance tasks. When enabled, all API requests (except health checks) will return a 503 Service Unavailable response, and users will see a friendly maintenance page.

## How to Enable/Disable Maintenance Mode

### Local Development

1. **Edit the `.env` file** in the project root:
   ```bash
   # Enable maintenance mode
   MAINTENANCE_MODE=true
   
   # Disable maintenance mode (normal operation)
   MAINTENANCE_MODE=false
   ```

2. **Restart the backend service** for changes to take effect:
   ```bash
   docker-compose restart backend
   ```

### Docker Compose (Development)

The `MAINTENANCE_MODE` environment variable is automatically passed from your `.env` file to the backend container via `docker-compose.yml`.

### Production Deployment

For production deployments, set the `MAINTENANCE_MODE` environment variable in your deployment configuration:

**Docker Compose (Production):**
```bash
# In your production .env file
MAINTENANCE_MODE=true

# Or set directly in docker-compose.prod.yml
environment:
  MAINTENANCE_MODE: "true"
```

**Direct Environment Variable:**
```bash
# Set before starting the application
export MAINTENANCE_MODE=true
npm start
```

**Kubernetes/Cloud Platforms:**
Set the environment variable in your deployment configuration (ConfigMap, Secret, or deployment manifest).

## What Happens in Maintenance Mode

### Backend Behavior
- All API endpoints return **503 Service Unavailable**
- Health check endpoint (`/health`) remains accessible for monitoring
- Requests are logged with "maintenance mode active" message
- Response includes maintenance mode flag for client detection

### Frontend Behavior
- API client automatically detects 503 responses
- Users are redirected to a maintenance page
- Maintenance page displays:
  - Friendly message explaining the situation
  - Estimated time (if configured)
  - Support contact information

### Example API Response
```json
{
  "code": "SERVICE_UNAVAILABLE",
  "message": "The system is currently undergoing maintenance. Please try again later.",
  "maintenanceMode": true
}
```

## Monitoring During Maintenance

The health check endpoint remains accessible during maintenance mode:

```bash
# Check if system is in maintenance mode
curl http://localhost:3000/health

# Response includes maintenance status
{
  "status": "ok",
  "timestamp": "2025-01-27T10:30:00Z",
  "maintenance": {
    "enabled": true,
    "message": "System is in maintenance mode"
  }
}
```

## Best Practices

1. **Plan Ahead**: Notify users before enabling maintenance mode
2. **Use Health Checks**: Monitor the health endpoint to verify maintenance mode is active
3. **Quick Toggle**: Keep maintenance mode duration as short as possible
4. **Test First**: Test maintenance mode in a staging environment before production
5. **Document**: Keep a log of when and why maintenance mode was enabled

## Troubleshooting

### Maintenance mode not activating
- Verify `.env` file has `MAINTENANCE_MODE=true`
- Restart the backend service: `docker-compose restart backend`
- Check backend logs: `docker-compose logs -f backend`
- Verify environment variable is set: `docker-compose exec backend env | grep MAINTENANCE_MODE`

### Users still accessing the application
- Clear browser cache and cookies
- Verify API client is detecting 503 responses
- Check frontend logs for redirect behavior

### Cannot disable maintenance mode
- Set `MAINTENANCE_MODE=false` in `.env`
- Restart backend service
- Verify with health check endpoint

## Implementation Details

### Files Modified
- `.env.example` - Added MAINTENANCE_MODE configuration
- `docker-compose.yml` - Added MAINTENANCE_MODE to backend environment
- `backend/src/presentation/api/middleware/MaintenanceMiddleware.ts` - Middleware implementation
- `frontend/src/presentation/web/pages/error/MaintenancePage.tsx` - Maintenance page UI
- `frontend/src/presentation/web/services/api.ts` - 503 response interceptor

### Requirements Satisfied
- **Requirement 21.4**: Maintenance mode support
- Returns 503 Service Unavailable when enabled
- Allows health check endpoint for monitoring
- User-friendly maintenance page on frontend
- Configurable via environment variable
