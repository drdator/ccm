import { describe, it, expect, beforeEach } from 'vitest';
// @ts-ignore - supertest will be installed
import request from 'supertest';
import { createTestApp, testUser, testUser2 } from './helpers.js';

describe('Authentication Endpoints', () => {
  let app: any;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User created successfully');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('api_key');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should return error for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Username, email, and password are required');
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'invalid-email',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Invalid email format');
    });

    it('should return error for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'test@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Password must be at least 8 characters');
    });

    it('should return error for duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try to register with same username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'different@example.com'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Username or email already exists');
    });

    it('should return error for duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: 'different'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Username or email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with username successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('should login with email successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
    });

    it('should return error for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should return error for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Username and password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      const token = registerRes.body.token;

      // Get current user info
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return error without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Access token required');
    });

    it('should return error with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/regenerate-api-key', () => {
    it('should regenerate API key successfully', async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      const token = registerRes.body.token;
      const oldApiKey = registerRes.body.user.api_key;

      // Regenerate API key
      const res = await request(app)
        .post('/api/auth/regenerate-api-key')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'API key regenerated successfully');
      expect(res.body).toHaveProperty('api_key');
      expect(res.body.api_key).not.toBe(oldApiKey);
      expect(res.body.api_key).toHaveLength(64); // 32 bytes in hex
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/auth/regenerate-api-key');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Access token required');
    });
  });
});