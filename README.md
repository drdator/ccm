# CCM - Claude Command Manager

CCM is a package manager for Claude AI commands, like NPM for JavaScript or pip for Python. It allows you to publish and share command sets (packages) that contain multiple Claude Code slash commands.

## Key Concepts

- **Command Sets**: Groups of related commands published together as a package
- **Namespaced Access**: Commands are accessed with their package name (e.g., `/my-project/hello`)
- **No Conflicts**: Multiple packages can have commands with the same name
- **Version Management**: Entire command sets are versioned together
- **Dual Structure**: Publishers work in root structure, consumers work in `.claude/` structure

## Workflows

### Publisher Workflow (Creating Commands)
```bash
# Create a new command set
mkdir my-commands && cd my-commands
ccm init --name "my-utils"

# Create commands in commands/ directory
echo "# Hello Command" > commands/hello.md

# Publish to registry
ccm publish
```

### Consumer Workflow (Using Commands)
```bash
# Use commands in any project
cd my-project
ccm install my-utils

# Commands available in Claude Code
# /my-utils/hello
```

## Project Structure

This is a monorepo containing:

- **`cli/`** - Command-line interface for managing Claude commands
- **`api/`** - Registry API server for hosting and sharing commands
- **`web/`** - Web interface for browsing and discovering commands

## Quick Start

### Try the Example Package
```bash
# Install the CLI globally
cd cli
npm run build
npm link

# Test with the example package
cd ../example-commands
ccm publish --dry    # Preview
ccm publish          # Actually publish

# Install it somewhere else
cd /tmp && mkdir test && cd test
ccm install hello-world
ccm list
```

### Development Setup

#### Full Stack Development
```bash
# Install dependencies
npm install

# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start web interface
npm run dev:web

# Terminal 3: Test CLI
cd cli && npm run build && npm link
```

#### Individual Components
```bash
# CLI only
npm run build:cli

# API only
npm run dev:api

# Web only
npm run dev:web
```

## Commands

- `npm run dev:cli` - Run CLI in development mode
- `npm run dev:api` - Run API server (Native Fastify, auto-creates SQLite DB)
- `npm run dev:web` - Run web interface (http://localhost:8080)
- `npm run build` - Build all components
- `npm run migrate` - Run database migrations (for SQLite)
- `sqlite3 ccm-registry.db < scripts/seed-data.sql` - Seed database with example commands

## API Framework (2025 Modern Stack)

CCM uses **100% Native Fastify** for maximum performance and modern TypeScript support:

- **Framework**: Fastify 5.4.0 (9.7x faster than Express)
- **Type Safety**: Full TypeScript integration with automatic request/response validation
- **Schema Validation**: JSON Schema validation for all endpoints
- **Security**: @fastify/helmet and @fastify/cors plugins
- **Performance Monitoring**: Built-in request timing and structured logging
- **Modern Features**: HTTP/2 support, async/await throughout

### Performance Benefits
- **Request Speed**: 40-90% faster than Express-based APIs
- **Schema Validation**: Automatic validation with detailed error messages
- **Type Safety**: Compile-time checking prevents runtime errors
- **Modern Architecture**: Built for 2025 development practices
