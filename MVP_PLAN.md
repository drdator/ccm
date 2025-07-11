# CCM MVP Implementation Plan

## Overview
CCM (Claude Command Manager) will be a package manager for Claude Code custom commands, enabling users to discover, share, and manage slash commands for Claude Code.

## Key Insight
CCM integrates with Claude Code's existing command system (`.claude/commands/`), acting as a distribution and version management layer rather than replacing the command infrastructure.

## MVP Scope (v0.1.0)

### Core Features
1. **Command Installation/Removal** - Download and install commands to `.claude/commands/`
2. **Command Publishing** - Share commands to central repository
3. **Command Discovery** - Search and browse available commands
4. **Version Management** - Basic versioning for commands
5. **CLI Interface** - Simple command-line tool

### Out of Scope for MVP
- GUI interface
- Team/organization features
- Advanced templating
- Command dependencies
- Paid/premium commands

## Technical Architecture

### 1. Command Format
```yaml
# command.yaml (metadata file)
name: "git-commit-helper"
version: "1.0.0"
description: "Generate semantic git commit messages"
author: "username"
claudeVersion: ">=1.0.0"
tags: ["git", "productivity"]
files:
  - "git-commit-helper.md"
```

```markdown
# git-commit-helper.md (command file)
---
description: Generate semantic git commit messages
arguments: true
---

Based on the git diff output below, generate a semantic commit message:

$ARGUMENTS
```

### 2. System Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CCM CLI       │────▶│  CCM Registry    │────▶│  Cloud Storage  │
│  (Node.js)      │     │   (REST API)     │     │   (Commands)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│ .claude/commands│     │   PostgreSQL     │
│  (local files)  │     │   (metadata)     │
└─────────────────┘     └──────────────────┘
```

## Implementation Steps

### Phase 1: CLI Foundation (Week 1-2)

#### Step 1.1: Project Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up build toolchain (esbuild/webpack)
- [ ] Configure testing framework (Jest)
- [ ] Set up linting and formatting (ESLint, Prettier)

#### Step 1.2: CLI Framework
- [ ] Implement commander.js structure
- [ ] Create command routing system
- [ ] Add configuration management (`~/.ccmrc`)
- [ ] Implement logging and error handling

#### Step 1.3: Local Command Management
- [ ] Implement command file detection in `.claude/commands/`
- [ ] Create command metadata parser
- [ ] Build local command listing functionality
- [ ] Add command validation

**Deliverable**: `ccm list` command working locally

### Phase 2: Registry API (Week 3-4)

#### Step 2.1: API Infrastructure
- [ ] Set up Express.js API server
- [ ] Configure PostgreSQL database
- [ ] Implement database migrations
- [ ] Set up API documentation (OpenAPI)

#### Step 2.2: Core API Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
GET    /api/commands          - List/search commands
GET    /api/commands/:name    - Get command details
POST   /api/commands          - Publish command
GET    /api/commands/:name/download - Download command files
```

#### Step 2.3: Database Schema
```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- commands table
CREATE TABLE commands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  description TEXT,
  author_id INTEGER REFERENCES users(id),
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, version)
);

-- command_files table
CREATE TABLE command_files (
  id SERIAL PRIMARY KEY,
  command_id INTEGER REFERENCES commands(id),
  filename VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL
);

-- tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  command_id INTEGER REFERENCES commands(id),
  tag VARCHAR(50) NOT NULL
);
```

#### Step 2.4: Authentication
- [ ] Implement JWT token generation
- [ ] Add API key support for CLI authentication
- [ ] Create middleware for protected routes
- [ ] Implement rate limiting

**Deliverable**: Working API with authentication

### Phase 3: Command Publishing (Week 5)

#### Step 3.1: CLI Publishing Flow
- [ ] Implement `ccm init` to create command.yaml
- [ ] Add `ccm publish` command
- [ ] Create command packaging logic
- [ ] Implement file upload to registry

#### Step 3.2: Registry Publishing
- [ ] Validate command package structure
- [ ] Check for naming conflicts
- [ ] Store command metadata in database
- [ ] Upload command files to cloud storage

