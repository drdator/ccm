# CCM - Claude Command Manager

CCM is a command manager for Claude AI, like NPM for JavaScript or pip for Python dependencies.

## Project Structure

This is a monorepo containing:

- **`cli/`** - Command-line interface for managing Claude commands
- **`api/`** - Registry API server for hosting and sharing commands

## Quick Start

### CLI Development
```bash
# Install dependencies
npm install

# Run CLI in development mode
npm run dev:cli

# Build CLI
npm run build:cli
```

### API Development
```bash
# Install dependencies
npm install

# Set up environment
cp api/.env.example api/.env
# Edit api/.env with your configuration

# Run database migrations
npm run migrate

# Run API in development mode
npm run dev:api
```

## Commands

- `npm run dev:cli` - Run CLI in development mode
- `npm run dev:api` - Run API server in development mode
- `npm run build` - Build both CLI and API
- `npm run migrate` - Run database migrations
