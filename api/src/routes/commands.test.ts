import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth.js';
import commandRoutes from './commands.js';
import { initializeDatabase } from '../config/database-sqlite.js';

describe('Commands Routes', () => {
  let app: express.Application;
  let db: any;
  let authToken: string;
  let userId: number;

  const testUser = {
    username: 'commandstest',
    email: 'commandstest@example.com',
    password: 'password123'
  };

  const testCommand = {
    metadata: `name: test-command
version: 1.0.0
description: A test command package
tags: ["test", "demo"]`,
    files: [
      {
        filename: 'hello.md',
        content: `---
description: Test hello command
author: Test User
tags: ["test"]
arguments: true
---

# Hello Command

This is a test command.

$ARGUMENTS`
      }
    ]
  };

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Initialize test database
    await initializeDatabase();
    const { getDatabase } = await import('../config/database-sqlite.js');
    db = await getDatabase();
    
    // Setup Express app for testing
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/commands', commandRoutes);

    // Register test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (db) {
      await db.exec('DELETE FROM commands WHERE name LIKE "test-%"');
      await db.exec('DELETE FROM command_files WHERE command_id IN (SELECT id FROM commands WHERE name LIKE "test-%")');
      await db.exec('DELETE FROM tags WHERE command_id IN (SELECT id FROM commands WHERE name LIKE "test-%")');
    }
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('GET /api/commands', () => {
    beforeEach(async () => {
      // Create a test command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand);
    });

    it('should list commands successfully', async () => {
      const response = await request(app)
        .get('/api/commands')
        .expect(200);

      expect(response.body).toHaveProperty('commands');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.commands)).toBe(true);
      expect(response.body.pagination).toMatchObject({
        limit: 20,
        offset: 0
      });
    });

    it('should respect limit and offset parameters', async () => {
      const response = await request(app)
        .get('/api/commands?limit=5&offset=0')
        .expect(200);

      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should include tags in command responses', async () => {
      const response = await request(app)
        .get('/api/commands')
        .expect(200);

      const testCmd = response.body.commands.find((cmd: any) => cmd.name === 'test-command');
      if (testCmd) {
        expect(testCmd).toHaveProperty('tags');
        expect(Array.isArray(testCmd.tags)).toBe(true);
      }
    });
  });

  describe('GET /api/commands/search', () => {
    beforeEach(async () => {
      // Create a test command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand);
    });

    it('should search commands successfully', async () => {
      const response = await request(app)
        .get('/api/commands/search?q=test')
        .expect(200);

      expect(response.body).toHaveProperty('commands');
      expect(response.body).toHaveProperty('query', 'test');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.commands)).toBe(true);
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/commands/search')
        .expect(400);

      expect(response.body.error).toContain('Search query required');
    });

    it('should return empty results for non-existent query', async () => {
      const response = await request(app)
        .get('/api/commands/search?q=nonexistentcommand123')
        .expect(200);

      expect(response.body.commands).toHaveLength(0);
    });
  });

  describe('GET /api/commands/:name', () => {
    beforeEach(async () => {
      // Create a test command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand);
    });

    it('should get specific command successfully', async () => {
      const response = await request(app)
        .get('/api/commands/test-command')
        .expect(200);

      expect(response.body).toHaveProperty('command');
      expect(response.body.command).toMatchObject({
        name: 'test-command',
        version: '1.0.0',
        description: 'A test command package'
      });
      expect(response.body.command).toHaveProperty('tags');
    });

    it('should get specific version of command', async () => {
      const response = await request(app)
        .get('/api/commands/test-command?version=1.0.0')
        .expect(200);

      expect(response.body.command.version).toBe('1.0.0');
    });

    it('should return 404 for non-existent command', async () => {
      const response = await request(app)
        .get('/api/commands/non-existent-command')
        .expect(404);

      expect(response.body.error).toContain('Command not found');
    });
  });

  describe('GET /api/commands/:name/download', () => {
    beforeEach(async () => {
      // Create a test command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand);
    });

    it('should download command successfully', async () => {
      const response = await request(app)
        .get('/api/commands/test-command/download')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'test-command',
        version: '1.0.0',
        description: 'A test command package'
      });
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0]).toMatchObject({
        filename: 'hello.md',
        content: expect.stringContaining('# Hello Command')
      });
    });

    it('should return 404 for non-existent command download', async () => {
      const response = await request(app)
        .get('/api/commands/non-existent-command/download')
        .expect(404);

      expect(response.body.error).toContain('Command not found');
    });
  });

  describe('POST /api/commands', () => {
    it('should publish command successfully', async () => {
      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Command published successfully',
        command: {
          name: 'test-command',
          version: '1.0.0',
          description: 'A test command package'
        }
      });
      expect(response.body.command).toHaveProperty('tags');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/commands')
        .send(testCommand)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid metadata', async () => {
      const invalidCommand = {
        metadata: 'invalid yaml content',
        files: testCommand.files
      };

      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCommand)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing required fields', async () => {
      const incompleteCommand = {
        metadata: `name: test-incomplete
# Missing version`,
        files: testCommand.files
      };

      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteCommand)
        .expect(400);

      expect(response.body.error).toContain('version');
    });

    it('should fail with no files', async () => {
      const commandWithoutFiles = {
        metadata: testCommand.metadata,
        files: []
      };

      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commandWithoutFiles)
        .expect(400);

      expect(response.body.error).toContain('At least one command file is required');
    });

    it('should fail with non-markdown files', async () => {
      const commandWithInvalidFile = {
        metadata: testCommand.metadata,
        files: [
          {
            filename: 'script.js',
            content: 'console.log("hello");'
          }
        ]
      };

      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commandWithInvalidFile)
        .expect(400);

      expect(response.body.error).toContain('Markdown (.md) files');
    });

    it('should fail with duplicate command version', async () => {
      // Publish first command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand);

      // Try to publish same version again
      const response = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommand)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });
});