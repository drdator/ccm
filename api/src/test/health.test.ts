import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from './helpers/build-app.js';

describe('Health API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
      expect(data.framework).toBe('Fastify');
      expect(data.version).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
    });

    it('should have valid timestamp format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      const data = response.json();
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});