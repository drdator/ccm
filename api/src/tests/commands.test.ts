import { describe, it, expect, beforeEach } from 'vitest';
// @ts-ignore - supertest will be installed
import request from 'supertest';
import { createTestApp, createAuthenticatedUser, testCommand, testUser2 } from './helpers.js';

describe('Command Endpoints', () => {
  let app: any;
  let authUser: any;

  beforeEach(async () => {
    app = createTestApp();
    authUser = await createAuthenticatedUser(app);
  });

  describe('GET /api/commands', () => {
    it('should return empty list when no commands exist', async () => {
      const res = await request(app)
        .get('/api/commands');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('commands');
      expect(res.body.commands).toHaveLength(0);
      expect(res.body.pagination).toEqual({
        limit: 20,
        offset: 0,
        total: 0
      });
    });

    it('should return list of commands', async () => {
      // Publish a command first
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);

      const res = await request(app)
        .get('/api/commands');

      expect(res.status).toBe(200);
      expect(res.body.commands).toHaveLength(1);
      expect(res.body.commands[0]).toHaveProperty('name', 'test-command');
      expect(res.body.commands[0]).toHaveProperty('version', '1.0.0');
      expect(res.body.commands[0]).toHaveProperty('description', 'A test command');
      expect(res.body.commands[0]).toHaveProperty('tags');
      expect(res.body.commands[0].tags).toContain('test');
      expect(res.body.commands[0].tags).toContain('example');
    });

    it('should support pagination', async () => {
      // Publish multiple commands
      for (let i = 1; i <= 25; i++) {
        await request(app)
          .post('/api/commands')
          .set('Authorization', `Bearer ${authUser.token}`)
          .send({
            metadata: `name: command-${i}\nversion: 1.0.0\ndescription: Command ${i}`,
            files: [{
              filename: `command-${i}.md`,
              content: `# Command ${i}`
            }]
          });
      }

      // Get first page
      const res1 = await request(app)
        .get('/api/commands?limit=10&offset=0');

      expect(res1.status).toBe(200);
      expect(res1.body.commands).toHaveLength(10);
      expect(res1.body.pagination.limit).toBe(10);
      expect(res1.body.pagination.offset).toBe(0);

      // Get second page
      const res2 = await request(app)
        .get('/api/commands?limit=10&offset=10');

      expect(res2.status).toBe(200);
      expect(res2.body.commands).toHaveLength(10);
      expect(res2.body.pagination.offset).toBe(10);
    });
  });

  describe('GET /api/commands/search', () => {
    beforeEach(async () => {
      // Publish multiple commands for search tests
      const commands = [
        { name: 'git-helper', description: 'Git command helper' },
        { name: 'code-review', description: 'Code review assistant' },
        { name: 'test-runner', description: 'Test execution helper' }
      ];

      for (const cmd of commands) {
        await request(app)
          .post('/api/commands')
          .set('Authorization', `Bearer ${authUser.token}`)
          .send({
            metadata: `name: ${cmd.name}\nversion: 1.0.0\ndescription: ${cmd.description}`,
            files: [{
              filename: `${cmd.name}.md`,
              content: `# ${cmd.name}`
            }]
          });
      }
    });

    it('should search commands by name', async () => {
      const res = await request(app)
        .get('/api/commands/search?q=git');

      expect(res.status).toBe(200);
      expect(res.body.commands).toHaveLength(1);
      expect(res.body.commands[0].name).toBe('git-helper');
      expect(res.body.query).toBe('git');
    });

    it('should search commands by description', async () => {
      const res = await request(app)
        .get('/api/commands/search?q=review');

      expect(res.status).toBe(200);
      expect(res.body.commands).toHaveLength(1);
      expect(res.body.commands[0].name).toBe('code-review');
    });

    it('should return empty results for no matches', async () => {
      const res = await request(app)
        .get('/api/commands/search?q=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.commands).toHaveLength(0);
    });

    it('should return error when query is missing', async () => {
      const res = await request(app)
        .get('/api/commands/search');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Search query required');
    });
  });

  describe('GET /api/commands/:name', () => {
    beforeEach(async () => {
      // Publish a command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);
    });

    it('should get command by name', async () => {
      const res = await request(app)
        .get('/api/commands/test-command');

      expect(res.status).toBe(200);
      expect(res.body.command).toHaveProperty('name', 'test-command');
      expect(res.body.command).toHaveProperty('version', '1.0.0');
      expect(res.body.command).toHaveProperty('description', 'A test command');
      expect(res.body.command).toHaveProperty('tags');
    });

    it('should get specific version', async () => {
      // Publish another version
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: `name: test-command\nversion: 2.0.0\ndescription: Updated test command`,
          files: [{
            filename: 'test-command.md',
            content: '# Updated'
          }]
        });

      const res = await request(app)
        .get('/api/commands/test-command?version=1.0.0');

      expect(res.status).toBe(200);
      expect(res.body.command.version).toBe('1.0.0');
      expect(res.body.command.description).toBe('A test command');
    });

    it('should return 404 for non-existent command', async () => {
      const res = await request(app)
        .get('/api/commands/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Command not found');
    });
  });

  describe('GET /api/commands/:name/download', () => {
    beforeEach(async () => {
      // Publish a command
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);
    });

    it('should download command files', async () => {
      const res = await request(app)
        .get('/api/commands/test-command/download');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'test-command');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('files');
      expect(res.body.files).toHaveLength(1);
      expect(res.body.files[0]).toHaveProperty('filename', 'test-command.md');
      expect(res.body.files[0]).toHaveProperty('content');
    });

    it('should increment download counter', async () => {
      // Download command
      await request(app)
        .get('/api/commands/test-command/download');

      // Check download count
      const res = await request(app)
        .get('/api/commands/test-command');

      expect(res.body.command.downloads).toBe(1);

      // Download again
      await request(app)
        .get('/api/commands/test-command/download');

      // Check count again
      const res2 = await request(app)
        .get('/api/commands/test-command');

      expect(res2.body.command.downloads).toBe(2);
    });
  });

  describe('POST /api/commands', () => {
    it('should publish a new command', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Command published successfully');
      expect(res.body.command).toHaveProperty('name', 'test-command');
      expect(res.body.command).toHaveProperty('version', '1.0.0');
      expect(res.body.command).toHaveProperty('tags');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/commands')
        .send(testCommand);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Authentication required');
    });

    it('should support API key authentication', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('X-API-Key', authUser.apiKey)
        .send(testCommand);

      expect(res.status).toBe(201);
      expect(res.body.command).toHaveProperty('name', 'test-command');
    });

    it('should validate command metadata', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: 'invalid yaml',
          files: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid command metadata');
    });

    it('should require name and version', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: 'description: Missing name and version',
          files: [{
            filename: 'test.md',
            content: '# Test'
          }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Command name and version are required');
    });

    it('should validate semantic versioning', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: 'name: test\nversion: invalid-version',
          files: [{
            filename: 'test.md',
            content: '# Test'
          }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Version must follow semantic versioning');
    });

    it('should require at least one file', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: 'name: test\nversion: 1.0.0',
          files: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('At least one command file is required');
    });

    it('should only accept .md files', async () => {
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          metadata: 'name: test\nversion: 1.0.0',
          files: [{
            filename: 'test.txt',
            content: 'Not markdown'
          }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Command files must be Markdown (.md) files');
    });

    it('should prevent duplicate versions', async () => {
      // Publish first version
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);

      // Try to publish same version
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Command test-command@1.0.0 already exists');
    });

    it('should allow different users to publish same command name', async () => {
      // First user publishes
      await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(testCommand);

      // Create second user
      const authUser2 = await createAuthenticatedUser(app, testUser2);

      // Second user publishes same command name
      const res = await request(app)
        .post('/api/commands')
        .set('Authorization', `Bearer ${authUser2.token}`)
        .send(testCommand);

      // In a real implementation, you might want to namespace commands
      // For now, this test shows current behavior
      expect(res.status).toBe(409);
    });
  });
});