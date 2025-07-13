import { beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, getDatabase } from '../config/database-sqlite.js';
import { join } from 'path';
import { unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';

// Set test environment with unique DB per test run
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

let db: any;
let dbPath: string;

// Cleanup any orphaned test database files from previous failed runs
async function cleanupOrphanedTestDbs() {
  try {
    const files = await readdir(process.cwd());
    const testDbFiles = files.filter(file => 
      file.startsWith('test-ccm-registry-') && 
      file.endsWith('.db') &&
      file !== process.env.TEST_DB_NAME
    );
    
    for (const file of testDbFiles) {
      try {
        await unlink(join(process.cwd(), file));
        console.log(`🧹 Cleaned up orphaned test database: ${file}`);
      } catch (error) {
        // Ignore errors for files that might be in use
      }
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
}

// Setup database for all tests
beforeAll(async () => {
  // Clean up any orphaned test databases first
  await cleanupOrphanedTestDbs();
  
  // Use unique database name based on timestamp to avoid conflicts
  const dbName = `test-ccm-registry-${Date.now()}-${Math.random().toString(36).substring(7)}.db`;
  process.env.TEST_DB_NAME = dbName;
  dbPath = join(process.cwd(), dbName);
  
  await initializeDatabase();
  db = await getDatabase();
  console.log('✅ Test database initialized');
});

// Clean database before each test
beforeEach(async () => {
  if (db) {
    try {
      // Clean up all tables in dependency order
      await db.exec('DELETE FROM downloads');
      await db.exec('DELETE FROM tags');
      await db.exec('DELETE FROM command_files');
      await db.exec('DELETE FROM commands');
      await db.exec('DELETE FROM users');
      
      // Reset auto-increment counters
      await db.exec('DELETE FROM sqlite_sequence');
    } catch (error) {
      console.warn('Database cleanup warning:', error);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (db) {
    await db.close();
    console.log('✅ Test database closed');
  }
  
  // Delete the test database file
  try {
    if (existsSync(dbPath)) {
      await unlink(dbPath);
      console.log('✅ Test database file deleted');
    }
  } catch (error) {
    console.warn('⚠️  Failed to delete test database file:', error);
  }
});