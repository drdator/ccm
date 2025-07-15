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
    // Respect HOME environment variable if set (for testing)
    const homeDirectory = process.env.HOME || homedir();
    const configDir = join(homeDirectory, '.ccm');
    this.configPath = join(configDir, 'config.json');
    
    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    this.config = this.loadConfig();
  }

  private loadConfig(): ApiConfig {
    // Default to production URL, but allow development override
    const getDefaultRegistryUrl = () => {
      // Always prioritize explicit CCM_REGISTRY_URL if set
      if (process.env.CCM_REGISTRY_URL) {
        return process.env.CCM_REGISTRY_URL;
      }
      
      // Check if we're in development environment
      if (process.env.NODE_ENV === 'development' || process.env.CCM_DEV === 'true') {
        return 'http://localhost:3000/api';
      }
      
      // Production default
      return 'https://claudecommands.dev/api';
    };

    const defaultConfig: ApiConfig = {
      registryUrl: getDefaultRegistryUrl()
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