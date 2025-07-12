import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
// Use SQLite models for local development
const UserModel = process.env.NODE_ENV === 'production' 
  ? (await import('../models/User.js')).UserModel
  : (await import('../models/User-sqlite.js')).UserModel;

// Password validation function
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  return null;
}

// Rate limiting preHandler for auth endpoints
const authRateLimit = {
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Very restrictive for auth
  timeWindow: '15 minutes',
  errorResponseBuilder: (request: any, context: any) => {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Too many authentication attempts, retry in ${Math.round(context.ttl / 1000)} seconds`,
      expiresIn: Math.round(context.ttl / 1000)
    };
  }
};

// Enhanced Fastify schemas with validation
const registerSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: { 
        type: 'string', 
        minLength: 3, 
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$' 
      },
      email: { 
        type: 'string', 
        format: 'email',
        maxLength: 255 
      },
      password: { 
        type: 'string', 
        minLength: 8,
        maxLength: 128,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      }
    },
    additionalProperties: false
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 1 },
      password: { type: 'string', minLength: 1 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

const regenerateApiKeySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        apiKey: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

// Helper function to extract JWT token
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper function to verify JWT token
async function verifyToken(token: string): Promise<any> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          reject(new Error('Token has expired. Please login again.'));
        } else if (err.name === 'JsonWebTokenError') {
          reject(new Error('Invalid token format.'));
        } else {
          reject(new Error('Token verification failed.'));
        }
      } else {
        resolve(decoded);
      }
    });
  });
}

// Authentication hook for protected routes
const authenticateHook = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractToken(request);
    if (!token) {
      return reply.status(401).send({
        error: 'Access token required'
      });
    }

    const decoded = await verifyToken(token);
    
    // Attach user info to request
    (request as any).user = decoded;
  } catch (error) {
    return reply.status(401).send({
      error: 'Invalid or expired token'
    });
  }
};

export default async function authRoutes(fastify: FastifyInstance) {
  // Register rate limiting for auth routes
  await fastify.register(import('@fastify/rate-limit'), authRateLimit);

  // Register user
  fastify.post('/register', {
    schema: registerSchema
  }, async (request: FastifyRequest<{
    Body: { username: string; email: string; password: string }
  }>, reply) => {
    try {
      const { username, email, password } = request.body;

      // Validate password complexity
      const passwordError = validatePassword(password);
      if (passwordError) {
        return reply.status(400).send({
          error: passwordError
        });
      }

      // Check if user already exists
      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return reply.status(409).send({
          error: 'Username already exists'
        });
      }
      
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return reply.status(409).send({
          error: 'Email already exists'
        });
      }

      // Create user
      const user = await UserModel.create(username, email, password);
      
      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return reply.status(201).send({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Login user
  fastify.post('/login', {
    schema: loginSchema
  }, async (request: FastifyRequest<{
    Body: { username: string; password: string }
  }>, reply) => {
    try {
      const { username, password } = request.body;

      // Find user by username or email
      let user = await UserModel.findByUsername(username);
      if (!user) {
        user = await UserModel.findByEmail(username);
      }
      
      if (!user) {
        return reply.status(401).send({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        return reply.status(401).send({
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return reply.status(200).send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Regenerate API key (protected route)
  fastify.post('/regenerate-api-key', {
    schema: regenerateApiKeySchema,
    preHandler: authenticateHook
  }, async (request: FastifyRequest, reply) => {
    try {
      const user = (request as any).user;
      
      // Generate new API key
      const apiKey = await UserModel.regenerateApiKey(user.id);

      return reply.status(200).send({
        message: 'API key generated successfully',
        apiKey
      });

    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
}