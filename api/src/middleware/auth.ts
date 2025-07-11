import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { ApiError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new ApiError(401, 'Access token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new ApiError(401, 'API key required');
    }

    const user = await UserModel.findByApiKey(apiKey);
    if (!user) {
      throw new ApiError(401, 'Invalid API key');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware that accepts either JWT or API key
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (authHeader) {
    authenticateToken(req, res, next);
  } else if (apiKey) {
    authenticateApiKey(req, res, next);
  } else {
    next(new ApiError(401, 'Authentication required'));
  }
};