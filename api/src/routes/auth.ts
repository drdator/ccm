import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
// Use SQLite models for local development
const UserModel = process.env.NODE_ENV === 'production' 
  ? (await import('../models/User.js')).UserModel
  : (await import('../models/User-sqlite.js')).UserModel;

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
        minLength: 6,
        maxLength: 128 
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
        reject(err);
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
  // Register user
  fastify.post('/register', {
    schema: registerSchema
  }, async (request: FastifyRequest<{
    Body: { username: string; email: string; password: string }
  }>, reply) => {
    try {
      const { username, email, password } = request.body;

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