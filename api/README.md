# CCM Registry API

Backend API for the Claude Command Manager (CCM) registry.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database and run migrations:
```bash
# Create database
createdb ccm_registry

# Run migrations
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/regenerate-api-key` - Generate new API key

### Commands
- `GET /api/commands` - List all commands
- `GET /api/commands/search?q=query` - Search commands
- `GET /api/commands/:name` - Get specific command
- `GET /api/commands/:name/download` - Download command files
- `POST /api/commands` - Publish new command (requires auth)

## Authentication

The API supports two authentication methods:

1. **JWT Token** (for web/CLI sessions):
   ```
   Authorization: Bearer <token>
   ```

2. **API Key** (for CLI/programmatic access):
   ```
   X-API-Key: <api-key>
   ```

## Publishing Commands

To publish a command, send a POST request to `/api/commands` with:

```json
{
  "metadata": "name: my-command\nversion: 1.0.0\ndescription: My awesome command\ntags: [utility, git]",
  "files": [
    {
      "filename": "my-command.md",
      "content": "---\ndescription: My command\n---\n\n# My Command\n..."
    }
  ]
}
```

## Testing

The API includes a comprehensive test suite using Vitest:

```bash
# Install test dependencies
npm install --save-dev vitest supertest @types/supertest

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

Tests cover all endpoints with authentication, validation, and error cases. See `src/tests/README.md` for details.