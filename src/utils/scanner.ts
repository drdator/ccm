import { glob } from 'glob';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { Command, CommandFile } from '../types/command.js';
import { parseCommandFile } from './parser.js';

export async function scanCommands(options: { local?: boolean; global?: boolean } = {}): Promise<Command[]> {
  const commands: Command[] = [];
  const scannedPaths = new Set<string>();

  // Determine which locations to scan
  const scanLocal = options.local || (!options.local && !options.global);
  const scanGlobal = options.global || (!options.local && !options.global);

  // Scan local .claude/commands directory
  if (scanLocal) {
    const localPath = join(process.cwd(), '.claude', 'commands');
    if (existsSync(localPath)) {
      const localCommands = await scanDirectory(localPath, 'local');
      localCommands.forEach(cmd => {
        if (!scannedPaths.has(cmd.name)) {
          commands.push(cmd);
          scannedPaths.add(cmd.name);
        }
      });
    }
  }

  // Scan global ~/.claude/commands directory
  if (scanGlobal) {
    const globalPath = join(homedir(), '.claude', 'commands');
    if (existsSync(globalPath)) {
      const globalCommands = await scanDirectory(globalPath, 'global');
      globalCommands.forEach(cmd => {
        if (!scannedPaths.has(cmd.name)) {
          commands.push(cmd);
          scannedPaths.add(cmd.name);
        }
      });
    }
  }

  return commands;
}

async function scanDirectory(basePath: string, location: 'local' | 'global'): Promise<Command[]> {
  const commands: Command[] = [];
  
  // Find all .md files in the directory (including subdirectories for namespacing)
  const pattern = join(basePath, '**/*.md');
  const files = await glob(pattern, { 
    nodir: true,
    absolute: true 
  });

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const metadata = parseCommandFile(content);
      
      // Extract command name from file path
      const relativePath = filePath.replace(basePath + '/', '');
      const name = relativePath.replace(/\.md$/, '').replace(/\//g, ':');

      commands.push({
        name,
        path: filePath,
        location,
        metadata: {
          ...metadata,
          name
        },
        content
      });
    } catch (error) {
      console.warn(`Warning: Failed to parse command file ${filePath}:`, error instanceof Error ? error.message : String(error));
    }
  }

  return commands;
}