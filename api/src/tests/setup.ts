import { beforeAll, afterAll, beforeEach } from 'vitest';
import { getDatabase } from '../config/database-sqlite.js';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = join(process.cwd(), 'test-ccm-registry.db');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRY = '1h';

beforeAll(async () => {
  // Remove existing test database if it exists
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
});

beforeEach(async () => {
  // Clear all tables before each test
  const db = await getDatabase();
  await db.exec(`
    DELETE FROM downloads;
    DELETE FROM tags;
    DELETE FROM command_files;
    DELETE FROM commands;
    DELETE FROM users;
  `);
});

afterAll(async () => {
  // Clean up test database
  const db = await getDatabase();
  await db.close();
  
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
});