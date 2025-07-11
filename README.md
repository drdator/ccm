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
