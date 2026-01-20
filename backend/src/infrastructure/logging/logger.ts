/**
 * Winston Logger Configuration
 * 
 * Structured logging with Winston for error tracking and debugging.
 * Logs to console and files with JSON format.
 * 
 * Requirements:
 * - 21.3: Logging
 * - 21.2: Error tracking
 */

import winston from 'winston';
import path from 'path';

/**
 * Log levels:
 * - error: Errors that need immediate attention
 * - warn: Warnings that should be investigated
 * - info: Important business events
 * - debug: Detailed debugging information
 */
const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'lms-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            metaStr = '\n' + JSON.stringify(meta, null, 2);
          }
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  logger.add(new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  // Combined log file
  logger.add(new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

/**
 * Log request information
 */
export function logRequest(method: string, path: string, userId?: string): void {
  logger.info('HTTP Request', {
    method,
    path,
    userId
  });
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: {
    method?: string;
    path?: string;
    userId?: string;
    [key: string]: any;
  }
): void {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  });
}
