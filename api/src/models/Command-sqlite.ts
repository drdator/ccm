import { getDatabase } from '../config/database-sqlite.js';
import crypto from 'crypto';

export interface Command {
  id: number;
  name: string;
  version: string;
  description: string;
  repository?: string;
  license?: string;
  homepage?: string;
  category?: string;
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
    files: Array<{ filename: string; content: string }>,
    metadata?: {
      repository?: string;
      license?: string;
      homepage?: string;
      category?: string;
    }
  ): Promise<Command> {
    const db = await getDatabase();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Insert command
      const commandResult = await db.run(
        'INSERT INTO commands (name, version, description, repository, license, homepage, category, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, version, description, metadata?.repository || null, metadata?.license || null, metadata?.homepage || null, metadata?.category || null, authorId]
      );
      
      const commandId = commandResult.lastID;
      
      // Insert files
      for (const file of files) {
        const fileHash = crypto.createHash('sha256').update(file.content).digest('hex');
        await db.run(
          'INSERT INTO command_files (command_id, filename, content, file_hash) VALUES (?, ?, ?, ?)',
          [commandId, file.filename, file.content, fileHash]
        );
      }
      
      await db.run('COMMIT');
      
      return await db.get(
        'SELECT * FROM commands WHERE id = ?',
        [commandId]
      );
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async findByName(name: string, version?: string): Promise<Command | null> {
    const db = await getDatabase();
    
    if (version) {
      return await db.get(
        'SELECT c.*, u.username as author_username FROM commands c JOIN users u ON c.author_id = u.id WHERE c.name = ? AND c.version = ?',
        [name, version]
      );
    } else {
      return await db.get(
        'SELECT c.*, u.username as author_username FROM commands c JOIN users u ON c.author_id = u.id WHERE c.name = ? ORDER BY c.published_at DESC LIMIT 1',
        [name]
      );
    }
  }

  static async search(query: string, limit = 20, offset = 0): Promise<Command[]> {
    const db = await getDatabase();
    
    return await db.all(
      `SELECT c.*, u.username as author_username
       FROM commands c
       JOIN users u ON c.author_id = u.id
       WHERE c.name LIKE ? OR c.description LIKE ?
       ORDER BY c.downloads DESC, c.published_at DESC
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, limit, offset]
    );
  }

  static async list(limit = 20, offset = 0): Promise<Command[]> {
    const db = await getDatabase();
    
    return await db.all(
      `SELECT c.*, u.username as author_username
       FROM commands c
       JOIN users u ON c.author_id = u.id
       ORDER BY c.published_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  static async getFiles(commandId: number): Promise<CommandFile[]> {
    const db = await getDatabase();
    
    return await db.all(
      'SELECT * FROM command_files WHERE command_id = ?',
      [commandId]
    );
  }

  static async getTags(commandId: number): Promise<string[]> {
    const db = await getDatabase();
    
    const rows = await db.all(
      'SELECT tag FROM tags WHERE command_id = ?',
      [commandId]
    );
    
    return rows.map((row: any) => row.tag);
  }

  static async addTags(commandId: number, tags: string[]): Promise<void> {
    const db = await getDatabase();
    
    for (const tag of tags) {
      await db.run(
        'INSERT OR IGNORE INTO tags (command_id, tag) VALUES (?, ?)',
        [commandId, tag.toLowerCase()]
      );
    }
  }

  static async incrementDownloads(commandId: number, userId?: number, ipAddress?: string): Promise<void> {
    const db = await getDatabase();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Increment download counter
      await db.run(
        'UPDATE commands SET downloads = downloads + 1 WHERE id = ?',
        [commandId]
      );
      
      // Record download
      await db.run(
        'INSERT INTO downloads (command_id, user_id, ip_address) VALUES (?, ?, ?)',
        [commandId, userId || null, ipAddress || null]
      );
      
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}