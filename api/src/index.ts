import Fastify from 'fastify';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import commandRoutes from './routes/commands.js';

// Extend FastifyRequest to include startTime
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

// Load environment variables
dotenv.config();

// Initialize database (SQLite)
import('./config/database-sqlite.js').then(({ initializeDatabase }) => {
  initializeDatabase().catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
});

const PORT = process.env.PORT || 3000;

// Create Fastify instance with Pino structured logging
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }),
    serializers: {
      req: (request) => ({
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type']
        },
        remoteAddress: request.ip
      }),
      res: (reply) => ({
        statusCode: reply.statusCode
      })
    }
  }
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

// Register rate limiting
await fastify.register(import('@fastify/rate-limit'), {
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  timeWindow: '15 minutes',
  // More restrictive for auth endpoints
  keyGenerator: (request) => {
    return request.ip + (request.url.includes('/auth') ? ':auth' : '');
  },
  errorResponseBuilder: (request, context) => {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
      expiresIn: Math.round(context.ttl / 1000)
    };
  }
});

// Add performance monitoring hooks
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onSend', async (request, reply, payload) => {
  const duration = Date.now() - (request.startTime || 0);
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
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
    fastify.log.info({
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      framework: 'Fastify',
      version: '5.4.0'
    }, 'CCM Registry API started successfully');
  } catch (err) {
    fastify.log.error(err, 'Failed to start server');
    process.exit(1);
  }
};

start();