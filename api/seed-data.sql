-- CCM Registry Database Seed Data
-- Run with: sqlite3 ccm-registry.db < scripts/seed-data.sql

-- Insert seed user
INSERT OR REPLACE INTO users (id, username, email, password_hash, api_key, created_at, updated_at) 
VALUES (1, 'ccm-seeder', 'seeder@ccm.dev', '$2b$10$dummyhashforseeding', 'dummy-api-key-for-seeding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert command packages
INSERT OR REPLACE INTO commands (id, name, version, description, repository, license, homepage, category, author_id, downloads, published_at, updated_at) VALUES
(1, 'dev-tools', '1.2.0', 'Essential development productivity commands for coding workflows', 'https://github.com/ccm-org/dev-tools', 'MIT', 'https://dev-tools.ccm.dev', 'development', 1, 45, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'ai-prompts', '2.1.0', 'Collection of optimized AI prompts for various tasks and workflows', 'https://github.com/ccm-org/ai-prompts', 'Apache-2.0', 'https://ai-prompts.ccm.dev', 'productivity', 1, 78, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'writing-tools', '1.0.3', 'Professional writing and communication assistance commands', 'https://github.com/ccm-org/writing-tools', 'MIT', 'https://writing-tools.ccm.dev', 'productivity', 1, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'data-science', '1.5.0', 'Data analysis, visualization, and machine learning command helpers', 'https://github.com/ccm-org/data-science', 'BSD-3-Clause', 'https://data-science.ccm.dev', 'utility', 1, 34, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'web-dev', '2.0.1', 'Modern web development tools and best practices', 'https://github.com/ccm-org/web-dev', 'MIT', 'https://web-dev.ccm.dev', 'development', 1, 67, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'security-tools', '1.1.0', 'Security analysis and best practices for secure development', 'https://github.com/ccm-org/security-tools', 'GPL-3.0', 'https://security-tools.ccm.dev', 'security', 1, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert command files
INSERT OR REPLACE INTO command_files (command_id, filename, content, file_hash) VALUES
-- dev-tools commands
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

-- ai-prompts commands
(2, 'explain-code.md', '---
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

(2, 'refactor-suggestion.md', '---
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

(2, 'test-generator.md', '---
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

-- writing-tools commands
(3, 'technical-writer.md', '---
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

(3, 'email-composer.md', '---
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
(4, 'data-analyzer.md', '---
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

(4, 'ml-model-advisor.md', '---
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
(5, 'component-builder.md', '---
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

(5, 'api-designer.md', '---
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
(6, 'security-audit.md', '---
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
-- dev-tools tags
(1, 'development'), (1, 'productivity'), (1, 'git'), (1, 'code'),
-- ai-prompts tags
(2, 'ai'), (2, 'prompts'), (2, 'productivity'), (2, 'templates'),
-- writing-tools tags
(3, 'writing'), (3, 'communication'), (3, 'documentation'),
-- data-science tags
(4, 'data-science'), (4, 'analytics'), (4, 'python'), (4, 'statistics'),
-- web-dev tags
(5, 'web-development'), (5, 'javascript'), (5, 'css'), (5, 'html'),
-- security-tools tags
(6, 'security'), (6, 'analysis'), (6, 'best-practices');