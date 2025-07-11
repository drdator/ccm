import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CcmConfig, DEFAULT_CCM_CONFIG } from '../types/ccm.js';

export class CcmConfigManager {
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
      throw new Error('ccm.json not found. Run "ccm init" first.');
    }
    
    const content = readFileSync(this.configPath, 'utf-8');
    return JSON.parse(content);
  }

  write(config: CcmConfig): void {
    const content = JSON.stringify(config, null, 2);
    writeFileSync(this.configPath, content);
  }

  create(name: string, description?: string): CcmConfig {
    const config: CcmConfig = {
      name,
      description,
      ...DEFAULT_CCM_CONFIG
    } as CcmConfig;

    this.write(config);
    return config;
  }

  getClaudeDir(): string {
    return this.claudeDir;
  }

  getCommandsDir(): string {
    const config = this.exists() ? this.read() : { ccm: DEFAULT_CCM_CONFIG.ccm };
    return join(this.claudeDir, config.ccm?.commands || 'commands');
  }

  getInstalledDir(): string {
    const config = this.exists() ? this.read() : { ccm: DEFAULT_CCM_CONFIG.ccm };
    return join(this.claudeDir, config.ccm?.installed || 'installed');
  }
}