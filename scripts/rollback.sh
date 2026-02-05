#!/bin/bash

# ========================================
# Emergency Rollback Script
# ========================================
# Use this script to rollback to a previous version
# if deployment fails or causes issues
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 LMS Rollback Script${NC}"
echo ""

# Check if running on EC2
if [ ! -d "/opt/lms" ]; then
  echo -e "${RED}❌ This script must be run on the EC2 server${NC}"
  exit 1
fi

cd /opt/lms

# ========================================
# Show recent commits
# ========================================
echo -e "${GREEN}📜 Recent commits:${NC}"
git log --oneline -10
echo ""

# ========================================
# Ask for commit hash
# ========================================
read -p "Enter commit hash to rollback to (or 'cancel' to abort): " COMMIT_HASH

if [ "$COMMIT_HASH" = "cancel" ]; then
  echo -e "${YELLOW}⚠️  Rollback cancelled${NC}"
  exit 0
fi

# Validate commit hash
if ! git cat-file -e $COMMIT_HASH 2>/dev/null; then
  echo -e "${RED}❌ Invalid commit hash: $COMMIT_HASH${NC}"
  exit 1
fi

# ========================================
# Confirm rollback
# ========================================
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will rollback to commit $COMMIT_HASH${NC}"
echo -e "${YELLOW}Current commit: $(git rev-parse --short HEAD)${NC}"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}⚠️  Rollback cancelled${NC}"
  exit 0
fi

# ========================================
# Backup current state
# ========================================
echo ""
echo -e "${GREEN}💾 Creating backup before rollback...${NC}"

# Backup database
BACKUP_FILE="backups/pre-rollback-$(date +%Y%m%d-%H%M%S).sql.gz"
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U lms_user lms_prod | gzip > "$BACKUP_FILE"

echo -e "${GREEN}✅ Database backup created: $BACKUP_FILE${NC}"

# Save current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
echo $CURRENT_COMMIT > backups/last-commit-before-rollback.txt

# ========================================
# Perform rollback
# ========================================
echo ""
echo -e "${GREEN}🔄 Rolling back to commit $COMMIT_HASH...${NC}"

# Checkout target commit
git fetch origin
git checkout $COMMIT_HASH

# ========================================
# Rebuild and restart services
# ========================================
echo ""
echo -e "${GREEN}🔨 Rebuilding Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo -e "${GREEN}🛑 Stopping current containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo ""
echo -e "${GREEN}▶️  Starting containers with rolled back version...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# ========================================
# Wait for services to be healthy
# ========================================
echo ""
echo -e "${GREEN}⏳ Waiting for services to be healthy...${NC}"

for i in {1..30}; do
  if docker-compose -f docker-compose.prod.yml exec -T backend wget --quiet --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}Check logs: docker-compose -f docker-compose.prod.yml logs backend${NC}"
    exit 1
  fi
  echo "Attempt $i/30: Waiting for backend..."
  sleep 2
done

# ========================================
# Verify rollback
# ========================================
echo ""
echo -e "${GREEN}✅ Verifying rollback...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Rollback Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Rollback Summary:${NC}"
echo "  Previous commit: $CURRENT_COMMIT"
echo "  Current commit:  $COMMIT_HASH"
echo "  Database backup: $BACKUP_FILE"
echo ""
echo -e "${YELLOW}To restore the previous version:${NC}"
echo "  ./scripts/rollback.sh"
echo "  Enter commit: $CURRENT_COMMIT"
echo ""
echo -e "${GREEN}🎉 Application is now running the rolled back version${NC}"