#### Step 3.3: Versioning
- [ ] Implement semantic versioning validation
- [ ] Add version conflict resolution
- [ ] Create version history tracking

**Deliverable**: `ccm publish` command working end-to-end

### Phase 4: Command Installation (Week 6)

#### Step 4.1: Search Implementation
- [ ] Add `ccm search <query>` command
- [ ] Implement full-text search in registry
- [ ] Add filtering by tags
- [ ] Create relevance ranking

#### Step 4.2: Installation Flow
- [ ] Implement `ccm install <command>` 
- [ ] Download command files from registry
- [ ] Place files in correct `.claude/commands/` location
- [ ] Handle version specifications

#### Step 4.3: Dependency Resolution
- [ ] Track installed commands in `.ccm.lock` file
- [ ] Implement `ccm uninstall <command>`
- [ ] Add update checking mechanism

**Deliverable**: Full install/uninstall functionality

### Phase 5: Polish & Launch (Week 7-8)

#### Step 5.1: User Experience
- [ ] Add progress indicators for downloads
- [ ] Implement helpful error messages
- [ ] Create interactive prompts where needed
- [ ] Add command validation before publish

#### Step 5.2: Documentation
- [ ] Write comprehensive README
- [ ] Create getting started guide
- [ ] Document command creation process
- [ ] Add API documentation

#### Step 5.3: Infrastructure
- [ ] Set up production hosting (Vercel/Railway)
- [ ] Configure domain and SSL
- [ ] Implement monitoring and logging
- [ ] Create backup strategy

#### Step 5.4: Testing & QA
- [ ] Write unit tests (80% coverage target)
- [ ] Add integration tests
- [ ] Perform security audit
- [ ] Beta testing with select users

**Deliverable**: Production-ready MVP

## Infrastructure Requirements

### Hosting Stack (Recommended)
- **API**: Vercel or Railway (Node.js hosting)
- **Database**: Supabase or Neon (PostgreSQL)
- **File Storage**: Cloudflare R2 or AWS S3
- **CDN**: Cloudflare
- **Domain**: ccm.dev or similar

### Estimated Costs (Monthly)
- API Hosting: $20-50
- Database: $25
- Storage/CDN: $5-10
- Domain: $1
- **Total**: ~$60/month for MVP

## Success Metrics

### Launch Goals (First 30 days)
- 100+ registered users
- 50+ published commands
- 500+ command installations
- 5+ active contributors

### Quality Metrics
- < 2s command installation time
- 99.9% API uptime
- < 100ms search response time
- Zero critical security issues

## Risk Mitigation

### Technical Risks
1. **Command Conflicts**: Implement namespacing (user/command)
2. **Malicious Commands**: Add reporting system and moderation
3. **API Abuse**: Rate limiting and API keys
4. **Data Loss**: Regular backups and version control

### Adoption Risks
1. **Low Usage**: Focus on high-quality seed commands
2. **Complex Setup**: One-line installer script
3. **Poor Discovery**: Good search and curation

## Post-MVP Roadmap

### Version 0.2.0 (Month 2-3)
- Web interface for browsing commands
- Command collections/bundles
- User profiles and statistics
- Command ratings and reviews

### Version 0.3.0 (Month 4-6)
- VSCode extension
- Team/organization accounts
- Private command repositories
- Advanced templating system

## Development Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2 | CLI Foundation | Local command management |
| 3-4 | Registry API | Working API with auth |
| 5 | Publishing | Command publishing flow |
| 6 | Installation | Search and install |
| 7-8 | Polish & Launch | Production MVP |

## Next Steps

1. **Validate Technical Choices**: Confirm Node.js/TypeScript stack
2. **Secure Infrastructure**: Set up hosting accounts
3. **Recruit Beta Testers**: Find 10-20 early adopters
4. **Create Seed Content**: Develop 20-30 high-quality commands
5. **Begin Development**: Start with Phase 1

---

**Note**: This plan focuses on the absolute minimum features needed for a useful product. Each phase builds on the previous one, allowing for early testing and validation.