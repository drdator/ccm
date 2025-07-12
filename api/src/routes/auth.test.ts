import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth.js';
import { initializeDatabase } from '../config/database-sqlite.js';

describe('Authentication Routes', () => {
  let app: express.Application;
  let db: any;

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
    
    // Mount auth routes
    app.use('/api/auth', authRoutes);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (db) {
      await db.exec('DELETE FROM users WHERE username LIKE "test%"');
    }
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          username: 'testuser',
          email: 'test@example.com'
        }
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com', 
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'different@example.com',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'differentuser',
          email: 'test3@example.com',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser4'
          // Missing email and password
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser5',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      username: 'logintest',
      email: 'logintest@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        user: {
          username: testUser.username,
          email: testUser.email
        }
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.user.username).toBe(testUser.username);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username
          // Missing password
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/regenerate-api-key', () => {
    let authToken: string;
    const testUser = {
      username: 'apikeytest',
      email: 'apikeytest@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      authToken = registerResponse.body.token;
    });

    it('should generate API key for authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/regenerate-api-key')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'API key generated successfully'
      });
      expect(response.body.apiKey).toBeDefined();
      expect(typeof response.body.apiKey).toBe('string');
      expect(response.body.apiKey.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/regenerate-api-key')
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/regenerate-api-key')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});