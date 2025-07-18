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

