import { ApiConfigManager } from '../config/api.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export class ApiClient {
  private config: ApiConfigManager;

  constructor() {
    this.config = new ApiConfigManager();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.getRegistryUrl()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.getAuthHeaders(),
          ...options.headers
        }
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `Request failed with status ${response.status}`,
          status: response.status
        };
      }

      return {
        success: true,
        data: data as T,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  // Authentication
  async register(username: string, email: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  async login(username: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getMe(): Promise<ApiResponse> {
    return this.request('/auth/me');
  }

  // Commands
  async searchCommands(query: string, limit = 20, offset = 0): Promise<ApiResponse> {
    const params = new URLSearchParams({ q: query, limit: limit.toString(), offset: offset.toString() });
    return this.request(`/commands/search?${params}`);
  }

  async listCommands(limit = 20, offset = 0): Promise<ApiResponse> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.request(`/commands?${params}`);
  }

  async getCommand(name: string, version?: string): Promise<ApiResponse> {
    const params = version ? `?version=${version}` : '';
    return this.request(`/commands/${name}${params}`);
  }

  async downloadCommand(name: string, version?: string): Promise<ApiResponse> {
    const params = version ? `?version=${version}` : '';
    return this.request(`/commands/${name}/download${params}`);
  }

  async publishCommand(metadata: string, files: Array<{ filename: string; content: string }>): Promise<ApiResponse> {
    return this.request('/commands', {
      method: 'POST',
      body: JSON.stringify({ metadata, files })
    });
  }

  // Configuration
  saveAuth(token: string, username: string, apiKey: string): void {
    this.config.saveConfig({ token, username, apiKey });
  }

  clearAuth(): void {
    this.config.clearAuth();
  }

  isAuthenticated(): boolean {
    return this.config.isAuthenticated();
  }

  getUsername(): string | undefined {
    return this.config.getConfig().username;
  }
}