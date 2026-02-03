/**
 * Maintenance Mode Middleware
 * 
 * Returns 503 Service Unavailable when system is in maintenance mode.
 * Requirements: 21.4 - Maintenance mode support
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logging/logger.js';

/**
 * Check if maintenance mode is enabled
 * Controlled by MAINTENANCE_MODE environment variable
 */
function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

/**
 * Maintenance mode middleware
 * Returns 503 Service Unavailable when maintenance mode is enabled
 * 
 * Allows health check endpoint to pass through for monitoring
 */
export function maintenanceMode(req: Request, res: Response, next: NextFunction): void {
  // Allow health check endpoint even in maintenance mode
  if (req.path === '/health') {
    next();
    return;
  }

  // Check if maintenance mode is enabled
  if (isMaintenanceMode()) {
    logger.warn('Request blocked - maintenance mode active', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    res.status(503).json({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The system is currently undergoing maintenance. Please try again later.',
      maintenanceMode: true
    });
    return;
  }

  next();
}

/**
 * Get maintenance mode status
 * Useful for health checks and monitoring
 */
export function getMaintenanceStatus(): { enabled: boolean; message?: string } {
  const enabled = isMaintenanceMode();
  
  return {
    enabled,
    message: enabled 
      ? 'System is in maintenance mode' 
      : 'System is operational'
  };
}
