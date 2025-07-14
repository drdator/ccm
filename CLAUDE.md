# CCM - Claude Command Manager

A comprehensive package manager for Claude Code commands, designed to function like npm for JavaScript but specifically for Claude AI productivity commands.

## Overview

**CCM** enables developers to discover, share, and manage Claude Code slash commands through a complete ecosystem consisting of:

- **Registry API**: Secure backend for package storage and discovery
- **CLI Tool**: Command-line interface for package management
- **Web Interface**: Browser-based package discovery and documentation

**Think npm for Claude Code commands** - publish command packages, install them in projects, and share productivity tools across teams.

## Quick Start

### For Command Consumers (Installing Packages)

```bash
# Install CCM CLI globally
npm install -g ccm-cli

# Configure registry (development)
ccm config --registry http://localhost:3000/api

# Search and install packages
ccm search git
ccm install dev-tools

# Use in Claude Code
/dev-tools:git-helper
```

### For Command Publishers (Creating Packages)

```bash
# Create a new command package
mkdir my-commands && cd my-commands
ccm init --name "my-utils"

# Add commands in commands/ directory
echo "# Git Status Helper" > commands/git-status.md

# Register and publish
ccm register
ccm publish
```

### For Development Setup

```bash
# Clone and setup development environment
git clone [repository]
cd ccm
npm install
npm run dev:setup
```

## Project Architecture

### Monorepo Structure

```
ccm/
├── api/                    # Registry API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── config/        # Configuration
│   │   └── index.ts       # Server entry point
│   ├── tests/             # API tests
│   └── package.json
├── cli/                    # Command-line interface
│   ├── src/
│   │   ├── commands/      # CLI command implementations
│   │   ├── config/        # Configuration management
│   │   ├── utils/         # Shared utilities
│   │   └── index.ts       # CLI entry point
│   ├── tests/             # CLI tests including E2E
│   └── package.json
├── web/                    # Web interface
│   ├── index.html         # Main page
│   ├── script.js          # Frontend logic
│   ├── styles.css         # Styling
│   ├── vite.config.js     # Build configuration
│   └── package.json
├── example-commands/       # Example package for testing
└── scripts/               # Development scripts
```

### Technology Stack

**API Server:**
- **Framework**: Fastify 5.4.0 (high-performance Node.js server)
- **Database**: SQLite (file-based, zero-configuration)
- **Authentication**: JWT tokens with bcrypt
- **Language**: TypeScript with ES modules

**CLI Tool:**
- **Framework**: Commander.js for command structure
- **Language**: TypeScript with Node.js
- **UI**: Chalk for colors, Inquirer for interactive prompts

**Web Interface:**
- **Build Tool**: Vite for modern frontend development
- **Language**: Vanilla JavaScript (no framework dependencies)
- **Styling**: Custom CSS with modern design patterns

## Development Workflow

### Initial Setup

1. **Prerequisites**
   ```bash
   # Required
   node >= 18.0.0
   npm >= 9.0.0
   ```

2. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Setup development environment
   npm run dev:setup
   
   # Start individual components
   npm run dev:api    # API server on :3000 (SQLite auto-created)
   npm run dev:web    # Web interface on :8080
   npm run dev:cli    # CLI development mode
   ```

3. **Database Setup**
   ```bash
   # SQLite (automatic - no setup required)
   npm run dev:api    # Creates ccm-registry.db automatically
   
   # Optional: Seed with example commands
   cd api && npm run db:seed
   ```

### Package Development Patterns

CCM implements a **dual-structure architecture** to cleanly separate publisher and consumer workflows:

#### Publisher Workflow (Creating Commands)
```
my-commands/                    # Clean root for development
├── commands/                   # Command files (.md)
│   ├── git-helper.md
│   └── code-review.md
├── ccm.json                   # Package manifest
└── .gitignore
```

#### Consumer Workflow (Using Commands)
```
project/
├── .claude/
│   ├── commands/              # Symlinks to installed packages
│   │   ├── dev-tools/        # → ../installed/dev-tools/commands/
│   │   └── utils/            # → ../installed/utils/commands/
│   ├── installed/            # Downloaded packages (git-ignored)
│   ├── ccm.json             # Dependencies manifest
│   └── .gitignore
├── src/
└── package.json
```

### Key Commands

```bash
# CLI Development
cd cli
npm run dev                # Development mode with hot reload
npm run build             # Build for production
npm run test              # Run unit tests
npm run test:e2e          # Run end-to-end tests

