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

#### CLI Development
```bash
npm install
npm run build:cli
```

#### API Development  
```bash
npm install
npm run dev:api    # Starts with SQLite (no Docker needed)
```

## Commands

- `npm run dev:cli` - Run CLI in development mode
- `npm run dev:api` - Run API server (auto-creates SQLite DB)
- `npm run build` - Build both CLI and API
- `npm run migrate` - Run database migrations (for SQLite)
