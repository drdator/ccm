import { beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, getDatabase } from '../config/database-sqlite.js';

// Set test environment with unique DB per test run
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

let db: any;

// Setup database for all tests
beforeAll(async () => {
  // Use unique database name based on timestamp to avoid conflicts
  const dbName = `test-ccm-registry-${Date.now()}-${Math.random().toString(36).substring(7)}.db`;
  process.env.TEST_DB_NAME = dbName;
  
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
});