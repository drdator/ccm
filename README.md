# CCM - Claude Command Manager

> **Live Demo**: [https://claudecommands.dev](https://claudecommands.dev)

CCM is a package manager for Claude Code slash commands, like npm for JavaScript or pip for Python. Discover, install, and share command packages that enhance your Claude Code productivity.

## 🚀 Quick Start

### Install CCM CLI

```bash
# Install globally from GitHub
npm install -g https://github.com/drdator/ccm.git

# Or clone and install locally
git clone https://github.com/drdator/ccm.git
cd ccm/cli
npm install
npm run build
npm link
```

### Ready to Use (Registry Pre-configured)

The CLI comes pre-configured with the official registry at `https://claudecommands.dev/api`.

```bash
# Optional: Override registry for development
ccm config --registry http://localhost:3000/api
```

### Install Your First Package

```bash
# Search for available packages
ccm search

# Install a package
ccm install hello-world

# Install specific version
ccm install hello-world@1.0.0

# List installed packages
ccm list
```

### Use Commands in Claude Code

After installation, commands are available in Claude Code with the package namespace:

```
/hello-world:greet
```

## 📦 Key Features

- **🎯 Namespaced Commands**: No conflicts between packages
- **🔍 Package Discovery**: Browse commands at [claudecommands.dev](https://claudecommands.dev)
- **📚 Version Management**: Semantic versioning with package@version syntax
- **🔒 Secure Registry**: JWT authentication and validated publishing
- **⚡ Fast Performance**: Built on Fastify for maximum speed

## 🛠️ For Package Publishers

### Create a New Package

```bash
# Initialize a new command package
mkdir my-commands && cd my-commands
ccm init --name "my-productivity-tools"

# Create commands in the commands/ directory
echo "# My First Command" > commands/hello.md
```

### Publish to Registry

```bash
# Register an account (first time only)
ccm register

# Publish your package
ccm publish
```

### Example Command File

```markdown
---
description: "A friendly greeting command"
author: "Your Name"
tags: ["greeting", "hello"]
---

# Hello Command

Hello! This is my first CCM command.

You can use arguments like this: $ARGUMENTS
```

## 🏗️ Project Architecture

This is a monorepo containing:

- **`cli/`** - Command-line interface for managing packages (TypeScript + Commander.js)
- **`api/`** - Registry API server (Fastify + SQLite + TypeScript)
- **`web/`** - Web interface for package discovery (Vite + Vanilla JS)
- **`example-commands/`** - Example command package for testing

## 🖥️ Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Full Stack Development

```bash
# Install dependencies
npm install

# Start all services
npm run dev:api    # API server on :3000
npm run dev:web    # Web interface on :8080
npm run dev:cli    # CLI development mode
```

### Individual Components

```bash
# CLI only
cd cli && npm run build && npm link

# API only
cd api && npm run dev

# Web only
cd web && npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Component-specific tests
npm run test:api
npm run test:cli
npm run test:e2e
```

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/drdator/ccm.git
cd ccm

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Verify deployment
curl http://localhost:3000/api/health
```

## 📚 Documentation

- **[Architecture Guide](CLAUDE.md)** - Detailed system architecture and development workflow

## 🔧 API Reference

### Public Endpoints

- `GET /api/commands` - List all packages (latest versions)
- `GET /api/commands/:name` - Get package details
- `GET /api/commands/:name/versions` - Get all versions of a package
- `GET /api/commands/:name/download` - Download package files
- `GET /api/commands/search?q=query` - Search packages
- `GET /health` - API health check

### Authenticated Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/commands` - Publish package
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/regenerate-api-key` - Generate new API key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Fastify](https://fastify.dev) for high-performance APIs
- Powered by [Vite](https://vitejs.dev) for modern web development
- Inspired by npm, pip, and other great package managers

---

**Happy coding with Claude! 🤖**