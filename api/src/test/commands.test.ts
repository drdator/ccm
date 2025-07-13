import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, testUser } from './helpers/build-app.js';
import './setup.js';

describe('Commands API', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: number;

  const testCommand = {
    metadata: {
      name: 'test-command',
      version: '1.0.0',
      description: 'A test command package',
      tags: ['test', 'demo']
    },
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

  beforeEach(async () => {
    app = await buildApp();
    
    // Register and login to get auth token for protected routes
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser
    });
    
    const registerData = registerResponse.json();
    authToken = registerData.token;
    userId = registerData.user?.id;
  });

  describe('GET /api/commands', () => {
    beforeEach(async () => {
      // Publish a test command
      await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });
    });

    it('should list commands successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.commands).toBeDefined();
      expect(Array.isArray(data.commands)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.offset).toBe(0);
    });

    it('should respect limit and offset parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands?limit=5&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.offset).toBe(0);
    });

    it('should include tags in command responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      const testCmd = data.commands.find((cmd: any) => cmd.name === 'test-command');
      if (testCmd) {
        expect(testCmd.tags).toBeDefined();
        expect(Array.isArray(testCmd.tags)).toBe(true);
      }
    });

    it('should validate limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands?limit=101' // Over maximum
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/commands/search', () => {
    beforeEach(async () => {
      // Publish a test command
      await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });
    });

    it('should search commands successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/search?q=test'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.commands).toBeDefined();
      expect(data.query).toBe('test');
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.commands)).toBe(true);
    });

    it('should fail without search query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/search'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return empty results for non-existent query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/search?q=nonexistentcommand123'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.commands).toHaveLength(0);
    });

    it('should validate search query length', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/search?q=' // Empty query
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/commands/:name', () => {
    beforeEach(async () => {
      // Publish a test command
      await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });
    });

    it('should get specific command successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/test-command'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.command).toBeDefined();
      expect(data.command.name).toBe('test-command');
      expect(data.command.version).toBe('1.0.0');
      expect(data.command.description).toBe('A test command package');
      expect(data.command.tags).toBeDefined();
    });

    it('should get specific version of command', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/test-command?version=1.0.0'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.command.version).toBe('1.0.0');
    });

    it('should return 404 for non-existent command', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/non-existent-command'
      });

      expect(response.statusCode).toBe(404);
      const data = response.json();
      expect(data.error).toBe('Command not found');
    });
  });

  describe('GET /api/commands/:name/download', () => {
    beforeEach(async () => {
      // Publish a test command
      await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });
    });

    it('should download command successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/test-command/download'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.name).toBe('test-command');
      expect(data.version).toBe('1.0.0');
      expect(data.description).toBe('A test command package');
      expect(data.files).toBeDefined();
      expect(data.tags).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
      expect(data.files).toHaveLength(1);
      expect(data.files[0].filename).toBe('hello.md');
      expect(data.files[0].content).toContain('# Hello Command');
    });

    it('should return 404 for non-existent command download', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/non-existent-command/download'
      });

      expect(response.statusCode).toBe(404);
      const data = response.json();
      expect(data.error).toBe('Command not found');
    });
  });

  describe('POST /api/commands', () => {
    it('should publish command successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.message).toBe('Command published successfully');
      expect(data.command.name).toBe('test-command');
      expect(data.command.version).toBe('1.0.0');
      expect(data.command.description).toBe('A test command package');
      expect(data.command.tags).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        payload: testCommand
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.error).toBe('Access token required');
    });

    it('should fail with invalid metadata', async () => {
      const invalidCommand = {
        metadata: {
          name: 'test-invalid'
          // Missing required version field
        },
        files: testCommand.files
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: invalidCommand
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe('Bad Request');
    });

    it('should fail with missing required fields', async () => {
      const incompleteCommand = {
        metadata: {
          name: 'test-incomplete'
          // Missing version
        },
        files: testCommand.files
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: incompleteCommand
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe('Bad Request');
    });

    it('should fail with no files', async () => {
      const commandWithoutFiles = {
        metadata: testCommand.metadata,
        files: []
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: commandWithoutFiles
      });

      expect(response.statusCode).toBe(400);
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: commandWithInvalidFile
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with duplicate command version', async () => {
      // Publish first command
      await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });

      // Try to publish same version again
      const response = await app.inject({
        method: 'POST',
        url: '/api/commands',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: testCommand
      });

      expect(response.statusCode).toBe(409);
      const data = response.json();
      expect(data.error).toContain('already exists');
    });
  });
});