export interface CcmConfig {
  name: string;
  version: string;
  description?: string;
  repository?: string;
  license?: string;
  homepage?: string;
  category?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
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
  dependencies: {}
};