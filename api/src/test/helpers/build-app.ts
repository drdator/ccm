import Fastify, { FastifyInstance } from 'fastify';
import authRoutes from '../../routes/auth.js';
import commandRoutes from '../../routes/commands.js';

export async function buildApp(opts = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disable logging in tests
    ...opts
  });

  // Register plugins
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false
  });

  await app.register(import('@fastify/cors'), {
    origin: true,
    credentials: true
  });

  // Register rate limiting with generous limits for testing
  await app.register(import('@fastify/rate-limit'), {
    max: 1000, // Very high for testing
    timeWindow: '1 minute'
  });

  // Register routes
  app.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      framework: 'Fastify',
      version: '5.4.0',
      uptime: process.uptime()
    };
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(commandRoutes, { prefix: '/api/commands' });

  return app;
}

// Test user data with complex passwords
export const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123!'
};

export const testUser2 = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'Password456!'
};