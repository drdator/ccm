import { Router } from 'express';
import jwt from 'jsonwebtoken';
// Use SQLite models for local development
const UserModel = process.env.NODE_ENV === 'production' 
  ? (await import('../models/User.js')).UserModel
  : (await import('../models/User-sqlite.js')).UserModel;
import { ApiError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      throw new ApiError(400, 'Username, email, and password are required');
    }

    if (username.length < 3 || username.length > 50) {
      throw new ApiError(400, 'Username must be between 3 and 50 characters');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    // Check if user exists
    const existingUser = await UserModel.findByUsername(username) || await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'Username or email already exists');
    }

    // Create user
    const user = await UserModel.create(username, email, password);

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        api_key: user.api_key
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    // Find user by username or email
    const user = await UserModel.findByUsername(username) || await UserModel.findByEmail(username);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        api_key: user.api_key
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

// Regenerate API key
router.post('/regenerate-api-key', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const newApiKey = await UserModel.regenerateApiKey(req.user!.id);
    res.json({
      message: 'API key regenerated successfully',
      api_key: newApiKey
    });
  } catch (error) {
    next(error);
  }
});

export default router;