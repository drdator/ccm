import { beforeAll, afterAll } from 'vitest';
import { TestApiServer } from './helpers/api-server.js';

let apiServer: TestApiServer;

// Global setup - start API server before all tests
beforeAll(async () => {
  console.log('🚀 Starting E2E test setup...');
  
  // Start test API server on port 3333
  apiServer = new TestApiServer(3333);
  
  try {
    await apiServer.start();
    
    // Set global environment variables for all CLI processes
    process.env.CCM_REGISTRY_URL = apiServer.getBaseUrl();
    process.env.NODE_ENV = 'test';
    
    console.log('✅ E2E test setup complete');
  } catch (error) {
    console.error('❌ Failed to start test API server:', error);
    throw error;
  }
}, 30000); // 30 second timeout for server startup

// Global teardown - stop API server after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');
  
  if (apiServer) {
    await apiServer.stop();
  }
  
  console.log('✅ E2E test cleanup complete');
}, 10000);

// Export API server for tests that need it
export { apiServer };