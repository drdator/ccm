import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
// Use SQLite models for local development
const CommandModel = process.env.NODE_ENV === 'production'
  ? (await import('../models/Command.js')).CommandModel
  : (await import('../models/Command-sqlite.js')).CommandModel;
import { parseCommandYaml } from '../utils/validation.js';

// Enhanced Fastify schemas with validation
const listCommandsSchema = {
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'number', minimum: 0, default: 0 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              author_id: { type: 'number' },
              downloads: { type: 'number' },
              published_at: { type: 'string' },
              updated_at: { type: 'string' },
              author_username: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  }
};

const searchCommandsSchema = {
  querystring: {
    type: 'object',
    required: ['q'],
    properties: {
      q: { type: 'string', minLength: 1, maxLength: 100 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'number', minimum: 0, default: 0 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              author_id: { type: 'number' },
              downloads: { type: 'number' },
              published_at: { type: 'string' },
              updated_at: { type: 'string' },
              author_username: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        query: { type: 'string' },
        pagination: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

const getCommandSchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      version: { type: 'string', maxLength: 20 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        command: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            author_id: { type: 'number' },
            downloads: { type: 'number' },
            published_at: { type: 'string' },
            updated_at: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

const downloadCommandSchema = {
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      version: { type: 'string', maxLength: 20 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string' },
        author_id: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

const publishCommandSchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['metadata', 'files'],
    properties: {
      metadata: { type: 'string', minLength: 1 },
      files: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          required: ['filename', 'content'],
          properties: {
            filename: { 
              type: 'string', 
              pattern: '\\.md$',
              minLength: 1,
              maxLength: 255 
            },
            content: { 
              type: 'string', 
              minLength: 1,
              maxLength: 50000 
            }
          },
          additionalProperties: false
        }
      }
    },
    additionalProperties: false
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        command: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            author_id: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
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

export default async function commandRoutes(fastify: FastifyInstance) {
  // List all commands
  fastify.get('/', {
    schema: listCommandsSchema
  }, async (request: FastifyRequest<{
    Querystring: { limit?: number; offset?: number }
  }>, reply) => {
    try {
      const limit = Math.min(request.query.limit || 20, 100);
      const offset = request.query.offset || 0;
      
      const commands = await CommandModel.list(limit, offset);
      
      // Add tags to each command
      const commandsWithTags = await Promise.all(
        commands.map(async (cmd: any) => ({
          ...cmd,
          tags: await CommandModel.getTags(cmd.id)
        }))
      );
      
      return reply.status(200).send({
        commands: commandsWithTags,
        pagination: {
          limit,
          offset,
          total: commandsWithTags.length
        }
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Search commands
  fastify.get('/search', {
    schema: searchCommandsSchema
  }, async (request: FastifyRequest<{
    Querystring: { q: string; limit?: number; offset?: number }
  }>, reply) => {
    try {
      const { q: query } = request.query;
      const limit = Math.min(request.query.limit || 20, 100);
      const offset = request.query.offset || 0;
      
      const commands = await CommandModel.search(query, limit, offset);
      
      // Add tags to each command
      const commandsWithTags = await Promise.all(
        commands.map(async (cmd: any) => ({
          ...cmd,
          tags: await CommandModel.getTags(cmd.id)
        }))
      );
      
      return reply.status(200).send({
        commands: commandsWithTags,
        query,
        pagination: {
          limit,
          offset,
          total: commandsWithTags.length
        }
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get specific command
  fastify.get('/:name', {
    schema: getCommandSchema
  }, async (request: FastifyRequest<{
    Params: { name: string };
    Querystring: { version?: string }
  }>, reply) => {
    try {
      const { name } = request.params;
      const { version } = request.query;
      
      const command = await CommandModel.findByName(name, version);
      if (!command) {
        return reply.status(404).send({
          error: 'Command not found'
        });
      }
      
      const tags = await CommandModel.getTags(command.id);
      
      return reply.status(200).send({
        command: {
          ...command,
          tags
        }
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Download command files
  fastify.get('/:name/download', {
    schema: downloadCommandSchema
  }, async (request: FastifyRequest<{
    Params: { name: string };
    Querystring: { version?: string }
  }>, reply) => {
    try {
      const { name } = request.params;
      const { version } = request.query;
      
      const command = await CommandModel.findByName(name, version);
      if (!command) {
        return reply.status(404).send({
          error: 'Command not found'
        });
      }
      
      // Get files
      const files = await CommandModel.getFiles(command.id);
      const tags = await CommandModel.getTags(command.id);
      
      // Track download
      const ipAddress = request.ip;
      const userId = (request as any).user?.id;
      await CommandModel.incrementDownloads(command.id, userId, ipAddress);
      
      return reply.status(200).send({
        name: command.name,
        version: command.version,
        description: command.description,
        author_id: command.author_id,
        tags,
        files: files.map((f: any) => ({
          filename: f.filename,
          content: f.content
        }))
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Publish new command (protected route)
  fastify.post('/', {
    schema: publishCommandSchema,
    preHandler: authenticateHook
  }, async (request: FastifyRequest<{
    Body: { 
      metadata: string; 
      files: Array<{ filename: string; content: string }> 
    }
  }>, reply) => {
    try {
      const userId = (request as any).user.id;
      
      // Validate command package
      const { metadata, files } = request.body;
      
      // Parse and validate metadata
      let parsedMetadata;
      try {
        parsedMetadata = parseCommandYaml(metadata);
      } catch (error: any) {
        return reply.status(400).send({
          error: `Invalid metadata format: ${error.message}`
        });
      }
      
      const { name, version, description, tags } = parsedMetadata;
      
      if (!name || !version) {
        return reply.status(400).send({
          error: 'Command name and version are required'
        });
      }
      
      // Check if command version already exists
      const existing = await CommandModel.findByName(name, version);
      if (existing) {
        return reply.status(409).send({
          error: `Command ${name}@${version} already exists`
        });
      }
      
      // Create command
      const command = await CommandModel.create(
        name,
        version,
        description || '',
        userId,
        files
      );
      
      // Add tags if provided
      if (tags && Array.isArray(tags)) {
        await CommandModel.addTags(command.id, tags);
      }
      
      return reply.status(201).send({
        message: 'Command published successfully',
        command: {
          ...command,
          tags: tags || []
        }
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
}