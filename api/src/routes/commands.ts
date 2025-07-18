import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
// Import SQLite model
import { CommandModel } from '../models/Command-sqlite.js';

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
              repository: { type: 'string' },
              license: { type: 'string' },
              homepage: { type: 'string' },
              category: { type: 'string' },
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
              repository: { type: 'string' },
              license: { type: 'string' },
              homepage: { type: 'string' },
              category: { type: 'string' },
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
            repository: { type: 'string' },
            license: { type: 'string' },
            homepage: { type: 'string' },
            category: { type: 'string' },
            author_id: { type: 'number' },
            author_username: { type: 'string' },
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
        repository: { type: 'string' },
        license: { type: 'string' },
        homepage: { type: 'string' },
        category: { type: 'string' },
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
    properties: {
      authorization: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['metadata', 'files'],
    properties: {
      metadata: { 
        type: 'object',
        required: ['name', 'version'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          version: { type: 'string', minLength: 1, maxLength: 20 },
          description: { type: 'string', maxLength: 500 },
          repository: { type: 'string', format: 'uri', maxLength: 200 },
          license: { type: 'string', maxLength: 50 },
          homepage: { type: 'string', format: 'uri', maxLength: 200 },
          category: { type: 'string', maxLength: 50 },
          keywords: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 }
        },
        additionalProperties: false
      },
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
            repository: { type: 'string' },
            license: { type: 'string' },
            homepage: { type: 'string' },
            category: { type: 'string' },
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

export default async function commandRoutes(fastify: FastifyInstance) {
  // List all commands (grouped by name, showing latest version)
  fastify.get('/', {
    schema: listCommandsSchema
  }, async (request: FastifyRequest<{
    Querystring: { limit?: number; offset?: number }
  }>, reply) => {
    try {
      const limit = Math.min(request.query.limit || 20, 100);
      const offset = request.query.offset || 0;
      
      const commands = await CommandModel.listLatestVersions(limit, offset);
      
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

  // Get all versions of a package
  fastify.get('/:name/versions', async (request: FastifyRequest<{
    Params: { name: string }
  }>, reply) => {
    try {
      const { name } = request.params;
      
      const versions = await CommandModel.getAllVersions(name);
      if (!versions || versions.length === 0) {
        return reply.status(404).send({
          error: 'Package not found'
        });
      }
      
      // Add tags to each version
      const versionsWithTags = await Promise.all(
        versions.map(async (cmd: any) => ({
          ...cmd,
          tags: await CommandModel.getTags(cmd.id)
        }))
      );
      
      return reply.status(200).send({
        name,
        versions: versionsWithTags
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
      metadata: {
        name: string;
        version: string;
        description?: string;
        repository?: string;
        license?: string;
        homepage?: string;
        category?: string;
        keywords?: string[];
        tags?: string[];
      }; 
      files: Array<{ filename: string; content: string }> 
    }
  }>, reply) => {
    try {
      const userId = (request as any).user.id;
      
      // Validate command package
      const { metadata, files } = request.body;
      
      // Extract metadata fields
      const { name, version, description, repository, license, homepage, category, keywords, tags } = metadata;
      
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
      
      // Create command with metadata
      const commandMetadata = {
        repository,
        license,
        homepage,
        category
      };
      
      const command = await CommandModel.create(
        name,
        version,
        description || '',
        userId,
        files,
        commandMetadata
      );
      
      // Add tags and keywords if provided
      const allTags = [];
      if (tags && Array.isArray(tags)) {
        allTags.push(...tags);
      }
      if (keywords && Array.isArray(keywords)) {
        allTags.push(...keywords);
      }
      
      if (allTags.length > 0) {
        await CommandModel.addTags(command.id, allTags);
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