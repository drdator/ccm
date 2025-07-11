import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getDatabase } from '../config/database-sqlite.js';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  api_key: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(username: string, email: string, password: string): Promise<User> {
    const db = await getDatabase();
    const password_hash = await bcrypt.hash(password, 10);
    const api_key = crypto.randomBytes(32).toString('hex');
    
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash, api_key) VALUES (?, ?, ?, ?)',
      [username, email, password_hash, api_key]
    );
    
    return await db.get(
      'SELECT * FROM users WHERE id = ?',
      [result.lastID]
    );
  }

  static async findByUsername(username: string): Promise<User | null> {
    const db = await getDatabase();
    return await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    return await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  static async findByApiKey(apiKey: string): Promise<User | null> {
    const db = await getDatabase();
    return await db.get(
      'SELECT * FROM users WHERE api_key = ?',
      [apiKey]
    );
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async regenerateApiKey(userId: number): Promise<string> {
    const db = await getDatabase();
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    await db.run(
      'UPDATE users SET api_key = ? WHERE id = ?',
      [newApiKey, userId]
    );
    
    return newApiKey;
  }
}