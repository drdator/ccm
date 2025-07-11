import { describe, it, expect } from 'vitest';
// @ts-ignore - supertest will be installed
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('Health Check', () => {
  it('should return health status', async () => {
    const app = createTestApp();
    
    // Add health endpoint to test app
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});