# API Development  
cd api
npm run dev               # Development server with hot reload
npm run build             # Build TypeScript
npm run test              # Run API tests
npm run db:seed           # Seed database with example commands

# Web Development
cd web
npm run dev               # Vite development server
npm run build             # Build for production
npm run preview           # Preview production build
```

## Usage Examples

### Publishing a Command Package

1. **Initialize Package**
   ```bash
   mkdir my-productivity-tools
   cd my-productivity-tools
   ccm init --name "productivity-tools"
   ```

2. **Create Commands**
   ```bash
   # Create command file
   cat > commands/task-manager.md << 'EOF'
   ---
   description: "Smart task management and prioritization helper"
   author: "Your Name"
   tags: ["productivity", "tasks", "management"]
   ---
   
   # Task Manager
   
   Help me organize and prioritize my tasks for maximum productivity.
   
   Please analyze my task list and suggest:
   1. Priority ordering based on urgency and impact
   2. Time estimates for each task
   3. Optimal scheduling throughout the day
   
   $ARGUMENTS
   EOF
   ```

3. **Configure Package Metadata**
   ```json
   {
     "name": "productivity-tools",
     "version": "1.0.0",
     "description": "Productivity and task management commands",
     "repository": "https://github.com/username/productivity-tools",
     "license": "MIT",
     "category": "productivity",
     "keywords": ["productivity", "tasks", "management"]
   }
   ```

4. **Publish**
   ```bash
   ccm register                    # Create account (first time)
   ccm publish                     # Publish package
   ```

### Installing and Using Packages

1. **Install in Project**
   ```bash
   cd my-project
   ccm install productivity-tools
   ```

2. **Use in Claude Code**
   ```
   /productivity-tools:task-manager
   
   Today's tasks:
   - Finish project documentation (due tomorrow)
   - Review pull requests (5 pending)
   - Prepare presentation for Friday
   - Update website content
   - Call client about requirements
   ```

### Team Collaboration

1. **Share Dependencies**
   ```bash
   # Team member A
   ccm install dev-tools code-quality
   git add .claude/ccm.json
   git commit -m "Add CCM dependencies"
   
   # Team member B
   git pull
   ccm install  # Installs all dependencies from ccm.json
   ```

## Testing

### Test Structure
```
tests/
├── unit/                  # Unit tests for individual components
├── integration/          # API integration tests
└── e2e/                  # End-to-end workflow tests
    ├── scenarios/
    │   ├── auth-flow.test.ts
    │   ├── publisher-flow.test.ts
    │   └── consumer-flow.test.ts
    └── helpers/          # Test utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Component-specific tests
npm run test:api          # API tests
npm run test:cli          # CLI tests  
npm run test:e2e          # End-to-end tests

# Test with coverage
npm run test:coverage

# Interactive test UI
npm run test:ui
```

### Writing Tests

**API Tests (using Fastify inject):**
```typescript
import { test, expect } from 'vitest'
import { buildApp } from '../src/app.js'

test('should create command', async () => {
  const app = await buildApp()
  
  const response = await app.inject({
    method: 'POST',
    url: '/api/commands',
    headers: { authorization: `Bearer ${token}` },
    payload: commandData
  })
  
  expect(response.statusCode).toBe(201)
})
```

**E2E Tests (full workflow):**
```typescript
test('complete publisher workflow', async () => {
  // Setup test environment
  const testDir = await createTestDirectory()
  
  // Initialize package
  await runCLI(['init', '--name', 'test-package'], testDir)
  
  // Add command files
  await writeFile(join(testDir, 'commands/test.md'), commandContent)
  
  // Publish
  const publishResult = await runCLI(['publish'], testDir)
  expect(publishResult.success).toBe(true)
  
  // Verify on registry
  const response = await fetch(`${API_URL}/commands/test-package`)
  expect(response.status).toBe(200)
})
```

## Deployment

### Production Setup

**Environment Variables:**
```bash
# API Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-256-bit-secret

