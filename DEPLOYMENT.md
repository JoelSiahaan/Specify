# Deployment Guide

This guide provides step-by-step instructions for deploying the LMS to production on AWS EC2 with Let's Encrypt SSL.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [AWS EC2 Setup](#aws-ec2-setup)
- [Domain Configuration](#domain-configuration)
- [Initial Deployment](#initial-deployment)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Resources

- **AWS Account**: Active AWS account with EC2 access
- **Domain Name**: Custom domain (required for Let's Encrypt SSL)
  - Cost: $10-15/year for .com/.id/.co.id
  - Educational domains (.ac.id, .sch.id): FREE for Indonesian universities/schools
- **SSH Key Pair**: For secure EC2 access
- **GitHub Account**: For CI/CD pipeline (optional)

### Required Tools

- **SSH Client**: For connecting to EC2 instance
- **Git**: For cloning repository
- **OpenSSL**: For generating secrets

### Cost Estimation

**Monthly Costs**:
- EC2 t3.medium (On-Demand): ~$35-40/month
- EC2 t3.medium (Reserved 1-year): ~$23-28/month
- Domain: $10-15/year (~$1/month)
- **Total**: ~$36-41/month (On-Demand) or ~$24-29/month (Reserved)

---

## Environment Setup

### 1. Generate Secrets

Generate cryptographically secure secrets before deployment:

```bash
# Generate JWT Access Secret (32+ characters)
openssl rand -base64 32
# Example output: 8xK9mP2nQ5rT7vW1yZ3aB4cD6eF8gH0iJ2kL4mN6oP8q

# Generate JWT Refresh Secret (32+ characters)
openssl rand -base64 32
# Example output: 9yL0nQ3oR6sU8wX2zA5bC7dE9fG1hI3jK5lM7nO9pQ1r

# Generate Database Password (24+ characters)
openssl rand -base64 24
# Example output: 3nR5tY7uI9oP1aS3dF5gH7jK9l
```

**⚠️ Security Warning**:
- Store secrets securely (password manager, vault)
- Never commit secrets to Git
- Use different secrets for development and production
- Rotate secrets regularly (every 90 days recommended)

### 2. Prepare Environment File

Create `.env.production` file with production configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://lms_user:${DB_PASSWORD}@postgres:5432/lms_prod?connection_limit=10&pool_timeout=30
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Database Password (from step 1)
DB_PASSWORD=<paste_database_password_here>

# JWT Secrets (from step 1)
JWT_ACCESS_SECRET=<paste_access_secret_here>
JWT_REFRESH_SECRET=<paste_refresh_secret_here>
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

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Choose AMI**:
   - AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - Architecture: 64-bit (x86)

3. **Choose Instance Type**:
   - Instance Type: t3.medium (2 vCPU, 4 GB RAM)
   - For 50+ concurrent users

4. **Configure Instance**:
   - Network: Default VPC
   - Auto-assign Public IP: Enable
   - IAM role: None (not needed)

5. **Add Storage**:
   - Size: 50 GB
   - Volume Type: gp3 (General Purpose SSD)
   - Delete on Termination: Unchecked (for data safety)

6. **Add Tags**:
   - Key: Name
   - Value: LMS-Production

7. **Configure Security Group**:
   - Create new security group
   - Security group name: LMS-Security-Group
   - Rules:
     - SSH (22): Your IP only (e.g., 203.0.113.0/32)
     - HTTP (80): 0.0.0.0/0 (all traffic)
     - HTTPS (443): 0.0.0.0/0 (all traffic)

8. **Review and Launch**:
   - Select existing key pair or create new one
   - Download .pem file (keep it safe!)
   - Launch instance

### 2. Allocate Elastic IP

Elastic IP ensures your IP address doesn't change when instance restarts.

1. **Go to AWS Console** → EC2 → Elastic IPs

2. **Allocate Elastic IP**:
   - Click "Allocate Elastic IP address"
   - Click "Allocate"

3. **Associate with EC2 Instance**:
   - Select the Elastic IP
   - Actions → Associate Elastic IP address
   - Select your EC2 instance
   - Click "Associate"

4. **Note your Elastic IP** (e.g., 54.123.45.67)

### 3. Connect to EC2

```bash
# Change key permissions (first time only)
chmod 400 your-key.pem

# SSH to EC2 (replace with your Elastic IP)
ssh -i your-key.pem ubuntu@<your-elastic-ip>
```

---

## Domain Configuration

### 1. Configure DNS

Point your domain to EC2 Elastic IP:

1. **Go to your domain registrar** (Namecheap, GoDaddy, etc.)

2. **Add A Record**:
   - Type: A
   - Host: @ (or your subdomain, e.g., lms)
   - Value: Your Elastic IP (e.g., 54.123.45.67)
   - TTL: 300 (5 minutes)

3. **Wait for DNS propagation** (5-30 minutes)

4. **Verify DNS**:
```bash
# Check if domain points to your IP
nslookup yourdomain.com
# Should return your Elastic IP
```

---

## Initial Deployment

### 1. Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 3. Clone Repository

```bash
# Clone repository
git clone https://github.com/JoelSiahaan/Specify.git
cd Specify
```

### 4. Configure Environment

```bash
# Create .env.production file
nano .env.production

# Paste configuration from Environment Setup section
# IMPORTANT: Replace yourdomain.com with your actual domain
# Save and exit (Ctrl+X, Y, Enter)
```

### 5. Build and Start Services

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start services (without SSL first)
docker-compose -f docker-compose.prod.yml up -d

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate
```

---

## SSL Certificate Setup

### 1. Install Certbot

```bash
# Update package list
sudo apt-get update

# Install Certbot and Nginx plugin
sudo apt-get install certbot python3-certbot-nginx -y
```

### 2. Stop Nginx Temporarily

```bash
# Stop Nginx to allow Certbot to bind to port 80
docker-compose -f docker-compose.prod.yml stop nginx
```

### 3. Generate SSL Certificate

```bash
# Generate certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Follow prompts:
# - Enter email address (for renewal notifications)
# - Agree to Terms of Service (Y)
# - Share email with EFF (optional, Y or N)
# - Certbot will automatically configure Nginx
```

**What Certbot Does**:
- Generates SSL certificate at `/etc/letsencrypt/live/yourdomain.com/`
- Automatically updates nginx.conf with SSL configuration
- Sets up HTTP to HTTPS redirect
- Configures security headers

### 4. Restart Nginx with SSL

```bash
# Start Nginx with SSL configuration
docker-compose -f docker-compose.prod.yml start nginx

# Verify Nginx is running
docker-compose -f docker-compose.prod.yml ps nginx
```

### 5. Set Up Auto-Renewal

SSL certificates expire every 90 days. Set up automatic renewal:

```bash
# Add cron job for auto-renewal
echo "0 0 * * * certbot renew --quiet" | sudo crontab -

# Test auto-renewal (dry-run)
sudo certbot renew --dry-run
```

### 6. Verify SSL Certificate

```bash
# Check certificate details
sudo certbot certificates

# Test HTTPS connection
curl https://yourdomain.com/health

# Open in browser and check for green padlock icon
# https://yourdomain.com
```

---

## CI/CD Pipeline

### 1. Setup GitHub Secrets

Add secrets to GitHub repository:

1. **Go to GitHub** → Your Repository → Settings → Secrets and variables → Actions

2. **Add secrets**:
   - `PROD_HOST`: Your EC2 Elastic IP
   - `PROD_USER`: ubuntu
   - `PROD_SSH_KEY`: Contents of your .pem file

### 2. GitHub Actions Workflow

The repository includes `.github/workflows/deploy.yml` for automated deployment.

**Workflow Steps**:
1. Run tests on every push
2. Build Docker images on main branch
3. Push images to GitHub Container Registry
4. Deploy to production server

**Trigger Deployment**:
```bash
# Push to main branch
git push origin main

# GitHub Actions will automatically:
# - Run tests
# - Build images
# - Deploy to production
```

---

## Monitoring & Maintenance

### View Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres

# View error logs only
docker-compose -f docker-compose.prod.yml logs -f backend | grep ERROR

# View logs from last hour
docker-compose -f docker-compose.prod.yml logs --since 1h backend
```

### Health Checks

```bash
# Check application health
curl https://yourdomain.com/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected"}

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check system resources
docker stats
```

### Update Application

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@<your-elastic-ip>

# Navigate to project directory
cd Specify

# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Update services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d

# Run migrations (if any)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify health
curl https://yourdomain.com/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Backup & Recovery

### Database Backups

**Manual Backup**:
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U lms_user lms_prod > backup.sql

# Compress backup
gzip backup.sql
```

**Automated Daily Backups**:
```bash
# Create backup script
nano /home/ubuntu/backup.sh

# Add script content:
#!/bin/bash
cd /home/ubuntu/Specify
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U lms_user lms_prod | gzip > /home/ubuntu/backups/lms_$(date +\%Y\%m\%d).sql.gz

# Make executable
chmod +x /home/ubuntu/backup.sh

# Add cron job (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/ubuntu/backup.sh
```

**Backup Retention**:
```bash
# Keep last 7 days
find /home/ubuntu/backups -name "lms_*.sql.gz" -mtime +7 -delete
```

### Restore from Backup

```bash
# Stop application
docker-compose -f docker-compose.prod.yml down

# Restore database
gunzip < /home/ubuntu/backups/lms_20250113.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U lms_user lms_prod

# Start application
docker-compose -f docker-compose.prod.yml up -d

# Verify health
curl https://yourdomain.com/health
```

---

## Troubleshooting

### Issue: Cannot connect to EC2

**Solution**:
```bash
# Check Security Group allows SSH from your IP
# AWS Console → EC2 → Security Groups → Edit inbound rules

# Verify SSH key permissions
chmod 400 your-key.pem

# Try verbose SSH
ssh -v -i your-key.pem ubuntu@<your-elastic-ip>
```

### Issue: Domain not resolving

**Solution**:
```bash
# Check DNS propagation
nslookup yourdomain.com

# Wait 5-30 minutes for DNS propagation
# Clear DNS cache on your computer
```

### Issue: SSL certificate generation failed

**Solution**:
```bash
# Ensure port 80 is open in Security Group
# Ensure Nginx is stopped
docker-compose -f docker-compose.prod.yml stop nginx

# Try again
sudo certbot --nginx -d yourdomain.com

# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log
```

### Issue: Docker containers won't start

**Solution**:
```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Clean rebuild
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Issue: Database connection failed

**Solution**:
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

### Issue: Application returns 502 Bad Gateway

**Solution**:
```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Security Checklist

- [ ] HTTPS enforced (TLS 1.2+) with Let's Encrypt
- [ ] HTTP to HTTPS redirect configured
- [ ] SSL certificate auto-renewal configured
- [ ] Security headers configured (X-Frame-Options, CSP, HSTS)
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
- [ ] AWS Security Group configured (ports 22, 80, 443 open)
- [ ] SSH key-based authentication (disable password login)
- [ ] Elastic IP allocated (IP doesn't change on restart)
- [ ] Domain configured with DNS A record
- [ ] Let's Encrypt certificate installed and verified

---

## Support

For deployment issues:
- **GitHub Issues**: https://github.com/JoelSiahaan/Specify/issues
- **Email**: joel.siahaan@example.com
- **Documentation**: See `.kiro/steering/deployment-workflow.md`

---

## Additional Resources

- **AWS EC2 Documentation**: https://docs.aws.amazon.com/ec2/
- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/
- **Docker Documentation**: https://docs.docker.com/
- **Nginx Documentation**: https://nginx.org/en/docs/
