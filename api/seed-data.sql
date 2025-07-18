-- CCM Registry Database Seed Data
-- Run with: sqlite3 ccm-registry.db < scripts/seed-data.sql

-- Insert seed user
INSERT OR REPLACE INTO users (id, username, email, password_hash, api_key, created_at, updated_at) 
VALUES (1, 'ccm-seeder', 'seeder@ccm.dev', '$2b$10$dummyhashforseeding', 'dummy-api-key-for-seeding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert command packages (including multiple versions for testing)
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) VALUES
-- dev-tools versions
(1, 'dev-tools', '1.0.0', 'Essential development productivity commands for coding workflows', 'https://github.com/ccm-org/dev-tools', 'MIT', 'https://dev-tools.ccm.dev', 'development', 1, 25, datetime('now', '-30 days'), datetime('now', '-30 days')),
(2, 'dev-tools', '1.2.0', 'Essential development productivity commands with enhanced git helpers', 'https://github.com/ccm-org/dev-tools', 'MIT', 'https://dev-tools.ccm.dev', 'development', 1, 45, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- hello-world versions (for testing)
(3, 'hello-world', '1.0.0', 'A classic Hello World example package for CCM', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 5, datetime('now', '-60 days'), datetime('now', '-60 days')),
(4, 'hello-world', '1.1.0', 'A classic Hello World example package for CCM with improved features', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 12, datetime('now', '-45 days'), datetime('now', '-45 days')),
(5, 'hello-world', '2.0.0', 'Hello World package v2.0 with breaking changes and new commands', 'https://github.com/ccm-org/hello-world', 'MIT', 'https://claudecommands.dev', 'example', 1, 8, datetime('now', '-15 days'), datetime('now', '-15 days')),

-- ai-prompts versions
(6, 'ai-prompts', '2.0.0', 'Collection of AI prompts for various tasks and workflows', 'https://github.com/ccm-org/ai-prompts', 'Apache-2.0', 'https://ai-prompts.ccm.dev', 'productivity', 1, 65, datetime('now', '-20 days'), datetime('now', '-20 days')),
(7, 'ai-prompts', '2.1.0', 'Collection of optimized AI prompts for various tasks and workflows', 'https://github.com/ccm-org/ai-prompts', 'Apache-2.0', 'https://ai-prompts.ccm.dev', 'productivity', 1, 78, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- single version packages
(8, 'writing-tools', '1.0.3', 'Professional writing and communication assistance commands', 'https://github.com/ccm-org/writing-tools', 'MIT', 'https://writing-tools.ccm.dev', 'productivity', 1, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'data-science', '1.5.0', 'Data analysis, visualization, and machine learning command helpers', 'https://github.com/ccm-org/data-science', 'BSD-3-Clause', 'https://data-science.ccm.dev', 'utility', 1, 34, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'web-dev', '2.0.1', 'Modern web development tools and best practices', 'https://github.com/ccm-org/web-dev', 'MIT', 'https://web-dev.ccm.dev', 'development', 1, 67, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 'security-tools', '1.1.0', 'Security analysis and best practices for secure development', 'https://github.com/ccm-org/security-tools', 'GPL-3.0', 'https://security-tools.ccm.dev', 'security', 1, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert command files
INSERT OR REPLACE INTO command_files (command_id, filename, content, file_hash) VALUES
-- dev-tools v1.0.0 commands
(1, 'git-helper.md', '---
description: Generate semantic git commit messages
author: CCM Seeder
tags: ["git", "productivity"]
arguments: true
---

# Git Commit Helper

Generate a semantic commit message based on the git diff output.

Please analyze the following git diff and suggest a semantic commit message following conventional commits format:

$ARGUMENTS

Format: type(scope): description
Types: feat, fix, docs, style, refactor, test, chore', 'hash1'),

(1, 'code-review.md', '---
description: Comprehensive code review assistant
author: CCM Seeder
tags: ["code-review", "quality"]
arguments: true
---

# Code Review Assistant

Perform a thorough code review focusing on:
- Code quality and best practices
- Security vulnerabilities
- Performance optimizations
- Maintainability improvements

$ARGUMENTS', 'hash2'),

(1, 'debug-helper.md', '---
description: Debug code issues and suggest solutions
author: CCM Seeder
tags: ["debugging", "troubleshooting"]
arguments: true
---

# Debug Helper

Help debug code issues by analyzing error messages, stack traces, and code context.

$ARGUMENTS

Please provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Potential solutions
4. Prevention strategies', 'hash3'),

-- dev-tools v1.2.0 commands (enhanced)
(2, 'git-helper.md', '---
description: Generate semantic git commit messages with enhanced features
author: CCM Seeder
tags: ["git", "productivity"]
arguments: true
---

# Git Commit Helper v1.2.0

Generate a semantic commit message based on the git diff output. Enhanced with branch detection and scope suggestions.

Please analyze the following git diff and suggest a semantic commit message following conventional commits format:

$ARGUMENTS

Format: type(scope): description
Types: feat, fix, docs, style, refactor, test, chore
Enhanced features: automatic scope detection, breaking change detection', 'hash3b'),

(2, 'code-review.md', '---
description: Comprehensive code review assistant with security focus
author: CCM Seeder
tags: ["code-review", "quality", "security"]
arguments: true
---

# Code Review Assistant v1.2.0

Perform a thorough code review focusing on:
- Code quality and best practices
- Security vulnerabilities (enhanced)
- Performance optimizations
- Maintainability improvements
- OWASP Top 10 compliance

$ARGUMENTS', 'hash2b'),

(2, 'git-commit.md', '---
description: Generate semantic commit messages with AI assistance
author: CCM Seeder
tags: ["git", "commit", "semantic"]
arguments: true
---

# Git Commit Message Generator

Generate conventional commit messages based on staged changes.

Usage:
- Analyze staged changes automatically
- Suggest appropriate commit type and scope
- Generate breaking change notices if needed

$ARGUMENTS', 'hash_git_commit'),

-- hello-world v1.0.0 commands
(3, 'greet.md', '---
description: A friendly greeting command
author: CCM Seeder
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

-- hello-world v1.1.0 commands
(4, 'greet.md', '---
description: An improved friendly greeting command
author: CCM Seeder
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

(4, 'welcome.md', '---
description: A welcoming command for new users
author: CCM Seeder
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

-- hello-world v2.0.0 commands
(5, 'greet.md', '---
description: Advanced greeting command with multiple languages
author: CCM Seeder
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

(5, 'goodbye.md', '---
description: Say goodbye in multiple languages
author: CCM Seeder
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

-- ai-prompts v2.0.0 commands
(6, 'explain-code.md', '---
description: Explain code in simple terms
author: CCM Seeder
tags: ["explanation", "learning"]
arguments: true
---

# Code Explainer

Explain the following code in simple, easy-to-understand terms:

$ARGUMENTS

Please break down:
- What the code does
- How it works step by step
- Key concepts and patterns
- Use analogies when helpful', 'hash4'),

(6, 'refactor-suggestion.md', '---
description: Suggest code refactoring improvements
author: CCM Seeder
tags: ["refactoring", "code-quality"]
arguments: true
---

# Refactoring Assistant

Analyze the following code and suggest refactoring improvements:

$ARGUMENTS

Focus on:
- Code readability
- Performance optimization
- Design patterns
- Maintainability
- SOLID principles', 'hash5'),

(6, 'test-generator.md', '---
description: Generate unit tests for given code
author: CCM Seeder
tags: ["testing", "quality-assurance"]
arguments: true
---

# Test Generator

Generate comprehensive unit tests for the following code:

$ARGUMENTS

Include:
- Happy path tests
- Edge cases
- Error scenarios
- Mock setups if needed
- Clear test descriptions', 'hash6'),

-- ai-prompts v2.1.0 commands (enhanced)
(7, 'explain-code.md', '---
description: Explain code in simple terms with examples
author: CCM Seeder
tags: ["explanation", "learning", "examples"]
arguments: true
---

# Code Explainer v2.1.0

Explain the following code in simple, easy-to-understand terms with practical examples:

$ARGUMENTS

Please break down:
- What the code does
- How it works step by step
- Key concepts and patterns
- Real-world examples
- Common use cases', 'hash4b'),

(7, 'refactor-suggestion.md', '---
description: Suggest advanced code refactoring improvements
author: CCM Seeder
tags: ["refactoring", "code-quality", "advanced"]
arguments: true
---

# Advanced Refactoring Assistant v2.1.0

Analyze the following code and suggest comprehensive refactoring improvements:

$ARGUMENTS

Focus on:
- Code readability and maintainability
- Performance optimization
- Modern design patterns
- SOLID principles
- Clean architecture
- Test-driven development', 'hash5b'),

(7, 'test-generator.md', '---
description: Generate comprehensive unit tests with mocking
author: CCM Seeder
tags: ["testing", "quality-assurance", "mocking"]
arguments: true
---

# Advanced Test Generator v2.1.0

Generate comprehensive unit tests for the following code:

$ARGUMENTS

Include:
- Happy path tests
- Edge cases and boundary conditions
- Error scenarios and exception handling
- Mock setups and dependency injection
- Integration test suggestions
- Performance test considerations', 'hash6b'),

-- writing-tools commands
(8, 'technical-writer.md', '---
description: Write clear technical documentation
author: CCM Seeder
tags: ["documentation", "technical-writing"]
arguments: true
---

# Technical Documentation Writer

Create clear, comprehensive technical documentation for:

$ARGUMENTS

Structure:
- Overview and purpose
- Prerequisites
- Step-by-step instructions
- Examples and code snippets
- Troubleshooting section', 'hash7'),

(8, 'email-composer.md', '---
description: Compose professional emails
author: CCM Seeder
tags: ["email", "communication"]
arguments: true
---

# Professional Email Composer

Compose a professional email based on the following requirements:

$ARGUMENTS

Ensure:
- Clear subject line
- Appropriate tone
- Concise and organized content
- Professional closing
- Call to action if needed', 'hash8'),

-- data-science commands
(9, 'data-analyzer.md', '---
description: Analyze datasets and suggest insights
author: CCM Seeder
tags: ["data-analysis", "insights"]
arguments: true
---

# Data Analysis Assistant

Analyze the following dataset or data description:

$ARGUMENTS

Provide:
- Data overview and statistics
- Potential insights and patterns
- Visualization suggestions
- Next steps for analysis
- Potential issues to investigate', 'hash9'),

(9, 'ml-model-advisor.md', '---
description: Suggest machine learning approaches
author: CCM Seeder
tags: ["machine-learning", "modeling"]
arguments: true
---

# ML Model Advisor

Based on the following problem description, suggest appropriate machine learning approaches:

$ARGUMENTS

Include:
- Problem type classification
- Recommended algorithms
- Feature engineering ideas
- Evaluation metrics
- Implementation considerations', 'hash10'),

-- web-dev commands
(10, 'component-builder.md', '---
description: Generate React/Vue components
author: CCM Seeder
tags: ["react", "vue", "components"]
arguments: true
---

# Component Builder

Create a reusable component based on these requirements:

$ARGUMENTS

Generate:
- Component structure
- Props interface
- Styling approach
- Usage examples
- Accessibility considerations', 'hash11'),

(10, 'api-designer.md', '---
description: Design REST API endpoints
author: CCM Seeder
tags: ["api", "rest", "backend"]
arguments: true
---

# API Design Assistant

Design REST API endpoints for the following requirements:

$ARGUMENTS

Include:
- Endpoint structure
- HTTP methods
- Request/response schemas
- Authentication considerations
- Error handling
- Documentation format', 'hash12'),

-- security-tools commands
(11, 'security-audit.md', '---
description: Perform security audit of code
author: CCM Seeder
tags: ["security", "audit"]
arguments: true
---

# Security Audit Assistant

Perform a security analysis of the following code or system:

$ARGUMENTS

Check for:
- Common vulnerabilities (OWASP Top 10)
- Authentication/authorization issues
- Input validation problems
- Data exposure risks
- Secure coding practices', 'hash13');

-- Insert tags
INSERT OR REPLACE INTO tags (command_id, tag) VALUES
-- dev-tools v1.0.0 tags
(1, 'development'), (1, 'productivity'), (1, 'git'), (1, 'code'),
-- dev-tools v1.2.0 tags
(2, 'development'), (2, 'productivity'), (2, 'git'), (2, 'code'), (2, 'enhanced'),
-- hello-world v1.0.0 tags
(3, 'greeting'), (3, 'hello'), (3, 'welcome'), (3, 'example'), (3, 'starter'),
-- hello-world v1.1.0 tags
(4, 'greeting'), (4, 'hello'), (4, 'welcome'), (4, 'example'), (4, 'starter'), (4, 'improved'),
-- hello-world v2.0.0 tags
(5, 'greeting'), (5, 'hello'), (5, 'welcome'), (5, 'example'), (5, 'i18n'), (5, 'advanced'),
-- ai-prompts v2.0.0 tags
(6, 'ai'), (6, 'prompts'), (6, 'productivity'), (6, 'templates'),
-- ai-prompts v2.1.0 tags
(7, 'ai'), (7, 'prompts'), (7, 'productivity'), (7, 'templates'), (7, 'enhanced'),
-- writing-tools tags
(8, 'writing'), (8, 'communication'), (8, 'documentation'),
-- data-science tags
(9, 'data-science'), (9, 'analytics'), (9, 'python'), (9, 'statistics'),
-- web-dev tags
(10, 'web-development'), (10, 'javascript'), (10, 'css'), (10, 'html'),
-- security-tools tags
(11, 'security'), (11, 'analysis'), (11, 'best-practices');