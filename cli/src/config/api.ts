import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ApiConfig {
  registryUrl: string;
  token?: string;
  apiKey?: string;
  username?: string;
}

export class ApiConfigManager {
  private configPath: string;
  private config: ApiConfig;

  constructor() {
    const configDir = join(homedir(), '.ccm');
    this.configPath = join(configDir, 'config.json');
    
    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    this.config = this.loadConfig();
  }

  private loadConfig(): ApiConfig {
    const defaultConfig: ApiConfig = {
      registryUrl: process.env.CCM_REGISTRY_URL || 'http://localhost:3000/api'
    };

    if (!existsSync(this.configPath)) {
      return defaultConfig;
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(content) };
    } catch (error) {
      console.warn('Failed to load config, using defaults');
      return defaultConfig;
    }
  }

  saveConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  getConfig(): ApiConfig {
    return this.config;
  }

  getRegistryUrl(): string {
    return this.config.registryUrl;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  isAuthenticated(): boolean {
    return !!(this.config.token || this.config.apiKey);
  }

  clearAuth(): void {
    delete this.config.token;
    delete this.config.apiKey;
    delete this.config.username;
    this.saveConfig(this.config);
  }
}