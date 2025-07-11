import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CcmConfig, DEFAULT_CCM_CONFIG } from '../types/ccm.js';

/**
 * Config manager for consumers (people installing commands)
 * Works with .claude/ directory structure
 */
export class ConsumerConfigManager {
  private configPath: string;
  private claudeDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.claudeDir = join(projectRoot, '.claude');
    this.configPath = join(this.claudeDir, 'ccm.json');
  }

  exists(): boolean {
    return existsSync(this.configPath);
  }

  read(): CcmConfig {
    if (!this.exists()) {
      // Create default consumer config if it doesn't exist
      this.ensureClaudeDir();
      const config: CcmConfig = {
        name: 'consumer-project',
        version: '1.0.0',
        dependencies: {}
      };
      this.write(config);
      return config;
    }
    
    const content = readFileSync(this.configPath, 'utf-8');
    return JSON.parse(content);
  }

  write(config: CcmConfig): void {
    this.ensureClaudeDir();
    const content = JSON.stringify(config, null, 2);
    writeFileSync(this.configPath, content);
  }

  private ensureClaudeDir(): void {
    if (!existsSync(this.claudeDir)) {
      mkdirSync(this.claudeDir, { recursive: true });
    }
  }

  getClaudeDir(): string {
    return this.claudeDir;
  }

  getCommandsDir(): string {
    return join(this.claudeDir, 'commands');
  }

  getInstalledDir(): string {
    return join(this.claudeDir, 'installed');
  }

  ensureDirectories(): void {
    this.ensureClaudeDir();
    
    const commandsDir = this.getCommandsDir();
    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
    }
    
    const installedDir = this.getInstalledDir();
    if (!existsSync(installedDir)) {
      mkdirSync(installedDir, { recursive: true });
    }
  }
}