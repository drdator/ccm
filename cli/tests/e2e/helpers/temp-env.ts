import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export class TempEnvironment {
  private tempDirs: string[] = [];
  private originalCwd: string;
  private originalHome: string | undefined;

  constructor() {
    this.originalCwd = process.cwd();
    this.originalHome = process.env.HOME;
  }

  /**
   * Create a temporary directory for a test
   */
  async createTempDir(prefix = 'ccm-e2e-'): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), prefix));
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  /**
   * Create a temporary project directory with ccm.json
   */
  async createTempProject(projectName = 'test-project'): Promise<string> {
    const projectDir = await this.createTempDir('ccm-project-');
    
    // Create ccm.json
    const ccmConfig = {
      name: projectName,
      version: '1.0.0',
      description: 'A test command package',
      tags: ['test', 'e2e'],
      dependencies: {}
    };

    await writeFile(
      join(projectDir, 'ccm.json'),
      JSON.stringify(ccmConfig, null, 2)
    );

    // Create commands directory
    const commandsDir = join(projectDir, 'commands');
    await mkdir(commandsDir, { recursive: true });

    // Create a sample command file
    const sampleCommand = `---
description: Test command for E2E testing
author: E2E Test
tags: ["test", "e2e"]
arguments: true
---

# Test Command

This is a test command created during E2E testing.

## Usage

\`\`\`bash
$ARGUMENTS
\`\`\`
`;

    await writeFile(join(commandsDir, 'test-cmd.md'), sampleCommand);

    return projectDir;
  }

  /**
   * Create a temporary home directory with CCM config
   */
  async createTempHome(apiUrl?: string): Promise<string> {
    const homeDir = await this.createTempDir('ccm-home-');
    const ccmDir = join(homeDir, '.ccm');
    await mkdir(ccmDir, { recursive: true });

    // Create config.json if API URL provided
    if (apiUrl) {
      const config = {
        registryUrl: apiUrl
      };
      await writeFile(
        join(ccmDir, 'config.json'),
        JSON.stringify(config, null, 2)
      );
    }

    return homeDir;
  }

  /**
   * Set environment to use temporary home directory
   */
  setTempHome(homeDir: string): void {
    process.env.HOME = homeDir;
  }

  /**
   * Create a temporary consumer directory (for installing commands)
   */
  async createTempConsumer(): Promise<string> {
    const consumerDir = await this.createTempDir('ccm-consumer-');
    
    // Create .claude directory structure
    const claudeDir = join(consumerDir, '.claude');
    const commandsDir = join(claudeDir, 'commands');
    const installedDir = join(claudeDir, 'installed');
    
    await mkdir(commandsDir, { recursive: true });
    await mkdir(installedDir, { recursive: true });

    // Create ccm.json for consumer
    const ccmConfig = {
      name: 'test-consumer',
      version: '1.0.0',
      description: 'Test consumer project',
      dependencies: {}
    };

    await writeFile(
      join(consumerDir, 'ccm.json'),
      JSON.stringify(ccmConfig, null, 2)
    );

    return consumerDir;
  }

  /**
   * Clean up all temporary directories and restore environment
   */
  async cleanup(): Promise<void> {
    // Restore original environment (skip chdir in worker threads)
    if (this.originalHome) {
      process.env.HOME = this.originalHome;
    } else {
      delete process.env.HOME;
    }

    // Clean up temporary directories
    for (const dir of this.tempDirs) {
      try {
        if (existsSync(dir)) {
          await rm(dir, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`Failed to clean up temp dir ${dir}:`, error);
      }
    }

    this.tempDirs = [];
  }

  /**
   * Get a unique username for testing
   */
  getUniqueUsername(prefix = 'testuser'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get a unique email for testing
   */
  getUniqueEmail(username?: string): string {
    const user = username || this.getUniqueUsername();
    return `${user}@example.com`;
  }

  /**
   * Get test password that meets requirements
   */
  getTestPassword(): string {
    return 'TestPass123!';
  }

  /**
   * Get a unique project name for testing
   */
  getUniqueProjectName(prefix = 'test-project'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${timestamp}-${random}`;
  }
}