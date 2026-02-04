#!/bin/sh
set -e

# Create uploads directory with proper permissions
# This runs AFTER volume mount, so ownership stays as nodejs user
mkdir -p /app/uploads/assignments /app/uploads/courses/materials

# Generate Prisma client
npx prisma generate

# Start application
exec node dist/main.js
