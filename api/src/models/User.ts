import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database.js';

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
    const password_hash = await bcrypt.hash(password, 10);
    const api_key = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO users (username, email, password_hash, api_key)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [username, email, password_hash, api_key]);
    return result.rows[0];
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findByApiKey(apiKey: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE api_key = $1';
    const result = await pool.query(query, [apiKey]);
    return result.rows[0] || null;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async regenerateApiKey(userId: number): Promise<string> {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    const query = 'UPDATE users SET api_key = $1 WHERE id = $2 RETURNING api_key';
    const result = await pool.query(query, [newApiKey, userId]);
    return result.rows[0].api_key;
  }
}