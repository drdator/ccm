import Fastify from 'fastify';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import commandRoutes from './routes/commands.js';

// Load environment variables
dotenv.config();

// Initialize database (SQLite for local development)
if (process.env.NODE_ENV !== 'production') {
  import('./config/database-sqlite.js').then(({ initializeDatabase }) => {
    initializeDatabase().catch(console.error);
  });
}

const PORT = process.env.PORT || 3000;

// Create Fastify instance
const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    level: 'info'
  } : true
});

// Register Fastify plugins
await fastify.register(import('@fastify/helmet'), {
  // Helmet security headers
  contentSecurityPolicy: false // Disable CSP for API
});

await fastify.register(import('@fastify/cors'), {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : true, // Allow all origins in development
  credentials: true
});

// Add performance monitoring hooks
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onSend', async (request, reply, payload) => {
  const duration = Date.now() - (request as any).startTime;
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`
  }, 'Request completed');
});

// Health check endpoint (native Fastify)
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    framework: 'Fastify',
    version: '5.4.0',
    uptime: process.uptime()
  };
});

// Native Fastify routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(commandRoutes, { prefix: '/api/commands' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: 'localhost' });
    console.log(`🚀 CCM Registry API (Native Fastify) running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ Framework: 100% Native Fastify - Maximum Performance`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();