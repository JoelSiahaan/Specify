/**
 * Jest Setup File
 * 
 * This file runs before all tests and sets up the testing environment.
 */

// Import reflect-metadata for dependency injection
require('reflect-metadata');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Increase test timeout for integration tests
jest.setTimeout(10000);
