import type { SuperTest, Test } from 'supertest';
// @ts-ignore - supertest will be installed
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from '../middleware/errorHandler.js';
import authRoutes from '../routes/auth.js';
import commandRoutes from '../routes/commands.js';

// Create test app instance
export function createTestApp() {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/commands', commandRoutes);
  
  // Error handling
  app.use(errorHandler);
  
  return app;
}

// Test user credentials
export const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!@#'
};

export const testUser2 = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'Test456!@#'
};

// Helper to register and login a test user
export async function createAuthenticatedUser(app: express.Application, user = testUser) {
  // Register user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(user);
  
  return {
    user: registerRes.body.user,
    token: registerRes.body.token,
    apiKey: registerRes.body.user.api_key
  };
}

// Test command data
export const testCommand = {
  metadata: `name: test-command
version: 1.0.0
description: A test command
tags: ["test", "example"]`,
  files: [{
    filename: 'test-command.md',
    content: `---
description: A test command
arguments: true
---

# Test Command

This is a test command for unit tests.

$ARGUMENTS`
  }]
};