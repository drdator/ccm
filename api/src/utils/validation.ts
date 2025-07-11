import yaml from 'yaml';

interface CommandMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  claudeVersion?: string;
  files?: string[];
}

export function parseCommandYaml(yamlContent: string): CommandMetadata {
  try {
    const parsed = yaml.parse(yamlContent);
    
    // Validate required fields
    if (!parsed.name || typeof parsed.name !== 'string') {
      throw new Error('Command name is required and must be a string');
    }
    
    if (!parsed.version || typeof parsed.version !== 'string') {
      throw new Error('Command version is required and must be a string');
    }
    
    // Validate version format (semantic versioning)
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!versionRegex.test(parsed.version)) {
      throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
    }
    
    // Validate name format (lowercase, hyphens, numbers)
    const nameRegex = /^[a-z0-9-]+$/;
    if (!nameRegex.test(parsed.name)) {
      throw new Error('Command name must contain only lowercase letters, numbers, and hyphens');
    }
    
    return {
      name: parsed.name,
      version: parsed.version,
      description: parsed.description || '',
      author: parsed.author || '',
      tags: parsed.tags || [],
      claudeVersion: parsed.claudeVersion,
      files: parsed.files || []
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid command metadata: ${error.message}`);
    }
    throw new Error('Invalid command metadata');
  }
}