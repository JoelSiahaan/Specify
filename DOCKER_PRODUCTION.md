# Docker Production Configuration Guide

This guide explains how to test and deploy the LMS using Docker in production mode.

## Overview

The production Docker setup includes:
- **Multi-stage builds** for optimized image sizes
- **Non-root users** for security
- **Health checks** for all services
- **Persistent volumes** for data
- **Nginx reverse proxy** with SSL/TLS support
- **PostgreSQL** with production-optimized settings

## Files

- `backend/Dockerfile` - Production backend build
- `frontend/Dockerfile` - Production frontend build with Nginx
- `docker-compose.prod.yml` - Production orchestration
- `.env.production.example` - Production environment template
- `.env.production.local` - Local production testing (gitignored)
- `nginx.conf` - Nginx configuration with SSL placeholders

## Local Production Testing

Before deploying to production, test the production Docker setup locally:

### Step 1: Create Local Test Environment

```bash
# Copy the local test environment file
cp .env.production.local .env.production

# Or create from example and customize
cp .env.production.example .env.production
# Edit .env.production with test values
```

### Step 2: Build Production Images

```bash
# Build all production images
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml build frontend
```

### Step 3: Start Production Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Step 4: Run Database Migrations

```bash
# Run migrations in production container
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma client (if needed)
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl http://localhost/health

# Check API
curl http://localhost/api/health

# Check frontend (open in browser)
open http://localhost
```

### Step 6: Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

## Production Deployment (AWS EC2)

### Prerequisites

1. **Domain Name**: Purchase domain ($10-15/year)
2. **AWS EC2 Instance**: t3.medium with Ubuntu 22.04 LTS
3. **Elastic IP**: Allocated and associated to EC2
4. **DNS Configuration**: A record pointing to Elastic IP
5. **Security Group**: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open

### Step 1: Prepare Production Environment

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@<your-elastic-ip>

# Clone repository
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify

# Create production environment file
cp .env.production.example .env.production

# Generate secure secrets
openssl rand -base64 32  # JWT_ACCESS_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 24  # DB_PASSWORD

# Edit .env.production with generated secrets and your domain
nano .env.production
```

### Step 2: Update Domain in Configuration

```bash
# Update nginx.conf with your domain
nano nginx.conf
# Replace lms.example.com with your actual domain (e.g., belajar.sekolahku.id)
```

### Step 3: Build and Start Services (Without SSL)

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Step 4: Install Let's Encrypt SSL

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Stop Nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Generate SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Certbot will:
# - Generate SSL certificate at /etc/letsencrypt/live/yourdomain.com/
# - Automatically update nginx.conf with SSL configuration
# - Set up HTTP to HTTPS redirect

# Restart Nginx with SSL
docker-compose -f docker-compose.prod.yml start nginx

# Set up auto-renewal (certificates expire every 90 days)
echo "0 0 * * * certbot renew --quiet" | sudo crontab -

# Test auto-renewal (dry-run)
sudo certbot renew --dry-run
```

### Step 5: Verify Production Deployment

```bash
# Check health endpoint (HTTPS)
curl https://yourdomain.com/health

# Check API
curl https://yourdomain.com/api/health

# Check frontend (open in browser)
# Should show green padlock (secure connection)
open https://yourdomain.com

# Check Docker containers
docker ps
# Should see: lms-nginx, lms-backend, lms-postgres

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Production Updates

### Rolling Update (Zero Downtime)

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@<your-elastic-ip>

# Navigate to project
cd Specify

# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Update services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations (if any)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify health
curl https://yourdomain.com/health
```

### Rollback

```bash
# Checkout previous version
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Rollback database (if needed)
gunzip < /backups/lms_<date>.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U lms_user lms_prod
```

## Backup and Recovery

### Database Backup

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U lms_user lms_prod > backup.sql

# Automated daily backups (cron job)
0 2 * * * docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U lms_user lms_prod | gzip > /backups/lms_$(date +\%Y\%m\%d).sql.gz
```

### Database Restore

```bash
# Restore from backup
gunzip < /backups/lms_20250113.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U lms_user lms_prod
```

### File Storage Backup

```bash
# Backup uploads directory
docker cp lms-backend:/app/uploads ./uploads-backup

# Restore uploads
docker cp ./uploads-backup lms-backend:/app/uploads
```

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Since 1 hour ago
docker-compose -f docker-compose.prod.yml logs --since 1h backend
```

### Check Container Status

```bash
# List running containers
docker ps

# Check container health
docker inspect lms-backend | grep -A 10 Health

# Check resource usage
docker stats
```

### Database Monitoring

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U lms_user lms_prod

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('lms_prod'));
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check health status
docker inspect lms-backend | grep -A 10 Health

# Restart service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U lms_user
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Prune unused resources
docker system prune -a
```

## Security Checklist

- [ ] HTTPS enforced (TLS 1.2+) with Let's Encrypt
- [ ] HTTP to HTTPS redirect configured
- [ ] SSL certificate auto-renewal configured
- [ ] Security headers configured (X-Frame-Options, CSP, HSTS)
- [ ] Rate limiting enabled (Nginx)
- [ ] Non-root users in containers
- [ ] Secrets stored in environment variables (not in code)
- [ ] Database credentials rotated regularly
- [ ] JWT secrets cryptographically random (32+ characters)
- [ ] File upload validation (type, size, content)
- [ ] AWS Security Group configured (ports 22, 80, 443)
- [ ] SSH key-based authentication (disable password login)
- [ ] Elastic IP allocated (IP doesn't change)
- [ ] Domain configured with DNS A record

## Cost Estimation

### AWS EC2 (On-Demand)
- **Instance**: t3.medium (2 vCPU, 4 GB RAM) - $30.37/month
- **Storage**: 50 GB gp3 EBS - $4.00/month
- **Elastic IP**: $0.00 (attached to running instance)
- **Data Transfer**: ~10 GB/month - $0.90/month
- **Total**: ~$35-40/month

### Cost Optimization
- **Reserved Instance** (1-year): ~$18/month (40% savings)
- **Savings Plan**: ~20-30% savings
- **Total with Reserved**: ~$23-28/month

### Domain Cost
- **.com/.net**: $10-15/year
- **.id/.co.id**: $10-15/year
- **Educational (.ac.id)**: FREE for Indonesian universities

## References

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Let's Encrypt**: https://letsencrypt.org/
- **Certbot**: https://certbot.eff.org/
- **Nginx**: https://nginx.org/en/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Check health: `curl https://yourdomain.com/health`
3. Review this guide
4. Check deployment-workflow.md in .kiro/steering/
