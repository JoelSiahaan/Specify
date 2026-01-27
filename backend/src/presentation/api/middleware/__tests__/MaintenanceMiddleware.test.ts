/**
 * Maintenance Mode Middleware Tests
 * 
 * Tests maintenance mode middleware functionality.
 * Requirements: 21.4 - Maintenance mode support
 */

import { Request, Response, NextFunction } from 'express';
import { maintenanceMode, getMaintenanceStatus } from '../MaintenanceMiddleware';
import { logger } from '../../../../infrastructure/logging/logger';

// Mock logger
jest.mock('../../../../infrastructure/logging/logger', () => ({
  logger: {
    warn: jest.fn()
  }
}));

describe('MaintenanceMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original environment
    originalEnv = process.env;

    mockRequest = {
      method: 'GET',
      path: '/api/courses',
      ip: '127.0.0.1'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('maintenanceMode', () => {
    it('should allow request when maintenance mode is disabled', () => {
      process.env.MAINTENANCE_MODE = 'false';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should allow request when MAINTENANCE_MODE is not set', () => {
      delete process.env.MAINTENANCE_MODE;

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should block request when maintenance mode is enabled', () => {
      process.env.MAINTENANCE_MODE = 'true';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'SERVICE_UNAVAILABLE',
        message: 'The system is currently undergoing maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should log blocked request in maintenance mode', () => {
      process.env.MAINTENANCE_MODE = 'true';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.warn).toHaveBeenCalledWith('Request blocked - maintenance mode active', {
        method: 'GET',
        path: '/api/courses',
        ip: '127.0.0.1'
      });
    });

    it('should allow health check endpoint even in maintenance mode', () => {
      process.env.MAINTENANCE_MODE = 'true';
      mockRequest.path = '/health';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should block POST requests in maintenance mode', () => {
      process.env.MAINTENANCE_MODE = 'true';
      mockRequest.method = 'POST';
      mockRequest.path = '/api/courses';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block PUT requests in maintenance mode', () => {
      process.env.MAINTENANCE_MODE = 'true';
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/courses/123';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block DELETE requests in maintenance mode', () => {
      process.env.MAINTENANCE_MODE = 'true';
      mockRequest.method = 'DELETE';
      mockRequest.path = '/api/courses/123';

      maintenanceMode(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('getMaintenanceStatus', () => {
    it('should return enabled: false when maintenance mode is disabled', () => {
      process.env.MAINTENANCE_MODE = 'false';

      const status = getMaintenanceStatus();

      expect(status).toEqual({
        enabled: false,
        message: 'System is operational'
      });
    });

    it('should return enabled: false when MAINTENANCE_MODE is not set', () => {
      delete process.env.MAINTENANCE_MODE;

      const status = getMaintenanceStatus();

      expect(status).toEqual({
        enabled: false,
        message: 'System is operational'
      });
    });

    it('should return enabled: true when maintenance mode is enabled', () => {
      process.env.MAINTENANCE_MODE = 'true';

      const status = getMaintenanceStatus();

      expect(status).toEqual({
        enabled: true,
        message: 'System is in maintenance mode'
      });
    });
  });
});
