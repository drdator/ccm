# CCM End-to-End Workflow Guide

This document provides a complete walkthrough of the Claude Command Manager (CCM) from setup to daily usage.

## Prerequisites

- Node.js 14+ installed
- API server running (for full functionality)
- Claude Code installed

## Two Different Workflows

CCM supports two different workflows:

1. **Publishers**: Developers creating and publishing command sets
2. **Consumers**: Users installing and using command sets from others

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

#### A. Publisher Workflow (Creating Commands)
```bash
# Create project directory
mkdir my-command-set
cd my-command-set

# Initialize CCM project for development
ccm init --name "my-project" --description "My awesome command set"
```

**Result:** Creates publisher structure:
```
my-command-set/
├── commands/           # Your command files (.md)
├── ccm.json           # Package manifest
└── .gitignore         # Auto-generated
```

#### B. Consumer Workflow (Using Commands)
No initialization needed! The `.claude/` directory is automatically created when you first install commands.

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

### 4. Creating and Publishing Command Sets

#### Create Command Files (Publisher Workflow)
```bash
# Create your first command
cat > commands/git-commit-helper.md << 'EOF'
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

# Create another command
cat > commands/pr-reviewer.md << 'EOF'
---
description: Review pull requests for code quality
author: Your Name
tags: ["git", "code-review"]
---

# PR Reviewer

Review this pull request for code quality, security, and best practices.
EOF
```

#### Publish Command Set to Registry
```bash
# Dry run first (see what would be published)
ccm publish --dry

# Actually publish all commands as a set
ccm publish --tag "utility"
```

**Result:** All commands in your project are published as a versioned set under your project name (e.g., `my-project`). Others can install the entire set with `ccm install my-project`.

### 5. Discovering and Installing Commands (Consumer Workflow)

#### Search for Commands
```bash
# Search by keyword
ccm search "git"

# Search with pagination
ccm search "helper" --limit 10 --offset 0
```

#### Install Command Sets from Registry
```bash
# Navigate to where you want to use commands
cd my-actual-project

# Install latest version of a command set
ccm install my-project

# Install specific version
ccm install my-project --version 1.2.0

# Force reinstall
ccm install my-project --force
```

**Result:** 
- Creates `.claude/` directory if it doesn't exist
- Downloads all command files to `.claude/installed/my-project/`
- Creates a single symlink `.claude/commands/my-project/` -> `.claude/installed/my-project/`
- Updates `.claude/ccm.json` dependencies
- All commands from the set become available in Claude Code
- Commands are accessed with namespace: `/my-project/command-name`

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

Once installed, commands are available in Claude Code with their namespace:

```
# In Claude Code - for the dev-tools package
/dev-tools/git-commit-helper

# With arguments
/dev-tools/git-commit-helper Here's my git diff: [paste diff]

# For your own commands
/my-project/hello
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
ccm install eslint-helper
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

### Publisher Structure (Creating Commands)
```
my-command-set/
├── commands/                          # Your command files
│   ├── git-helper.md
│   ├── pr-reviewer.md
│   └── code-formatter.md
├── ccm.json                           # Package manifest
├── .gitignore                         # Auto-generated
└── README.md
```

### Consumer Structure (Using Commands)
```
my-actual-project/
├── .claude/
│   ├── commands/
│   │   ├── dev-tools/ -> ../installed/dev-tools/  # Symlink to entire package
│   │   └── code-quality/ -> ../installed/code-quality/  # Symlink to entire package
│   ├── installed/                     # Git-ignored
│   │   ├── dev-tools/                 # Installed package
│   │   │   ├── git-helper.md
│   │   │   └── pr-reviewer.md
│   │   ├── code-quality/              # Another installed package
│   │   │   ├── eslint-helper.md
│   │   │   └── prettier-format.md
│   │   └── .ccm-metadata.json
│   └── ccm.json                       # Dependency manifest
├── src/                               # Your project files
└── README.md
```

## ccm.json Examples

### Publisher ccm.json (root of command set)
```json
{
  "name": "dev-tools",
  "version": "1.2.0",
  "description": "Development productivity commands"
}
```

### Consumer ccm.json (.claude/ccm.json)
```json
{
  "name": "consumer-project",
  "version": "1.0.0",
  "dependencies": {
    "dev-tools": "^1.2.0",
    "code-quality": "^2.0.0"
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