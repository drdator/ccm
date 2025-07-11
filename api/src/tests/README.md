# API Tests

Comprehensive test suite for the CCM Registry API using Vitest and Supertest.

## Test Structure

```
src/tests/
├── setup.ts          # Test setup and teardown
├── helpers.ts        # Shared test utilities
├── health.test.ts    # Health check endpoint tests
├── auth.test.ts      # Authentication endpoint tests
└── commands.test.ts  # Command management endpoint tests
```

## Running Tests

First, install the test dependencies:
```bash
npm install --save-dev vitest supertest @types/supertest @vitest/ui
```

Then run the tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Authentication Tests
- ✅ User registration with validation
- ✅ User login (username and email)
- ✅ JWT token generation
- ✅ API key authentication
- ✅ Get current user info
- ✅ Regenerate API key

### Command Tests
- ✅ List commands with pagination
- ✅ Search commands by name/description
- ✅ Get command details
- ✅ Download command files
- ✅ Publish new commands
- ✅ Version validation
- ✅ Duplicate version prevention
- ✅ File validation (.md only)
- ✅ Download counter tracking

## Test Database

Tests use a separate SQLite database (`test-ccm-registry.db`) that is:
- Created automatically when tests run
- Cleared before each test
- Deleted after all tests complete

## Writing New Tests

1. Create a new test file: `src/tests/your-feature.test.ts`
2. Import test utilities:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import request from 'supertest';
   import { createTestApp, createAuthenticatedUser } from './helpers.js';
   ```
3. Write your tests using the helpers provided

## Test Helpers

### `createTestApp()`
Creates a fresh Express app instance with all middleware and routes configured.

### `createAuthenticatedUser(app, user?)`
Registers a test user and returns their authentication details:
```typescript
const { user, token, apiKey } = await createAuthenticatedUser(app);
```

### Test Data
- `testUser` - Default test user credentials
- `testUser2` - Secondary test user for multi-user tests
- `testCommand` - Sample command data for publishing tests