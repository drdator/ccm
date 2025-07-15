import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

let db: any = null;

export async function getDatabase() {
  if (!db) {
    const dbFilename = process.env.NODE_ENV === 'test' 
      ? (process.env.TEST_DB_NAME || 'test-ccm-registry.db')
      : (process.env.DATABASE_PATH || 'ccm-registry.db');
      
    db = await open({
      filename: dbFilename,
      driver: sqlite3.Database
    });
    
    // Enable foreign key constraints
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Use console.log for database connection as logger isn't available yet
    console.log('✅ Connected to SQLite database');
  }
  
  return db;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  
  // Create tables adapted for SQLite
  await db.exec(`
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      api_key TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create commands table
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      repository TEXT,
      license TEXT,
      homepage TEXT,
      category TEXT,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      downloads INTEGER DEFAULT 0,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, version)
    );

    -- Create command_files table
    CREATE TABLE IF NOT EXISTS command_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create tags table
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      UNIQUE(command_id, tag)
    );

    -- Create downloads table
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_commands_name ON commands(name);
    CREATE INDEX IF NOT EXISTS idx_commands_author ON commands(author_id);
    CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
    CREATE INDEX IF NOT EXISTS idx_downloads_command ON downloads(command_id);
    CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
  `);
  
  // Use console.log for database initialization as logger isn't available yet
  console.log('✅ Database tables created/verified');
  
  // Auto-seed database in development mode
  if (process.env.NODE_ENV === 'development') {
    try {
      // Check if data already exists
      const existingCommands = await db.get('SELECT COUNT(*) as count FROM commands');
      if (existingCommands.count === 0) {
        console.log('📦 Seeding database with sample data...');
        await seedDatabase();
      }
    } catch (error) {
      console.error('⚠️  Database seeding failed:', error);
    }
  }
}

async function seedDatabase() {
  const db = await getDatabase();
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const seedFile = path.join(process.cwd(), 'seed-data.sql');
    if (fs.existsSync(seedFile)) {
      const seedData = fs.readFileSync(seedFile, 'utf8');
      await db.exec(seedData);
      console.log('✅ Database seeded successfully');
    } else {
      console.log('ℹ️  No seed file found, skipping seeding');
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}

export default getDatabase;