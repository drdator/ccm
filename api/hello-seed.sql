-- Simple hello command for production testing
-- Run with: sqlite3 ccm-registry.db < hello-seed.sql

-- Insert seed user
INSERT OR REPLACE INTO users (id, username, email, password_hash, api_key, created_at, updated_at) 
VALUES (1, 'ccm-admin', 'admin@claudecommands.dev', '$2b$10$dummyhashforseeding', 'dummy-api-key-for-seeding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert hello-world package v1.0.0
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (1, 'hello-world', '1.0.0', 'A classic Hello World example package for CCM', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert hello-world package v1.1.0 (newer version)
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (2, 'hello-world', '1.1.0', 'A classic Hello World example package for CCM with improved features', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert hello-world package v2.0.0 (major version)
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (3, 'hello-world', '2.0.0', 'Hello World package v2.0 with breaking changes and new commands', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dev-tools package v1.0.0
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (4, 'dev-tools', '1.0.0', 'Essential development tools and utilities for coding workflows', 'https://github.com/ccm-org/dev-tools', 'MIT', 'https://dev-tools.ccm.dev', 'development', 1, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dev-tools package v1.2.0 (patch version)
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (5, 'dev-tools', '1.2.0', 'Essential development tools with bug fixes and new git helpers', 'https://github.com/ccm-org/dev-tools', 'MIT', 'https://dev-tools.ccm.dev', 'development', 1, 45, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert greet command files for different versions
INSERT OR REPLACE INTO command_files (command_id, filename, content, file_hash) VALUES
(1, 'greet.md', '---
description: A friendly greeting command
author: CCM Admin
tags: ["greeting", "hello", "welcome", "example"]
arguments: true
---

# Greet Command v1.0.0

Hello! Welcome to CCM (Claude Command Manager)!

This is a simple greeting command to test that everything is working correctly.

👋 Thanks for using CCM - the package manager for Claude Code commands!

## Usage

You can use this command with or without arguments:
- `/hello-world:greet` - General greeting
- `/hello-world:greet World` - Greet someone specific

Happy coding with Claude!

$ARGUMENTS', 'greet-hash-1'),

(2, 'greet.md', '---
description: An improved friendly greeting command
author: CCM Admin
tags: ["greeting", "hello", "welcome", "example"]
arguments: true
---

# Greet Command v1.1.0

Hello! Welcome to CCM (Claude Command Manager)!

This is an improved greeting command with better formatting.

👋 Thanks for using CCM - the package manager for Claude Code commands!

## Usage

You can use this command with or without arguments:
- `/hello-world:greet` - General greeting
- `/hello-world:greet World` - Greet someone specific
- `/hello-world:greet "John Doe"` - Greet with full names

## What''s New in v1.1.0
- Better argument handling
- Improved formatting
- Support for quoted names

Happy coding with Claude!

$ARGUMENTS', 'greet-hash-2'),

(2, 'welcome.md', '---
description: A welcoming command for new users
author: CCM Admin
tags: ["welcome", "onboarding", "example"]
arguments: false
---

# Welcome Command

Welcome to the CCM community!

This command helps onboard new users to Claude Code slash commands.

## Getting Started

1. Install more packages with `ccm search`
2. Use commands in Claude Code with `/package:command`
3. Publish your own commands with `ccm publish`

Happy coding!', 'welcome-hash-1'),

(3, 'greet.md', '---
description: Advanced greeting command with multiple languages
author: CCM Admin
tags: ["greeting", "hello", "welcome", "example", "i18n"]
arguments: true
---

# Greet Command v2.0.0

Hello! Welcome to CCM (Claude Command Manager)!

This is the advanced greeting command with internationalization support.

👋 Thanks for using CCM - the package manager for Claude Code commands!

## Usage

You can use this command with different languages:
- `/hello-world:greet` - General greeting
- `/hello-world:greet World` - Greet someone specific
- `/hello-world:greet World --lang=es` - Greet in Spanish
- `/hello-world:greet World --lang=fr` - Greet in French

## What''s New in v2.0.0
- Multi-language support
- Advanced argument parsing
- Breaking changes to command format

⚠️ **Breaking Changes**: Language flags are now required for non-English greetings.

Happy coding with Claude!

$ARGUMENTS', 'greet-hash-3'),

(3, 'goodbye.md', '---
description: Say goodbye in multiple languages
author: CCM Admin
tags: ["goodbye", "farewell", "example", "i18n"]
arguments: true
---

# Goodbye Command

Say farewell in style!

## Usage

- `/hello-world:goodbye` - General goodbye
- `/hello-world:goodbye --lang=es` - Goodbye in Spanish
- `/hello-world:goodbye --lang=fr` - Goodbye in French

$ARGUMENTS', 'goodbye-hash-1'),

(4, 'git-status.md', '---
description: Enhanced git status with formatting
author: CCM Admin
tags: ["git", "development", "status"]
arguments: false
---

# Git Status Helper

Get a beautifully formatted git status.

Shows current branch, staged changes, and working directory status.

## Usage

- `/dev-tools:git-status` - Show formatted git status', 'git-status-hash-1'),

(5, 'git-status.md', '---
description: Enhanced git status with formatting and branch info
author: CCM Admin
tags: ["git", "development", "status"]
arguments: false
---

# Git Status Helper v1.2.0

Get a beautifully formatted git status with branch information.

Shows current branch, staged changes, working directory status, and remote tracking.

## Usage

- `/dev-tools:git-status` - Show formatted git status with branch info

## What''s New in v1.2.0
- Remote branch tracking
- Improved formatting
- Performance optimizations', 'git-status-hash-2'),

(5, 'git-commit.md', '---
description: Generate semantic commit messages
author: CCM Admin
tags: ["git", "development", "commit"]
arguments: true
---

# Git Commit Helper

Generate semantic commit messages following conventional commits format.

## Usage

- `/dev-tools:git-commit` - Generate commit message from staged changes
- `/dev-tools:git-commit "fix user login"` - Generate commit with custom message

$ARGUMENTS', 'git-commit-hash-1');

-- Insert tags for all versions
INSERT OR REPLACE INTO tags (command_id, tag) VALUES
-- hello-world v1.0.0
(1, 'greeting'), (1, 'hello'), (1, 'welcome'), (1, 'example'), (1, 'starter'),
-- hello-world v1.1.0
(2, 'greeting'), (2, 'hello'), (2, 'welcome'), (2, 'example'), (2, 'starter'), (2, 'improved'),
-- hello-world v2.0.0
(3, 'greeting'), (3, 'hello'), (3, 'welcome'), (3, 'example'), (3, 'i18n'), (3, 'advanced'),
-- dev-tools v1.0.0
(4, 'development'), (4, 'git'), (4, 'productivity'), (4, 'tools'),
-- dev-tools v1.2.0
(5, 'development'), (5, 'git'), (5, 'productivity'), (5, 'tools'), (5, 'enhanced');