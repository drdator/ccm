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

// Test user data
export const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

export const testUser2 = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password456'
};