# Optional
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
```

**SQLite Production Setup:**
```bash
# Build and start
cd api
npm run build
npm start

# SQLite database will be created automatically
# Ensure proper file permissions for ccm-registry.db
chmod 644 ccm-registry.db
```

### Web Interface Deployment

```bash
# Build for production
cd web
npm run build

# Deploy to static hosting (Vercel, Netlify, etc.)
# Or serve with nginx/apache
```

## Key Technical Decisions

### Why Fastify over Express?
- **Performance**: 40-90% faster than Express
- **Type Safety**: Native TypeScript support
- **Modern**: Built for current Node.js versions
- **Security**: Built-in validation and security features

### Why Directory-Level Symlinks?
- **Organization**: Maintains package structure
- **Simplicity**: Easier to understand than file-level linking
- **Namespace**: Natural command namespacing (`/package:command`)

### Why Dual Structure Architecture?
- **Clarity**: Separates publisher and consumer concerns
- **Git-Friendly**: Clean separation of versioned vs installed code
- **Team Collaboration**: Shared dependencies without conflicts

### Why SQLite?
- **Zero Configuration**: No database server setup required
- **Portable**: Single file database, easy to backup and move
- **Performance**: Excellent for small to medium workloads
- **Reliability**: ACID compliant and battle-tested

## Troubleshooting

### Common Issues

**CLI Command Not Found:**
```bash
# Check installation
npm list -g ccm-cli

# Reinstall if needed
npm install -g ccm-cli

# Verify PATH includes npm global bin
npm config get prefix
```

**API Connection Failures:**
```bash
# Check API server is running
curl http://localhost:3000/health

# Verify CLI configuration
ccm config

# Update registry URL if needed
ccm config --registry http://localhost:3000/api
```

**Package Installation Issues:**
```bash
# Check permissions
ls -la .claude/

# Clear cache and reinstall
rm -rf .claude/installed/
ccm install

# Verify symlinks
ls -la .claude/commands/
```

**Database Issues:**
```bash
# Check SQLite file permissions
ls -la api/ccm-registry.db

# Reset development database
rm api/ccm-registry.db
npm run dev:api  # Auto-recreates

# Backup database
cp api/ccm-registry.db api/ccm-registry.backup.db
```

### Development Debugging

**Enable Debug Logging:**
```bash
# CLI debugging
DEBUG=ccm:* ccm install package-name

# API debugging
DEBUG=fastify:* npm run dev:api
```

**Common Development Patterns:**
```bash
# Reset entire development environment
rm -rf api/ccm.db
rm -rf */node_modules
npm install
npm run dev:setup

# Test end-to-end workflow
npm run test:e2e:scenarios

# Verify package structure
ccm info package-name --verbose
```

## Contributing

### Development Guidelines

1. **Code Style**: TypeScript with ESLint/Prettier
2. **Testing**: Write tests for new features
3. **Documentation**: Update relevant docs
4. **Commits**: Conventional commit format

### Pull Request Process

1. Fork and create feature branch
2. Add tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit PR with clear description

### Architecture Principles

- **Security First**: Authentication and validation everywhere
- **Developer Experience**: Zero-configuration development setup
- **Performance**: Optimize for speed and efficiency
- **Compatibility**: Support multiple environments and platforms

---

## Additional Resources

- **API Documentation**: `/api/docs` when server is running
- **Example Commands**: `/example-commands` directory
- **Test Examples**: `/cli/tests/e2e/scenarios`
- **Development Scripts**: `/scripts` directory

For questions or support, see the project repository issues or discussions.