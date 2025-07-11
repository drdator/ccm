import { initializeDatabase } from './database-sqlite.js';

// Use SQLite for local development
export { getDatabase as default } from './database-sqlite.js';

// Initialize database on startup
initializeDatabase().catch(console.error);