-- Simple hello command for production testing
-- Run with: sqlite3 ccm-registry.db < hello-seed.sql

-- Insert seed user
INSERT OR REPLACE INTO users (id, username, email, password_hash, api_key, created_at, updated_at) 
VALUES (1, 'ccm-admin', 'admin@claudecommands.dev', '$2b$10$dummyhashforseeding', 'dummy-api-key-for-seeding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert hello-world package
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) 
VALUES (1, 'hello-world', '1.0.0', 'A classic Hello World example package for CCM', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert greet command file
INSERT OR REPLACE INTO command_files (command_id, filename, content, file_hash) VALUES
(1, 'greet.md', '---
description: A friendly greeting command
author: CCM Admin
tags: ["greeting", "hello", "welcome", "example"]
arguments: true
---

# Greet Command

Hello! Welcome to CCM (Claude Command Manager)!

This is a simple greeting command to test that everything is working correctly.

👋 Thanks for using CCM - the package manager for Claude Code commands!

## Usage

You can use this command with or without arguments:
- `/hello-world:greet` - General greeting
- `/hello-world:greet World` - Greet someone specific

## What is CCM?

CCM is like npm, but for Claude Code slash commands. You can:
- Discover and install useful commands
- Share your own commands with the community  
- Manage command dependencies in your projects

Happy coding with Claude!

$ARGUMENTS', 'greet-hash-1');

-- Insert tags
INSERT OR REPLACE INTO tags (command_id, tag) VALUES
(1, 'greeting'), (1, 'hello'), (1, 'welcome'), (1, 'example'), (1, 'starter');