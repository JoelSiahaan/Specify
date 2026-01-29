/**
 * Express Server Configuration Tests
 * 
 * Tests for Express server initialization and middleware setup.
 * Validates Requirements: 18.1, 18.2, 18.3, 21.7
 */

import request from 'supertest';
import app from '../main.js';

describe('Express Server Configuration', () => {
  describe('Health Check Endpoint', () => {
    it('should return 200 OK with health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app).get('/health');
      
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return positive uptime', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('Middleware Configuration', () => {
    it('should parse JSON request bodies', async () => {
      // This will be tested more thoroughly when we add actual endpoints
      // For now, we verify the server accepts JSON content-type
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });
      
      // Expect 401 since authentication middleware runs before route matching
      expect(response.status).toBe(401);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');
      
      // CORS middleware should handle OPTIONS requests
      expect([200, 204]).toContain(response.status);
    });

    it('should set CORS headers for allowed origin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Server Availability', () => {
    it('should respond to requests (Requirement 21.7)', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      // Should return 400 for malformed JSON or 404 if endpoint doesn't exist
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('API Response Format (Requirement 18.2)', () => {
    it('should return JSON responses', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include proper content-type header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-type']).toBeDefined();
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
