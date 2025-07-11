import yaml from 'yaml';
import { CommandMetadata } from '../types/command.js';

export function parseCommandFile(content: string): CommandMetadata {
  const metadata: CommandMetadata = {
    name: '',
  };

  // Check if the file has YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (frontmatterMatch) {
    try {
      const yamlContent = frontmatterMatch[1];
      const parsed = yaml.parse(yamlContent);
      
      // Extract known metadata fields
      if (parsed.description) metadata.description = parsed.description;
      if (parsed.author) metadata.author = parsed.author;
      if (parsed.tags && Array.isArray(parsed.tags)) metadata.tags = parsed.tags;
      if (parsed.arguments !== undefined) metadata.arguments = parsed.arguments;
      if (parsed.version) metadata.version = parsed.version;
      
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error instanceof Error ? error.message : String(error));
    }
  }

  // If no description in frontmatter, try to extract from first line of content
  if (!metadata.description) {
    const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    const firstLine = contentWithoutFrontmatter.trim().split('\n')[0];
    if (firstLine && firstLine.startsWith('#')) {
      metadata.description = firstLine.replace(/^#+\s*/, '').trim();
    }
  }

  return metadata;
}

export function parseCommandYaml(content: string): any {
  try {
    return yaml.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse command.yaml: ${error instanceof Error ? error.message : String(error)}`);
  }
}