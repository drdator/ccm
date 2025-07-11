export interface CcmConfig {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  ccm?: {
    registry?: string;
    installed?: string;
    commands?: string;
  };
}

export interface CcmLock {
  version: string;
  lockfileVersion: number;
  dependencies: Record<string, {
    version: string;
    resolved: string;
    integrity: string;
    dependencies?: Record<string, string>;
  }>;
}

export const DEFAULT_CCM_CONFIG: Partial<CcmConfig> = {
  version: '1.0.0',
  dependencies: {},
  devDependencies: {},
  ccm: {
    registry: 'https://registry.ccm.dev',
    installed: './installed',
    commands: './commands'
  }
};