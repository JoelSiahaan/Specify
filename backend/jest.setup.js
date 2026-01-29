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

// Test Database Configuration
// Uses dedicated test database on port 5433 (postgres-test service in Docker Compose)
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://lms_test_user:test_password@localhost:5433/lms_test';

// Increase test timeout for integration tests
jest.setTimeout(5000);
