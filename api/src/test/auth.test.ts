import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, testUser, testUser2 } from './helpers/build-app.js';
import './setup.js';

describe('Authentication API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.message).toBe('User registered successfully');
      expect(data.token).toBeDefined();
      expect(data.user.username).toBe(testUser.username);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.password_hash).toBeUndefined();
    });

    it('should reject registration with duplicate username', async () => {
      // Register first user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser
      });

      // Try to register with same username
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          username: testUser.username,
          email: 'different@example.com',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(409);
      const data = response.json();
      expect(data.error).toBe('Username already exists');
    });

    it('should reject registration with duplicate email', async () => {
      // Register first user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser
      });

      // Try to register with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          username: 'differentuser',
          email: testUser.email,
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(409);
      const data = response.json();
      expect(data.error).toBe('Email already exists');
    });

    it('should reject registration with invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          username: 'ab', // Too short
          email: 'invalid-email',
          password: '123' // Too short
        }
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe('Bad Request');
    });

    it('should reject registration with missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          username: 'testuser'
          // Missing email and password
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user before each login test
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser
      });
    });

    it('should login with valid username and password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: testUser.username,
          password: testUser.password
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.message).toBe('Login successful');
      expect(data.token).toBeDefined();
      expect(data.user.username).toBe(testUser.username);
    });

    it('should login with email instead of username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: testUser.email, // Using email as username
          password: testUser.password
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.user.username).toBe(testUser.username);
    });

    it('should reject login with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: testUser.username,
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'nonexistent',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: testUser.username
          // Missing password
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/regenerate-api-key', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser
      });
      
      authToken = registerResponse.json().token;
    });

    it('should regenerate API key for authenticated user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/regenerate-api-key',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.message).toBe('API key generated successfully');
      expect(data.apiKey).toBeDefined();
      expect(typeof data.apiKey).toBe('string');
      expect(data.apiKey.length).toBeGreaterThan(0);
    });

    it('should reject request without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/regenerate-api-key'
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.error).toBe('Access token required');
    });

    it('should reject request with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/regenerate-api-key',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.error).toBe('Invalid or expired token');
    });
  });
});