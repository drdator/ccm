import pool from '../config/database.js';
import crypto from 'crypto';

export interface Command {
  id: number;
  name: string;
  version: string;
  description: string;
  author_id: number;
  downloads: number;
  published_at: Date;
  updated_at: Date;
}

export interface CommandFile {
  id: number;
  command_id: number;
  filename: string;
  content: string;
  file_hash: string;
}

export class CommandModel {
  static async create(
    name: string,
    version: string,
    description: string,
    authorId: number,
    files: Array<{ filename: string; content: string }>
  ): Promise<Command> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert command
      const commandQuery = `
        INSERT INTO commands (name, version, description, author_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const commandResult = await client.query(commandQuery, [name, version, description, authorId]);
      const command = commandResult.rows[0];
      
      // Insert files
      for (const file of files) {
        const fileHash = crypto.createHash('sha256').update(file.content).digest('hex');
        const fileQuery = `
          INSERT INTO command_files (command_id, filename, content, file_hash)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(fileQuery, [command.id, file.filename, file.content, fileHash]);
      }
      
      await client.query('COMMIT');
      return command;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByName(name: string, version?: string): Promise<Command | null> {
    let query = 'SELECT * FROM commands WHERE name = $1';
    const params: any[] = [name];
    
    if (version) {
      query += ' AND version = $2';
      params.push(version);
    } else {
      query += ' ORDER BY published_at DESC LIMIT 1';
    }
    
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  static async search(query: string, limit = 20, offset = 0): Promise<Command[]> {
    const searchQuery = `
      SELECT c.*, u.username as author_username
      FROM commands c
      JOIN users u ON c.author_id = u.id
      WHERE c.name ILIKE $1 OR c.description ILIKE $1
      ORDER BY c.downloads DESC, c.published_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(searchQuery, [`%${query}%`, limit, offset]);
    return result.rows;
  }

  static async list(limit = 20, offset = 0): Promise<Command[]> {
    const query = `
      SELECT c.*, u.username as author_username
      FROM commands c
      JOIN users u ON c.author_id = u.id
      ORDER BY c.published_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async getFiles(commandId: number): Promise<CommandFile[]> {
    const query = 'SELECT * FROM command_files WHERE command_id = $1';
    const result = await pool.query(query, [commandId]);
    return result.rows;
  }

  static async getTags(commandId: number): Promise<string[]> {
    const query = 'SELECT tag FROM tags WHERE command_id = $1';
    const result = await pool.query(query, [commandId]);
    return result.rows.map((row: any) => row.tag);
  }

  static async addTags(commandId: number, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const query = 'INSERT INTO tags (command_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING';
      await pool.query(query, [commandId, tag.toLowerCase()]);
    }
  }

  static async incrementDownloads(commandId: number, userId?: number, ipAddress?: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Increment download counter
      await client.query('UPDATE commands SET downloads = downloads + 1 WHERE id = $1', [commandId]);
      
      // Record download
      await client.query(
        'INSERT INTO downloads (command_id, user_id, ip_address) VALUES ($1, $2, $3)',
        [commandId, userId || null, ipAddress || null]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}