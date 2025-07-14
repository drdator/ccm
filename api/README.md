# CCM Registry API

Backend API for the Claude Command Manager (CCM) registry using SQLite database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration (SQLite auto-created)
```

3. Start the development server (SQLite database auto-created):
```bash
npm run dev
```

4. Optional - Seed database with example data:
```bash
npm run db:seed
```

## Database

The API uses SQLite for data storage:
- Database file: `ccm-registry.db` (auto-created on startup)
- Schema initialization: Automatic on first run
- Seeding: Run `npm run db:seed` for example data

## API Endpoints

### Health Check
- `GET /health` - API health status

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
  "metadata": "name: my-command\nversion: 1.0.0\ndescription: My awesome command\nrepository: https://github.com/user/repo\nlicense: MIT\nhomepage: https://example.com\ncategory: utility\ntags: [utility, git]",
  "files": [
    {
      "filename": "my-command.md",
      "content": "---\ndescription: My command\n---\n\n# My Command\n..."
    }
  ]
}
```

## Metadata Fields

Commands support the following metadata fields:
- `name` (required) - Package name
- `version` (required) - Semantic version
- `description` - Brief description
- `repository` - Repository URL
- `license` - SPDX license identifier
- `homepage` - Homepage URL
- `category` - Package category
- `tags` - Array of tags

## Testing

The API includes a comprehensive test suite using Vitest:

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Clean up test databases
npm run test:cleanup
```

Tests cover all endpoints with authentication, validation, and error cases.

## Technology Stack

- **Framework**: Fastify 5.4.0 with TypeScript
- **Database**: SQLite with automatic initialization
- **Authentication**: JWT + API Keys
- **Testing**: Vitest with Supertest
- **Security**: CORS, Helmet, Rate Limiting