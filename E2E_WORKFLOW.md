# CCM End-to-End Workflow Guide

This document provides a complete walkthrough of the Claude Command Manager (CCM) from setup to daily usage.

## Prerequisites

- Node.js 14+ installed
- API server running (for full functionality)
- Claude Code installed

## Complete E2E Workflow

### 1. Initial Setup

#### Start the API Server (Development)
```bash
# In the api directory
cd api
npm run dev
```

The API will be available at `http://localhost:3000`

#### Build and Install CLI
```bash
# In the cli directory
cd cli
npm run build

# Optional: Link globally for easier access
npm link
```

### 2. Project Initialization

#### Create a New Project
```bash
# Create project directory
mkdir my-claude-project
cd my-claude-project

# Initialize CCM project
ccm init --name "my-project" --description "Custom commands for my project"
```

**Result:** Creates `.claude/` directory structure:
```
.claude/
├── commands/           # User commands + symlinks to installed
├── installed/          # CCM-managed commands (git-ignored)
├── ccm.json           # Dependency manifest
└── .gitignore         # Auto-generated
```

### 3. User Registration & Authentication

#### Register New Account
```bash
ccm register \
  --username myusername \
  --email me@example.com \
  --password mypassword123
```

**Result:** 
- Creates account in registry
- Automatically logs you in
- Saves authentication to `~/.ccm/config.json`

#### Login (if already have account)
```bash
ccm login --username myusername --password mypassword123
```

#### Check Authentication Status
```bash
ccm whoami  # (if implemented)
# Or check config manually
cat ~/.ccm/config.json
```

### 4. Creating and Publishing Commands

#### Create a Command File
```bash
# Create your first command
cat > .claude/commands/git-commit-helper.md << 'EOF'
---
description: Generate semantic git commit messages
author: Your Name
tags: ["git", "productivity"]
arguments: true
---

# Git Commit Helper

Generate a semantic commit message based on the changes.

Based on the following git diff, suggest a semantic commit message:

$ARGUMENTS
EOF
```

#### Publish Command to Registry
```bash
# Dry run first (see what would be published)
ccm publish --dry

# Actually publish
ccm publish --tag "utility"
```

**Result:** Command is uploaded to registry and available for others to install.

### 5. Discovering and Installing Commands

#### Search for Commands
```bash
# Search by keyword
ccm search "git"

# Search with pagination
ccm search "helper" --limit 10 --offset 0
```

#### Install Commands from Registry
```bash
# Install latest version
ccm install git-helper

# Install specific version
ccm install git-helper --version 1.2.0

# Install and save as dev dependency
ccm install test-utils --save-dev

# Force reinstall
ccm install git-helper --force
```

**Result:** 
- Downloads command files to `.claude/installed/`
- Creates symlinks in `.claude/commands/`
- Updates `ccm.json` dependencies
- Command becomes available in Claude Code

#### Install All Dependencies
```bash
# Install all commands listed in ccm.json
ccm install
```

### 6. Managing Commands

#### List All Commands
```bash
# List both user and installed commands
ccm list

# List only local (user-created) commands
ccm list --local

# List only installed commands
ccm list --global
```

#### View Command Details
```bash
ccm info git-helper  # (if implemented)
```

### 7. Using Commands in Claude Code

Once installed, commands are available in Claude Code:

```
# In Claude Code
/git-commit-helper

# With arguments
/git-commit-helper Here's my git diff: [paste diff]
```

### 8. Team Collaboration Workflow

#### Project Setup for Team
```bash
# Team member clones project
git clone <project-repo>
cd project

# Install all project dependencies
ccm install

# All commands from ccm.json are now available
ccm list
```

#### Adding Team Dependencies
```bash
# Team lead adds new command
ccm install eslint-helper --save
git add .claude/ccm.json
git commit -m "Add eslint-helper command"
git push

# Team members update
git pull
ccm install  # Installs new dependencies
```

### 9. Advanced Workflows

#### Version Management
```bash
# Check for updates
ccm outdated  # (if implemented)

# Update all dependencies
ccm update    # (if implemented)

# Update specific command
ccm update git-helper  # (if implemented)
```

#### Development Workflow
```bash
# Create, test, and publish a command
ccm init --name "my-new-command"
# ... create command files ...
ccm publish --dry      # Test publish
ccm publish            # Actual publish
```

#### Cleanup
```bash
# Remove installed command
ccm uninstall git-helper  # (if implemented)

# Clear all installed commands
rm -rf .claude/installed/*
ccm install  # Reinstall from ccm.json
```

### 10. Troubleshooting

#### Common Issues

**Authentication Expired:**
```bash
ccm login --username myusername --password mypassword123
```

**Symlink Issues (Windows):**
```bash
# CCM automatically falls back to copying files if symlinks fail
ccm install <command> --force  # Retry installation
```

**API Connection Issues:**
```bash
# Check API status
curl http://localhost:3000/health

# Set custom registry URL
export CCM_REGISTRY_URL=https://your-api-server.com/api
```

**Command Not Available in Claude Code:**
```bash
# Verify installation
ccm list

# Check symlinks
ls -la .claude/commands/

# Reinstall if needed
ccm install <command> --force
```

#### Reset Everything
```bash
# Clear authentication
ccm logout

# Remove all installed commands
rm -rf .claude/installed/*
rm .claude/ccm.json

# Start fresh
ccm init
```

## File Structure Overview

After full setup, your project will look like:

```
my-claude-project/
├── .claude/
│   ├── commands/
│   │   ├── my-command.md              # User-created
│   │   ├── git-helper.md -> ../installed/git-helper.md  # Symlink
│   │   └── eslint-helper.md -> ../installed/eslint-helper.md
│   ├── installed/                     # Git-ignored
│   │   ├── git-helper.md
│   │   ├── eslint-helper.md
│   │   └── .ccm-metadata.json
│   ├── ccm.json                       # Dependency manifest
│   └── .gitignore                     # Auto-generated
├── src/                               # Your project files
└── README.md
```

## ccm.json Example

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "Custom commands for my project",
  "dependencies": {
    "git-helper": "^1.2.0",
    "eslint-helper": "^2.0.0"
  },
  "devDependencies": {
    "test-utils": "^1.0.0"
  },
  "ccm": {
    "registry": "http://localhost:3000/api",
    "installed": "./installed",
    "commands": "./commands"
  }
}
```

## Success Criteria

After completing this workflow, you should have:

- ✅ CCM project initialized with proper structure
- ✅ User account created and authenticated
- ✅ Custom command created and published
- ✅ External commands discovered and installed
- ✅ Commands available in Claude Code via symlinks
- ✅ Team collaboration setup with shared dependencies
- ✅ Git-friendly setup (installed commands ignored)

## Next Steps

1. **Create more commands** and build a library
2. **Share with community** via the registry
3. **Set up CI/CD** for automated publishing
4. **Monitor usage** and gather feedback
5. **Contribute to ecosystem** by publishing useful commands

---

**Note:** This workflow assumes the API server is running locally. For production use, replace `http://localhost:3000` with your deployed API URL.