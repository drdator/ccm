import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, testUser } from './helpers/build-app.js';
import './setup.js';

describe('Commands Version Grouping', () => {
  let app: FastifyInstance;
  let authToken: string;

  const createTestCommand = (version: string, description: string) => ({
    metadata: {
      name: 'versioned-command',
      version,
      description,
      tags: ['test', 'versioning']
    },
    files: [
      {
        filename: 'hello.md',
        content: `---
description: Test hello command v${version}
author: Test User
tags: ["test"]
arguments: true
---

# Hello Command v${version}

${description}

$ARGUMENTS`
      }
    ]
  });

  beforeEach(async () => {
    app = await buildApp();
    
    // Register and login to get auth token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser
    });
    
    const registerData = registerResponse.json();
    authToken = registerData.token;
  });

  describe('Version Grouping', () => {
    beforeEach(async () => {
      // Publish multiple versions of the same command
      const versions = [
        { version: '1.0.0', description: 'Initial version' },
        { version: '1.1.0', description: 'Bug fixes' },
        { version: '2.0.0', description: 'Major update with breaking changes' }
      ];

      for (const { version, description } of versions) {
        await app.inject({
          method: 'POST',
          url: '/api/commands',
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: createTestCommand(version, description)
        });
        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should list only latest version of each package', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      // Should only have one entry for 'versioned-command'
      const versionedCommands = data.commands.filter((cmd: any) => cmd.name === 'versioned-command');
      expect(versionedCommands.length).toBe(1);
      
      // Should be the latest version (2.0.0)
      expect(versionedCommands[0].version).toBe('2.0.0');
      expect(versionedCommands[0].description).toBe('Major update with breaking changes');
    });

    it('should return all versions via /api/commands/:name/versions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/versioned-command/versions'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data.name).toBe('versioned-command');
      expect(data.versions).toBeDefined();
      expect(Array.isArray(data.versions)).toBe(true);
      expect(data.versions.length).toBe(3);
      
      // Should be ordered by published_at DESC (newest first)
      expect(data.versions[0].version).toBe('2.0.0');
      expect(data.versions[1].version).toBe('1.1.0');
      expect(data.versions[2].version).toBe('1.0.0');
      
      // Each version should have tags
      data.versions.forEach((version: any) => {
        expect(version.tags).toBeDefined();
        expect(Array.isArray(version.tags)).toBe(true);
      });
    });

    it('should return 404 for non-existent package versions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/non-existent-package/versions'
      });

      expect(response.statusCode).toBe(404);
      const data = response.json();
      expect(data.error).toBe('Package not found');
    });

    it('should download specific version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/versioned-command/download?version=1.0.0'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data.name).toBe('versioned-command');
      expect(data.version).toBe('1.0.0');
      expect(data.files).toBeDefined();
      expect(data.files[0].content).toContain('v1.0.0');
      expect(data.files[0].content).toContain('Initial version');
    });

    it('should download latest version when no version specified', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/versioned-command/download'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data.name).toBe('versioned-command');
      expect(data.version).toBe('2.0.0');
      expect(data.files[0].content).toContain('v2.0.0');
      expect(data.files[0].content).toContain('Major update with breaking changes');
    });

    it('should get specific version details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/versioned-command?version=1.1.0'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data.command.name).toBe('versioned-command');
      expect(data.command.version).toBe('1.1.0');
      expect(data.command.description).toBe('Bug fixes');
    });
  });

  describe('Search with Version Grouping', () => {
    beforeEach(async () => {
      // Publish multiple versions of multiple commands
      const commands = [
        { name: 'search-test-a', versions: ['1.0.0', '1.1.0', '2.0.0'] },
        { name: 'search-test-b', versions: ['0.1.0', '0.2.0'] }
      ];

      for (const cmd of commands) {
        for (const version of cmd.versions) {
          await app.inject({
            method: 'POST',
            url: '/api/commands',
            headers: {
              authorization: `Bearer ${authToken}`
            },
            payload: {
              metadata: {
                name: cmd.name,
                version,
                description: `Test command ${cmd.name} version ${version}`,
                tags: ['search', 'test']
              },
              files: [{
                filename: 'test.md',
                content: '# Test\n\nSearch test content'
              }]
            }
          });
        }
      }
    });

    it('should search and return latest versions only', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands/search?q=search-test'
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      // Should have 2 results (one for each package)
      const searchResults = data.commands.filter((cmd: any) => cmd.name.startsWith('search-test'));
      expect(searchResults.length).toBe(2);
      
      // Each should be the latest version
      const testA = searchResults.find((cmd: any) => cmd.name === 'search-test-a');
      const testB = searchResults.find((cmd: any) => cmd.name === 'search-test-b');
      
      expect(testA.version).toBe('2.0.0');
      expect(testB.version).toBe('0.2.0');
    });
  });
});