# CCM - Claude Command Manager

A package manager for Claude Code slash commands - like npm for JavaScript but for Claude Code commands.

## Development Environment Setup

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Quick Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:api     # API server on :3000 (SQLite auto-created)
npm run dev:web     # Web interface on :8080
npm run dev:cli     # CLI development mode

# Run tests
npm test
```

### Database Setup
```bash
# SQLite database auto-created on first API startup
# Seed with test data
cd api && npm run db:seed
```

## Key Commands

### Development
```bash
# CLI development
cd cli && npm run build && npm link

# API development
cd api && npm run dev

# Web development  
cd web && npm run dev

# Testing
npm run test:api
npm run test:cli
npm run test:e2e
```

### Package Management
```bash
# Install packages
ccm install package-name
ccm install package-name@1.0.0

# Publish packages
ccm init --name "my-package"
ccm register
ccm publish
```

## Project Architecture

### Monorepo Structure
```
ccm/
├── api/           # Fastify + SQLite registry server
├── cli/           # Commander.js CLI tool
├── web/           # Vite + vanilla JS web interface
└── example-commands/  # Test package
```

### Package Structure
**Publisher (creating commands):**
```
my-package/
├── commands/      # Command files (.md)
├── ccm.json      # Package manifest
└── .gitignore
```

**Consumer (using commands):**
```
project/
├── .claude/
│   ├── commands/     # Symlinks to packages
│   ├── installed/    # Downloaded packages (git-ignored)
│   └── ccm.json     # Dependencies
```

## Code Style Guidelines

- **TypeScript**: Strict configuration, explicit types
- **Testing**: Write tests for new features, descriptive names
- **Git**: Conventional commits, feature branches from `main`
- **ES Modules**: Use throughout codebase

## Troubleshooting

### Common Issues
```bash
# CLI not found
npm install -g ccm-cli

# API connection issues
curl http://localhost:3000/health
ccm config --registry http://localhost:3000/api

# Package installation issues
rm -rf .claude/installed/
ccm install

# Reset development environment
rm -rf api/ccm-registry.db
npm install && npm run dev:setup
```

### Debug Logging
```bash
DEBUG=ccm:* ccm install package-name
DEBUG=fastify:* npm run dev:api
```

## Known Issues

- **SQLite**: Database auto-created, ensure proper permissions in production
- **Dependencies**: API server must be running for CLI/web to work
- **Windows**: Use WSL if encountering symlink issues
- **Tests**: Some may fail if API server not accessible

## Technology Stack

- **API**: Fastify + SQLite + TypeScript
- **CLI**: Commander.js + TypeScript  
- **Web**: Vite + Vanilla JS
- **Testing**: Vitest + E2E scenarios