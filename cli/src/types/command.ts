export interface CommandMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  tags?: string[];
  arguments?: boolean;
  package?: string;
}

export interface Command {
  name: string;
  path: string;
  location: 'local' | 'installed';
  metadata: CommandMetadata;
  content: string;
}

export interface CommandFile {
  path: string;
  filename: string;
  metadata?: CommandMetadata;
}